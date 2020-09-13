import { BaseFilter } from "./base_filter";

export class FilterDropdown extends BaseFilter {
  private isClearing!: boolean;
  private requireAll!: boolean;
  private noOthers!: boolean;

  protected async setup(): Promise<void> {
    const alreadySetup = this.container.getAttribute("data-setup") === "true";
    this.container.setAttribute("data-setup", "true");
    this.requireAll = false;
    this.noOthers = false;

    if (this.dataMapName && this.idMapName && !alreadySetup) {
      const button = this.container.querySelector(
        ".btn-group > button"
      ) as HTMLElement;
      const list = this.container.querySelector("div > ul") as HTMLUListElement;
      const loadingElement = document.createElement("span");
      loadingElement.classList.add("glyphicon");
      loadingElement.classList.add("glyphicon-refresh");
      button.append(loadingElement);
      button.setAttribute("disabled", "true");
      await this.dl.onLoaded(this.dataMapName);
      await this.dl.onLoaded(this.idMapName);
      if (this.dynamicOptions) {
        console.log(this.excludeoptions);
        for (const value in this.dl.getAnyMapData(this.dataMapName)) {
          if (this.excludeoptions[value]) {
            continue;
          }
          const option = document.createElement("li");
          option.setAttribute("data-value", value);
          option.setAttribute("data-active", "false");
          const a = document.createElement("a");
          a.setAttribute("href", "#");
          const okSpan = document.createElement("span");
          okSpan.classList.add("glyphicon");
          okSpan.classList.add("glyphicon-ok");
          a.append(value);
          a.append(okSpan);
          option.append(a);
          list.prepend(option);
        }
      }
      button.removeAttribute("disabled");
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
    const menu = this.container.querySelector("ul.dropdown-menu");
    menu?.querySelectorAll("li").forEach((ele) => {
      ele.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLLIElement;
        if (target.getAttribute("disabled")) {
          return;
        }
        if (!alreadySetup) {
          target.setAttribute(
            "data-active",
            "" + (target.getAttribute("data-active") === "false")
          );
          if (target.getAttribute("data-active") === "true") {
            const display =
              target.getAttribute("data-display") ||
              target.getAttribute("data-value");
            this.valueDisplay.innerText = display || "";
            menu
              .querySelector(
                "li:not([data-value=" +
                  target.getAttribute("data-value")!.replace(/ /g, "\\ ") +
                  "])"
              )
              ?.setAttribute("data-active", "false");
          } else {
            this.valueDisplay.innerText = "";
          }
        }
        this.valueChanged();
      });
    });
  }

  private setupDropdownMany(alreadySetup: boolean): void {
    const menu = this.container.querySelector(
      "ul.dropdown-menu"
    ) as HTMLElement;
    const isMiscOptions = menu.classList.contains("miscSelection");
    menu.querySelectorAll("li")?.forEach((ele) => {
      ele.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLLIElement;
        if (target.getAttribute("disabled")) {
          return;
        }
        if (!alreadySetup) {
          target.setAttribute(
            "data-active",
            "" + (target.getAttribute("data-active") === "false")
          );
          if (target.getAttribute("data-active") === "false") {
            if (target.getAttribute("data-value") === "And") {
              this.requireAll = false;
              menu
                .querySelector("li[data-value=Or]")
                ?.setAttribute("data-active", "true");
            } else if (target.getAttribute("data-value") === "Or") {
              this.requireAll = true;
              menu
                .querySelector("li[data-value=And]")
                ?.setAttribute("data-active", "true");
            } else if (target.getAttribute("data-value") === "NoOthers") {
              this.noOthers = false;
            }
          } else {
            if (target.getAttribute("data-value") === "And") {
              this.requireAll = true;
              menu
                .querySelector("li[data-value=Or]")
                ?.setAttribute("data-active", "false");
            } else if (target.getAttribute("data-value") === "Or") {
              this.requireAll = false;
              menu
                .querySelector("li[data-value=And]")
                ?.setAttribute("data-active", "false");
            } else if (target.getAttribute("data-value") === "NoOthers") {
              this.noOthers = true;
            }
          }
          const display = document.createElement("div");
          const selected = menu.querySelectorAll(
            "li[data-active=true]:not([data-control=true])"
          );
          this.valueDisplay.innerHTML = "";
          if (selected.length > 0) {
            let suffix = "";
            if (
              menu
                .querySelector("li[data-value=And]")
                ?.getAttribute("data-active") === "true" ||
              isMiscOptions
            ) {
              suffix = " and";
            } else {
              suffix = " or";
            }
            if (
              menu
                .querySelector("li[data-value=NoOthers]")
                ?.getAttribute("data-active") === "true"
            ) {
              const onlyDiv = document.createElement("div");
              onlyDiv.innerText = "Only";
              display.append(onlyDiv);
            }
            for (let i = 0; i < selected.length; i++) {
              const newNode = document.createElement("div");
              let valueDisplay = selected[i].getAttribute("data-display");
              if (!valueDisplay) {
                valueDisplay = selected[i].getAttribute("data-value");
              }
              if (i < selected.length - 1) {
                newNode.innerText = valueDisplay + suffix;
              } else {
                newNode.innerText = valueDisplay || "";
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
    });
  }

  public requireAllValues(): boolean {
    return this.requireAll;
  }

  public noOtherValues(): boolean {
    return this.noOthers;
  }

  public getValues(): string[] {
    const activeItems = this.container.querySelectorAll(
      "ul.dropdown-menu > li[data-active=true]:not([data-control])"
    );
    const results: string[] = [];
    for (const element of activeItems) {
      results.push(element.getAttribute("data-value") || "");
    }
    return results;
  }

  protected clear(): void {
    const menu = this.container.querySelector("ul.dropdown-menu");
    this.isClearing = true;
    menu?.querySelectorAll("li[data-active=true]").forEach((ele) => {
      (ele as HTMLElement).click();
    });
    this.isClearing = false;
    this.valueChanged();
  }

  public setValue(value: string[]): void {
    const menu = this.container.querySelector("ul.dropdown-menu");
    this.isClearing = true;
    menu?.querySelectorAll("li[data-active=true]").forEach((ele) => {
      (ele as HTMLElement).click();
    });
    for (const key of value) {
      (menu?.querySelector(
        "li[data-value=" + key.replace(/ /g, "\\ ") + "]"
      ) as HTMLElement)?.click();
    }
    this.isClearing = false;
  }
}
