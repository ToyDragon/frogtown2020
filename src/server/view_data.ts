import express from "express";

import Services from "./services";
import CardSearchRouteHandler from "../views/cardsearch/handler";

/**
 * Data required for a page to be displayed, and to be available in the header nav bar.
 */
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

/**
 * Describes a piece of data that can be included with views, and an async callback to retrieve it.
 */
export interface IncludedData {
  var: string;
  retriever: (req: express.Request) => Promise<unknown>;
}

/**
 * Gets the data for all pages that can be displayed.
 * @param {Services} services
 */
export function GetAllPages(services: Services): PageData[] {
  return [
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
  ];
}
