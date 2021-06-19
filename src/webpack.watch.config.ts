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
          use: [
            {
              loader: "ts-loader",
              options: { transpileOnly: true },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    entry: `./src/views/${view.view}/behavior.tsx`,
    mode: "development",
    devtool: "source-map",
    watch: true,
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      fallback: {
        https: require.resolve("https-browserify"),
        http: require.resolve("stream-http"),
      },
    },
  };
});
