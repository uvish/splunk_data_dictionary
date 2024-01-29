# Splunk Data Dictionary
### Components
* 3 Splunk Instances (US,EMEA,APAC)
* 1 Splunk Instance (DataDictionary , KV Store)
* Splunk Enumerator (Watcher / Collection Framework)
* Backend (Nodejs)
* Frontend (React w/ Splunk UI Toolkit)

## Installation
* Install Docker Desktop 
* Once Docker Desktop is running , from the 'splunk_data_dictionary' directory , use command ```docker compose up -d```.
* 7 Docker containers will be started , wait for all splunk instances to initialize, Check for the 'enumerator' logs till splunk instances are detected.

![Flow](splunk.drawio.png)
