// eslint-disable-next-line node/no-unpublished-import
import puppeteer from "puppeteer";
import Assert from "./assertions";

const pageGetter = (async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <html>
      <head>
        <style>
          .nodisp {
            display: none;
          }
        </style>
      </head>
      <body>
        <div id="divOne">div one content</div>
        <div id="divTwo">
          <div id="divThree" class="nodisp">div three content</div>
        </div>
        <div id="divFour" class="nodisp"></div>
        <div id="divFive" class="nodisp">
          <div id="divSix">div six content</div>
        </div>
        <input type="text" id="inputText" value="input content" />
      </body>
    </html>
  `);
  return page;
})();

test("Assert.equals", async () => {
  await expect(Assert.equals("a", "a")).resolves.not.toThrow();
  await expect(Assert.equals("1", "1")).resolves.not.toThrow();
  await expect(Assert.equals(1, 1)).resolves.not.toThrow();
  await expect(Assert.equals(2, 1)).rejects.toThrow();
  await expect(Assert.equals("a", "b")).rejects.toThrow();
});

test("Assert.notEquals", async () => {
  await expect(Assert.notEquals("a", "a")).rejects.toThrow();
  await expect(Assert.notEquals("1", "1")).rejects.toThrow();
  await expect(Assert.notEquals(1, 1)).rejects.toThrow();
  await expect(Assert.notEquals(2, 1)).resolves.not.toThrow();
  await expect(Assert.notEquals("a", "b")).resolves.not.toThrow();
});

test("Assert.contains", async () => {
  await expect(Assert.contains("abcdefg", "xyz")).rejects.toThrow();
  await expect(Assert.contains("xyz", "y")).resolves.not.toThrow();
});

test("Assert.doesntContain", async () => {
  await expect(Assert.doesntContain("abcdefg", "xyz")).resolves.not.toThrow();
  await expect(Assert.doesntContain("xyz", "y")).rejects.toThrow();
});

test("Assert.visible", async () => {
  const page = await pageGetter;
  await expect(Assert.visible(page, "#divOne")).resolves.not.toThrow();
  await expect(Assert.visible(page, "#divTwo")).resolves.not.toThrow();
  await expect(Assert.visible(page, "#divThree")).rejects.toThrow();
  await expect(Assert.visible(page, "#divFour")).rejects.toThrow();
  await expect(Assert.visible(page, "#divFive")).rejects.toThrow();
  await expect(Assert.visible(page, "#divSix")).rejects.toThrow();
});

test("Assert.notVisible", async () => {
  const page = await pageGetter;
  await expect(Assert.notVisible(page, "#divOne")).rejects.toThrow();
  await expect(Assert.notVisible(page, "#divTwo")).rejects.toThrow();
  await expect(Assert.notVisible(page, "#divThree")).resolves.not.toThrow();
  await expect(Assert.notVisible(page, "#divFour")).resolves.not.toThrow();
  await expect(Assert.notVisible(page, "#divFive")).resolves.not.toThrow();
  await expect(Assert.notVisible(page, "#divSix")).resolves.not.toThrow();
});

test("Assert.existsAndGetValue", async () => {
  const page = await pageGetter;
  await expect(
    Assert.existsAndGetValue(page, "#fakeDiv", "className")
  ).rejects.toThrow();
  await expect(
    Assert.existsAndGetValue(page, "#divThree", "className")
  ).resolves.toBe("nodisp");
  await expect(
    Assert.existsAndGetValue(page, "#inputText", "value")
  ).resolves.toBe("input content");
});

test("Assert.valueSatisfies", async () => {
  const page = await pageGetter;
  await expect(
    Assert.valueSatisfies(
      page,
      "#fakeDiv",
      "className",
      (className) => className === ""
    )
  ).rejects.toThrow();
  await expect(
    Assert.valueSatisfies(
      page,
      "#divThree",
      "className",
      (className: string) => className === "nodisp"
    )
  ).resolves.not.toThrow();
  await expect(
    Assert.valueSatisfies(
      page,
      "#inputText",
      "value",
      (className: string) => className === "input content"
    )
  ).resolves.not.toThrow();
  await expect(
    Assert.valueSatisfies(
      page,
      "#inputText",
      "value",
      (className: string) => className === "wrong input content"
    )
  ).rejects.toThrow();
});
