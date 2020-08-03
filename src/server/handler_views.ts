import * as express from "express";
import Services from "./services";
import { IncludedData, GetAllPages } from "./view_data";
import { logInfo } from "./log";
import SharedHandler from "../views/shared/server/handler";

export function retrieveAllData(
  req: express.Request,
  includedData: IncludedData[]
): Promise<Record<string, unknown>> {
  return new Promise((resolve, _reject) => {
    const data: { [key: string]: unknown } = {};
    let currentItem = 0;
    const TryNextItem = () => {
      if (!includedData || currentItem >= includedData.length) {
        resolve(data);
      } else {
        includedData[currentItem]
          .retriever(req)
          .then((value) => {
            data[includedData[currentItem].var] = value;
            currentItem++;
            TryNextItem();
          })
          .catch(() => {
            data["errorOccurred"] = true;
            currentItem++;
            TryNextItem();
          });
      }
    };
    TryNextItem();
  });
}

/**
 * Creates route handler to serve views
 * @param {Services} services
 * @return {express.Router}
 */
export default function ViewHandler(services: Services): express.Router {
  const router = express.Router();
  const allPages = GetAllPages(services);
  const viewDir = __dirname + "/../views/";

  // Statically serve shared resoureces
  router.use(express.static(viewDir + "shared/client/"));
  router.use(express.static("./static/"));
  router.use(express.static("./static/styles/"));
  router.use(SharedHandler(services));

  // Each view has routes that needs to be set up
  for (const view of allPages) {
    logInfo("Initialized routes for page " + view.title);

    // Create callback that provides data needed for the EJS render, and performs the render
    const renderCallback = (req: express.Request, res: express.Response) => {
      logInfo("Handling request for page " + view.title);
      const data = view.includedData || [];
      retrieveAllData(req, data).then((includedData) => {
        res.render("pages/" + view.view, {
          view: view,
          allViews: allPages,
          route: view.routes[0],
          includedData: JSON.stringify(includedData),
        });
      });
    };

    for (const route of view.routes) {
      router.get("/" + route + ".html", (req, res) => {
        renderCallback(req, res);
      });
    }

    // This doesn't match the source files, webpack will compile
    // the behavior.ts file and it's dependencies into this bundle file.
    router.use("/" + view.routes[0], express.static(viewDir + view.view + "/"));
    router.use(
      "/" + view.routes[0] + "/styles.css",
      express.static("./static/styles/" + view.view + "_styles.css")
    );

    if (view.index) {
      router.get("/", renderCallback);
    }

    if (view.routeHandler) {
      router.use("/" + view.routes[0], view.routeHandler);
    }
  }

  return router;
}
