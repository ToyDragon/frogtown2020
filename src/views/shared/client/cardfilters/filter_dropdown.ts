import { BaseFilter } from "./base_filter";

export class FilterDropdown extends BaseFilter {
  private isClearing!: boolean;
  private requireAll!: boolean;
  private noOthers!: boolean;

  protected async setup(): Promise<void> {
    const alreadySetup = this.container.attr("data-setup") === "true";
    this.container.attr("data-setup", "true");
    this.requireAll = false;
    this.noOthers = false;

    if (this.dataMapName && this.idMapName && !alreadySetup) {
      const button = this.container.find("> .btn-group > button");
      const list = this.container.find("> div > ul");
      const loadingElement = $(
        // eslint-disable-next-line prettier/prettier
        "<span class=\"glyphicon glyphicon-refresh\"></span>"
      );
      button.append(loadingElement);
      button.attr("disabled", "true");
      await this.dl.onLoaded(this.dataMapName);
      await this.dl.onLoaded(this.idMapName);
      if (this.dynamicOptions) {
        console.log(this.excludeoptions);
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          if (this.excludeoptions[value]) {
            continue;
          }
          const option = $(
            // eslint-disable-next-line prettier/prettier
            "<li data-value=\"" +
              value +
              // eslint-disable-next-line prettier/prettier
              "\" data-active=\"false\"><a href=\"#\">" +
              value +
              // eslint-disable-next-line prettier/prettier
              " <span class=\"glyphicon glyphicon-ok\"></span></a></li>"
          );
          list.prepend(option);
        }
      }
      button.removeAttr("disabled");
      loadingElement.remove();
      this.ready = true;
    }

    this.setupDropdown(alreadySetup);
  }

  private setupDropdown(alreadySetup: boolean): void {
    if (this.filterclass === "dropdownExclusive") {
      this.setupDropdownExclusive(alreadySetup);
    }
    if (this.filterclass === "dropdownMany") {
      this.setupDropdownMany(alreadySetup);
    }
  }

  private setupDropdownExclusive(alreadySetup: boolean): void {
    const menu = this.container.find("ul.dropdown-menu");
    menu.find("> li").on("click", (e) => {
      if ($(e.delegateTarget).attr("disabled")) {
        return;
      }
      if (!alreadySetup) {
        $(e.delegateTarget).attr(
          "data-active",
          "" + ($(e.delegateTarget).attr("data-active") === "false")
        );
        if ($(e.delegateTarget).attr("data-active") === "true") {
          const display =
            $(e.delegateTarget).attr("data-display") ||
            $(e.delegateTarget).attr("data-value");
          this.valueDisplay.text(display || "");
          menu
            .find(
              "> li:not([data-value=" +
                $(e.delegateTarget).attr("data-value")!.replace(/ /g, "\\ ") +
                "])"
            )
            .attr("data-active", "false");
        } else {
          this.valueDisplay.text("");
        }
      }
      this.valueChanged();
    });
  }

  private setupDropdownMany(alreadySetup: boolean): void {
    const menu = this.container.find("ul.dropdown-menu");
    const isMiscOptions = menu.hasClass("miscSelection");
    menu.find("> li").on("click", (e) => {
      if ($(e.delegateTarget).attr("disabled")) {
        return;
      }
      if (!alreadySetup) {
        $(e.delegateTarget).attr(
          "data-active",
          "" + ($(e.delegateTarget).attr("data-active") === "false")
        );
        if ($(e.delegateTarget).attr("data-active") === "false") {
          if ($(e.delegateTarget).attr("data-value") === "And") {
            this.requireAll = false;
            menu.find("> li[data-value=Or]").attr("data-active", "true");
          } else if ($(e.delegateTarget).attr("data-value") === "Or") {
            this.requireAll = true;
            menu.find("> li[data-value=And]").attr("data-active", "true");
          } else if ($(e.delegateTarget).attr("data-value") === "NoOthers") {
            this.noOthers = false;
          }
        } else {
          if ($(e.delegateTarget).attr("data-value") === "And") {
            this.requireAll = true;
            menu.find("> li[data-value=Or]").attr("data-active", "false");
          } else if ($(e.delegateTarget).attr("data-value") === "Or") {
            this.requireAll = false;
            menu.find("> li[data-value=And]").attr("data-active", "false");
          } else if ($(e.delegateTarget).attr("data-value") === "NoOthers") {
            this.noOthers = true;
          }
        }
        const display = $("<div></div>");
        const selected = menu.find(
          "> li[data-active=true]:not([data-control=true])"
        );
        this.valueDisplay.empty();
        if (selected.length > 0) {
          let suffix = "";
          if (
            menu.find("> li[data-value=And]").attr("data-active") === "true" ||
            isMiscOptions
          ) {
            suffix = " and";
          } else {
            suffix = " or";
          }
          if (
            menu.find("> li[data-value=NoOthers]").attr("data-active") ===
            "true"
          ) {
            display.append($("<div>Only</div>"));
          }
          for (let i = 0; i < selected.length; i++) {
            let newNode = null;
            let valueDisplay = $(selected[i]).attr("data-display");
            if (!valueDisplay) {
              valueDisplay = $(selected[i]).attr("data-value");
            }
            if (i < selected.length - 1) {
              newNode = $("<div>" + valueDisplay + suffix + "</div>");
            } else {
              newNode = $("<div>" + valueDisplay + "</div>");
            }
            display.append(newNode);
          }
        }
        this.valueDisplay.append(display);
      }
      if (!this.isClearing) {
        this.valueChanged();
      }
    });
  }

  public requireAllValues(): boolean {
    return this.requireAll;
  }

  public noOtherValues(): boolean {
    return this.noOthers;
  }

  public getValues(): string[] {
    const activeItems = this.container.find(
      "ul.dropdown-menu > li[data-active=true]:not([data-control])"
    );
    return activeItems.toArray().map((element) => {
      return $(element).attr("data-value") as string;
    });
  }

  protected clear(): void {
    const menu = this.container.find("ul.dropdown-menu");
    this.isClearing = true;
    menu.find("> li[data-active=true]").trigger("click");
    this.isClearing = false;
    this.valueChanged();
  }

  public setValue(value: string[]): void {
    const menu = this.container.find("ul.dropdown-menu");
    this.isClearing = true;
    menu.find("> li[data-active=true]").trigger("click");
    for (const key of value) {
      menu
        .find("> li[data-value=" + key.replace(/ /g, "\\ ") + "]")
        .trigger("click");
    }
    this.isClearing = false;
  }
}
