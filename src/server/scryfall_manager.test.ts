import ScryfallManager from "./scryfall_manager";

const scryfallManager = new ScryfallManager();

test("Succeeds simple request.", (done) => {
  jest.setTimeout(30000);
  scryfallManager
    .request<object>("https://api.scryfall.com/bulk-data")
    .then((result) => {
      expect(result).not.toBe(null);
      done();
    });
});
