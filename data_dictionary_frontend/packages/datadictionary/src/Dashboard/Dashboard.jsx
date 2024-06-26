import React, { useEffect, useState } from 'react';

let config;
if (process.env.DOCKER_CONTAINER === 'true') {
    config = require('../../../../config_docker.json');
  } else {
    config = require('../../../../config.json');
  }

import axios from 'axios';

// Splunk UI Components
import Button from '@splunk/react-ui/Button';
import TabLayout from '@splunk/react-ui/TabLayout';
import ListIcon from '@splunk/react-icons/List';
import CirclesFour from '@splunk/react-icons/CirclesFour';
import ChartColumnSquare from '@splunk/react-icons/ChartColumnSquare';
import CylinderMagnifier from '@splunk/react-icons/CylinderMagnifier';
import BellDot from '@splunk/react-icons/BellDot';
import TableSlide from '@splunk/react-icons/TableSlide';
import CylinderIndex from '@splunk/react-icons/CylinderIndex';
import Moon from '@splunk/react-icons/Moon';
import Sun from '@splunk/react-icons/Sun';
import Portrait from '@splunk/react-icons/Portrait';

// Other Components
import Overview from '../Overview/Overview';
import styles from './style.json';

// Helper Functions
import Session from '../Utils/Session'
import {Container} from '../CommonStyles';
import ObjectListComponent from '../ObjectListComponent/ObjectListComponent';

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


  const SPLUNK_SERVER_URL = config.splunk.server_url;
  const LOGIN_ENDPOINT = `${SPLUNK_SERVER_URL}/proxy/services/auth/login`;
  const USER_DETAILS_ENDPOINT = `${SPLUNK_SERVER_URL}/proxy/services/authentication/users`;
  const JSON_OUTPUT = `?output_mode=json`;


  const getRoles = async () => {
    try{
        const userDetailsResponse = await axios.get(USER_DETAILS_ENDPOINT+`/${Session.getUserName()}`+JSON_OUTPUT,
                {headers:{
                        Authorization: `Splunk ${Session.getSessionKey()}`
                    }
                });

        if(userDetailsResponse.data.entry){
            console.log(userDetailsResponse.data.entry[0].content.roles)
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
     <TabContainer roles={roles}/>
    </div>
  );
};

function TabContainer({ roles }) {
    const [activePanelId, setActivePanelId] = useState('overview');
    const handleChange = (e, { activePanelId: panelId }) => {
        setActivePanelId(panelId);
    };

const enterpriseIconProps = {
        hideDefaultTooltip: true,
        screenReaderText: null,
        size: '16px',
    };

const KO_LIST = [
    {name:"Apps",value:"apps",icon: <CirclesFour {...enterpriseIconProps} variant="filled" />},
    {name:"Dashbaords",value:"dashboards", icon: <ChartColumnSquare {...enterpriseIconProps} variant="filled" />},
    {name:"Saved Searches",value:"savedSearches", icon: <CylinderMagnifier {...enterpriseIconProps} variant="filled" />},
    {name:"Alerts",value:"alerts", icon: <BellDot {...enterpriseIconProps} variant="filled" />}
]
const DATA_INVENTORY_LIST = [
    {name:"Lookups",value:"lookups", icon: <TableSlide {...enterpriseIconProps} variant="filled" />},
    {name:"Fields",value:"fields", icon: <ListIcon {...enterpriseIconProps} variant="filled" />},
    {name:"Index",value:"indexes", icon: <CylinderIndex {...enterpriseIconProps} variant="filled" />}
]

  
const iconProps = {
    screenReaderText: null,
    height: '16px',
    width: '16px',
};

const ThemeToggle = () => {
    let colorScheme = localStorage.getItem('theme');
  
    const toggleTheme = () => {
        localStorage.setItem('theme',colorScheme === 'dark' ? 'light' : 'dark');
        window.location.reload();
    };

    return (
      <div style={colorScheme === "dark"? styles.toggleContainerLight : styles.toggleContainerDark}>
        <Button style={ styles.toggleButton} onClick={toggleTheme} icon={ colorScheme === "dark"? <Sun {...iconProps}/> :  <Moon {...iconProps}/>}>
        </Button>
      </div>
    );
  };

    return (
        <Container>
            <div style={styles.logoutDiv}>
                <span></span>
            <div style={styles.logoutDiv}>
                <p style={{"margin-right":"30px"}}><Portrait {...iconProps}/>   {Session.getUserName()}</p>
              <Button style={styles.logoutButton} label="Logout" appearance="destructive" onClick={()=>{Session.logout()}} />
              </div>
            </div>
        <TabLayout autoActivate defaultActivePanelId="overview" activePanelId={activePanelId} onChange={handleChange}>
            
            <TabLayout.Panel label="Overview" panelId="overview" style={{ margin: 20 }}>
               <Overview/>
            </TabLayout.Panel>
            <TabLayout.Panel label="KOs" panelId="kos" style={{ margin: 20 }}>
                <ObjectListComponent roles={roles} objectList={KO_LIST} defaultObject={"apps"} />
            </TabLayout.Panel>
            <TabLayout.Panel label="Data Inventory" panelId="data_inventory" style={{ margin: 20 }}>
                <ObjectListComponent roles={roles} objectList={DATA_INVENTORY_LIST} defaultObject={"lookups"} />
            </TabLayout.Panel>
        </TabLayout>
        <ThemeToggle/>
        </Container>
    );
}

export default Dashbaord;
