const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

function hashDataFile() {
  const file = path.resolve(__dirname, "public/data/olympiad_data.json.gz");
  const buf = fs.readFileSync(file);
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 12);
}

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "swc-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    new CopyPlugin({
      patterns: [{ from: "public", to: "." }],
    }),
    new webpack.DefinePlugin({
      "process.env.DATA_HASH": JSON.stringify(hashDataFile()),
    }),
  ],
  devServer: {
    port: process.env.DEV_SERVER_PORT || 3001,
    hot: true,
    open: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, "public"),
    },
  },
};
