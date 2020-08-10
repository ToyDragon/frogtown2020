import { BaseFilter } from "./base_filter";

export class FilterText extends BaseFilter {
  private input!: HTMLInputElement | null;
  private currentTimeout!: NodeJS.Timer | null;
  private lastChange!: Date;

  protected setup(): void {
    this.lastChange = new Date();
    this.input = this.container[0].querySelector(".input-group > input");
    this.input?.setAttribute("disabled", "true");
    this.input?.addEventListener("keyup", () => {
      this.lastChange = new Date();
      this.waitForMoreChanges();
    });
    this.active = true;
    this.dl.onLoaded(this.idMapName).then(() => {
      this.input?.removeAttribute("disabled");
      this.ready = true;
    });
  }

  protected clear(): void {
    if (this.input) {
      this.input.value = "";
      this.valueChanged();
    }
  }

  private waitForMoreChanges(): void {
    if (this.currentTimeout) {
      return;
    }
    const ellapsedMs = new Date().getTime() - this.lastChange.getTime();
    const remainingMs = 175 - ellapsedMs;
    if (remainingMs > 0) {
      this.currentTimeout = setTimeout(() => {
        this.currentTimeout = null;
        this.waitForMoreChanges();
      }, remainingMs + 25); //25ms buffer to make sure we don't undershoot
    } else {
      this.currentTimeout = null;
      this.valueChanged();
    }
  }

  protected applyPrimaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    const firstValue = (requiredValues.splice(0, 1)[0] + "").toLowerCase();
    const idMap = this.dl.getAnyMapData(this.idMapName);
    const exactMatches = [];
    for (const id in idMap) {
      const text = (idMap[id] as string).toLowerCase();
      if (text.includes(firstValue)) {
        cardIds.push(id);
        if (text === firstValue) {
          exactMatches.push(cardIds.length - 1);
        }
      }
    }

    for (let index = 0; index < exactMatches.length; index++) {
      const nextExact = exactMatches[index];
      if (index === nextExact) {
        //this index is already an exact match, just move on to the next one
      } else {
        const temp = cardIds[index];
        cardIds[index] = cardIds[nextExact];
        cardIds[nextExact] = temp;
      }
    }
  }

  protected applySecondaryFilterAnd(
    cardIds: string[],
    requiredValues: string[]
  ): void {
    if (requiredValues.length > 0) {
      const text = (requiredValues[0] + "").toLowerCase();
      const idMap = this.dl.getAnyMapData(this.idMapName);
      if (!idMap) {
        return;
      }
      for (let cardIndex = cardIds.length - 1; cardIndex >= 0; cardIndex--) {
        const cardId = cardIds[cardIndex];
        const thisCardsText = (idMap[cardId] as string).toLowerCase();

        if (!thisCardsText || !thisCardsText.includes(text)) {
          cardIds.splice(cardIndex, 1);
        }
      }
    }
  }

  public getValues(): string[] {
    if (this.input && this.input.value) {
      return [this.input.value];
    }
    return [];
  }

  public setValue(value: unknown): void {
    if (this.input) {
      this.input.value = value + "";
    }
  }
}
