/**
 * String values for card rarities.
 */
export enum MTGCardRarity {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  MythicRare = "mythicrare",
}

/**
 * Object with keys from enum MTGCostType, and values are numbers.
 */
export interface MTGCostMap {
  /**
   * costType is a value from MTGCostType.
   */
  [costType: string]: number;
}

/**
 * All of the available locales that cards could be printed in.
 * http://gatherer.wizards.com/Pages/Language.aspx
 */
export enum MTGLocale {
  ENUS = "en-US", // English, United States
  ZHTW = "zh-tw", // China, Chinese-Traditional
  ZHCN = "zh-cn", // China, Chinese-Standard
  FRFR = "fr-fr", // France, French
  JAJP = "ja-jp", // Japan, Japanese
  KOKR = "ko-KR", // Korea, Korean
  RURU = "ru-RU", // Rusia, Rusian
  ESES = "es-es", // Spain, Spanish
  DEDE = "de-de", // Germany, German
  PTBR = "pt-br", // Brazil, Portuguese
}

/**
 * All of the available languages that cards could be printed in. Very similar to locale, but does not include country code.
 * http://gatherer.wizards.com/Pages/Language.aspx
 */
export enum MTGLanguage {
  EN = "en-US", // English
  ZHT = "zht", // Chinese-Traditional
  ZHS = "zhs", // Chinese-Standard
  FR = "fr", // French
  JA = "ja", // Japanese
  KO = "ko", // Korean
  RU = "ru", // Rusian
  ES = "es", // Spanish
  DE = "de", // German
  PT = "pt", // Portuguese
  IT = "it", // Italian
  HE = "he", // Hebrew, 1 card
  LA = "la", // Latin, 1 card
  GRC = "grc", // Ancient Greek, 1 card
  AR = "ar", // Arabic, 1 card
  SA = "sa", // Sanskrit, 1 card
  PX = "px", // Phyrexian, 1 card
}

/**
 * String values for all of the notable formats.
 */
export enum ScryfallFormat {
  Standard = "standard",
  Modern = "modern",
  Legacy = "legacy",
  Vintage = "vintage",
  Commander = "commander",
  Future = "future",
  Frontier = "frontier",
  Pauper = "pauper",
  Penny = "penny",
  Duel = "duel",
  Oldschool = "oldschool",
}

export type ScryfallLegalStatus =
  | "legal"
  | "not_legal"
  | "restricted"
  | "banned";

export interface ScryfallLegalities {
  [format: string]: ScryfallLegalStatus;
  standard: ScryfallLegalStatus;
  modern: ScryfallLegalStatus;
  legacy: ScryfallLegalStatus;
  vintage: ScryfallLegalStatus;
  commander: ScryfallLegalStatus;
  future: ScryfallLegalStatus;
  frontier: ScryfallLegalStatus;
  pauper: ScryfallLegalStatus;
  penny: ScryfallLegalStatus;
  duel: ScryfallLegalStatus;
  oldschool: ScryfallLegalStatus;
}

/**
 * Array of colors in WUBRG order.
 */
export type MTGColorArray =
  //single colors
  | [MTGCostType.White]
  | [MTGCostType.Blue]
  | [MTGCostType.Black]
  | [MTGCostType.Red]
  | [MTGCostType.Green]
  //double colors
  //White X
  | [MTGCostType.White, MTGCostType.Blue]
  | [MTGCostType.White, MTGCostType.Black]
  | [MTGCostType.White, MTGCostType.Red]
  | [MTGCostType.White, MTGCostType.Green]
  //Blue X
  | [MTGCostType.Blue, MTGCostType.Black]
  | [MTGCostType.Blue, MTGCostType.Red]
  | [MTGCostType.Blue, MTGCostType.Green]
  //Black X
  | [MTGCostType.Black, MTGCostType.Red]
  | [MTGCostType.Black, MTGCostType.Green]
  //Red X
  | [MTGCostType.Red, MTGCostType.Green]
  //triple colors
  //White Blue X
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Black]
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Red]
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Green]
  //White Black X
  | [MTGCostType.White, MTGCostType.Black, MTGCostType.Red]
  | [MTGCostType.White, MTGCostType.Black, MTGCostType.Green]
  //White Red X
  | [MTGCostType.White, MTGCostType.Red, MTGCostType.Green]
  //Blue Black X
  | [MTGCostType.Blue, MTGCostType.Black, MTGCostType.Red]
  | [MTGCostType.Blue, MTGCostType.Black, MTGCostType.Green]
  //Blue Red X
  | [MTGCostType.Blue, MTGCostType.Red, MTGCostType.Green]
  //Black Red X
  | [MTGCostType.Black, MTGCostType.Red, MTGCostType.Green]
  //quad colors
  //White Blue Black X
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Black, MTGCostType.Red]
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Black, MTGCostType.Green]
  //White Blue Red X
  | [MTGCostType.White, MTGCostType.Blue, MTGCostType.Red, MTGCostType.Green]
  //White Black Red X
  | [MTGCostType.White, MTGCostType.Black, MTGCostType.Red, MTGCostType.Green]
  //Blue Black Red X
  | [MTGCostType.Blue, MTGCostType.Black, MTGCostType.Red, MTGCostType.Green]
  //five colors
  | [
      MTGCostType.White,
      MTGCostType.Blue,
      MTGCostType.Black,
      MTGCostType.Red,
      MTGCostType.Green
    ];

