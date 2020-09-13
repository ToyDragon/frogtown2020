import * as CardTypes from "./card_types";

export interface CardIDMap<T> {
  [cardId: string]: T;
}
export interface StringValueMap<T> {
  [value: string]: T;
}
export interface NumericValueMap<T> {
  [value: number]: T;
}

export class BackData {}

export class MapData {
  public IDToName: CardIDMap<string> = {};
  public NameToID: StringValueMap<string[]> = {};
  public IDToCMC: CardIDMap<number> = {};
  public CMCToID: NumericValueMap<string[]> = {};
  public IDToMultiverse: CardIDMap<number> = {};
  public MultiverseToID: NumericValueMap<string[]> = {};
  public IDToSetCode: CardIDMap<string> = {};
  public SetCodeToID: StringValueMap<string[]> = {};
  public IDToToughness: CardIDMap<string | number> = {};
  public ToughnessToID: StringValueMap<string[]> = {};
  public IDToStrength: CardIDMap<string | number> = {};
  public StrengthToID: StringValueMap<string[]> = {};
  public IDToRarity: CardIDMap<CardTypes.Rarity> = {};
  public RarityToID: StringValueMap<string[]> = {};

  public IDToImage: CardIDMap<CardTypes.ImageData> = {};
  public ImageToID: StringValueMap<string[]> = {};

  public IDToColorIdentity: CardIDMap<CardTypes.ColorShort[]> = {};
  public ColorIdentityToID: StringValueMap<string[]> = {};
  public IDToColor: CardIDMap<CardTypes.Color[]> = {};
  public ColorToID: StringValueMap<string[]> = {};
  public IDToSubtype: CardIDMap<string[]> = {};
  public SubtypeToID: StringValueMap<string[]> = {};
  public IDToSupertype: CardIDMap<string[]> = {};
  public SupertypeToID: StringValueMap<string[]> = {};
  public IDToType: CardIDMap<string[]> = {};
  public TypeToID: StringValueMap<string[]> = {};

  public IDToLegalFormat: CardIDMap<string[]> = {};
  public LegalFormatToID: StringValueMap<string[]> = {};

  public IDToToken: CardIDMap<CardTypes.Token[]> = {};
  public TokenToID: StringValueMap<string[]> = {};

  public IDToText: CardIDMap<string> = {};
  public IDToBack: CardIDMap<BackData> = {};
  public BackToID: StringValueMap<string[]> = {};

  public SetCodeToRelease: StringValueMap<string> = {};
  public SetCodeToSetName: StringValueMap<string> = {};
  public TokenAssetToName: StringValueMap<string> = {};

  public IDToNumber: CardIDMap<string> = {};
  public IDToCost: CardIDMap<string> = {};
}
