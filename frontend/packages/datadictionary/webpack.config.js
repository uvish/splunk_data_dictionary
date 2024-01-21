const path = require('path');
const webpackMerge = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    entry: {
        Datadictionary: path.join(__dirname, 'src/Datadictionary.jsx'),
    },
    output: {
        path: path.join(__dirname),
    },
    module: {
        loaders: [
          {
            test: /\.css$/,
            use: ['style-loader','css-loader'],
          },
        ],
      },
});