/**
 * String values for all of the available cost symbols.
 */
export enum MTGCostType {
  //Ability specific
  Tap = "T",

  //Normal WUBRG+C
  White = "W",
  Blue = "U",
  Black = "B",
  Red = "R",
  Green = "G",
  Colorless = "C",

  //Half WUBRG
  HalfWhite = "HalfW",
  HalfBlue = "HalfU",
  HalfBlack = "HalfB",
  HalfRed = "HalfR",
  HalfGreen = "HalfG",

  //Color Combos
  WhiteOrBlue = "WU",
  WhiteOrBlack = "WB",
  BlueOrRed = "UR",
  BlueOrBlack = "UB",
  BlackOrRed = "BR",
  BlackOrGreen = "BG",
  RedOrWhite = "RW",
  RedOrGreen = "RG",
  GreenOrWhite = "GW",
  GreenOrBlue = "GU",

  //Color or 2 Colorless
  WhiteOrTwoColorless = "2W",
  BlueOrTwoColorless = "2U",
  BlackOrTwoColorless = "2B",
  RedOrTwoColorless = "2R",
  GreenOrTwoColorless = "2G",

  //Color or 2 Life
  WhiteOrTwoLife = "WP",
  BlueOrTwoLife = "UP",
  BlackOrTwoLife = "BP",
  RedOrTwoLife = "RP",
  GreenOrTwoLife = "GP",

  //Variable
  X = "X",
  Y = "Y",
  Z = "Z",
}

export type ScryfallGames = ("arena" | "mtgo" | "paper")[];

/**
 * String values for card super types.
 */
export enum MTGCardSuperType {
  Basic = "Basic",
  Legendary = "Legendary",
  Ongoing = "Ongoing",
  Snow = "Snow",
  World = "World",
}

export interface ScryfallCardImages {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallCardFace {
  object: "card_face";
  artist?: string;
  color_indicator?: MTGColorArray;
  colors?: MTGColorArray;
  flavor_text?: string;

  /**
   * A unique identifier for the card face artwork that remains consistent across reprints. Newly spoiled cards may not have this field yet.
   */
  illustration_id?: string;
  image_uris?: ScryfallCardImages;
  loyalty?: string;

  /**
   * String made up of curly bracketed MTGCostType's, such as "{4}{W}{W}{G}"
   */
  mana_cost: string;

  name: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  type_line: string;
}

/**
 * https://scryfall.com/docs/api/layouts#frame-effects
 */
export enum ScryfallFrameEffectEnum {
  Legendary = "legendary",
  Miracle = "miracle",
  NyxTouched = "nyxtouched",
  Draft = "draft",
  Devoid = "devoid",
  Tombstone = "tombstone",
  ColorShifted = "colorshifted",
  SunMoonDFC = "sunmoondfc",
  CompassLandDFC = "compasslanddfc",
  OriginPWDFC = "originpwdfc",
  MoonEldraziDFC = "MoonEldraziDFC",
}

export type ScryfallFrameEffect = "" | ScryfallFrameEffectEnum;

export type ScryfallFrame = "1993" | "1997" | "2003" | "2015" | "future";
export type ScryfallRarity = "common" | "uncommon" | "rare" | "mythic";

export interface ScryfallRelatedURIs {
  gatherer: string;
  tcgplayer_decks: string;
  edhrec: string;
  mtgtop8: string;
}

export interface ScryfallFullCard {
  object: "card";

