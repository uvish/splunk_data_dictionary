import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@splunk/react-ui/Button';

// Custom Components
import LoginPage from './LoginPage/LoginPage';
import Dashboard from './Dashboard/Dashboard';

// Util Functions
import Session from './Utils/Session';

import { StyledContainer, StyledGreeting } from './DatadictionaryStyles';

const propTypes = {
    name: PropTypes.string,
};

const Datadictionary = ({ name = 'User' }) => {
    return (
        <StyledContainer>
            <StyledGreeting data-testid="greeting">Splunk > Data Dictionary</StyledGreeting>

            { Session.isLoggedIn() ? (
                <Dashboard/>
            ):(
                <LoginPage/>
            )}
        </StyledContainer>
    );
};

Datadictionary.propTypes = propTypes;

export default Datadictionary;
