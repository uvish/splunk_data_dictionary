import React, { useEffect, useState } from 'react';
import config from '../../../../config.json';
import axios from 'axios';

// Splunk UI Components
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';

// Util Functions
import Session from '../Utils/Session';


const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const splunk_server_url = config.splunk.server_url;

  const LOGIN_ENDPOINT = splunk_server_url+`/proxy/services/auth/login`;
  // const USER_DETAILS_ENDPOINT = splunk_server_url+`/proxy/services/authentication/users`;
  // const JSON_OUTPUT = `?output_mode=json`;

  const login = async () => {
    try {
        const credentials = new URLSearchParams(
            {
                username: username,
                password: password,
                output_mode: 'json'
            }
        ).toString();

        axios.post(LOGIN_ENDPOINT,credentials)
        .then(sessionResponse=>{
            if(sessionResponse.data.sessionKey){
                setSessionKey(sessionResponse.data.sessionKey);
                Session.createSession(username,sessionResponse.data.sessionKey);
                window.location.href = '/';
            }
        })
        .catch (error=>{
            console.error(error.response);
        })
    }catch (error) {
      console.error('Login failed:', error);
      alert('An error occurred during login.');
    }
  };

  return (
    <div>
      <h2>Login Page</h2>
      <form>
        <label htmlFor="username">Username:</label>
        <Text
          type="text"
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        /><br />

        <label htmlFor="password">Password:</label>
        <Text
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />

        <Button onClick={login}>Login</Button>
      </form>
    </div>
  );
};

export default LoginPage;
