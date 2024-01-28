import React, { useState ,useEffect } from 'react';

import axios from 'axios';

// Splunk UI Components
import Card from '@splunk/react-ui/Card';
import styles from './Overview.style.json';

// Util Functions
import Session from '../Utils/Session';

import config from '../../../../config.json';
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
                <CustomCard name={"Dashboard"} count={overview.dashboards}/>
                <CustomCard name={"Reports"} count={overview.reports}/>
                <CustomCard name={"Lookups"} count={overview.lookups}/>
                <CustomCard name={"Indexes"} count={overview.indexes}/>
                <CustomCard name={"Apps"} count={overview.apps}/>
                <CustomCard name={"Saved Searches"} count={overview.savedSearches}/>
             </div>
        )}
        </div>
    );
}



const CustomCard =({name,count})=>{
    return (
        <Card style={styles.card}>
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