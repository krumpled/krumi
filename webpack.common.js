/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
const debug = require('debug');
const dotenv = require('dotenv');

const log = debug('krumi:webpack');

log('attempting to load environment from ENV');

dotenv.config();

const environment = {
  logging: {
    url: process.env.KRUMI_LOGGING_URL || '/_logs',
    enabled: !!(process.env.KRUMI_LOGGING_URL && process.env.KRUMI_LOGGING_URL.length > 0),
  },
  session: {
    key: process.env.KRUMI_SESSION_KEY || 'krumi:session',
  },
  krumnet: {
    url: process.env.KRUMI_KRUMNET_URL || 'http://0.0.0.0:8080',
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|gif|ico)&/,
        use: 'file-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [require('tailwindcss'), require('autoprefixer'), require('postcss-color-function')],
            },
          },
        ],
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
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    new webpack.DefinePlugin({ KRUMI_CONFIG: JSON.stringify(environment) }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@krumpled/krumi': path.resolve(__dirname, 'src'),
    },
  },
  output: {
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
