/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const common = require('./webpack.common.js');
const path = require('path');
const { merge } = require('webpack-merge');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = merge(common, {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist/target/development/krumi'),
  },
});
