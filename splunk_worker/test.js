const axios = require('axios');
let data = JSON.stringify({
  "event": [
    {
      "splunk_host": "US",
      "type": "Dashboard",
      "object_info": {
        "name": " Dashboard A",
        "description": "Test Dashboard US",
        "owner": "UjjwalV."
      },
      "custom_meta_labels": [
        "tag A",
        "tag B"
      ],
      "custom_classification": "Secret"
    },
    {
      "splunk_host": "EMEA",
      "type": "Dashboard B",
      "object_info": {
        "name": " Dashboard B",
        "description": "Test Dashboard EU",
        "owner": "UjjwalV."
      },
      "custom_meta_labels": [
        "tag AA",
        "tag BB"
      ],
      "custom_classification": "TopSecret"
    },
    {
      "splunk_host": "APAC",
      "type": "Dashboard C",
      "object_info": {
        "name": " Dashboard C",
        "description": "Test Dashboard APAC",
        "owner": "UjjwalV."
      },
      "custom_meta_labels": [
        "tag AAA",
        "tag BBB"
      ],
      "custom_classification": "Confidential"
    }
  ]
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'http://localhost:8088/services/collector/event',
  headers: { 
    'Authorization': 'Splunk 7aef6cf6-8050-4258-9c36-cd68b0c79660', 
    'Content-Type': 'application/json'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
