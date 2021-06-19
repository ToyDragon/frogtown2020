import * as Path from "path";
import * as ViewData from "./server/view_data";
import Services from "./server/services";

const fakeServices = ({
  config: null,
  dbManager: null,
  storagePortal: null,
} as unknown) as Services;

module.exports = ViewData.GetAllPages(fakeServices).map((view) => {
  return {
    output: {
      filename: view.view + "Bundle.js",
      path: Path.resolve(__dirname, "views", view.view),
      libraryTarget: "commonjs",
    },
    name: view.view,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    entry: Path.resolve(__dirname, "views", view.view, "behavior"),
    mode: "development",
    devtool: "source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      fallback: {
        https: require.resolve("https-browserify"),
        http: require.resolve("stream-http"),
      },
    },
  };
});
