import { Deck } from "../shared/deck_types";
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable-next-line node/no-unpublished-require */
const rough = require("../../../node_modules/roughjs/bundled/rough.cjs.js");
/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable-next-line node/no-unpublished-require */

export default function setupSearchArrow(deckRetriever: () => Deck): void {
  drawArrow(deckRetriever);
  setInterval(() => {
    drawArrow(deckRetriever);
  }, 125);
}

function drawArrow(deckRetriever: () => Deck): void {
  const searchSvg = document.querySelector("#searchSVG") as SVGSVGElement;
  searchSvg.innerHTML = "";
  let numCards = 0;

  numCards += deckRetriever().mainboard.length;
  numCards += deckRetriever().sideboard.length;

  if (numCards === 0) {
    const rc = rough.svg(searchSvg);
    const startX = 150;
    const startY = 15;
    const width = 250;
    const height = 420;
    const points = [
      [startX + width / 3, startY + height],
      [startX + width / 3, startY + height / 4],
      [startX, startY + height / 4],
      [startX + width / 2, startY],
      [startX + width, startY + height / 4],
      [startX + (2 * width) / 3, startY + height / 4],
      [startX + (2 * width) / 3, startY + height],
    ];

    for (let i = 0; i < points.length; i++) {
      const ni = (i + 1) % points.length;

      const l = points[i];
      const r = points[ni];
      const ele = rc.line(l[0], l[1], r[0], r[1], {
        bowing: 3,
        stroke: "#303b4c",
        strokeWidth: 3,
      });
      searchSvg.append(ele);
    }
  }
}
