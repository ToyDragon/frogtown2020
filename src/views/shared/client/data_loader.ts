import { MapData } from "./blob_storage_data_loader";

export interface DataLoader {
  getMapData<K extends keyof MapData>(mapName: K): MapData[K] | null;
  getAnyMapData(mapName: string): Record<string, unknown> | null;
  onLoaded(mapName: string): Promise<void>;
  onLoadedCB(mapName: string, cb: () => void): void;
  onAllLoadedCB(mapNames: string[], cb: () => void): void;
  isDoneLoading(mapName: keyof MapData): boolean;
}
