import React, { useState, useEffect, useRef } from 'react';
import config from '../../../../config.json';

// External Libraries
import axios from 'axios';
import Fuse from 'fuse.js';

// Splunk UI Components
import Select from '@splunk/react-ui/Select';
import Table from '@splunk/react-ui/Table';
import Paginator from '@splunk/react-ui/Paginator';
import Globe from '@splunk/react-icons/Globe';
import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Modal from '@splunk/react-ui/Modal';
import Multiselect from '@splunk/react-ui/Multiselect';
import Button from '@splunk/react-ui/Button';
import Pencil from '@splunk/react-icons/Pencil';
import ChevronsDoubleDownGuillemets from '@splunk/react-icons/ChevronsDoubleDownGuillemets';
import MessageBar from '@splunk/react-ui/MessageBar';
import TrashCanCross from '@splunk/react-icons/TrashCanCross';
import NodeSplit from '@splunk/react-icons/NodeSplit';
import Clock from '@splunk/react-icons/Clock';
import Tooltip from '@splunk/react-ui/Tooltip';

import P from '@splunk/react-ui/Paragraph';

// Helper Functions
import Session from '../Utils/Session';

const enterpriseIconProps = {
    hideDefaultTooltip: true,
    screenReaderText: null,
    size: '16px',
};

const SPLUNK_SERVER_URL = config.splunk.server_url;
const KO_ENDPOINT = `${SPLUNK_SERVER_URL}/list?type=`;
const OVERVIEW_ENDPOINT = `${SPLUNK_SERVER_URL}/overview`;
const GET_ALL_SPLUNK_HOSTS = `${SPLUNK_SERVER_URL}/all_hosts`;
const UPDATE_RECORD_ENDPOINT = `${SPLUNK_SERVER_URL}/update`;
const REQUEST_ACCESS_ENDPOINT = `${SPLUNK_SERVER_URL}/request-access`;
const USER_ACCESS_REQUESTS = `${SPLUNK_SERVER_URL}/userRequests`;
const CANCEL_ACCESS_REQUEST = `${SPLUNK_SERVER_URL}/cancelRequest`;
const ALL_PENDING_REQUESTS = `${SPLUNK_SERVER_URL}/allPendingRequests`;
const APPROVE_REQUEST = `${SPLUNK_SERVER_URL}/approve-request`;
const DENY_REQUEST = `${SPLUNK_SERVER_URL}/cancelRequest`;
const DELETE_OBJECT = `${SPLUNK_SERVER_URL}/deleteObject`;
const RECORDS_PER_PAGE = 15;

const enterpriseIcons = {
    Hosts: <Globe {...enterpriseIconProps} variant="filled" />,
    Edit: <Pencil {...enterpriseIconProps} />,
    GetAccess: <ChevronsDoubleDownGuillemets {...enterpriseIconProps} />,
    Trash: <TrashCanCross {...enterpriseIconProps}/>,
    Share: <NodeSplit  {...enterpriseIconProps}/>,
    Wait: <Clock {...enterpriseIconProps}/>
};

const fuseOptions = {
    includeMatches: false,
    keys: [
        'custom_meta_label',
        'custom_classification',
        'object_info.description',
        'object_info.name',
        'object_info.owner',
    ],
};

