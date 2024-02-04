const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const express = require('express');
const app = express();

app.listen(1111, () => {
  console.log(`Server is running on http://localhost:${1111}`);
});

let healthy = false;

let config;
if (process.env.DOCKER_CONTAINER === 'true') {
  console.log("Loading Docker Config");
  config = require('./config_docker.json');
  console.log(JSON.stringify(config));
} else {
  config = require('./config.json');
}

const UPDATE_INTERVAL = 5000 ; //every 5 seconds

const SPLUNKD_ENDPOINTS = {
  DASHBOARDS :     "/servicesNS/-/-/data/ui/views",
  REPORTS :        "/servicesNS/-/-/saved/searches?search=alert_type%3D%22always%22",
  SAVED_SEARCHES : "/servicesNS/-/-/saved/searches?search=alert_type%3D%22number%20of%20events%22",
  LOOKUPS :        "/servicesNS/-/-/data/transforms/lookups",
  INDEXES :        "/servicesNS/-/-/data/indexes",
  APPS :           "/servicesNS/-/-/apps/local",
  ALERTS :         "/services/alerts",
  FIELDS :         "/services/search/fields"
}
const KV_ENDPONT_DATA_DICTIONARY = `/servicesNS/nobody/${config.splunk_dictionary_instance.appName}/storage/collections/data/${config.splunk_dictionary_instance.collectionName}`;
const KV_ENDPONT_SPLUNK_HOSTS = `/servicesNS/nobody/${config.splunk_dictionary_instance.appName}/storage/collections/data/${config.splunk_dictionary_instance.ledgerCollectionName}`;
let updateInProgress = false;

setInterval(async ()=>{
  if(!updateInProgress)
    {
      await collectAndSend()
    }
},UPDATE_INTERVAL);

async function collectAndSend() {
    for (const instance of config.splunk_instances) {
      try {
      let [dashboards, reports, savedSearches, lookups, indexes, apps, alerts, fields] = await Promise.all([
        fetchRecords(instance, "Dashboard", SPLUNKD_ENDPOINTS.DASHBOARDS),
        fetchRecords(instance, "Report", SPLUNKD_ENDPOINTS.REPORTS),
        fetchRecords(instance, "SavedSearch", SPLUNKD_ENDPOINTS.SAVED_SEARCHES),
        fetchRecords(instance, "Lookup", SPLUNKD_ENDPOINTS.LOOKUPS),
        fetchRecords(instance, "Index", SPLUNKD_ENDPOINTS.INDEXES),
        fetchRecords(instance, "App", SPLUNKD_ENDPOINTS.APPS),
        fetchRecords(instance, "Alert", SPLUNKD_ENDPOINTS.ALERTS),
        fetchRecords(instance, "Field", SPLUNKD_ENDPOINTS.FIELDS)
      ]);

      let incomingList = [...dashboards, ...reports, ...savedSearches, ...lookups, ...indexes, ...apps, ...alerts, ...fields];
      let currentList = await getAllRecordsFromKV();

      let updateList = incomingList.filter(obj2 => !currentList.some(obj1 => obj1.id === obj2.id));

      healthy = true;

      let thisInstanceList = currentList.filter((record)=>{
        return record.splunk_host == instance.hostname
      })

      console.log(`${getCurrentTime()} | Splunk ${instance.name} \t | Records: ${incomingList.length} \t | Indexed: ${thisInstanceList.length} \t | Pending: ${updateList.length}`)

      // Add New Pending Records in KV
      let result = []
      updateInProgress = true;
      for(let record of updateList){
        let updated = await writeRecordToKV(record);
        if(updated['_key'])
        result.push(updated);
      }
      updateList = [];
      updateInProgress = false;
      // console.log("Updated Records:"+result.length)
      await updateNewSplunkInstanceInLedger(instance.hostname,instance.name);
    } catch (error) {
      healthy = false;
      console.error(`Waiting for Splunk: ${instance.hostname}`);
    }
    }
    if(healthy)
    console.log('=========================================================================================')
}

async function updateNewSplunkInstanceInLedger(hostname,name){
  try{
    const response = await axios.get(`${config.splunk_dictionary_instance.hostname}${KV_ENDPONT_SPLUNK_HOSTS}?query={"name":"${name}","hostname":"${hostname}"}`, {
      auth: {
        username: config.splunk_dictionary_instance.username,
        password: config.splunk_dictionary_instance.password
      },
      params:{
        count: -1, // no paging 
        output_mode: "json"
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    if(response.data.length < 1){
      await axios.post(`${config.splunk_dictionary_instance.hostname}${KV_ENDPONT_SPLUNK_HOSTS}`, {
        name:name,
        hostname:hostname,
        id: uuidv4()
      }, {
        auth: {
          username: config.splunk_dictionary_instance.username,
          password: config.splunk_dictionary_instance.password
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        }),
        headers :{
          'Content-Type': 'application/json'
        }
      });
      console.log(`New Splunk Host Added !! ${name} ${hostname}`);
    }
    return;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

async function getAllRecordsFromKV(){
  try{
    const response = await axios.get(`${config.splunk_dictionary_instance.hostname}${KV_ENDPONT_DATA_DICTIONARY}`, {
      auth: {
        username: config.splunk_dictionary_instance.username,
        password: config.splunk_dictionary_instance.password
      },
      params:{
        count: -1, // no paging 
        output_mode: "json"
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

async function writeRecordToKV(record){
  try{
    const response = await axios.post(`${config.splunk_dictionary_instance.hostname}${KV_ENDPONT_DATA_DICTIONARY}`, record, {
      auth: {
        username: config.splunk_dictionary_instance.username,
        password: config.splunk_dictionary_instance.password
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      headers :{
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function fetchRecords(instance, type, endpoint){
  try {
    const response = await axios.get(`${instance.hostname}${endpoint}`, {
      auth: {
        username: instance.username,
        password: instance.password
      },
      params:{
        count: -1, // no paging 
        output_mode: "json"
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    let data = response.data.entry;
    let responseData = [];
    for(let entry of data){
      responseData.push(
        {
          "splunk_host" :instance.hostname,
          "type": type,
          "id": type=="Field" ? instance.hostname+entry.id : entry.id,
          "timestamp": entry.updated,
          "custom_classification": "Unclassified",
          "object_info":{
            "name": entry.name,
            "description": entry.content?.description || "no description",
            "owner": entry.acl?.owner || ""
          }
        }
      )
    }
    return responseData;
  } catch (error) {
    return { instanceName: instance.name, error: error.message };
  }
}

app.get('/ping', async (req, res) => {
  if(healthy){
    res.json({"healthy":"ok"})
  }else{
    res.status(500).json({ error: 'Waiting for Splunk Instances..' });
  }
})

