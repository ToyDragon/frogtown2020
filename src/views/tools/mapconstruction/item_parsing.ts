import {
  ScryfallFullCard,
  ScryfallRelatedCard,
  ScryfallComponent,
  MTGCostType,
  MTGCardSuperType,
} from "../../shared/scryfall_types";

// Lol good luck understanding or maintaining these regexes.
/* eslint-disable max-len */
const tokenRegex = /([0-9]+\/[0-9]+)? ?((?:(?:blue|black|white|red|green|colorless)(?:,? and )?)+) ?((?:[A-Za-z]+ )+) ?((?:creature|artifact ?)+) tokens?(?: with ((?:[a-z]+)(?: and [a-z]{2,})?))?(?: named ([A-Za-z]+))?/;
//                   [power/toughness] [color]                                                      name               [type]                     token      [attributes, e.g. trample]
/* eslint-enable max-len */

// Tokens that don't fit neatly into the above regex.
const problematicTokens: { expression: RegExp; tokenstring: string }[] = [
  {
    expression: / Treasure token/,
    tokenstring: "treasureartifact",
  },
];
const cardTypesRegex = /([a-zA-Z ]*)(?:— ([a-zA-Z \n]*)(?:\(((?:[0-9x*+-]*(?:\{1\/2\})?|∞))(?:\/([0-9x*+-]*(?:\{1\/2\})?))?\))?)?/u;

