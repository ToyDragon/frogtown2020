import { extractBulkEntryTextFromJSONText } from "./extract_bulk_entry_text_from_json_text";

test("Correctly parses sample deck with 6 cards", () => {
  expect(
    extractBulkEntryTextFromJSONText(
      // eslint-disable-next-line
      `{"ObjectStates":[{"Name":"DeckCustom","ContainedObjects":[{"CardID":100,"Name":"Card","Nickname":"Akoum Firebird","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":200,"Name":"Card","Nickname":"Amplifire","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":300,"Name":"Card","Nickname":"Angelfire Crusader","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":400,"Name":"Card","Nickname":"Annihilating Fire","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":500,"Name":"Card","Nickname":"Jorn, God of Winter // Kaldring, the Rimestaff","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":600,"Name":"Card","Nickname":"Advent of the Wurm","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}}],"DeckIDs":[100,200,300,400,500,600],"CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/3d637cb2-b770-4637-a75c-c2ed9e562538.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"2":{"FaceURL":"https://www.frogtown.me/Images/V116/8a529382-75d5-4129-880c-16d8425326be.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"3":{"FaceURL":"https://www.frogtown.me/Images/V116/a7af8350-9a51-437c-a55e-19f3e07acfa9.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"4":{"FaceURL":"https://www.frogtown.me/Images/V116/ae12fd10-c13e-4777-a233-96204ec75ac1.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"5":{"FaceURL":"https://www.frogtown.me/Images/V116/c697548f-925b-405e-970a-4e78067d5c8e.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"6":{"FaceURL":"https://www.frogtown.me/Images/V116/e49ceeeb-ebb4-4364-9cfa-367b1d153b9e.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":0,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"Name":"Card","CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/3fd53493-ac85-4dd0-b1db-0ae0130ea2d4.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":2.2,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},"CardID":100,"Nickname":"Wurm"},{"Name":"Card","CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/c697548f-925b-405e-970a-4e78067d5c8e.jpg","BackURL":"https://www.frogtown.me/Images/V116/df10ea65-fffd-4d95-9e79-f9f653000e42.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":4.4,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},"CardID":100,"Nickname":"Jorn, God of Winter // Kaldring, the Rimestaff"}]}`
    )
  ).toBe(`1 3d637cb2-b770-4637-a75c-c2ed9e562538
1 8a529382-75d5-4129-880c-16d8425326be
1 a7af8350-9a51-437c-a55e-19f3e07acfa9
1 ae12fd10-c13e-4777-a233-96204ec75ac1
1 c697548f-925b-405e-970a-4e78067d5c8e
1 e49ceeeb-ebb4-4364-9cfa-367b1d153b9e
`);
});

test("Correctly parses sample deck with multiples", () => {
  expect(
    extractBulkEntryTextFromJSONText(
      // eslint-disable-next-line
      `{"ObjectStates":[{"Name":"DeckCustom","ContainedObjects":[{"CardID":100,"Name":"Card","Nickname":"Akoum Firebird","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":100,"Name":"Card","Nickname":"Akoum Firebird","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":100,"Name":"Card","Nickname":"Akoum Firebird","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":200,"Name":"Card","Nickname":"Amplifire","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":300,"Name":"Card","Nickname":"Angelfire Crusader","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":400,"Name":"Card","Nickname":"Annihilating Fire","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":500,"Name":"Card","Nickname":"Jorn, God of Winter // Kaldring, the Rimestaff","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"CardID":600,"Name":"Card","Nickname":"Advent of the Wurm","Transform":{"posX":0,"posY":0,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}}],"DeckIDs":[100,100,100,200,300,400,500,600],"CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/3d637cb2-b770-4637-a75c-c2ed9e562538.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"2":{"FaceURL":"https://www.frogtown.me/Images/V116/8a529382-75d5-4129-880c-16d8425326be.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"3":{"FaceURL":"https://www.frogtown.me/Images/V116/a7af8350-9a51-437c-a55e-19f3e07acfa9.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"4":{"FaceURL":"https://www.frogtown.me/Images/V116/ae12fd10-c13e-4777-a233-96204ec75ac1.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"5":{"FaceURL":"https://www.frogtown.me/Images/V116/c697548f-925b-405e-970a-4e78067d5c8e.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true},"6":{"FaceURL":"https://www.frogtown.me/Images/V116/e49ceeeb-ebb4-4364-9cfa-367b1d153b9e.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":0,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":180,"scaleX":1,"scaleY":1,"scaleZ":1}},{"Name":"Card","CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/3fd53493-ac85-4dd0-b1db-0ae0130ea2d4.jpg","BackURL":"https://i.imgur.com/a8z6DQC.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":2.2,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},"CardID":100,"Nickname":"Wurm"},{"Name":"Card","CustomDeck":{"1":{"FaceURL":"https://www.frogtown.me/Images/V116/c697548f-925b-405e-970a-4e78067d5c8e.jpg","BackURL":"https://www.frogtown.me/Images/V116/df10ea65-fffd-4d95-9e79-f9f653000e42.jpg","NumHeight":1,"NumWidth":1,"BackIsHidden":true}},"Transform":{"posX":4.4,"posY":1,"posZ":0,"rotX":0,"rotY":180,"rotZ":0,"scaleX":1,"scaleY":1,"scaleZ":1},"CardID":100,"Nickname":"Jorn, God of Winter // Kaldring, the Rimestaff"}]}`
    )
  ).toBe(`3 3d637cb2-b770-4637-a75c-c2ed9e562538
1 8a529382-75d5-4129-880c-16d8425326be
1 a7af8350-9a51-437c-a55e-19f3e07acfa9
1 ae12fd10-c13e-4777-a233-96204ec75ac1
1 c697548f-925b-405e-970a-4e78067d5c8e
1 e49ceeeb-ebb4-4364-9cfa-367b1d153b9e
`);
});