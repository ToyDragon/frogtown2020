import { DataLoader } from "../data_loader";
import { FilterDropdown } from "./filter_dropdown";

interface Displayable {
  title: string;
  requiredMaps: string[];
}

export class FilterDisplayOptions extends FilterDropdown {
  public constructor(
    dataLoader: DataLoader,
    filtertype: string,
    defaultIndex: number,
    updateHandler: () => void,
    options: Displayable[]
  ) {
    const root = document.querySelector(
      `div[data-filtertype=${filtertype}]`
    ) as HTMLElement;
    if (root.getAttribute("data-setupDisplay") !== "true") {
      root.setAttribute("data-setupDisplay", "true");
      let ix = 0;
      for (const option of options) {
        const item = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("href", "#");
        const okSpan = document.createElement("span");
        okSpan.classList.add("glyphicon");
        okSpan.classList.add("glyphicon-ok");
        a.append(option.title);
        a.append(okSpan);
        item.append(a);
        item.setAttribute("data-value", option.title);
        const isDefault = ix === defaultIndex;
        item.setAttribute("data-active", "" + isDefault);
        if (isDefault) {
          item.classList.add("default");
        }
        document
          .querySelector(`div[data-filtertype=${filtertype}] ul`)
          ?.append(item);

        if (option.requiredMaps && option.requiredMaps.length > 0) {
          item.setAttribute("disabled", "true");
          dataLoader.onAllLoadedCB(option.requiredMaps, () => {
            item.removeAttribute("disabled");
          });
        }

        ix++;
      }
    }
    super(dataLoader, filtertype, updateHandler);
  }

  public resetDefault(): void {
    (document.querySelector(
      `div[data-filtertype=${this.type}] ul li.default`
    ) as HTMLElement).click();
  }
}
