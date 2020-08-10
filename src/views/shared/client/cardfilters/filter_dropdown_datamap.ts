import { FilterDropdown } from "./filter_dropdown";

export class FilterDropdownDataMap extends FilterDropdown {
  protected async setup(): Promise<void> {
    this.container.find("ul > li").each((_index, element) => {
      $(element).attr("disabled", "true");
      this.dl.onLoadedCB($(element).attr("data-value") || "", () => {
        $(element).removeAttr("disabled");
      });
    });
    super.setup();
  }
}
