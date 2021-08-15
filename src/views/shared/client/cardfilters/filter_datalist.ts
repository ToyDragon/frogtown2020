import { BaseFilter } from "./base_filter";

export class FilterDatalist extends BaseFilter {
  private input!: HTMLInputElement;

  protected async setup(): Promise<void> {
    const inputGroup = this.container!.querySelector(
      ".input-group"
    ) as HTMLElement;
    this.input = inputGroup?.querySelector("input") as HTMLInputElement;
    this.input.addEventListener("click", () => {
      if (this.input.value !== "") {
        this.input.value = "";
        this.input.click(); // TODO why do we have this
        this.valueChanged();
      }
    });
    if (this.dynamicOptions) {
      const loadingElement = document.createElement("div");
      loadingElement.classList.add("input-group-addon");
      const refreshElement = document.createElement("span");
      refreshElement.classList.add("g");
      loadingElement.classList.add("glyphicon");
      loadingElement.classList.add("glyphicon-refresh");
      refreshElement.append(loadingElement);
      const list = inputGroup?.querySelector("datalist") as HTMLElement;

      inputGroup.append(loadingElement);
      this.input.setAttribute("disabled", "true");
      await this.dl.onLoaded(this.dataMapName);
      await this.dl.onLoaded(this.idMapName);
      if (this.dataMapName === "SetCodeToID") {
        await this.dl.onLoaded("SetCodeToSetName");
        const setCodeToSetName = this.dl.getAnyMapData(
          "SetCodeToSetName"
        ) as Record<string, string>;
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          const display = setCodeToSetName[value];
          const option = document.createElement("option");
          option.value = display;
          option.innerHTML = value;
          list.prepend(option);
        }
        this.input.removeAttribute("disabled");
        loadingElement.remove();
      } else {
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          const display = value;
          const option = document.createElement("option");
          option.value = display;
          option.innerHTML = value;
          list.prepend(option);
        }
        this.input.removeAttribute("disabled");
        loadingElement.remove();
      }
      this.ready = true;
    }
    this.input.addEventListener("change", () => {
      this.valueChanged();
    });
  }

  public getValues(): string[] {
    if (this.dataMapName === "SetCodeToID") {
      const setName = this.input.value;
      const setCodeToSetName = this.dl.getAnyMapData(
        "SetCodeToSetName"
      ) as Record<string, string>;
      for (const setCode in setCodeToSetName) {
        if (setCodeToSetName[setCode] === setName) {
          return [setCode];
        }
      }
      return [];
    } else {
      return [this.input.value as string];
    }
  }

  protected clear(): void {
    this.input.value = "";
  }
}
