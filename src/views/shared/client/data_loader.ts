import * as MTGTypes from "../scryfall_types";
import { DataDetailsResponse } from "../handler_types";
import { post, request } from "./request";

export class SetNameAndCode {
  /**
   * Displayable name of the set.
   */
  public name = "";

  /**
   * Short set code, typically three characters.
   */
  public code = "";

  /**
   * Set release date.
   */
  public releaseDate = "";
}

export class Token {
  public displayName = "";

  public assetName = "";
}

export interface CardIDMap<T> {
  [cardId: string]: T;
}
export interface StringValueMap<T> {
  [value: string]: T;
}
export interface NumericValueMap<T> {
  [value: number]: T;
}

export class BackData {}

export const MapsIDToX: (keyof MapData)[] = [
  "IDToName",
  "IDToCMC",
  "IDToSetCode",
  "IDToToughness",
  "IDToPower",
  "IDToRarity",
  "IDToColorIdentity",
  "IDToColor",
  "IDToSubtype",
  "IDToSupertype",
  "IDToType",
  "IDToLegalFormat",
  "IDToText",
  "FrontIDToBackID",
  "TokenIDToName",
  "IDToCollectorsNumber",
  "IDToCost",
  "IDToLargeImageURI",
];

export class MapData {
  public IDToName: CardIDMap<string> = {};
  public NameToID: StringValueMap<string[]> = {};
  public IDToCMC: CardIDMap<number> = {};
  public CMCToID: NumericValueMap<string[]> = {};
  public IDToSetCode: CardIDMap<string> = {};
  public SetCodeToID: StringValueMap<string[]> = {};
  public IDToToughness: CardIDMap<string | number> = {};
  public ToughnessToID: StringValueMap<string[]> = {};
  public IDToPower: CardIDMap<string | number> = {};
  public PowerToID: StringValueMap<string[]> = {};
  public IDToRarity: CardIDMap<MTGTypes.ScryfallRarity> = {};
  public RarityToID: StringValueMap<string[]> = {};

  public IDToColorIdentity: CardIDMap<MTGTypes.MTGCostType[]> = {};
  public ColorIdentityToID: StringValueMap<string[]> = {};
  public IDToColor: CardIDMap<MTGTypes.MTGCostType[]> = {};
  public ColorToID: StringValueMap<string[]> = {};
  public IDToSubtype: CardIDMap<string[]> = {};
  public SubtypeToID: StringValueMap<string[]> = {};
  public IDToSupertype: CardIDMap<string[]> = {};
  public SupertypeToID: StringValueMap<string[]> = {};
  public IDToType: CardIDMap<string[]> = {};
  public TypeToID: StringValueMap<string[]> = {};

  public IDToLegalFormat: CardIDMap<string[]> = {};
  public LegalFormatToID: StringValueMap<string[]> = {};

  public IDToText: CardIDMap<string> = {};
  public FrontIDToBackID: CardIDMap<string> = {};

  public SetCodeToRelease: StringValueMap<string> = {};
  public SetCodeToSetName: StringValueMap<string> = {};
  public TokenIDToName: StringValueMap<string> = {};

  public IDToCollectorsNumber: CardIDMap<string> = {};
  public IDToCost: CardIDMap<string> = {};
  public IDToLargeImageURI: CardIDMap<string> = {};
  public IDToTokenStrings: CardIDMap<string> = {};
  public TokenStringToTokenID: CardIDMap<string> = {};
  public TokenIDToTokenString: CardIDMap<string> = {};
}

export class DataLoader {
  public dataDetails: DataDetailsResponse | null = null;
  private mapData: MapData = new MapData();
  private includedData: MapData | null = null;

  private doneLoading: { [mapName: string]: boolean } = {};
  private handlers: { [mapName: string]: (() => void)[] } = {};

  public constructor(includedData: MapData | null) {
    this.includedData = includedData;
  }

  public async init(): Promise<void> {
    this.dataDetails = await post<unknown, DataDetailsResponse>(
      "/data/details",
      {}
    );
  }

  public getAnyMapData(mapName: string): Record<string, unknown> | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getMapData(mapName as any);
  }

  public getMapData<K extends keyof MapData>(mapName: K): MapData[K] | null {
    if (this.isDoneLoading(mapName)) {
      return this.mapData[mapName];
    }
    if (this.includedData) {
      return this.includedData[mapName];
    }
    return null;
  }

  public isDoneLoading(mapName: keyof MapData): boolean {
    return !!this.doneLoading[mapName];
  }

  private async loadOneMap(mapName: keyof MapData): Promise<boolean> {
    if (!this.dataDetails || !this.dataDetails.changeDate) {
      return false;
    }

    const url =
      this.dataDetails.baseURL +
      "/" +
      this.dataDetails.awsS3DataMapBucket +
      "/" +
      mapName +
      ".json";
    this.mapData[mapName] = (await request<unknown, unknown>(
      url,
      {},
      "GET"
    )) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    this.doneLoading[mapName] = true;
    if (this.handlers[mapName]) {
      for (const cb of this.handlers[mapName]) {
        cb();
      }
    }
    return true;
  }

  public startLoading(preferredMaps: (keyof MapData)[]): void {
    const mapsLoaded: { [mapName: string]: boolean } = {};
    for (const mapName of preferredMaps) {
      mapsLoaded[mapName] = true;
      this.loadOneMap(mapName);
    }

    for (const mapName in this.mapData) {
      if (!mapsLoaded[mapName]) {
        this.loadOneMap(mapName as keyof MapData);
      }
    }
  }

  public onLoaded(mapName: string): Promise<void> {
    return new Promise((resolve) => {
      this.onLoadedCB(mapName, () => {
        resolve();
      });
    });
  }

  public onLoadedCB(mapName: string, cb: () => void): void {
    if (this.doneLoading[mapName]) {
      setTimeout(() => {
        cb();
      });
    } else {
      this.handlers[mapName] = this.handlers[mapName] || [];
      this.handlers[mapName].push(cb);
    }
  }

  public onAllLoaded(mapNames: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.onAllLoadedCB(mapNames, () => {
        resolve();
      });
    });
  }

  public onAllLoadedCB(mapNames: string[], cb: () => void): void {
    let loadI = 0;
    const waitForNext = () => {
      if (loadI >= mapNames.length) {
        cb();
      } else {
        this.onLoadedCB(mapNames[loadI], () => {
          loadI++;
          waitForNext();
        });
      }
    };
    waitForNext();
  }
}
