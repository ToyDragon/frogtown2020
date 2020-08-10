import { BaseFilter } from "./base_filter";

export class FilterNumberRange extends BaseFilter {
  private lowInput!: JQuery<HTMLElement>;
  private highInput!: JQuery<HTMLElement>;

  protected async setup(): Promise<void> {
    const inputGroup = this.container.find("> .btn-group > .input-group");
    this.lowInput = inputGroup.find("> input.min");
    this.highInput = inputGroup.find("> input.max");
    this.lowInput.on("change mouseup click", () => {
      this.valueChanged();
    });
    this.highInput.on("change mouseup click", () => {
      this.valueChanged();
    });

    this.lowInput.attr("disabled", "true");
    this.highInput.attr("disabled", "true");

    await this.dl.onLoaded(this.dataMapName);
    await this.dl.onLoaded(this.idMapName);
    this.lowInput.removeAttr("disabled");
    this.highInput.removeAttr("disabled");

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
    let low = this.lowInput.val();
    let high = this.highInput.val();
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
    this.lowInput.val("");
    this.highInput.val("");
  }
}
