import React, { useState ,useEffect } from 'react';
import config from '../../../../config.json';
import axios from 'axios';
// Splunk UI Components
import Select from '@splunk/react-ui/Select';
import TableSlide from '@splunk/react-icons/TableSlide'
import List from '@splunk/react-icons/List'
import CylinderIndex from '@splunk/react-icons/CylinderIndex';
import Table from '@splunk/react-ui/Table';
import Paginator from '@splunk/react-ui/Paginator';
import Globe from '@splunk/react-icons/Globe';

// Helper Functions
import Session from '../Utils/Session'

const enterpriseIconProps = {
    hideDefaultTooltip: true,
    screenReaderText: null,
    size: '16px',
};

const splunk_server_url = config.splunk.server_url;
const KO_ENDPOINT = splunk_server_url + `/list?type=`;
const OVERVIEW_ENDPOINT = splunk_server_url+`/overview`;
const GET_ALL_SPLUNK_HOSTS = splunk_server_url + `/values?field=splunk_host`;
const ROCORDS_PER_PAGE = 10

const enterpriseIcons = {
    'Lookups': <TableSlide {...enterpriseIconProps} variant="filled" />,
    'Fields': <List {...enterpriseIconProps} variant="filled" />,
    'Indexes': <CylinderIndex {...enterpriseIconProps} variant="filled" />,
    'Hosts': <Globe {...enterpriseIconProps} variant="filled" />,
};

const DataInventory = () => {


    const [data,setData] = useState([]);
    const [selectorValue, setSelectorValue] = useState('lookups');
    const [isLoading,setLoading] = useState('true');
    const [overview,setOverview] = useState({});
    const [pageNum, setPageNum] = useState(1);
    const [paginatedData, setPaginatedData] = useState([]);
    const [allSplunkHosts, setAllSplunkHosts] = useState([]);
    const [currentHost, setCurrentHost] = useState('all');

    useEffect(()=>{
        const fetchData = async () => {
            try {

            // Fetch KOs..
            const url = currentHost !== 'all' ? KO_ENDPOINT + selectorValue + `&splunk_host=${currentHost}` : KO_ENDPOINT + selectorValue ;
              const response = await axios.get(url,
              {headers:{Authorization: `Splunk ${Session.getSessionKey()}`}});

            setData(response.data[selectorValue]);
            setPaginatedData(getPaginatedData(response.data[selectorValue],pageNum));
        
            const overviewResponse = await axios.get(OVERVIEW_ENDPOINT,
                {headers:{
                        Authorization: `Splunk ${Session.getSessionKey()}`
                    }
                });

                if(overviewResponse.data){
                    setOverview(overviewResponse.data);
                    setLoading(false);
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
    },[selectorValue,currentHost]);

    const selectChange =(e, { value: key }) => {
        setSelectorValue(key);
        setPageNum(1);
    }
    const handlePaginatorChange = (event, { page }) => {
        setPageNum(page);
        setPaginatedData(getPaginatedData(data,page));
    };
    const getPaginatedData =(data, page) =>{
        const startIndex = (page - 1) * ROCORDS_PER_PAGE;
        const endIndex = startIndex + ROCORDS_PER_PAGE;
        const pageElements = data.slice(startIndex, endIndex);
        return pageElements;
    }
    const handleHostChange = (e, { value: key }) =>{
        setCurrentHost(key);
    }

    return (
        <div>
           <Select value={selectorValue} onChange={selectChange}>
            <Select.Option label={"Lookups"+` ${overview.apps?overview.lookups:".."}`} value="lookups" icon={enterpriseIcons['Lookups']}/>
            <Select.Option label={"Fields"+` ${overview.dashboards?overview.fields:".."}`} value="fields"  icon={enterpriseIcons['Fields']} />
            <Select.Option label={"Index"+` ${overview.savedSearches?overview.indexes:".."}`} value="indexes" icon={enterpriseIcons['Indexes']} />
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

        { isLoading ? (
            <div>
            Loading..
         </div>
        ):(
            <div>
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
                    <Table.Row key={row[7]}>
                        <Table.Cell>{JSON.parse(row[3]).id}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).object_info.name}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).object_info.description}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).object_info.owner}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).custom_meta_label}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).custom_classification}</Table.Cell>
                        <Table.Cell>{JSON.parse(row[3]).splunk_host}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
        <Paginator
            onChange={handlePaginatorChange}
            current={pageNum}
            alwaysShowLastPageLink
            totalPages={Math.ceil(data.length/10)}
        />
        </div>
        )}
        </div>
    );
}

export default DataInventory;