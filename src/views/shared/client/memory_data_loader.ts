import { MapData } from "./blob_storage_data_loader";

export class MemoryDataLoader {
  public mapData = new MapData();

  constructor() {}

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

  public onLoadedCB(_mapName: string, cb: () => void): void {
    cb();
  }
  public onAllLoadedCB(_mapNames: string[], cb: () => void): void {
    cb();
  }
  public isDoneLoading(_mapName: keyof MapData): boolean {
    return true;
  }
}
