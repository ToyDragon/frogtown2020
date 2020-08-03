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
    entry: Path.resolve(__dirname, "views", view.view, "behavior.js"),
    mode: "development",
  };
});
