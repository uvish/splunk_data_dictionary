import React, { useEffect, useState } from 'react';
import config from '../../../../config.json';
import axios from 'axios';

// Splunk UI Components
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import TabLayout from '@splunk/react-ui/TabLayout';
import P from '@splunk/react-ui/Paragraph';
import DL from '@splunk/react-ui/DefinitionList';
import Link from '@splunk/react-ui/Link';
import List from '@splunk/react-ui/List';

// Other Components
import Overview from '../Overview/Overview';
import KO from '../KO/KO';

// Helper Functions
import Session from '../Utils/Session'
import DataInventory from '../DataInventory/DataInventory';

const Dashbaord = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=>{
        if(Session.isLoggedIn()){
            console.log('Getting Roles ..')
            getRoles();
        }else {
            Session.logout();
        }
        },[]);


  const splunk_server_url = config.splunk.server_url;

  const LOGIN_ENDPOINT = splunk_server_url+`/proxy/services/auth/login`;
  const USER_DETAILS_ENDPOINT = splunk_server_url+`/proxy/services/authentication/users`;
  const JSON_OUTPUT = `?output_mode=json`;


  const getRoles = async () => {
    try{
        const userDetailsResponse = await axios.get(USER_DETAILS_ENDPOINT+`/${Session.getUserName()}`+JSON_OUTPUT,
                {headers:{
                        Authorization: `Splunk ${Session.getSessionKey()}`
                    }
                });

        if(userDetailsResponse.data.entry){
                setRoles(userDetailsResponse.data.entry[0].content.roles)
                // setRoles[roles];
                setLoading(false);
                return roles;
            }
        } catch(error){
                    console.log(error);
                    setError(error);
                    setLoading(false);
                    if(error.response.status == 401) {
                        Session.logout();
                    }
          }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
     <h1>Dashboard</h1>
     {/* <h2>{roles}</h2> */}
     <TabContainer/>
    </div>
  );
};

function TabContainer() {
    const [activePanelId, setActivePanelId] = useState('overview');
    const handleChange = (e, { activePanelId: panelId }) => {
        setActivePanelId(panelId);
    };

    return (
        <TabLayout autoActivate defaultActivePanelId="overview" activePanelId={activePanelId} onChange={handleChange}>
            <TabLayout.Panel label="Overview" panelId="overview" style={{ margin: 20 }}>
               <Overview/>
            </TabLayout.Panel>
            <TabLayout.Panel label="KOs" panelId="kos" style={{ margin: 20 }}>
               <KO/>
            </TabLayout.Panel>
            <TabLayout.Panel label="Data Inventory" panelId="data_inventory" style={{ margin: 20 }}>
               <DataInventory/>
            </TabLayout.Panel>
        </TabLayout>
    );
}

export default Dashbaord;
