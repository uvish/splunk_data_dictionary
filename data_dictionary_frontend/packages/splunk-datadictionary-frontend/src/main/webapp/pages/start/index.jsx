import React from 'react';

import layout from '@splunk/react-page';
import Datadictionary from '@splunk/datadictionary';
import { getUserTheme } from '@splunk/splunk-utils/themes';

import { StyledContainer, StyledGreeting } from './StartStyles';

getUserTheme()
    .then((theme) => {
        layout(
            <StyledContainer>
                <StyledGreeting>Hello, from inside SplunkDatadictionaryFrontend!</StyledGreeting>
                <div>Your component will appear below.</div>
                <Datadictionary name="from inside Datadictionary" />
            </StyledContainer>,
            {
                theme,
            }
        );
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
