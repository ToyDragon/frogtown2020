import RealScryfallManager from "./real_scryfall_manager";

const scryfallManager = new RealScryfallManager();

test("Succeeds simple request.", (done) => {
  jest.setTimeout(30000);
  scryfallManager
    .request<unknown>("https://api.scryfall.com/bulk-data")
    .then((result) => {
      expect(result).not.toBe(null);
      done();
    });
});
