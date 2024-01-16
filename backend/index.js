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
    // const metaFields = await getMetaFields();
    const apps = await getApps();
    const sourcetype = await getSourceTypeCount();
    console.log(sourcetype)
    
    // Add similar calls for searches, alerts, lookups, and fields

    res.json({
      dashboards: dashboards.length,
      reports: reports.length,
      lookups: lookups.length,
      savedSearches: savedSearches.length,
      indexes: indexes.length,
    //   metaFields: metaFields.length,
      apps: apps.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/list', async (req, res) => {
  const type = req.query.type;

  try {
    switch (type) {
      case 'dashboard':
        res.json({ dashboards: await getDashboards() });
        break;
      case 'report':
        res.json({ reports: await getReports() });
        break;
      // Add similar cases for searches, alerts, lookups, and fields
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

// Functions for fetching data from Splunk
async function getDashboards() {
    const response = await service.request('/servicesNS/-/-/data/ui/views', 'GET');
    return response.data.entry;
}

async function getReports() {
    const response = await service.request('/servicesNS/-/-/saved/searches', 'GET');
    // console.log(response)
    return response.data.entry;
}

async function getSavedSearches(){
    const response = await service.request('/servicesNS/-/-/saved/searches', 'GET');

    return response.data.entry;
}

async function getLookups() {
    const response = await service.request('/servicesNS/-/-/data/lookup-table-files', 'GET');
    // console.log(response)
    return response.data.entry;
}

async function getUniqueFields(indexName) {
    const response = await service.request(`/servicesNS/-/-/data/indexes/${indexName}/fields`, 'GET');
    return response.data.fields;
  }

async function getIndexes() {
    const response = await service.request('/servicesNS/-/-/data/indexes', 'GET');
    return response.data.entry;
}

async function getMetaFields() {
    const response = await service.request('/servicesNS/-/-/data/meta/fields', 'GET');
    return response.data.entry;
  }

  async function getApps() {
    const response = await service.request('/servicesNS/-/-/apps/local', 'GET');
    return response.data.entry;
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
  

  
// Function to search Splunk
async function searchSplunk(query) {
  const response = await axios.get(
    `${splunkConfig.splunkProtocol}://${splunkConfig.splunkHost}:${splunkConfig.splunkPort}/servicesNS/-/-/search/jobs/export?search=${encodeURIComponent(
      query
    )}`,
    { auth: splunkCredentials }
  );
  return response.data;
}
