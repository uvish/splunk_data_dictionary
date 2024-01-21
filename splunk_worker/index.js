const express = require('express');
const app = express();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid')

const config = require('./config.json')

app.use(express.json());

const sendLogToSplunk = async () => {
  const logMessage = generateRandomLog();
  await sendToSplunk(logMessage);
};

setInterval(sendLogToSplunk, 1000); // Send log every 1 second

const sendToSplunk = async (message) => { 
  
  let payload = {
    event : message
  }
      try {
        const response = await axios.post(config.splunk.HEC_URL, payload, {
          headers: {
            Authorization: `Splunk ${config.splunk.Token}`,
            // 'X-Splunk-Request-Channel': uuidv4(),
            'Content-Type': 'application/json'
          },
        });

        console.log(response.data)
    
        if (response.data && response.data.text === 'Success') {
          console.log('Event successfully indexed');
        } else {
          console.error('Unexpected response from Splunk:', response.data);
        }
      } catch (error) {
        console.error('Error sending event to Splunk:', error.message);
      }

};

const generateRandomLog = () => {
    const splunk_host = ["US","EMEA","APAC"];
    const type = ["Dashboard","Report","Lookup","SavedSearch","Index","App","Alert"];
    const object_info_name = ["Service A","Service B","Service C","Service D"];
    const object_info_description = ["Service A Desc","Service B Desc","Service C Desc","Service D Desc"];
    const object_info_owner = ["Tim","Harry","Richard","Michael"];
    const custom_meta_label = ["Tag A","Tag B","Tag C","Tag D"];
    const custom_classification = ["Unclassified","Confidential","Secret","Top Secret","Top Secret/SCI"]

    let message = {
      id : uuidv4(),
      splunk_host : splunk_host[Math.floor(Math.random()*splunk_host.length)],
      type: type[Math.floor(Math.random()*type.length)],
      object_info: {
        name: object_info_name[Math.floor(Math.random()*object_info_name.length)],
        description: object_info_description[Math.floor(Math.random()*object_info_description.length)],
        owner: object_info_owner[Math.floor(Math.random()*object_info_owner.length)]
      },
      custom_meta_label: custom_meta_label[Math.floor(Math.random()*custom_meta_label.length)],
      custom_classification: custom_classification[Math.floor(Math.random()*custom_classification.length)]
    }
    return message;
  };

const PORT = 1234;
app.listen(PORT, () => {
  console.log(`Log Source App listening on port ${PORT}`);
});
