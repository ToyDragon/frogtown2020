/* eslint-disable prettier/prettier */
import * as stream from "stream";
import { ScryfallFullCard } from "../../shared/scryfall_types";
import { logError } from "../../../server/log";
import MapFile, { MapFilterOperator } from "./map_file";
import getItem from "./item_parsing";
import checkForCard from "./check_for_card";

interface Range {
  start: number;
  end: number;
}

export default class IndividualMapConstructor {
  private templateFile: string;
  private streamBuffer: string;
  private cardCount: number;
  public mapTemplate: MapFile | null = null;
  public errorCount = 0;

  private lastParseData = "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any;

  public constructor(templateFile: string) {
    this.templateFile = templateFile;
    this.streamBuffer = "";
    this.cardCount = 0;
  }

  public async attachStream(input: stream.Readable): Promise<void> {
    this.mapTemplate = new MapFile(this.templateFile);
    await this.mapTemplate.loadFromFile();
    this.streamBuffer = "";
    this.cardCount = 0;
    input.on("data", (data: string) => {
      this.handleInputData(data);
    });
  }

  public getCardCount(): number {
    return this.cardCount;
  }

  private cardMeetsFilter(card: ScryfallFullCard): boolean {
    if (
      this.mapTemplate &&
      this.mapTemplate.data &&
      this.mapTemplate.data.filter
    ) {
      for (const filter of this.mapTemplate.data.filter) {
        const rawValueList = getItem(card, filter.key as string);
        const expectedValue = filter.value;
        for (const realValue of rawValueList) {
          if (
            this.excludeItem(
              filter.operator,
              realValue,
              expectedValue as string
            )
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private excludeItem(
    operator: MapFilterOperator | undefined,
    realValue: string,
    expectedValue: string
  ): boolean {
    realValue = realValue || "";
    if (operator === MapFilterOperator.Equals) {
      if (realValue !== expectedValue) {
        return true;
      }
    }

    if (operator === MapFilterOperator.NotEquals) {
      if (realValue === expectedValue) {
        return true;
      }
    }

    if (operator === MapFilterOperator.Exists) {
      if (!realValue) {
        return true;
      }
    }

    if (operator === MapFilterOperator.Contains) {
      if ((realValue as string).indexOf(expectedValue) === -1) {
        return true;
      }
    }

    if (operator === MapFilterOperator.NotContains) {
      if ((realValue as string).indexOf(expectedValue) !== -1) {
        return true;
      }
    }

    if (operator === MapFilterOperator.ContainedIn) {
      if (expectedValue.indexOf(realValue as string) === -1) {
        return true;
      }
    }

    return false;
  }

  private parseOneCard(range: Range): boolean {
    const rawData = this.streamBuffer.substr(
      range.start,
      range.end - range.start + 1
    );
    this.lastParseData =
      `Buffer: ${rawData}\nRange: ${JSON.stringify(range)}`;
    try {
      const cardData = JSON.parse(rawData) as ScryfallFullCard;
      if (this.cardMeetsFilter(cardData)) {
        this.addToMaps(cardData);
      }
      return true;
    } catch (e) {
      if (this.errorCount <= 3) {
        logError(
          `Error parsing card with range: ${JSON.stringify(range)}` +
            `\n${e}` +
            `\n${this.streamBuffer}` +
            "\nPrevious card----" +
            `\n${this.lastParseData}`
        );
      }
      this.errorCount += 1;
      return false;
    }
  }

  private addToMaps(card: ScryfallFullCard): void {
    if (
      !this.mapTemplate ||
      !this.mapTemplate.data ||
      !this.mapTemplate.data.maps
    ) {
      return;
    }

    for (let i = 0; i < this.mapTemplate?.data?.maps.length; i++) {
      const mapDetails = this.mapTemplate?.data?.maps[i];
      const mapData = this.mapTemplate?.mapData[i];
      const keyData = getItem(card, mapDetails.key);
      const valueData = getItem(card, mapDetails.value);
      for (const key of keyData) {
        if (key === null || key === undefined) {
          continue;
        }
        for (const value of valueData) {
          if (value === null || value === undefined) {
            continue;
          }
          if (mapDetails.duplicates) {
            mapData[key] = mapData[key] || [];
            mapData[key].push(value);
          } else {
            mapData[key] = value;
          }
        }
      }
    }
  }

  private handleInputData(data: string): void {
    this.streamBuffer += data;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = checkForCard(this.streamBuffer);
      if (!result) {
        break;
      }
      if (this.parseOneCard(result)) {
        this.streamBuffer = this.streamBuffer.substr(result.end + 1);
        this.cardCount++;
      }
    }
  }
}
