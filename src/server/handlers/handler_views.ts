import * as express from "express";
import Services from "../services";
import { IncludedData, GetAllPages } from "../view_data";
import { logInfo } from "../log";
import SharedHandler from "../../views/shared/server/handler";
import {
  ColorStringToArray,
  DeckKeysRow,
} from "../services/database/dbinfos/db_info_deck_keys";
import { UserKeysRow } from "../services/database/dbinfos/db_info_user_keys";
import { GetSession } from "../services/performance_monitor/performance_logger";
import { PerformanceSession } from "../services/performance_monitor/performance_monitor";

// Helper function to gather data required for a page to render.
export function retrieveAllData(
  services: Services,
  req: express.Request,
  includedData: IncludedData[],
  perfSession: PerformanceSession
): Promise<Record<string, unknown>> {
  return new Promise((resolve, _reject) => {
    const data: { [key: string]: unknown } = {};
    let currentItem = 0;
    const TryNextItem = () => {
      if (!includedData || currentItem >= includedData.length) {
        resolve(data);
      } else {
        perfSession.Push(`Data: "${includedData[currentItem].var}"`);
        includedData[currentItem]
          .retriever(services, req)
          .then((value) => {
            data[includedData[currentItem].var] = value;
            currentItem++;
            perfSession.Pop();
            TryNextItem();
          })
          .catch((reason) => {
            logInfo("Error loading user data: " + JSON.stringify(reason));
            data["errorOccurred"] = true;
            currentItem++;
            perfSession.Pop();
            TryNextItem();
          });
      }
    };
    TryNextItem();
  });
}

export interface DeckInfo {
  id: string;
  name: string;
  cardCount: number;
  colors: string[];
  keyCard: string;
  index: number;
}

// List of decks shown in the toolbar.
const includedDataDecks: IncludedData = {
  var: "decks",
  retriever: async (services, req) => {
    const decks: DeckInfo[] = [];
    const connection = await services.dbManager.getConnection();
    if (!connection) {
      return decks;
    }

    const deckRows = await connection.query<DeckKeysRow[]>(
      "SELECT * FROM deck_keys WHERE owner_id=?;",
      [req.cookies["publicId"]]
    );
    if (deckRows?.value && deckRows?.value.length > 0) {
      let i = 0;
      for (const deckRow of deckRows.value) {
        decks.push({
          id: deckRow.id,
          name: deckRow.name,
          cardCount: deckRow.card_count,
          colors: ColorStringToArray(deckRow.colors),
          keyCard: deckRow.star_card_id,
          index: i++, // TODO
        });
      }
    }

    connection.release();
    return decks;
  },
};

// Details about the current user.
const includedDataUserDetails: IncludedData = {
  var: "userDetails",
  retriever: async (services, req) => {
    const userDetails = { name: "", backUrl: "", error: true };
    const connection = await services.dbManager.getConnection();
    if (!connection) {
      return userDetails;
    }

    const userRows = await connection.query<UserKeysRow[]>(
      "SELECT * FROM user_keys WHERE public_id=?;",
      [req.cookies["publicId"]]
    );
    if (userRows?.value && userRows?.value.length > 0) {
      userDetails.name = userRows.value[0].name;
      userDetails.backUrl = userRows.value[0].back_url;
      userDetails.error = false;
    }

    connection.release();
    return userDetails;
  },
};

// Creates route handler to serve views
export default function ViewHandler(
  services: Services,
  debugBanner: string
): express.Router {
  const router = express.Router();
  const allPages = GetAllPages(services);
  const viewDir = __dirname + "/../../views/";

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
      data.push(includedDataDecks);
      data.push(includedDataUserDetails);
      const perfSession = GetSession(res);
      perfSession.Push("Load view data");
      retrieveAllData(services, req, data, perfSession).then((includedData) => {
        perfSession.Pop();
        perfSession.Push("Render view");
        res.render("pages/" + view.view, {
          view: view,
          allViews: allPages,
          route: view.routes[0],
          debugBanner: debugBanner,
          includedData: JSON.stringify(includedData),
        });
        perfSession.Pop();
      });
    };

    // The main way the page is accessed
    for (const route of view.routes) {
      router.get(`/${route}.html`, (req, res) => {
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
    logInfo(`Static serving ${view.routes[0]} to ${viewDir + view.view + "/"}`);
    router.use(
      `/${view.routes[0]}/styles.css`,
      express.static(`./static/styles/${view.view}_styles.css`)
    );

    // Add handler for page specific requests
    if (view.routeHandler) {
      router.use("/" + view.routes[0], view.routeHandler);
    }
  }

  return router;
}
