export enum Rarity {
  mythicRare = "mythic rare",
  rare = "rare",
  uncommon = "uncommon",
  common = "common",
  land = "land",
  marketing = "marketing",
  checklist = "checklist",
  doubleFaced = "double faced",
  timeshiftedCommon = "timeshifted common",
  timeshiftedUncommon = "timeshifted uncommon",
  timeshiftedRare = "timeshifted rare",
  timeshiftedPurple = "timeshifted purple",
  powerNine = "power nine",
  foilCommon = "foil common",
  foilUncommon = "foil uncommon",
  foilRare = "foil rare",
  foilMythicRare = "foil mythic rare",
}

export enum BorderType {
  white = "white",
  black = "black",
  silver = "silver",
}

export enum ExpansionType {
  core = "core",
  expansion = "expansion",
  reprint = "reprint",
  box = "box",
  un = "un",
  fromTheVault = "from the vault",
  premiumDeck = "premium deck",
  duelDeck = "duel deck",
  starter = "starter",
  commander = "commander",
  planechase = "planechase",
  archenemy = "archenemy",
  promo = "promo",
  vanguard = "vanguard",
  masters = "masters",
  conspiracy = "conspiracy",
  masterpiece = "masterpiece",
}

export enum LayoutType {
  normal = "normal",
  split = "split",
  doubleFaced = "double-faced",
  token = "token",
  plane = "plane",
  scheme = "scheme",
  phenomenon = "phenomenon",
  leveler = "leveler",
  vanguard = "vanguard",
  meld = "meld",
  aftermath = "aftermath",
}

export enum Color {
  white = "White",
  blue = "Blue",
  black = "Black",
  red = "Red",
  green = "Green",
  colorless = "Colorless",
}

export enum ColorShort {
  white = "W",
  blue = "B",
  black = "U",
  red = "R",
  green = "G",
  colorless = "C",
}

export enum Supertype {
  Basic = "Basic",
  Legendary = "Legendary",
  Snow = "Snow",
  World = "World",
  Ongoing = "Ongoing",
  Elite = "Elite",
  Host = "Host",
}

export enum Type {
  Artifact = "Artifact",
  Creature = "Creature",
  Enchantment = "Enchantment",
  Instant = "Instant",
  Land = "Land",
  Planeswalker = "Planeswalker",
  Tribal = "Tribal",
  Sorcery = "Sorcery",
  Scheme = "Scheme",
  Vanguard = "Vanguard",
}

export enum Language {
  italian = "Italian",
  spanish = "Spanish",
  russian = "Russian",
  portuguese = "Portuguese (Brazil)",
  korean = "Korean",
  japanese = "Japanese",
  french = "French",
  german = "German",
  chineseTraditional = "Chinese Traditional",
  chineseSimplified = "Chinese Simplified",
}

export enum LanguageShort {
  italian = "Italian",
  spanish = "Spanish",
  russian = "Russian",
  portuguese = "Portuguese (Brazil)",
  korean = "Korean",
  japanese = "Japanese",
  french = "French",
  german = "German",
  chineseTraditional = "Chinese Traditional",
  chineseSimplified = "Chinese Simplified",
}

export enum Format {
  commander = "Commander",
  legacy = "Legacy",
  modern = "Modern",
  vintage = "Vintage",
}

export enum Legality {
  restricted = "Restricted",
  banned = "Banned",
  legal = "Legal",
}

export interface FormatLegality {
  format: Format;
  legality: Legality;
}

export interface Ruling {
  /**
   * The date of the ruling.
   */
  date: string;

  /**
   * The text of the ruling.
   */
  text: string;
}

export interface ImageData {
  /**
   * True if a low quality asset from gatherer is available.
   */
  gatherer: boolean;

  /**
   * True if a high quality asset from scryfall is available.
   */
  scryfall: boolean;

  /**
   * True if scryfall does not and will not ever have assets for this card.
   */
  scryfallInvalid?: boolean;
}

export interface SetNameAndCode {
  /**
   * Displayable name of the set.
   */
  name: string;

  /**
   * Short set code, typically three characters.
   */
  code: string;

  /**
   * Set release date.
   */
  releaseDate: string;
}

export interface Token {
  displayName: string;

  assetName: string;
}
