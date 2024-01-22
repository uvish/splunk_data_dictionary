import React, { useState, useEffect } from 'react';
import config from '../../../../config.json';

// External Libraries
import axios from 'axios';
import Fuse from 'fuse.js'

// Splunk UI Components
import Select from '@splunk/react-ui/Select';
import CirclesFour from '@splunk/react-icons/CirclesFour';
import ChartColumnSquare from '@splunk/react-icons/ChartColumnSquare';
import CylinderMagnifier from '@splunk/react-icons/CylinderMagnifier';
import BellDot from '@splunk/react-icons/BellDot';
import Table from '@splunk/react-ui/Table';
import Paginator from '@splunk/react-ui/Paginator';
import Globe from '@splunk/react-icons/Globe';
import Text from '@splunk/react-ui/Text';

// Helper Functions
import Session from '../Utils/Session';

const enterpriseIconProps = {
    hideDefaultTooltip: true,
    screenReaderText: null,
    size: '16px',
};

const splunk_server_url = config.splunk.server_url;
const KO_ENDPOINT = splunk_server_url + `/list?type=`;
const OVERVIEW_ENDPOINT = splunk_server_url + `/overview`;
const GET_ALL_SPLUNK_HOSTS = splunk_server_url + `/values?field=splunk_host`;
const RECORDS_PER_PAGE = 10;

const fuseOptions = {
	includeMatches: false,
	keys: [
		"custom_meta_label",
        "custom_classification",
		"object_info.description",
        "object_info.name",
        "object_info.owner"
	]
};

const enterpriseIcons = {
    Apps: <CirclesFour {...enterpriseIconProps} variant="filled" />,
    Dashboards: <ChartColumnSquare {...enterpriseIconProps} variant="filled" />,
    SavedSearchs: <CylinderMagnifier {...enterpriseIconProps} variant="filled" />,
    Alerts: <BellDot {...enterpriseIconProps} variant="filled" />,
    Hosts: <Globe {...enterpriseIconProps} variant="filled" />,
};

