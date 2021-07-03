import { extractCardIDFromImageURL } from "./extract_cardid_from_image_url";

test("Correctly parses sample cards", () => {
  for (const url of [
    "https://www.frogtown.me/Images/V1/90bbc0fa-4810-490d-bda7-a8fd4aaa01c4.jpg",
    "https://www.frogtown.me/Images/V16/90bbc0fa-4810-490d-bda7-a8fd4aaa01c4.jpg",
    "https://www.frogtown.me/Images/V116/90bbc0fa-4810-490d-bda7-a8fd4aaa01c4.jpg",
    "https://www.frogtown.me/Images/V1116/90bbc0fa-4810-490d-bda7-a8fd4aaa01c4.jpg",
    "https://beta.frogtown.me/Images/V116/90bbc0fa-4810-490d-bda7-a8fd4aaa01c4.jpg",
  ]) {
    expect(extractCardIDFromImageURL(url)).toBe(
      "90bbc0fa-4810-490d-bda7-a8fd4aaa01c4"
    );
  }
});
