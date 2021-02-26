import { ScryfallFullCard } from "../../shared/scryfall_types";
import * as FileUtils from "../../../shared/file_utils";
import { logError } from "../../../server/log";

interface RawMapFilter {
  key?: keyof ScryfallFullCard;
  value?: keyof ScryfallFullCard;
  operator?: MapFilterOperator;
}

export interface RawMapDetails {
  name: string;
  duplicates: boolean;
  key: string;
  value: string;
}

export enum MapFilterOperator {
  Equals = "equals",
  NotEquals = "notequals",
  Exists = "exists",
  Contains = "contains",
  NotContains = "notcontains",
  ContainedIn = "containedin",
}

export interface RawMapFileData {
  filter?: RawMapFilter[];
  maps?: RawMapDetails[];
}

export default class MapFile {
  private path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public mapData: any[];
  public data: RawMapFileData | null;

  public constructor(pathOrMapdata: string) {
    this.path = pathOrMapdata;
    this.data = null;
    this.mapData = [];
  }

  public async loadFromFile(): Promise<boolean> {
    const stat = await FileUtils.stat(this.path);
    if (!stat) {
      logError("Error loading file: " + this.path);
      return false;
    }
    const contents = await FileUtils.readFile(this.path);
    if (!contents) {
      logError("Error reading file: " + this.path);
      return false;
    }

    try {
      this.data = JSON.parse(contents);
    } catch (e) {
      logError("Error parsing file: " + this.path);
      return false;
    }

    const validationError = this.verifyData();
    if (validationError) {
      logError("Error verifying data: " + this.path);
      logError(validationError);
      return false;
    }

    for (let i = 0; i < this.data!.maps!.length; i++) {
      this.mapData.push({});
    }
    return true;
  }

  private verifyData(): string {
    if (!this.data) return "Unable to find root object.";
    if (this.data.filter) {
      if (!Array.isArray(this.data.filter)) return "Filters are not an array.";
      for (let i = 0; i < this.data.filter.length; i++) {
        const f = this.data.filter[i];
        if (!f) return "Filter object is null.";
        if (typeof f !== "object") return "Filter is not an object.";
        if (typeof f.key !== "string") return "Filter key is not a string.";
        if (f.key.length <= 0) return "Filter key is empty.";
        if (typeof f.value !== "string") return "Filter value is not a string.";
        if (f.value.length <= 0) return "Filter value is empty.";
        if (
          f.operator !== MapFilterOperator.Equals &&
          f.operator !== MapFilterOperator.NotEquals &&
          f.operator !== MapFilterOperator.Exists &&
          f.operator !== MapFilterOperator.Contains &&
          f.operator !== MapFilterOperator.NotContains &&
          f.operator !== MapFilterOperator.ContainedIn
        )
          return "Filter operator inavlid.";
      }
    }

    if (!this.data.maps) return "Unable to find maps.";
    if (!Array.isArray(this.data.maps)) return "Maps are not an array.";
    if (this.data.maps.length === 0) return "Maps are empty.";
    for (let i = 0; i < this.data.maps.length; i++) {
      const m = this.data.maps[i];
      if (!m) return "Map object is null.";
      if (typeof m !== "object") return "Map is not an object.";
      if (typeof m.duplicates !== "boolean")
        return "Map duplicate is not a boolean.";
      if (typeof m.key !== "string") return "Map key is not a string.";
      if (m.key.length <= 0) return "Map key is empty.";
      if (typeof m.value !== "string") return "Map value is not a string.";
      if (m.value.length <= 0) return "Map value is empty.";
      if (typeof m.name !== "string") return "Map name is not a string.";
      if (m.name.length <= 0) return "Map name is empty.";
    }

    return "";
  }
}