const KO = () => {
    const [data, setData] = useState([]);
    const [selectorValue, setSelectorValue] = useState('apps');
    const [isLoading, setLoading] = useState('true');
    const [overview, setOverview] = useState({});
    const [pageNum, setPageNum] = useState(1);
    const [paginatedData, setPaginatedData] = useState([]);
    const [totalPages,setTotalPages] = useState(0);
    const [allSplunkHosts, setAllSplunkHosts] = useState([]);
    const [currentHost, setCurrentHost] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // setLoading(true);
                // Fetch KOs..
                const url = currentHost !== 'all' ? KO_ENDPOINT + selectorValue + `&splunk_host=${currentHost}` : KO_ENDPOINT + selectorValue ;
                console.log(url)
                const response = await axios.get(url, {
                    headers: { Authorization: `Splunk ${Session.getSessionKey()}` },
                });

                
                const parsedData = response.data[selectorValue].map((element) => {
                    return JSON.parse(element[3]);
                  });
                setData(parsedData);
                if(searchTerm === ''){
                    setPaginatedData(getPaginatedData(parsedData, pageNum));
                    setTotalPages(Math.ceil(parsedData.length / RECORDS_PER_PAGE));
                }else{
                    let fuse = new Fuse(parsedData, fuseOptions);
                    let searchResults = fuse.search(searchTerm,pageNum);
                    searchResults = searchResults.map(({ item }) => item);
                    setPaginatedData(getPaginatedData(searchResults,1));
                    setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE))
                }
                

                // Fetch Overview Numbers..
                const overviewResponse = await axios.get(OVERVIEW_ENDPOINT, {
                    headers: {
                        Authorization: `Splunk ${Session.getSessionKey()}`,
                    },
                });

                if (overviewResponse.data) {
                    setOverview(overviewResponse.data);
                }

                // Fetch all Splunk Hosts..
                const allSplunkHosts = await axios.get(GET_ALL_SPLUNK_HOSTS, {
                    headers: { Authorization: `Splunk ${Session.getSessionKey()}` },
                });

                if(allSplunkHosts.data.values){
                    setAllSplunkHosts(allSplunkHosts.data.values)
                }
                setLoading(false);

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectorValue,currentHost]);


    // handle search
    useEffect(()=>{
        let fuse = new Fuse(data, fuseOptions);
        if(searchTerm === ''){
            setPaginatedData(getPaginatedData(data,1));
             setTotalPages(Math.ceil(data.length / RECORDS_PER_PAGE))
        }else{
            let searchResults = fuse.search(searchTerm,pageNum);
            searchResults = searchResults.map(({ item }) => item);
            setPaginatedData(getPaginatedData(searchResults,1));
            setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE))
        }
        // TODO
        // copy search logic to data inventory
    },[searchTerm])

    const selectChange = (e, { value: key }) => {
        setSelectorValue(key);
        setPageNum(1); // to prevent glitch when coming from higher page numbers
    };
    const handlePaginatorChange = (event, { page }) => {
        let fuse = new Fuse(data, fuseOptions);
        setPageNum(page);
        if(searchTerm === ''){
            setPaginatedData(getPaginatedData(data,page));
             setTotalPages(Math.ceil(data.length / RECORDS_PER_PAGE))
        }else{
            let searchResults = fuse.search(searchTerm,pageNum);
            searchResults = searchResults.map(({ item }) => item);
            setPaginatedData(getPaginatedData(searchResults,page));
            setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE))
        }

        // setPaginatedData(getPaginatedData(data, page));
    };
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * RECORDS_PER_PAGE;
        const endIndex = startIndex + RECORDS_PER_PAGE;
        const pageElements = data.slice(startIndex, endIndex);
        return pageElements;
    };
    const handleHostChange = (e, { value: key }) =>{
        setCurrentHost(key);
    }

    return (
        <div>
            <Select value={selectorValue} onChange={selectChange}>
                <Select.Option
                    label={'Apps' + ` ${overview.apps ? overview.apps : '..'}`}
                    value="apps"
                    icon={enterpriseIcons['Apps']}
                />
                <Select.Option
                    label={'Dashboards' + ` ${overview.dashboards ? overview.dashboards : '..'}`}
                    value="dashboards"
                    icon={enterpriseIcons['Dashboards']}
                />
                <Select.Option
                    label={
                        'Saved Searches' +
                        ` ${overview.savedSearches ? overview.savedSearches : '..'}`
                    }
                    value="savedSearches"
                    icon={enterpriseIcons['SavedSearchs']}
                />
                <Select.Option
                    label={'Alerts' + ` ${overview.alerts ? overview.alerts : '..'}`}
                    value="alerts"
                    icon={enterpriseIcons['Alerts']}
                />
            </Select>

            <Select value={currentHost} onChange={handleHostChange}>
            <Select.Option
                label="All"
                value="all"
                icon={enterpriseIcons['Hosts']}
            />
            {allSplunkHosts.map((item, index) => (
                <Select.Option
                key={index}
                label={item}
                value={item}
                icon={enterpriseIcons['Hosts']}
            />
            ))}
            </Select>
            <Text
            type="text"
            id="search"
            name="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading ? (
                <div>Loading..</div>
            ) : (
                <div>
                    {/* {paginatedData.map((row) => (
                                <p key={row.id}>{JSON.stringify(row)}</p>
                            ))} */}
                    <Table stripeRows>
                        <Table.Head>
                            <Table.HeadCell>Id</Table.HeadCell>
                            <Table.HeadCell>Name</Table.HeadCell>
                            <Table.HeadCell>Description</Table.HeadCell>
                            <Table.HeadCell>Owner</Table.HeadCell>
                            <Table.HeadCell>Meta Label</Table.HeadCell>
                            <Table.HeadCell>Classification</Table.HeadCell>
                            <Table.HeadCell>Splunk Host</Table.HeadCell>
                            <Table.HeadCell>Action</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {paginatedData.map((row) => (
                                <Table.Row key={row.id}>
                                     <Table.Cell>{row.id}</Table.Cell>
                                     <Table.Cell>{row.object_info.name}</Table.Cell>
                                     <Table.Cell>{row.object_info.description}</Table.Cell>
                                     <Table.Cell>{row.object_info.owner}</Table.Cell>
                                     <Table.Cell>{row.custom_meta_label}</Table.Cell>
                                     <Table.Cell>{row.custom_classification}</Table.Cell>
                                     <Table.Cell>{row.splunk_host}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                    <Paginator
                        onChange={handlePaginatorChange}
                        current={pageNum}
                        alwaysShowLastPageLink
                        totalPages={totalPages}
                    />
                </div>
            )}
        </div>
    );
};

export default KO;
