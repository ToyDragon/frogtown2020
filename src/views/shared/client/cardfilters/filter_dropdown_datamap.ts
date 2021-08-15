import { FilterDropdown } from "./filter_dropdown";

export class FilterDropdownDataMap extends FilterDropdown {
  protected async setup(): Promise<void> {
    this.container!.querySelectorAll("ul > li").forEach((element) => {
      element.setAttribute("disabled", "true");
      this.dl.onLoadedCB(element.getAttribute("data-value") || "", () => {
        element.removeAttribute("disabled");
      });
    });
    super.setup();
  }
}
