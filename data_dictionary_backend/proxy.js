const express = require('express');
const router = express.Router();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({ secure: false });

let conf;
if (process.env.DOCKER_CONTAINER === 'true') {
    conf = require('./config_docker.json');
  } else {
    conf = require('./config.json');
  }
const splunkConfig = conf.splunk_dictionary_instance;

router.all('/*', (req, res) => {
  const targetUrl = splunkConfig.hostname + req.originalUrl.replace(/^\/proxy/, '');
  console.log("Proxy:"+targetUrl);
  proxy.web(req, res, { target: targetUrl ,ignorePath: true });
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
  console.log(`Outgoing Request: ${req.method} ${proxyReq.path} to ${options.target.href}`);
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy Error:', err);
  res.status(500).send('Proxy Error');
});

module.exports = router;
