import { FilterDropdown } from "./filter_dropdown";
import { MapData } from "../../data_map_types";

export interface MiscOptions {
  "Show Duplicates"?: boolean;
  "Stack Duplicates"?: boolean;
  "Action Add"?: boolean;
  "Action Remove"?: boolean;
  "Action Similar"?: boolean;
  "Action ReplaceAll"?: boolean;
  "Action To Sideboard"?: boolean;
  "Action To Mainboard"?: boolean;
  "Action Star"?: boolean;
  "Sort By Release"?: boolean;
  "Group Map"?: keyof MapData;
  "Strict Matching"?: boolean;
}

export class FilterMiscOptions extends FilterDropdown {
  public getMiscValues(): MiscOptions {
    const values = this.getValues() as (keyof MiscOptions)[];
    const options: MiscOptions = {};
    for (const val of values) {
      (options as Record<string, boolean>)[val] = true;
    }
    return options;
  }
}