export default function getItem(
  card: ScryfallFullCard,
  prop: string
): string[] {
  const key = prop.split(".")[0];
  const modifier = prop.split(".")[1];

  if (key === "tokenstring") {
    return [parseTokenObject(card)];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value = ((card as unknown) as Record<string, any>)[key];

  if (Array.isArray(value)) {
    if (modifier === "join") {
      return [value.join("")];
    } else if (modifier === "0") {
      return [value[0]];
    } else if (modifier === "tokenid") {
      return (value as ScryfallRelatedCard[])
        .filter((x) => {
          return x.component === ScryfallComponent.Token;
        })
        .map((x) => {
          return x.id;
        });
    } else if (modifier === "orcolorless") {
      if (value.length === 0 || typeof value[0] === "undefined") {
        return [MTGCostType.Colorless];
      }
      return value;
    } else if (value && modifier) {
      const allModifiers = prop.split(".");
      for (let i = 1; i < allModifiers.length; i++) {
        if (value) {
          value = value[allModifiers[i]];
        }
      }
      return [value];
    }

    return value;
  }

  if (modifier === "parseTokens") {
    if (!value && key === "oracle_text" && card.card_faces) {
      for (const face of card.card_faces) {
        value += face.oracle_text;
      }
    }
    return parseTokens(value);
  }

  if (modifier === "islegal") {
    const legalFormats = [];

    for (const format in value) {
      if (value[format] === "legal") {
        legalFormats.push(format);
      }
    }

    return legalFormats;
  } else if (modifier === "parseTypes" || modifier === "parseSuperTypes") {
    const result = cardTypesRegex.exec(value);
    if (!result || result.length < 2 || typeof result[1] !== "string") {
      return [];
    }
    const individualTypes = result[1].split(" ");
    const types = [];
    const superTypes = [];
    for (const type of individualTypes) {
      if (!type || type.length === 0) {
        continue;
      }
      if (isSuperType(type)) {
        superTypes.push(type);
      } else {
        types.push(type);
      }
    }
    if (modifier === "parseTypes") {
      return types;
    }
    return superTypes;
  } else if (modifier === "parseSubTypes") {
    const result = cardTypesRegex.exec(value);
    if (!result || result.length < 3 || typeof result[2] !== "string")
      return [];
    return result[2].trim().split(" ");
  } else if (value && modifier) {
    const allModifiers = prop.split(".");
    for (let i = 1; i < allModifiers.length; i++) {
      if (value) {
        value = value[allModifiers[i]];
      }
    }
    return [value];
  }

  if (!value && key === "image_uris" && card.card_faces) {
    if (modifier) {
      const result = (card.card_faces[0].image_uris as unknown) as Record<
        string,
        string
      >;
      return [result[modifier]];
    }
    return [card.card_faces[0].image_uris?.large || ""];
  }

  return [value];
}

function parseTokens(text: string): string[] {
  const originalText = text;
  const tokens = [];
  let result = tokenRegex.exec(text);
  while (result) {
    const pt = result[1];
    const colors = result[2];
    const subtype = result[3];
    const type = result[4];
    const modifiers = result[5];
    const name = result[6];
    const tokenstring = sanitizeToken(
      pt,
      colors,
      subtype,
      type,
      modifiers,
      name
    );

    tokens.push(tokenstring);
    text = text.substr(result.index + result[0].length);
    result = tokenRegex.exec(text);
  }

  for (const tokenPair of problematicTokens) {
    text = originalText;
    let result = tokenPair.expression.exec(text);
    while (result) {
      tokens.push(tokenPair.tokenstring);
      text = text.substr(result.index + result[0].length);
      result = tokenRegex.exec(text);
    }
  }

  return tokens;
}

function cleanTokenString(s: string): string {
  const val = s
    .toLowerCase()
    .replace(/\//g, "_")
    .replace(/[^a-zA-Z0-9]/g, "");
  return val;
}

function isSuperType(candidate: string): boolean {
  for (const superType in MTGCardSuperType) {
    if (candidate === superType) {
      return true;
    }
  }

  return false;
}

function parseTokenObject(token: ScryfallFullCard): string {
  const cleanName = cleanTokenString((token.name || "").split(" ")[0]);
  const cleanType = cleanTokenString(token.type_line);
  if (cleanName === "marit") {
    return "2020blackavatarcreatureflyingandindestructible";
  }
  if (cleanType.indexOf(cleanName) === -1) {
    return cleanName;
  }
  let ptString = "";
  if (token.power || token.toughness) {
    ptString = cleanTokenString(token.power + "/" + token.toughness);
  }

  let colors = "colorless";
  if (token.colors) {
    colors = cleanTokenColorString(
      token.colors
        .join("")
        .replace("W", "white")
        .replace("U", "blue")
        .replace("B", "black")
        .replace("R", "red")
        .replace("G", "green")
    );
  }

  let types = "",
    subtypes = "";
  const typeResult = cardTypesRegex.exec(token.type_line);
  if (typeResult) {
    const individualTypes = typeResult[1] + "".split(" ");
    for (const type of individualTypes) {
      if (!type || type.length === 0) {
        continue;
      }
      if (!isSuperType(type)) {
        types += type;
      }
    }
    types = cleanTokenString(types).replace("token", "");
    subtypes = cleanTokenString(typeResult[2] + "");
  }

  let modifiers = (token.oracle_text || "")
    .split(/[\n(]/)[0]
    .split(",")
    .join("");
  if (modifiers.indexOf("{") === 0) {
    modifiers = "";
  }
  modifiers = cleanTokenString(modifiers);
  if (
    modifiers.indexOf("when") === 0 ||
    modifiers.indexOf("this") === 0 ||
    modifiers.indexOf("sacrifice") === 0 ||
    modifiers.indexOf("atthebeginning") === 0 ||
    modifiers.indexOf("creaturesyoucontrol") === 0
  ) {
    modifiers = "";
  }

  return sanitizeToken(ptString, colors, subtypes, types, modifiers, "");
}

function cleanTokenColorString(s: string): string {
  const result = cleanTokenString(s.replace(/,? ?and/g, ""));
  let val = "";
  if (!result) {
    val = "colorless";
  }
  if (result.indexOf("white") >= 0) {
    val = "white" + val;
  }
  if (result.indexOf("blue") >= 0) {
    val = "blue" + val;
  }
  if (result.indexOf("black") >= 0) {
    val = "black" + val;
  }
  if (result.indexOf("red") >= 0) {
    val = "red" + val;
  }
  if (result.indexOf("green") >= 0) {
    val = "green" + val;
  }
  return val;
}

function sanitizeToken(
  powertoughness?: string,
  colors?: string,
  subtype?: string,
  type?: string,
  modifiers?: string,
  name?: string
) {
  if (powertoughness) {
    powertoughness = cleanTokenString(powertoughness);
  }
  if (colors) {
    colors = cleanTokenColorString(colors);
  }
  if (subtype) {
    subtype = cleanTokenString(subtype);
  }
  if (type) {
    type = cleanTokenString(type);
  }
  if (modifiers) {
    modifiers = cleanTokenString(modifiers);
  }
  if (name) {
    name = cleanTokenString(name);
  }

  if (name) {
    return name;
  }

  let tokenstr = "";
  if (powertoughness) {
    tokenstr += powertoughness;
  }

  if (colors) {
    tokenstr += colors;
  }

  if (subtype) {
    tokenstr += subtype;
  }

  if (type) {
    tokenstr += type;
  }

  if (modifiers) {
    tokenstr += modifiers;
  }

  let result = cleanTokenString(tokenstr);
  if (result === "44redbirdcreatureflying") {
    result = "44redrukhcreatureflying";
  }
  return result;
}
