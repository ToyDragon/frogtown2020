import express from "express";

import Services from "./services";
import CardSearchRouteHandler from "../views/cardsearch/handler";
import SettingsRouteHandler from "../views/settings/handler";
import DeckViewerRouteHandler, {
  DeckViewerIncludedData,
} from "../views/deckviewer/handler";
import ToolsRouteHandler from "../views/tools/handler";
import ServerStatusRouteHandler from "../views/serverstatus/handler";
import HelpRouteHandler from "../views/help/handler";
import PrivacyRouteHandler from "../views/privacy/handler";

// Data required for a page to be displayed, and to be available in the header nav bar.
export class PageData {
  public routes: string[] = [];
  public view = "";
  public title = "";
  public description = "";
  public index?: boolean;
  public hidden?: boolean;
  public routeHandler?: express.Router;
  public renderCallback?: () => void;
  public includedData?: IncludedData[];
}

// Describes a piece of data that can be included with views, and an async callback to retrieve it.
export interface IncludedData {
  var: string;
  retriever: (services: Services, req: express.Request) => Promise<unknown>;
}

// Gets the data for all pages that can be displayed.
export function GetAllPages(services: Services): PageData[] {
  return [
    {
      routes: [
        "deckviewer",
        "deckviewer/:deckId",
        "deckviewer/:deckId/:action",
      ],
      view: "deckviewer",
      title: "My Decks",
      description: "",
      includedData: DeckViewerIncludedData,
      routeHandler: DeckViewerRouteHandler(services),
    },
    {
      index: true,
      routes: ["cardsearch"],
      view: "cardsearch",
      title: "Card Search",
      description:
        "A beautiful MTG deck builder that includes an easy to use search " +
        "tool, in browser playtesting, and exporting to play in Tabletop " +
        "Simulator. Creating decks for Magic has never been easier!",
      routeHandler: CardSearchRouteHandler(services),
    },
    {
      routes: ["settings"],
      view: "settings",
      title: "Settings",
      description: "",
      routeHandler: SettingsRouteHandler(services),
    },
    {
      routes: ["help"],
      view: "help",
      title: "Help",
      description: "",
      routeHandler: HelpRouteHandler(services),
    },
    {
      routes: ["privacy"],
      view: "privacy",
      title: "Privacy",
      description: "",
      routeHandler: PrivacyRouteHandler(services),
    },
    {
      routes: ["tools"],
      view: "tools",
      title: "Tools",
      hidden: true,
      description: "",
      routeHandler: ToolsRouteHandler(services),
    },
    {
      routes: ["serverstatus"],
      view: "serverstatus",
      title: "Server Status",
      hidden: true,
      description: "",
      routeHandler: ServerStatusRouteHandler(services),
    },
  ];
}