const ObjectListComponent = ({ roles, objectList, defaultObject }) => {
    const [data, setData] = useState([]);
    const [selectorValue, setSelectorValue] = useState(defaultObject);
    const [isLoading, setLoading] = useState('true');
    const [overview, setOverview] = useState({});
    const [pageNum, setPageNum] = useState(1);
    const [paginatedData, setPaginatedData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [allSplunkHosts, setAllSplunkHosts] = useState([]);
    const [currentHost, setCurrentHost] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const modalToggle = useRef(null);
    const [editModal, setEditModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [currentTags, setCurrentTags] = useState([]);
    const [currentClassification, setCurrentClassification] = useState('');
    const [currentObject, setCurrentObject] = useState({});
    const [accessRequests, setAccessRequests] = useState([]);
    const [pendingRequests, setAllPendingRequests] = useState([]);
    const [bannerMessage, setBannerMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);

    const isAdmin = roles.includes('admin');
    const handleEditModalOpen = (object) => {
        let metaLabels = [];
        let customClassification = '';
        if (object.custom_meta_label) {
            metaLabels = object.custom_meta_label.split(',');
        }
        if (object.custom_classification) {
            customClassification = object.custom_classification;
        }
        setCurrentObject(object);
        setCurrentTags(metaLabels);
        setCurrentClassification(customClassification);
        setEditModal(true);
    };

    const handleApproveRequestModalOpen = () => {
        setApproveModal(true);
    };

    const handleEditModalClose = () => {
        setApproveModal(false);
        setEditModal(false);
        modalToggle?.current?.focus();
    };

    const handleRequestClickAway = ({ reason }) => {
        if (reason === 'escapeKey') {
            setEditModal(false);
            setApproveModal(false);
            modalToggle?.current?.focus();
        }
    };

    const makeGetRequest = async (url) => {
        const response = await axios.get(url, {
            headers: { Authorization: `Splunk ${Session.getSessionKey()}` },
        });
        return response.data;
    };
    const makePostRequest = async (url, body) => {
        const response = await axios.post(url, body, {
            headers: { Authorization: `Splunk ${Session.getSessionKey()}` },
        });

        return response.data;
    };
    const makeDeleteRequest = async (url) => {
        const response = await axios.delete(url, {
            headers: { Authorization: `Splunk ${Session.getSessionKey()}` },
        });
        return response.data;
    };

    const updatePendingRequests = async () => {
        let allPendingRequests = await makeGetRequest(ALL_PENDING_REQUESTS);
        console.log('all pending requests');
        console.log(allPendingRequests);
        setAllPendingRequests(allPendingRequests);
    };

    const showBanner = (message) => {
        setShowMessage(true);
        setBannerMessage(message);
        setTimeout(() => {
            setShowMessage(false);
        }, 3000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch KOs..
                const url =
                    currentHost !== 'all'
                        ? KO_ENDPOINT + selectorValue + `&splunk_host=${currentHost}`
                        : KO_ENDPOINT + selectorValue;
                const objectsForSplunkHost = await makeGetRequest(url);

                if (isAdmin) {
                    await updatePendingRequests();
                    setData(objectsForSplunkHost[selectorValue]);
                } else {
                    let objectsWithAccessStatus = [];
                    let requests = await makeGetRequest(
                        USER_ACCESS_REQUESTS + `?user=${Session.getUserName()}`
                    );
                    setAccessRequests(requests);
                    for (let object of objectsForSplunkHost[selectorValue]) {
                        for (let request of requests) {
                            if (request.id == object.id) {
                                object.access_status = request.status;
                            }
                        }
                        objectsWithAccessStatus.push(object);
                    }
                    setData(objectsWithAccessStatus);
                }

                if (searchTerm === '') {
                    setPaginatedData(
                        getPaginatedData(objectsForSplunkHost[selectorValue], pageNum)
                    );
                    setTotalPages(
                        Math.ceil(objectsForSplunkHost[selectorValue].length / RECORDS_PER_PAGE)
                    );
                } else {
                    let fuse = new Fuse(objectsForSplunkHost[selectorValue], fuseOptions);
                    let searchResults = fuse.search(searchTerm, pageNum);
                    searchResults = searchResults.map(({ item }) => item);
                    setPaginatedData(getPaginatedData(searchResults, 1));
                    setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE));
                }

                // Fetch Overview Numbers..
                const overviewResponse = await makeGetRequest(OVERVIEW_ENDPOINT);
                if (overviewResponse) {
                    setOverview(overviewResponse);
                }

                // Fetch all Splunk Hosts..
                const host_list = await makeGetRequest(GET_ALL_SPLUNK_HOSTS);
                if (host_list) {
                    setAllSplunkHosts(host_list.values);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectorValue, currentHost]);

    // handle search
    useEffect(() => {
        let fuse = new Fuse(data, fuseOptions);
        if (searchTerm === '') {
            setPaginatedData(getPaginatedData(data, 1));
            setTotalPages(Math.ceil(data.length / RECORDS_PER_PAGE));
        } else {
            let searchResults = fuse.search(searchTerm, pageNum);
            searchResults = searchResults.map(({ item }) => item);
            setPaginatedData(getPaginatedData(searchResults, 1));
            setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE));
        }
        // TODO
        // copy search logic to data inventory
    }, [searchTerm]);

    const selectChange = (e, { value: key }) => {
        setSelectorValue(key);
        setPageNum(1); // to prevent glitch when coming from higher page numbers
    };
    const handlePaginatorChange = (event, { page }) => {
        let fuse = new Fuse(data, fuseOptions);
        setPageNum(page);
        if (searchTerm === '') {
            setPaginatedData(getPaginatedData(data, page));
            setTotalPages(Math.ceil(data.length / RECORDS_PER_PAGE));
        } else {
            let searchResults = fuse.search(searchTerm, pageNum);
            searchResults = searchResults.map(({ item }) => item);
            setPaginatedData(getPaginatedData(searchResults, page));
            setTotalPages(Math.ceil(searchResults.length / RECORDS_PER_PAGE));
        }
    };
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * RECORDS_PER_PAGE;
        const endIndex = startIndex + RECORDS_PER_PAGE;
        const pageElements = data.slice(startIndex, endIndex);
        return pageElements;
    };
    const handleHostChange = (e, { value: key }) => {
        setCurrentHost(key);
    };
    const handleTagChange = (e, { values }) => {
        setCurrentTags(values);
        console.log(values);
    };
    const handleClassificationChange = (e, { value: key }) => {
        setCurrentClassification(key);
        console.log(key);
    };
    const handleEditSave = async () => {
        let objectToUpdate = currentObject;
        objectToUpdate.custom_classification = currentClassification;
        objectToUpdate.custom_meta_label = currentTags.join(',');
        let response = await makePostRequest(
            UPDATE_RECORD_ENDPOINT + `?key=${objectToUpdate['_key']}`,
            objectToUpdate
        );
        if (response['_key']) {
            handleEditModalClose();
        } else {
            alert('Update Failed !');
        }
    };
    const updateRequestStatus = (object, status) => {
        let currentData = data;
        let newData = [];
        for (let data of currentData) {
            if (data.id == object.id) {
                data.access_status = status;
            }
            newData.push(data);
        }
        setData(newData);
    };
    const handleGetAccess = async (object) => {
        let requestBody = {
            user: Session.getUserName(),
            object_type: object.type,
            status: 'requested',
            id: object.id,
        };
        await makePostRequest(REQUEST_ACCESS_ENDPOINT, requestBody);
        updateRequestStatus(object, 'requested');
    };
    const cancelRequest = async (object) => {
        for (let request of accessRequests) {
            if (request.id == object.id) {
                let response = await makeDeleteRequest(
                    CANCEL_ACCESS_REQUEST + `/${request['_key']}`
                );
                console.log(response);
                updateRequestStatus(object, '');
            }
        }
    };
    const approveRequest = async (object) => {
        console.log(object['_key']);
        await makePostRequest(APPROVE_REQUEST + `/${object['_key']}`);
        await updatePendingRequests();
    };
    const denyRequest = async (object) => {
        console.log(object['_key']);
        await makeDeleteRequest(DENY_REQUEST + `/${object['_key']}`);
        await updatePendingRequests();
    };
    const handleDeleteObject = async (object) =>{
        console.log("Deleting:"+object.id);
        let response = await axios.delete(DELETE_OBJECT, {
            headers: { Authorization: `Splunk ${Session.getSessionKey()}`,"id":object.id },
        });
            let currentData = data;
            let newData = currentData.filter(row => row.id !== object.id);
            setData(newData)
            window.location.reload();
            showBanner('Deleted')
    }
    const copyToClipboard = (url) =>{
        navigator.clipboard.writeText(url)
          .then(() => {
            console.log('Url copied to clipboard');
          })
          .catch(err => {
            console.error('Unable to copy url to clipboard', err);
          });
    }
    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
      };

    return (
        <div>
            <Modal
                onRequestClose={handleRequestClickAway}
                open={editModal}
                style={{ width: '600px' }}
            >
                <Modal.Header title="Header" onRequestClose={handleEditModalClose} />
                <Modal.Body>
                    <P>Edit Meta tag and Object Classification</P>
                    <ControlGroup label="Classification">
                        <Select value={currentClassification} onChange={handleClassificationChange}>
                            <Select.Option label="Unclassified" value="Unclassified" />
                            <Select.Option label="Confidential" value="Confidential" />
                            <Select.Option label="Secret" value="Secret" />
                            <Select.Option label="Top Secret" value="Top Secret" />
                            <Select.Option label="Top Secret / SCI" value="Top Secret / SCI" />
                        </Select>
                    </ControlGroup>
                    <ControlGroup label="Meta Labels / Tags">
                        <Multiselect
                            allowNewValues
                            values={currentTags}
                            onChange={handleTagChange}
                            inline
                        />
                    </ControlGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleEditModalClose} label="Cancel" />
                    <Button
                        type="submit"
                        appearance="primary"
                        label="Save"
                        onClick={handleEditSave}
                    />
                </Modal.Footer>
            </Modal>

            <Modal
                onRequestClose={handleRequestClickAway}
                open={approveModal}
                style={{ width: '650px' }}
            >
                <Modal.Header title="Header" onRequestClose={handleEditModalClose} />
                <Modal.Body>
                    <P>Pending Requests</P>
                    <Table stripeRows headType="docked" dockScrollBar>
                        <Table.Head>
                            <Table.HeadCell width={150}>User</Table.HeadCell>
                            <Table.HeadCell width={100}>Object</Table.HeadCell>
                            <Table.HeadCell width={150}>Object Name</Table.HeadCell>
                            <Table.HeadCell width={250}>Action</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {pendingRequests.map((row) => (
                                <Table.Row key={row.id}>
                                    <Table.Cell>{row.user}</Table.Cell>
                                    <Table.Cell>{row.object_type}</Table.Cell>
                                    <Table.Cell>
                                        {row.id.substring(row.id.lastIndexOf('/') + 1)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Button
                                            appearance="primary"
                                            label="Approve"
                                            onClick={() => {
                                                approveRequest(row);
                                            }}
                                        />
                                        <Button
                                            appearance="secondary"
                                            label="Deny"
                                            onClick={() => {
                                                denyRequest(row);
                                            }}
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="secondary" onClick={handleEditModalClose} label="Close" />
                </Modal.Footer>
            </Modal>
            <Select value={selectorValue} onChange={selectChange}>
                {objectList.map((item,index)=>(
                     <Select.Option
                        key={item.value+':'+index}
                        label={item.name+` ${overview[item.value] ? overview[item.value] : '..'}`}
                        value={item.value}
                        icon={item.icon}
                    />
                ))}
            </Select>

            <Select value={currentHost} onChange={handleHostChange}>
                <Select.Option label="All" value="all" icon={enterpriseIcons.Hosts} />
                {allSplunkHosts.map((item, index) => (
                    <Select.Option
                        key={item['_key']}
                        label={item.name}
                        value={item.hostname}
                        icon={enterpriseIcons.Hosts}
                    />
                ))}
            </Select>

            {isAdmin && (
                <Button
                    appearance="primary"
                    label="Approve Requests"
                    onClick={handleApproveRequestModalOpen}
                />
            )}

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
                    <Table stripeRows>
                        <Table.Head>
                            {/* <Table.HeadCell>Id</Table.HeadCell> */}
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
                                    {/* <Table.Cell>{row.id}</Table.Cell> */}
                                    <Table.Cell>{row.object_info.name}</Table.Cell>
                                    <Tooltip contentRelationship="label" content={(row.object_info.description)} style={{ margin: '0 10px' }}>
                                    <Table.Cell>{truncateText(row.object_info.description,100)}</Table.Cell>
                                    </Tooltip>
                                    <Table.Cell>{row.object_info.owner}</Table.Cell>
                                    <Table.Cell>{row.custom_meta_label}</Table.Cell>
                                    <Table.Cell>{row.custom_classification}</Table.Cell>
                                    <Table.Cell>{row.splunk_host}</Table.Cell>
                                    <Table.Cell>
                                        {isAdmin ? (
                                            <div>
                                            <Button
                                                onClick={() => {
                                                    handleEditModalOpen(row);
                                                }}
                                                ref={modalToggle}
                                                label="Edit"
                                                icon={enterpriseIcons.Edit}
                                            />
                                            <Button
                                                onClick={() => {
                                                    handleDeleteObject(row);
                                                }}
                                                label="Delete"
                                                icon={enterpriseIcons.Trash}
                                            />
                                            </div>
                                            
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    if (row.access_status === 'requested') {
                                                        cancelRequest(row);
                                                    } else if (row.access_status === 'approved') {
                                                        copyToClipboard(row.id)
                                                        showBanner('Copied to clipboard');
                                                    } else {
                                                        handleGetAccess(row);
                                                    }
                                                }}
                                                ref={modalToggle}
                                                label={
                                                    row.access_status === 'requested'
                                                        ? 'Requested'
                                                        : row.access_status === 'approved'
                                                        ? 'Share'
                                                        : 'Get Access'
                                                }
                                                icon={
                                                    row.access_status === 'requested'
                                                    ? enterpriseIcons.Wait
                                                    : row.access_status === 'approved'
                                                    ? enterpriseIcons.Share : enterpriseIcons.GetAccess
                                                }
                                            />
                                        )}
                                    </Table.Cell>
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
                    {showMessage && <MessageBar type="info">{bannerMessage}</MessageBar>}
                </div>
            )}
        </div>
    );
};

export default ObjectListComponent;
