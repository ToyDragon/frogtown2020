import { DataDetailsResponse } from "../handler_types";
import { MapData } from "./blob_storage_data_loader";
import { DataLoader } from "./data_loader";

export class MemoryDataLoader implements DataLoader {
  public mapData = new MapData();
  private handlers: { [mapName: string]: (() => void)[] } = {};

  constructor() {}
  onAllLoaded(mapNames: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.onAllLoadedCB(mapNames, () => {
        resolve();
      });
    });
  }
  startLoading(_preferredMaps: (keyof MapData)[]): void {
    throw new Error("Method not implemented.");
  }
  init(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public getMapData<K extends keyof MapData>(mapName: K): MapData[K] | null {
    return this.mapData[mapName];
  }

  public getAnyMapData(mapName: string): Record<string, unknown> | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getMapData(mapName as any);
  }

  public onLoaded(_mapName: string): Promise<void> {
    return new Promise((resolve) => {
      resolve();
    });
  }

  public injectMapData<K extends keyof MapData>(
    mapName: K,
    data: MapData[K]
  ): void {
    this.mapData[mapName] = data;
  }

  public onLoadedCB(mapName: string, cb: () => void): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (this.mapData as any)[mapName] !== "undefined") {
      setTimeout(() => {
        cb();
      });
    } else {
      this.handlers[mapName] = this.handlers[mapName] || [];
      this.handlers[mapName].push(cb);
    }
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
  public isDoneLoading(mapName: keyof MapData): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (this.mapData as any)[mapName] !== "undefined";
  }
  public getDataDetails(): DataDetailsResponse | null {
    return null;
  }
}
