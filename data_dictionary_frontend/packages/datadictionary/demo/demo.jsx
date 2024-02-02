import React from 'react';
import { render } from 'react-dom';

import { SplunkThemeProvider } from '@splunk/themes';
import { getUserTheme, getThemeOptions } from '@splunk/splunk-utils/themes';

import Datadictionary from '../src/Datadictionary';

getUserTheme()
    .then((theme) => {
        const containerEl = document.getElementById('main-component-container');
        const splunkTheme = getThemeOptions(theme);
        let colorTheme = localStorage.getItem('theme');
        if(!colorTheme) colorTheme = "dark";
        render(
            <SplunkThemeProvider {...splunkTheme} colorScheme={colorTheme}>
                <Datadictionary/>
            </SplunkThemeProvider>,
            containerEl
        );
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
