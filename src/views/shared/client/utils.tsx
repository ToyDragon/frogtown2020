import { DataDetailsResponse } from "../handler_types";
import { resolveOrTimeout } from "../../../shared/resolve_or_timeout";

export function GetImageUrl(
  cardId: string,
  dataDetails: DataDetailsResponse
): string {
  return (
    dataDetails.baseURL +
    "/" +
    dataDetails.awsS3CompressedImageBucket +
    "/" +
    cardId +
    ".jpg"
  );
}

export const SYMBOLS = [
  /* eslint-disable prettier/prettier */
  { regex: /\{T\}/g, display: "<div class=\"tap icon\"></div>" },
  { regex: /\{X\}/g, display: "<div class=\"manaX icon\"></div>" },
  { regex: /\{Y\}/g, display: "<div class=\"manaY icon\"></div>" },
  { regex: /\{Z\}/g, display: "<div class=\"manaZ icon\"></div>" },
  { regex: /\{W\}/g, display: "<div class=\"manaW icon\"></div>" },
  { regex: /\{U\}/g, display: "<div class=\"manaU icon\"></div>" },
  { regex: /\{B\}/g, display: "<div class=\"manaB icon\"></div>" },
  { regex: /\{R\}/g, display: "<div class=\"manaR icon\"></div>" },
  { regex: /\{G\}/g, display: "<div class=\"manaG icon\"></div>" },
  { regex: /\{2\/W\}/g, display: "<div class=\"mana2W icon\"></div>" },
  { regex: /\{2\/U\}/g, display: "<div class=\"mana2U icon\"></div>" },
  { regex: /\{2\/B\}/g, display: "<div class=\"mana2B icon\"></div>" },
  { regex: /\{2\/R\}/g, display: "<div class=\"mana2R icon\"></div>" },
  { regex: /\{2\/G\}/g, display: "<div class=\"mana2G icon\"></div>" },
  { regex: /\{C\}/g, display: "<div class=\"manaC icon\"></div>" },
  { regex: /\{W\/U\}/g, display: "<div class=\"manaWU icon\"></div>" },
  { regex: /\{W\/B\}/g, display: "<div class=\"manaWB icon\"></div>" },
  { regex: /\{U\/R\}/g, display: "<div class=\"manaUR icon\"></div>" },
  { regex: /\{U\/B\}/g, display: "<div class=\"manaUB icon\"></div>" },
  { regex: /\{B\/R\}/g, display: "<div class=\"manaBR icon\"></div>" },
  { regex: /\{B\/G\}/g, display: "<div class=\"manaBG icon\"></div>" },
  { regex: /\{R\/W\}/g, display: "<div class=\"manaRW icon\"></div>" },
  { regex: /\{R\/G\}/g, display: "<div class=\"manaRG icon\"></div>" },
  { regex: /\{G\/W\}/g, display: "<div class=\"manaGW icon\"></div>" },
  { regex: /\{W\/P\}/g, display: "<div class=\"manaWP icon\"></div>" },
  { regex: /\{U\/P\}/g, display: "<div class=\"manaUP icon\"></div>" },
  { regex: /\{B\/P\}/g, display: "<div class=\"manaBP icon\"></div>" },
  { regex: /\{R\/P\}/g, display: "<div class=\"manaRP icon\"></div>" },
  { regex: /\{G\/P\}/g, display: "<div class=\"manaGP icon\"></div>" },
  { regex: /\{0\}/g, display: "<div class=\"mana0 icon\"></div>" },
  { regex: /\{1\}/g, display: "<div class=\"mana1 icon\"></div>" },
  { regex: /\{2\}/g, display: "<div class=\"mana2 icon\"></div>" },
  { regex: /\{3\}/g, display: "<div class=\"mana3 icon\"></div>" },
  { regex: /\{4\}/g, display: "<div class=\"mana4 icon\"></div>" },
  { regex: /\{5\}/g, display: "<div class=\"mana5 icon\"></div>" },
  { regex: /\{6\}/g, display: "<div class=\"mana6 icon\"></div>" },
  { regex: /\{7\}/g, display: "<div class=\"mana7 icon\"></div>" },
  { regex: /\{8\}/g, display: "<div class=\"mana8 icon\"></div>" },
  { regex: /\{9\}/g, display: "<div class=\"mana9 icon\"></div>" },
  { regex: /\{10\}/g, display: "<div class=\"mana10 icon\"></div>" },
  { regex: /\{11\}/g, display: "<div class=\"mana11 icon\"></div>" },
  { regex: /\{12\}/g, display: "<div class=\"mana12 icon\"></div>" },
  { regex: /\{13\}/g, display: "<div class=\"mana13 icon\"></div>" },
  { regex: /\{14\}/g, display: "<div class=\"mana14 icon\"></div>" },
  { regex: /\{15\}/g, display: "<div class=\"mana15 icon\"></div>" },
  { regex: /\{16\}/g, display: "<div class=\"mana16 icon\"></div>" },
  { regex: /\{1000000\}/g, display: "<div class=\"mana1000000 icon\"></div>" },
  /* eslint-enable prettier/prettier */
];

export function IsDebug(): boolean {
  return window.location.search.indexOf("debug") >= 0;
}

export function ReplaceSymbols(text: string): string {
  for (const symbol of SYMBOLS) {
    text = text.replace(symbol.regex, symbol.display);
  }
  return text;
}

export function ReplaceNewlines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      return `<div class="textLine">${line}</div>`;
    })
    .join("");
}

export async function LoadCardImageIntoElement(
  cardId: string,
  dataDetails: DataDetailsResponse,
  element: HTMLElement
): Promise<void> {
  if (element.getAttribute("data-loaded")) {
    return;
  }
  element.setAttribute("data-loaded", "true");
  element.style.backgroundImage = "url(/Images/CardBack.jpg)";
  const imageUrl = GetImageUrl(cardId, dataDetails);

  const result = await resolveOrTimeout(waitForImageToLoad(imageUrl), 100);
  let url = "";
  if (result.timedOut) {
    element.style.backgroundImage = "url(/Images/CardBack.jpg)";
    url = await result.promise!;
  } else {
    url = result.result!;
  }
  element.style.backgroundImage = url;
}

function waitForImageToLoad(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(`url("${imageUrl}")`);
    img.onerror = reject;
    img.src = imageUrl;
  });
}

export function showPopup(popup: HTMLElement | null): void {
  if (popup) {
    popup.classList.remove("nodisp");
    if (popup.parentElement) {
      const pWidth = popup.parentElement.clientWidth;
      const popupContentEle = popup.querySelector("> .popup") as HTMLElement;
      if (popupContentEle) {
        const width = popupContentEle.clientWidth;
        popupContentEle.style.marginLeft = pWidth / 2 - width / 2 + "px";
      }
    }
  }
}
