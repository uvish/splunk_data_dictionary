const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({ secure: false });

const conf = require('./config.json');
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

// router.post('/services/auth/login', async (req, res) => {
//     try {
//       const response = await axios.post(`https://${splunkConfig.host}:${splunkConfig.port}/services/auth/login`, 
//       new URLSearchParams({
//         username: req.query.username,
//         password: req.query.password,
//         output_mode: 'json',
//       }).toString()
//       , 
//       {
//           httpsAgent: new https.Agent({  
//           rejectUnauthorized: false,
//         })
//       }
//       );
//       res.json(response.data);
//     } catch (error) {
//       console.error('Proxy error:', error.message);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

//   router.get('/services/authentication/users/admin', async (req, res) => {
//     try {
//       const response = await axios.post(`https://${splunkConfig.host}:${splunkConfig.port}/services/authentication/users/admin`,
//       new URLSearchParams({output_mode: 'json'}).toString(), 
//       {
//         headers: req.headers,
//           httpsAgent: new https.Agent({  
//           rejectUnauthorized: false,
//         })
//       }
//       );
//       res.json(response.data);
//     } catch (error) {
//       console.log(error)
//       console.error('Proxy error:', error.message);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

module.exports = router;
