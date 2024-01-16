const express = require('express');
const axios = require('axios');

const app = express();
const splunkApiUrl = 'http://localhost:8089/services'; // Replace with your Splunk instance URL
const splunkCredentials = {
  username: 'uvish66@gmail.com',
  password: 'Uvish123@',
};

// Helper function to make authenticated requests to Splunk API using axios
const makeSplunkRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const response = await axios({
      method,
      url: `${splunkApiUrl}/${endpoint}?output_mode=json`,
      auth: {
        username: splunkCredentials.username,
        password: splunkCredentials.password,
      },
      json: true,
      data: body,
    });

    return response.data;
  } catch (error) {
    throw error.response.data || error.message;
  }
};

app.get('/overview', async (req, res) => {
  try {
    // Retrieve the number of dashboards, reports, searches, lookups, unique fields,
    // indexes, sourcetypes, sources, and hosts
    const [dashboards, reports, searches, lookups, uniqueFields, indexes, sourcetypes, sources, hosts] = await Promise.all([
      makeSplunkRequest('data/ui/views'),
    //   makeSplunkRequest('data/reports'),
    //   makeSplunkRequest('data/searches'),
      makeSplunkRequest('data/transforms/lookups'),
    //   makeSplunkRequest('data/transforms/extractions'),
    //   makeSplunkRequest('data/indexes'),
    //   makeSplunkRequest('data/sourcetypes'),
    //   makeSplunkRequest('data/sources'),
    //   makeSplunkRequest('data/hosts'),
    ]);

    const overviewData = {
      dashboards,
    //   reports,
    //   searches,
      lookups,
    //   uniqueFields,
    //   indexes,
    //   sourcetypes,
    //   sources,
    //   hosts,
    };

    res.json(overviewData);
  } catch (error) {
    console.log(error)
    res.status(500).send('Error fetching Splunk overview data');
  }
});

// Add other endpoints
app.get('/list', async (req, res) => {
  // Implement logic to retrieve list based on the type parameter
  const type = req.query.type;

  if (!type) {
    return res.status(400).send('Type parameter is required');
  }

  try {
    const listData = await makeSplunkRequest(`data/${type}/count`);
    res.json({ count: listData });
  } catch (error) {
    res.status(500).send(`Error fetching list for type: ${type}`);
  }
});

app.get('/search', async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  try {
    const searchResults = await makeSplunkRequest('search/jobs/export', 'POST', {
      search: query,
      output_mode: 'json',
    });

    res.json(searchResults);
  } catch (error) {
    res.status(500).send(`Error performing search for query: ${query}`);
  }
});

app.get('/add', async (req, res) => {
  const type = req.query.type;

  if (!type) {
    return res.status(400).send('Type parameter is required');
  }

  // Dummy logic: Implement actual logic to add metadata or classification based on the type parameter
  const result = { message: `Successfully added ${type}` };
  res.json(result);
});

// Start the server
const port = 30500;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