  /**
   * Numeric ID used in MTGArena
   */
  arena_id?: number;

  /**
   * A unique ID generated by Scryfall for this specific card
   */
  id: string;

  /**
   * 	A unique ID for this card’s oracle identity. This value is consistent
   * across reprinted card editions, and unique among different cards with
   * the same name (tokens, Unstable variants, etc).
   */
  oracle_id: string;

  /**
   * Numeric ID used in MTGO
   */
  mtgo_id?: number;

  /**
   * Numeric ID used in MTGO for the foil version
   */
  mtgo_foil_id?: number;

  /**
   * Numeric ID used for TCG Player
   */
  tcgplayer_id?: number;

  multiverse_ids?: string[];

  /**
   * Name as it appears on the card, in Pascale Case
   */
  name: string;

  lang: MTGLanguage;

  /**
   * Date in the format yyyy-mm-dd
   */
  released_at: string;

  /**
   * API URI to get more details about this card from Scryfall
   */
  uri: string;

  /**
   * User facing URI to Scryfall webpage with more details about this card
   */
  scryfall_uri: string;

  layout: ScryfallLayout;
  image_uris: ScryfallCardImages;

  /**
   * String made up of curly bracketed MTGCostType's, such as "{4}{W}{W}{G}"
   */
  mana_cost: string;

  cmc: number;

  /**
   * The full type line as it appears on the card, including emdash separator
   */
  type_line: string;

  /**
   * Full oracle text including newlines.
   */
  oracle_text: string;

  /**
   * Numeric string, or other symbol like *.
   */
  power?: string;

  /**
   * Numeric string, or other symbol like *.
   */
  toughness?: string;

  colors?: MTGColorArray;
  color_identity: MTGColorArray;
  color_indicator?: MTGColorArray;
  edhrec_rank?: number;

  /**
   * True if this printing exists in a foil version
   */
  foil: boolean;

  /**
   * True if this printing exists in a nonfoil version
   */
  nonfoil: boolean;

  /**
   * This card’s hand modifier, if it is Vanguard card. This value will contain a delta, such as -1.
   */
  hand_modifier?: number;

  all_parts?: ScryfallRelatedCard[];
  card_faces?: ScryfallCardFace[];
  legalities: ScryfallLegalities;
  life_modifier?: string;
  loyalty?: string;
  oversized: boolean;
  games: ScryfallGames;
  reserved: boolean;

  artist?: string;
  border_color: MTGBorderColor;
  collector_number: string;
  digital: boolean;
  flavor_text?: string;
  frame_effect: ScryfallFrameEffect;
  frame: ScryfallFrame;
  full_art: boolean;
  highres_image: boolean;
  illustration_id?: string;
  printed_name?: string;
  printed_text?: string;
  printed_type_line?: string;
  promo: boolean;
  rarity: ScryfallRarity;

  related_uris: ScryfallRelatedURIs;

  reprint: boolean;
  scryfall_set_uri: string;
  set_name: string;
  set_search_uri: string;
  set_uri: string;
  set: string;
  story_spotlight: boolean;
  watermark?: string;
}

export enum MTGBorderColor {
  Black = "black",
  Borderless = "borderless",
  Gold = "gold",
  Silver = "silver",
  White = "white",
}

export enum ScryfallLayout {
  Scheme = "scheme",
  Normal = "normal",
  Split = "split",
  Flip = "flip",
  Transform = "transform",
  Meld = "meld",
  Leveler = "leveler",
  Saga = "saga",
  Planar = "planar",
  Vanguard = "vanguard",
  Token = "token",
  DoubleFacedToken = "double_faced_token",
  Emblem = "emblem",
  Augment = "augment",
  Host = "host",
}

export enum ScryfallComponent {
  Token = "token",
  ComboPiece = "combo_piece",
  MeldPart = "meld_part",
}

export interface ScryfallRelatedCard {
  object: "related_card";
  id: string;
  component: ScryfallComponent;
  name: string;
  type_line: string;
  uri: string;
}
