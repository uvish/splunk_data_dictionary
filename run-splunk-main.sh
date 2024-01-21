docker run -d \
-p 8000:8000 \
-p 8089:8089 \
-p 8088:8088 \
-e SPLUNK_START_ARGS='--accept-license' \
-e SPLUNK_PASSWORD='Uvish123@' \
--platform linux/amd64 splunk/splunk:latest  # for apple silicon
