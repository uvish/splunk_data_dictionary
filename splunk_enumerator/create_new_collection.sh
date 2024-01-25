#  Create dictionary Collection 
curl -k -u admin:Uvish123@ \
    -d name=data_dictionary \
     https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config


#  Create dictionary Collection Schema
curl -k -u admin:Uvish123@ \
    https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config/data_dictionary \
    -d 'field.id=string' \
    -d 'field.splunk_host=string' \
    -d 'field.type=string' \
    -d 'field.object_info=string' \
    -d 'field.custom_meta_label=string' \
    -d 'field.custom_classification=string' \
    -d 'field.timestamp=string' \
    -d 'accelerated_fields.my_accel={"id": 1,"type":-1}'


# Add Sample Data
# curl -k -u admin:Uvish123@ \
#     https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/data/data_dictionary \
#     -H 'Content-Type: application/json' \
#     -d '{"id": "12345ABCDE", "splunk_host": "US","timestamp":"some_timestamp","type": "Dashboard","custom_meta_label":"appXmeta","custom_classification":"secret","object_info": { "name": "Mark's Dashboard", "description": "Dashboard for application X", "owner": "Mark"}}'

# Create splunk host collection , to keep track of hosts
curl -k -u admin:Uvish123@ \
    -d name=splunk_hosts \
     https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config
     
     
#  Create splunk host collection Collection Schema
curl -k -u admin:Uvish123@ \
    https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config/splunk_hosts \
    -d 'field.id=string' \
    -d 'field.hostname=string' \
    -d 'field.name=string' \
    -d 'accelerated_fields.my_accel={"id": 1,"hostname":-1}'

# Create request_approve collection , to keep track of requests and approvals
curl -k -u admin:Uvish123@ \
    -d name=request_approve \
     https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config
     
     
#  Create request_approve collection Collection Schema
curl -k -u admin:Uvish123@ \
    https://localhost:8089/servicesNS/nobody/splunk_data_dictionary/storage/collections/config/request_approve \
    -d 'field.user=string' \
    -d 'field.object_type=string' \
    -d 'field.status=string' \
    -d 'field.id=string' \
    -d 'accelerated_fields.my_accel={"status": 1,"user":-1}'