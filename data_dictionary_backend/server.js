const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors')

const app = express();
const conf = require('./config.json');
const port = conf.app.port;
const KV_ENDPONT = `/servicesNS/nobody/${conf.splunk_dictionary_instance.appName}/storage/collections/data/${conf.splunk_dictionary_instance.collectionName}`;
const KV_ENDPONT_SPLUNK_HOSTS = `/servicesNS/nobody/${conf.splunk_dictionary_instance.appName}/storage/collections/data/${conf.splunk_dictionary_instance.ledgerCollectionName}`;
const KV_ENDPONT_REQUEST_APPROVE = `/servicesNS/nobody/${conf.splunk_dictionary_instance.appName}/storage/collections/data/${conf.splunk_dictionary_instance.requestApproveCollectionName}`;

app.use(cors());
app.use(express.json());

// proxy for splunk rest calls from frontend , to bypass cors
const proxy = require('./proxy');

// To prevent caching of responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use('/proxy',proxy);

app.get('/overview', async (req, res) => {
  
  try {
    res.json({ 
      dashboards: (await getAllRecordsFromKV("Dashboard")).length,
      reports: (await getAllRecordsFromKV("Report")).length,
      lookups: (await getAllRecordsFromKV("Lookup")).length,
      savedSearches: (await getAllRecordsFromKV("SavedSearch")).length,
      indexes: (await getAllRecordsFromKV("Index")).length,
      apps: (await getAllRecordsFromKV("App")).length,
      alerts: (await getAllRecordsFromKV("Alert")).length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

app.get("/all_hosts", async (req,res)=>{
  try{
    res.json({
      values : await getAllSplunkHosts()
    });
  }
  catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
})


app.get('/list', async (req, res) => {
  const type = req.query.type;

  try {
    switch (type) {
      case 'dashboards':
        res.json({ dashboards: await getAllRecordsFromKV("Dashboard", req.query.splunk_host) });
        break;
      case 'reports':
        res.json({ reports: await getAllRecordsFromKV("Report", req.query.splunk_host) });
        break;
      case 'lookups':
        res.json({ lookups: await getAllRecordsFromKV("Lookup", req.query.splunk_host) });
        break;
      case 'savedSearches':
        res.json({ savedSearches: await getAllRecordsFromKV("SavedSearch", req.query.splunk_host) });
        break;
      case 'indexes':
        res.json({ indexes: await getAllRecordsFromKV("Index", req.query.splunk_host) });
        break;
      case 'alerts':
        res.json({ alerts: await getAllRecordsFromKV("Alert", req.query.splunk_host) });
        break;        
      case 'apps':
        res.json({ apps: await getAllRecordsFromKV("App", req.query.splunk_host) });
        break;
      case 'all':
        res.json({ 
          dashboards: await getAllRecordsFromKV("Dashboard" , req.query.splunk_host),
          reports: await getAllRecordsFromKV("Report" , req.query.splunk_host),
          lookups: await getAllRecordsFromKV("Lookup" , req.query.splunk_host),
          savedSearches: await getAllRecordsFromKV("SavedSearch" , req.query.splunk_host),
          indexes: await getAllRecordsFromKV("Index" , req.query.splunk_host),
          alerts: await getAllRecordsFromKV("Alert" , req.query.splunk_host)
        })
        break;
      default:
        res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/update', async (req, res) => {
  const key = req.query.key;
  const newData = req.body;
  console.log(key)
  console.log(req)
  if(!newData || !key){
    res.status(400).json({ error: "key or body missing" });
  }
  try {
    res.json(await updateRecord(key,newData))
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  TODO : Implement UI for these
app.get('/allPendingRequests', async (req, res) => {
  try{
    let response = await makeGetRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}?query={"status":"requested"}`);
    res.json(response.data);
  }catch (error) {
    res.status(500).json({ error: error.message });
  }
})

app.get('/userRequests', async (req, res) => {
  const user = req.query.user;
  if(!user){
    res.status(400).json({ error: "user missing" });
  }
  try{
    let response = await makeGetRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}?query={"user":"${user}"}`);
    res.json(response.data);
  }catch (error) {
    res.status(500).json({ error: error.message });
  }
})

app.post('/request-access', async (req, res) => {
  if(!req.body){
    res.status(400).json({ error: "Body Missing !" });
  }
  try {
    let response = await makePostRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}`,req.body);
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/approve-request/:key', async (req, res) => {
  if(!req.params.key){
    res.status(400).json({ error: "Key Missing !" });
  }
  try {
    // splunk logic to approve here ----
    let request_object = await makeGetRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}/${req.params.key}`);
    request_object.data.status = "approved";
    let response = await makePostRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}/${req.params.key}`,request_object.data);
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/cancelRequest/:key', async(req, res)=>{
  if(!req.params.key){
    res.status(400).json({ error: "Key Missing !" });
  }
  try {
    let response = await makeDeleteRequest(`${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_REQUEST_APPROVE}/${req.params.key}`);
     // splunk logic to deny here ----
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})

app.delete('/deleteObject', async(req,res)=>{
    let ObjectId = req.headers.id;
    if(!ObjectId){
      res.status(400).json({ error: "Object Id !" });
    }
    try{
      let kv_response = await getRecordFromKV(`{"id":"${ObjectId}"}`)
        if(kv_response.length > 0){
          let splunk_response = await makeDeleteRequest(ObjectId) // delete from Splunk
           if(splunk_response.data){
              let kv_delete_response = await deleteRecordFromKV(kv_response[0]['_key'])
             res.json(kv_delete_response);
           }
        }
    }catch(error){
      res.status(500).json({ error: error.message });
    }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




// async function getAllFieldValues(field){
//   let searchQuery = `index="main" | stats values(${field}) as ${field}`;
//   let response = await searchSplunk(searchQuery);
//   return response[0].rows[0][0];
// }


async function updateRecord(key,newData){
      try{
        const url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT}/${key}`;
        console.log(url);
        const respose = await makePostRequest(url,newData);
        return respose.data;
      }catch (error) {
      console.error(`Error Updating data in KV ${error}`);
      return error;
    }
}

async function getAllRecordsFromKV(type,host){
  try{
    let url;
    if(host){
      url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT}?query={"type":"${type}","splunk_host":"${host}"}`;
    }else{
      url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT}?query={"type":"${type}"}`;
    }
    console.log(url)
    const response = await makeGetRequest(url);
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

async function getRecordFromKV(query){
  try{
    let url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT}?query=${query}`;
    console.log(url)
    const response = await makeGetRequest(url);
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}
async function deleteRecordFromKV(key){
  try{
    let url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT}/${key}`;
    console.log(url)
    const response = await makeDeleteRequest(url);
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

async function getAllSplunkHosts(){
  try{
    const url = `${conf.splunk_dictionary_instance.hostname}${KV_ENDPONT_SPLUNK_HOSTS}`;
    console.log(url)
    const response = await makeGetRequest(url);
    return response.data;
  }catch (error) {
    console.error(`Error fetching data from KV ${error}`);
    return error;
  }
}

async function makeGetRequest(url){
  let response = await axios.get(url, {
    auth: {
      username: conf.splunk_dictionary_instance.username,
      password: conf.splunk_dictionary_instance.password
    },
    params:{
      count: -1, // no paging 
      output_mode: "json"
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
  return response;
}

async function makePostRequest(url,body){
  let response = await axios.post(url,body, {
    auth: {
      username: conf.splunk_dictionary_instance.username,
      password: conf.splunk_dictionary_instance.password
    },
    params:{
      count: -1, // no paging 
      output_mode: "json"
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
  return response;
}

async function makeDeleteRequest(url){
  let response = await axios.delete(url, {
    auth: {
      username: conf.splunk_dictionary_instance.username,
      password: conf.splunk_dictionary_instance.password
    },
    params:{
      count: -1, // no paging 
      output_mode: "json"
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
  return response;
}