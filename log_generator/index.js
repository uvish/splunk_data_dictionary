const express = require('express');
const app = express();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid')

const splunkHECUrl = 'http://localhost:8888/services/collector/event';
const splunkToken = 'ec3c7a4a-c8ec-4085-9c94-7accb86ab102';

app.use(express.json());

const sendLogToSplunk = async () => {
  const logMessage = generateRandomLog();
  console.log(logMessage)
  await sendToSplunk(logMessage);
};

setInterval(sendLogToSplunk, 1000); // Send log every 1 second

const sendToSplunk = async (message) => {
    const payload = {
        event: message,
      };
    
      try {
        const response = await axios.post(splunkHECUrl, payload, {
          headers: {
            Authorization: `Splunk ${splunkToken}`,
            'X-Splunk-Request-Channel': uuidv4()
          },
        });
    
        if (response.data && response.data.text === 'Success') {
          console.log('Event successfully indexed');
        } else {
          console.error('Unexpected response from Splunk:', response.data);
        }
      } catch (error) {
        console.error('Error sending event to Splunk:', error.message);
        // throw error;
      }
};

const generateRandomLog = () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const paths = ['/home', '/about', '/contact', '/dashboard'];
    const statuses = [200, 404, 500];
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];
    const randomPath = paths[Math.floor(Math.random() * paths.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const logMessage = `${randomMethod},${randomPath},${randomStatus}`;
    return logMessage;
  };

const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Log Source App listening on port ${PORT}`);
});
