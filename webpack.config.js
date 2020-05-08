const path = require("path");
const fs = require("fs");
const HTMLPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const debug = require("debug");

const log = debug("krumi:webpack");

module.exports = async function () {
  // eslint-disable-next-line dot-notation
  const configFile = process.env["KRUMI_CONFIG_FILE"] || "krumi-config.json";
  log('attempting to load config file "%s"', configFile);
  const configData = await fs.promises.readFile(configFile);
  const config = JSON.parse(configData.toString("utf8"));
  log('loaded config, targeting krumnet "%s"', config.krumnet.url);

  return {
    entry: "./src/index.ts",
    devtool: "inline-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new HTMLPlugin({ template: "src/index.html" }),
      new webpack.DefinePlugin({ KRUMI_CONFIG: JSON.stringify(config) }),
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "@krumpled/krumi": path.resolve(__dirname, "src"),
      },
    },
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
    },
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      historyApiFallback: true,
      compress: true,
      port: 9000,
    },
  };
};
