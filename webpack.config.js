/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const fs = require('fs');
const HTMLPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const debug = require('debug');

const log = debug('krumi:webpack');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = async function () {
  // eslint-disable-next-line dot-notation
  const configFile = process.env['KRUMI_CONFIG_FILE'] || 'krumi-config.json';
  log('attempting to load config file "%s"', configFile);
  const configData = await fs.promises.readFile(configFile);
  const config = JSON.parse(configData.toString('utf8'));
  log('loaded config, targeting krumnet "%s"', config.krumnet.url);

  return {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          ]
        },
        {
          enforce: 'pre',
          test: /\.js|ts|tsx$/,
          exclude: /node_modules/,
          loader: 'eslint-loader',
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new HTMLPlugin({ template: 'src/index.html' }),
      new webpack.DefinePlugin({ KRUMI_CONFIG: JSON.stringify(config) }),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@krumpled/krumi': path.resolve(__dirname, 'src'),
      },
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
    },
    devServer: {
      disableHostCheck: true,
      contentBase: path.join(__dirname, 'dist'),
      historyApiFallback: true,
      compress: true,
      port: 8081,
    },
  };
};
