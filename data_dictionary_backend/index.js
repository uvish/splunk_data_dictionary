const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const conf = require('./config.json');
var splunkjs = require('splunk-sdk');

const splunkConfig = conf.splunk;
const service = new splunkjs.Service(splunkConfig);


app.get('/overview', async (req, res) => {
  try {
    const dashboards = await getDashboards();
    const reports = await getReports();
    const lookups = await getLookups();
    const savedSearches = await getSavedSearches();
    const indexes = await getIndexes();
    const fields = await getFields();
    const apps = await getApps();s
    res.json({
      dashboards: dashboards.total,
      reports: reports.total,
      lookups: lookups.total,
      savedSearches: savedSearches.total,
      indexes: indexes.total,
      fields: fields.total,
      apps: apps.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/list', async (req, res) => {
  const type = req.query.type;

  try {
    switch (type) {
      case 'dashboards':
        res.json({ dashboards: await getDashboards() });
        break;
      case 'reports':
        res.json({ reports: await getReports() });
        break;
      case 'lookups':
        res.json({ lookups: await getLookups() });
        break;
      case 'savedSearches':
        res.json({ savedSearches: await getSavedSearches() });
        break;
      case 'indexes':
        res.json({ indexes: await getIndexes() });
        break;
      case 'apps':
        res.json({ apps: await getApps() });
        break;
      default:
        res.status(400).json({ error: 'Invalid type parameter' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/search', async (req, res) => {
  const query = req.query.q;

  try {
    const searchResults = await runOneshotSearch(query);
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

// Functions for fetching data from Splunk
async function getDashboards() {
    const response = await service.request('/servicesNS/-/-/data/ui/views', 'GET');
    return {list:response.data.entry,total:response.data.paging.total};
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
  console.log(response)
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
