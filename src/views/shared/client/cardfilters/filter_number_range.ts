import { BaseFilter } from "./base_filter";

export class FilterNumberRange extends BaseFilter {
  private lowInput!: HTMLInputElement;
  private highInput!: HTMLInputElement;

  protected async setup(): Promise<void> {
    const inputGroup = this.container!.querySelector(
      ".btn-group > .input-group"
    );
    this.lowInput = inputGroup?.querySelector("input.min") as HTMLInputElement;
    this.highInput = inputGroup?.querySelector("input.max") as HTMLInputElement;
    for (const event of ["change", "mouseup", "click"]) {
      this.lowInput.addEventListener(event, () => {
        this.valueChanged();
      });
      this.highInput.addEventListener(event, () => {
        this.valueChanged();
      });
    }

    this.lowInput.setAttribute("disabled", "true");
    this.highInput.setAttribute("disabled", "true");

    await this.dl.onLoaded(this.dataMapName);
    await this.dl.onLoaded(this.idMapName);
    this.lowInput.removeAttribute("disabled");
    this.highInput.removeAttribute("disabled");

    this.ready = true;
  }

  protected applyPrimaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    const low = Number(requiredValues[0]);
    const high = Number(requiredValues[1]);
    const dataMap = this.dl.getAnyMapData(this.dataMapName) as Record<
      string,
      string[]
    >;
    for (const value in dataMap) {
      const numericValue = Number(value);
      if (numericValue < low || numericValue > high) {
        continue;
      }
      for (const id of dataMap[value]) {
        cardIds.push(id);
      }
    }
  }

  protected applySecondaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    if (requiredValues.length > 0) {
      const low = Number(requiredValues[0]);
      const high = Number(requiredValues[1]);
      const idMap = this.dl.getAnyMapData(this.idMapName) as Record<
        string,
        string[]
      >;
      for (let cardIndex = cardIds.length - 1; cardIndex >= 0; cardIndex--) {
        const cardId = cardIds[cardIndex];
        const thisCardsValue = Number(idMap[cardId]);

        if (thisCardsValue < low || thisCardsValue > high) {
          cardIds.splice(cardIndex, 1);
        }
      }
    }
  }

  public getValues(): string[] {
    let low = Number(this.lowInput.value);
    let high = Number(this.highInput.value);
    if (!low && !high) {
      return [];
    }
    if (!low) {
      low = 0;
    }
    if (!high) {
      high = 999999;
    }
    return [low.toString(), high.toString()];
  }

  protected clear(): void {
    this.lowInput.value = "";
    this.highInput.value = "";
  }
}
