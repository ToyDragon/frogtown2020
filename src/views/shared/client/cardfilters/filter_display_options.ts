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
    const root = $("div[data-filtertype=" + filtertype + "]");
    if (root.attr("data-setupDisplay") !== "true") {
      root.attr("data-setupDisplay", "true");
      let ix = 0;
      for (const option of options) {
        const item = $("<li></li>");
        const a = $(
          // eslint-disable-next-line prettier/prettier
          "<a href=\"#\">" +
            option.title +
            // eslint-disable-next-line prettier/prettier
            " <span class=\"glyphicon glyphicon-ok\"></span></a>"
        );
        item.append(a);
        item.attr("data-value", option.title);
        const isDefault = ix === defaultIndex;
        item.attr("data-active", "" + isDefault);
        if (isDefault) {
          item.addClass("default");
        }
        $("div[data-filtertype=" + filtertype + "] ul").append(item);

        if (option.requiredMaps && option.requiredMaps.length > 0) {
          item.attr("disabled", "true");
          dataLoader.onAllLoadedCB(option.requiredMaps, () => {
            item.removeAttr("disabled");
          });
        }

        ix++;
      }
    }
    super(dataLoader, filtertype, updateHandler);
  }

  public resetDefault(): void {
    $("div[data-filtertype=" + this.type + "] ul li.default").trigger("click");
  }
}
