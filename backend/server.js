const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors')

const app = express();
const port = 3000;

const conf = require('./config.json');
var splunkjs = require('splunk-sdk');

const splunkConfig = conf.splunk;
const service = new splunkjs.Service(splunkConfig);

app.use(cors());

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
      dashboards: (await getList("Dashboard")).length,
      reports: (await getList("Report")).length,
      lookups: (await getList("Lookup")).length,
      savedSearches: (await getList("SavedSearch")).length,
      indexes: (await getList("Index")).length,
      apps: (await getList("App")).length,
      alerts: (await getList("Alert")).length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

app.get("/values", async (req,res)=>{
  try{
    res.json({
      values : await getAllFieldValues(req.query.field)
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
        res.json({ dashboards: await getList("Dashboard", req.query.splunk_host) });
        break;
      case 'reports':
        res.json({ reports: await getList("Report", req.query.splunk_host) });
        break;
      case 'lookups':
        res.json({ lookups: await getList("Lookup", req.query.splunk_host) });
        break;
      case 'savedSearches':
        res.json({ savedSearches: await getList("SavedSearch", req.query.splunk_host) });
        break;
      case 'indexes':
        res.json({ indexes: await getList("Index", req.query.splunk_host) });
        break;
      case 'alerts':
        res.json({ alerts: await getList("Alert", req.query.splunk_host) });
        break;        
      case 'apps':
        res.json({ apps: await getList("App", req.query.splunk_host) });
        break;
      case 'all':
        res.json({ 
          dashboards: await getList("Dashboard" , req.query.splunk_host),
          reports: await getList("Report" , req.query.splunk_host),
          lookups: await getList("Lookup" , req.query.splunk_host),
          savedSearches: await getList("SavedSearch" , req.query.splunk_host),
          indexes: await getList("Index" , req.query.splunk_host),
          alerts: await getList("Alert" , req.query.splunk_host)
        })
      // case 'fields':
      //   res.json({ fields: await getFields() });
        break;
      default:
        res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/search', async (req, res) => {
  const keyword = req.query.q;
  const query = `index=main AND 
  type="*${keyword}*" OR
  splunk_host="*${keyword}*" OR
  custom_classification="*${keyword}*" OR
  custom_meta_label="*${keyword}*" OR
  object_info.description="*${keyword}*" OR
  object_info.name="*${keyword}*" OR
  object_info.owner="*${keyword}*"
  `;
  try {
    const searchResults = await searchSplunk(query);
    res.json({ searchResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/add', async (req, res) => {
  const type = req.query.type;

  try {
    switch (type) {
      case 'classification':
        // Add logic to perform classification
        res.json({ message: 'Classification added successfully' });
        break;
      // Add similar cases for other meta tags
      default:
        res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



async function getList(object,splunk_host){
  let searchQuery = splunk_host? `index="main" type="${object}" splunk_host="${splunk_host}"` : `index="main" type="${object}"`;
      let response = await searchSplunk(searchQuery);
      // console.log(response[0].rows)
      return response[0].rows;
}

async function getAllFieldValues(field){
  let searchQuery = `index="main" | stats values(${field}) as ${field}`;
  let response = await searchSplunk(searchQuery);
  return response[0].rows[0][0];
}


// Functions for fetching data from Splunk
async function getDashboards() {
    let searchQuery = 'index="main" type="Dashboard"';
      let response = await searchSplunk(searchQuery);
      console.log(response[0].rows)
      return response[0].rows;
}

async function getAlerts(){
  const response = await service.request('/services/alerts', 'GET');
  return {list:response.data.entry,total:response.data.entry.length}
}

async function getReports() {
    const response = await service.request('/servicesNS/-/-/saved/searches', 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
}

async function getSavedSearches(){
    const response = await service.request('/servicesNS/-/-/saved/searches', 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
}

async function getFields() {
  const response = await searchSplunk('index=_internal  |  fieldsummary |  fields field');
  return {total:response[1]._properties.eventCount};
}

async function getLookups() {
    const response = await service.request('/servicesNS/-/-/data/transforms/lookups', 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
}

async function getUniqueFields(indexName) {
    const response = await service.request(`/servicesNS/-/-/data/indexes/${indexName}/fields`, 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
  }

async function getIndexes() {
    const response = await service.request('/servicesNS/-/-/data/indexes', 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
}



  async function getApps() {
    const response = await runOneshotSearch('| rest /servicesNS/-/-/apps/local | search disabled=0 | table label title version description');
    return {list:response.rows,total:response.rows.length};
  }

  async function getSourceTypeCount() {
    try{
    const search = service.search("| stats count by sourcetype");
    const results = await search.results(); // this line giving error
    console.log(results)
    return results.rows; // Number of unique SourceTypes
    }
    catch(e){
        console.log(e)
    }
  }
  


async function searchSplunk(query) {
  let search_job = await service.search("search "+query,{
    exec_mode:"blocking"
  });
  search_job = await search_job.fetch();
  let response = await search_job.results({count:0});
  return response
}

const runOneshotSearch = async (query) => {
  try {
    const searchOptions = { count: 0 };
    const results = await service.oneshotSearch(query, searchOptions);
    return results
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// search
// | rest /servicesNS/-/-/data/inputs/lookup
// | eval artifact_type="lookup", source="inputs/lookup"
// | search title=*main*
// | append [rest /servicesNS/-/-/data/transforms/extractions]
// | eval artifact_type=if(isnull(artifact_type), "extraction", artifact_type), source="transforms/extractions"
// | search title=*main*
// | append [rest /servicesNS/-/-/data/transforms/lookups]
// | eval artifact_type=if(isnull(artifact_type), "lookup_transform", artifact_type), source="transforms/lookups"
// | search title=*main*
// | append [rest /servicesNS/-/-/saved/searches]
// | eval artifact_type=if(isnull(artifact_type), "dashboard", artifact_type), source="saved/searches/_new"
// | search title=*main*
// | append [rest /servicesNS/-/-/data/ui/views]
// | eval artifact_type=if(isnull(artifact_type), "dashboard_panel", artifact_type), source="ui/views"
// | search title=*main*
// | append [rest /servicesNS/-/-/data/ui/nav]
// | eval artifact_type=if(isnull(artifact_type), "app", artifact_type), source="ui/nav"
// | search title=*main*
// | append [rest /servicesNS/-/-/data/indexes]
// | eval artifact_type="index", source="indexes"
// | search title=*main*
// | table title, artifact_type, source
