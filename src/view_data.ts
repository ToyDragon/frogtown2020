import express from "express";
import Config from "./config";

import CardSearchRouteHandler from "./views/cardsearch/handler";

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

export interface IncludedData {
  var: string;
  retriever: (req: express.Request) => Promise<unknown>;
}

export function GetAllPages(config: Config): PageData[] {
  return [
    {
      index: true,
      routes: ["cardsearch"],
      view: "cardsearch",
      title: "Card Search",
      description:
        "A beautiful MTG deck builder that includes an easy to use search tool, in browser playtesting, and exporting to play in Tabletop Simulator. Creating decks for Magic has never been easier!",
      routeHandler: CardSearchRouteHandler(config),
    },
  ];
}
