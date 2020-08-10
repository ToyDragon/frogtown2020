import { BaseFilter } from "./base_filter";

export class FilterDatalist extends BaseFilter {
  private input!: JQuery<HTMLElement>;

  protected async setup(): Promise<void> {
    const inputGroup = this.container.find("> .input-group");
    this.input = inputGroup.find("> input");
    this.input.on("click", () => {
      if (this.input.val() !== "") {
        this.input.val("");
        this.input.trigger("click");
        this.valueChanged();
      }
    });
    if (this.dynamicOptions) {
      const loadingElement = $(
        // eslint-disable-next-line prettier/prettier
        "<div class=\"input-group-addon\"><span class=\"glyphicon glyphicon-refresh\"></span></div>"
      );
      const list = inputGroup.find("> datalist");

      inputGroup.append(loadingElement);
      this.input.attr("disabled", "true");
      await this.dl.onLoaded(this.dataMapName);
      await this.dl.onLoaded(this.idMapName);
      if (this.dataMapName === "SetCodeToID") {
        await this.dl.onLoaded("SetCodeToSetName");
        const setCodeToSetName = this.dl.getAnyMapData(
          "SetCodeToSetName"
        ) as Record<string, string>;
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          const display = setCodeToSetName[value];
          const option = $(
            // eslint-disable-next-line prettier/prettier
            "<option value=\"" + display + "\">" + value + "</option>"
          );
          list.prepend(option);
        }
        this.input.removeAttr("disabled");
        loadingElement.remove();
      } else {
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          const display = value;
          const option = $(
            // eslint-disable-next-line prettier/prettier
            "<option value=\"" + display + "\">" + value + "</option>"
          );
          list.prepend(option);
        }
        this.input.removeAttr("disabled");
        loadingElement.remove();
      }
      this.ready = true;
    }
    this.input.on("change", () => {
      this.valueChanged();
    });
  }

  public getValues(): string[] {
    if (this.dataMapName === "SetCodeToID") {
      const setName = this.input.val() as string;
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
      return [this.input.val() as string];
    }
  }

  protected clear(): void {
    this.input.val("");
  }
}
