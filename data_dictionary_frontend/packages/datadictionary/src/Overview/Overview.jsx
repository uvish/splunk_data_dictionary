import React, { useState ,useEffect } from 'react';

import axios from 'axios';

// Splunk UI Components
import Card from '@splunk/react-ui/Card';
import styles from './Overview.style.json';

// Util Functions
import Session from '../Utils/Session';

let config;
if (process.env.DOCKER_CONTAINER === 'true') {
    config = require('../../../../config_docker.json');
  } else {
    config = require('../../../../config.json');
  }
  
const splunk_server_url = config.splunk.server_url;
const OVERVIEW_ENDPOINT = splunk_server_url+`/overview`;


const Overview = () =>{
    const [overview, setOverview] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
            setLoading(true);
            getOverview();
        },[]);
        

        const getOverview = async () => {
            try{  
                const response = await axios.get(OVERVIEW_ENDPOINT,
                        {headers:{
                                Authorization: `Splunk ${Session.getSessionKey()}`
                            }
                        });
        
                        if(response.data){
                            setOverview(response.data);
                            setLoading(false);
                        }
                } catch(error){
                            console.log(error);
                            setLoading(false);
                            if(error.response.status == 401) {
                                Session.logout();
                            }
                  }
        }
    
    return (
            <div>
            {loading ? (
            <div>
                Loading..
             </div>
        ):(
            <div>
                <CustomCard name={"Dashboard"} count={overview.dashboards} color={styles.dashboards}/>
                <CustomCard name={"Reports"} count={overview.reports}  color={styles.reports}/>
                <CustomCard name={"Lookups"} count={overview.lookups}  color={styles.lookups}/>
                <CustomCard name={"Indexes"} count={overview.indexes}  color={styles.indexes}/>
                <CustomCard name={"Apps"} count={overview.apps}  color={styles.apps}/>
                <CustomCard name={"Saved Searches"} count={overview.savedSearches}  color={styles.savedSearches}/>
                <CustomCard name={"Fields"} count={overview.fields}  color={styles.fields}/>
             </div>
        )}
        </div>
    );
}



const CustomCard =({name,count,color})=>{
    return (
        <Card style={{ ...styles.card, ...color}}>
            <Card.Body >
            <div style={styles.cardContainer}>
                <div style={styles.header}>{count}</div>
                <div style={styles.title}>{name}</div>
            </div>
        </Card.Body>
    </Card>
    )
}

export default Overview;