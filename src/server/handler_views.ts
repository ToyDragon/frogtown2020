import * as express from "express";
import Services from "./services";
import { IncludedData, GetAllPages } from "./view_data";
import { logInfo } from "./log";
import SharedHandler from "../views/shared/server/handler";
import { DeckKeysRow } from "./database/dbinfos/db_info_deck_keys";

/**
 * Helper function to gather data required for a page to render
 * @param {express.Request} req
 * @param {IncludedData[]} includedData
 */
export function retrieveAllData(
  services: Services,
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
          .retriever(services, req)
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
  router.use("/Icons", express.static("./static/icons/"));
  router.use(SharedHandler(services));

  // Each view has routes that needs to be set up
  for (const view of allPages) {
    logInfo("Initialized routes for page " + view.title);

    // Create callback that provides data needed for the EJS render, and performs the render
    const renderCallback = (req: express.Request, res: express.Response) => {
      logInfo("Handling request for page " + view.title);
      const data = view.includedData || [];
      data.push({
        var: "decks",
        retriever: async (services, _req) => {
          const decks: { id: string; name: string }[] = [];
          const connection = await services.dbManager.getConnection();
          if (!connection) {
            return decks;
          }

          const deckRows = await connection.query<DeckKeysRow[]>(
            "SELECT * FROM deck_keys WHERE owner_id=?;",
            [req.cookies["publicId"]]
          );
          if (deckRows?.value && deckRows?.value.length > 0) {
            for (const deckRow of deckRows.value) {
              decks.push({
                id: deckRow.id,
                name: deckRow.name,
              });
            }
          }

          connection.release();
          return decks;
        },
      });
      retrieveAllData(services, req, data).then((includedData) => {
        res.render("pages/" + view.view, {
          view: view,
          allViews: allPages,
          route: view.routes[0],
          includedData: JSON.stringify(includedData),
        });
      });
    };

    // The main way the page is accessed
    for (const route of view.routes) {
      router.get("/" + route + ".html", (req, res) => {
        renderCallback(req, res);
      });
    }

    // One lucky page also gets to be accessed from /
    if (view.index) {
      router.get("/", renderCallback);
    }

    // This doesn't match the source files, webpack will compile
    // the behavior.ts file and it's dependencies into this bundle file.
    router.use("/" + view.routes[0], express.static(viewDir + view.view + "/"));
    router.use(
      "/" + view.routes[0] + "/styles.css",
      express.static("./static/styles/" + view.view + "_styles.css")
    );

    // Add handler for page specific requests
    if (view.routeHandler) {
      router.use("/" + view.routes[0], view.routeHandler);
    }
  }

  return router;
}
