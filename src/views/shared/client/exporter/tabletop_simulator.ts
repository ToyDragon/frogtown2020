import * as TTSExport from "./exporter";
import { DataLoader } from "../data_loader";
import { Deck } from "../../deck_types";

export default class TableTopSimulator {
  private exporter!: TTSExport.Exporter;
  private dl!: DataLoader;

  public ready: Promise<void>;

  public constructor(dl: DataLoader) {
    this.exporter = new TTSExport.Exporter();
    this.dl = dl;
    let resolver!: () => void;
    this.ready = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    this.dl
      .onAllLoaded([
        "IDToName",
        "IDToTokenStrings",
        "TokenIDToTokenString",
        "TokenIDToName",
        "FrontIDToBackID",
      ])
      .then(() => {
        setTimeout(() => {
          resolver();
        }, 0);
      });
  }

  private getTokens(deckObj: Deck): string[] {
    const tokens = [];
    const uniquetokens: Record<string, boolean> = {};
    const allCandidates = deckObj.mainboard.concat(deckObj.sideboard);
    const IDToTokenStringMap = this.dl.getMapData("IDToTokenStrings");
    if (!IDToTokenStringMap) {
      return [];
    }

    const TokenStringToTokenIDMap: Record<string, string> = {};
    for (const tokenId in IDToTokenStringMap) {
      const tokenString = IDToTokenStringMap[tokenId];
      if (!TokenStringToTokenIDMap[tokenString]) {
        TokenStringToTokenIDMap[tokenString] = tokenId;
      }
    }

    for (const cardId of allCandidates) {
      const oneCardTokens = IDToTokenStringMap[cardId];
      if (oneCardTokens) {
        for (const tokenString of oneCardTokens) {
          const tokenId = TokenStringToTokenIDMap[tokenString];
          if (tokenId && !uniquetokens[tokenId]) {
            uniquetokens[tokenId] = true;
            tokens.push(tokenId);
          }
        }
      }
    }

    if (tokens.length) {
      console.log("Added tokens " + tokens.length + " tokens");
    }
    return tokens;
  }

  public exportDeck(deckObj: Deck): string {
    const tokenCardIds = this.getTokens(deckObj);
    const mainboard: TTSExport.Board = {
      cards: [],
      name: "Mainboard",
    };
    const sideboard: TTSExport.Board = {
      cards: [],
      name: "Sideboard",
    };
    const tokenboard: TTSExport.Board = {
      cards: [],
      name: "Tokens",
      faceup: true,
    };
    const flippableboard: TTSExport.Board = {
      cards: [],
      name: "Flippables",
      faceup: true,
    };

    const processOneCard = (cardId: string, board: TTSExport.Board) => {
      board.cards.push({
        cardId: cardId,
        name: this.getCardName(cardId),
      });
      const reverseCard = this.getBackCardId(cardId);
      if (reverseCard) {
        flippableboard.cards.push({
          cardId: cardId,
          backCardId: reverseCard,
          name: this.getCardName(cardId),
        });
      }
    };

    for (let i = 0; i < deckObj.mainboard.length; i++) {
      processOneCard(deckObj.mainboard[i], mainboard);
    }
    for (let i = 0; i < deckObj.sideboard.length; i++) {
      processOneCard(deckObj.sideboard[i], sideboard);
    }
    for (let i = 0; i < tokenCardIds.length; i++) {
      processOneCard(tokenCardIds[i], tokenboard);
    }

    const imageVersion = this.dl.dataDetails!.imageVersion;
    const rootURL = window.location.href.split("/").slice(0, 3).join("/");
    const compiledDeck = this.exporter.Export(
      {
        boards: [mainboard, sideboard, tokenboard, flippableboard].filter(
          (b) => {
            return b.cards.length > 0;
          }
        ),
        backURL: deckObj.ownerBackURL || rootURL + "/CardBack.jpg",
      },
      imageVersion
    );

    return JSON.stringify(compiledDeck);
  }

  private getCardName(cardId: string): string {
    const IDToNameMap = this.dl.getMapData("IDToName");
    if (IDToNameMap && IDToNameMap[cardId]) {
      return IDToNameMap[cardId];
    }
    const TokenIDToNameMap = this.dl.getMapData("TokenIDToName");
    if (TokenIDToNameMap && TokenIDToNameMap[cardId]) {
      return TokenIDToNameMap[cardId];
    }
    return "";
  }

  private getBackCardId(cardId: string): string {
    const FrontIDToBackIDMap = this.dl.getMapData("FrontIDToBackID");
    if (FrontIDToBackIDMap && FrontIDToBackIDMap[cardId]) {
      return FrontIDToBackIDMap[cardId];
    }
    return "";
  }
}
