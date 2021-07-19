import IndividualMapConstructor from "./individual_map_constructor";
import * as stream from "stream";
import * as fs from "fs";

test("Advent of the wurm", async (done) => {
  const c = new IndividualMapConstructor(
    await new Promise((resolve) => {
      fs.readFile("./mapfiles/defaultMaps.json", {}, (_err, data) => {
        resolve(data.toString());
      });
    })
  );
  const s = new stream.Readable();
  await c.attachStream(s);
  // eslint-disable-next-line max-len, quotes
  const card = `{"object":"card","id":"ba3b5e35-5448-4115-a9c5-6ac14013c904","oracle_id":"eb62aa4b-c11b-4195-ae85-cff8f78ce17b","multiverse_ids":[425972],"mtgo_id":63449,"mtgo_foil_id":63450,"tcgplayer_id":128828,"cardmarket_id":295999,"name":"Advent of the Wurm","lang":"en","released_at":"2017-03-17","uri":"https://api.scryfall.com/cards/ba3b5e35-5448-4115-a9c5-6ac14013c904","scryfall_uri":"https://scryfall.com/card/mm3/147/advent-of-the-wurm?utm_source=api","layout":"normal","highres_image":true,"image_status":"highres_scan","image_uris":{"small":"https://c1.scryfall.com/file/scryfall-cards/small/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.jpg?1593814046","normal":"https://c1.scryfall.com/file/scryfall-cards/normal/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.jpg?1593814046","large":"https://c1.scryfall.com/file/scryfall-cards/large/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.jpg?1593814046","png":"https://c1.scryfall.com/file/scryfall-cards/png/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.png?1593814046","art_crop":"https://c1.scryfall.com/file/scryfall-cards/art_crop/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.jpg?1593814046","border_crop":"https://c1.scryfall.com/file/scryfall-cards/border_crop/front/b/a/ba3b5e35-5448-4115-a9c5-6ac14013c904.jpg?1593814046"},"mana_cost":"{1}{G}{G}{W}","cmc":4.0,"type_line":"Instant","oracle_text":"Create a 5/5 green Wurm creature token with trample.","colors":["G","W"],"color_identity":["G","W"],"keywords":[],"all_parts":[{"object":"related_card","id":"ba3b5e35-5448-4115-a9c5-6ac14013c904","component":"combo_piece","name":"Advent of the Wurm","type_line":"Instant","uri":"https://api.scryfall.com/cards/ba3b5e35-5448-4115-a9c5-6ac14013c904"},{"object":"related_card","id":"3fd53493-ac85-4dd0-b1db-0ae0130ea2d4","component":"token","name":"Wurm","type_line":"Token Creature — Wurm","uri":"https://api.scryfall.com/cards/3fd53493-ac85-4dd0-b1db-0ae0130ea2d4"}],"legalities":{"standard":"not_legal","future":"not_legal","historic":"not_legal","gladiator":"not_legal","pioneer":"legal","modern":"legal","legacy":"legal","pauper":"not_legal","vintage":"legal","penny":"legal","commander":"legal","brawl":"not_legal","duel":"legal","oldschool":"not_legal","premodern":"not_legal"},"games":["paper","mtgo"],"reserved":false,"foil":true,"nonfoil":true,"oversized":false,"promo":false,"reprint":true,"variation":false,"set":"mm3","set_name":"Modern Masters 2017","set_type":"masters","set_uri":"https://api.scryfall.com/sets/02624962-f727-4c31-bbf2-a94fa6c5b653","set_search_uri":"https://api.scryfall.com/cards/search?order=set\u0026q=e%3Amm3\u0026unique=prints","scryfall_set_uri":"https://scryfall.com/sets/mm3?utm_source=api","rulings_uri":"https://api.scryfall.com/cards/ba3b5e35-5448-4115-a9c5-6ac14013c904/rulings","prints_search_uri":"https://api.scryfall.com/cards/search?order=released\u0026q=oracleid%3Aeb62aa4b-c11b-4195-ae85-cff8f78ce17b\u0026unique=prints","collector_number":"147","digital":false,"rarity":"rare","flavor_text":"The consciousness of Mat'Selesnya does not always spread in peaceful ways.","card_back_id":"0aeebaf5-8c7d-4636-9e82-8c27447861f7","artist":"Lucas Graciano","artist_ids":["ce98f39c-7cdd-47e6-a520-6c50443bb4c2"],"illustration_id":"fc06d465-4708-4c83-8473-9048a04d7d82","border_color":"black","frame":"2015","full_art":false,"textless":false,"booster":true,"story_spotlight":false,"edhrec_rank":4682,"prices":{"usd":"0.30","usd_foil":"0.40","eur":"0.29","eur_foil":null,"tix":"0.02"},"related_uris":{"gatherer":"https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=425972","tcgplayer_infinite_articles":"https://infinite.tcgplayer.com/search?contentMode=article\u0026game=magic\u0026partner=scryfall\u0026q=Advent+of+the+Wurm\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","tcgplayer_infinite_decks":"https://infinite.tcgplayer.com/search?contentMode=deck\u0026game=magic\u0026partner=scryfall\u0026q=Advent+of+the+Wurm\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","edhrec":"https://edhrec.com/route/?cc=Advent+of+the+Wurm","mtgtop8":"https://mtgtop8.com/search?MD_check=1\u0026SB_check=1\u0026cards=Advent+of+the+Wurm"},"purchase_uris":{"tcgplayer":"https://shop.tcgplayer.com/product/productsearch?id=128828\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","cardmarket":"https://www.cardmarket.com/en/Magic/Products/Search?referrer=scryfall\u0026searchString=Advent+of+the+Wurm\u0026utm_campaign=card_prices\u0026utm_medium=text\u0026utm_source=scryfall","cardhoarder":"https://www.cardhoarder.com/cards/63449?affiliate_id=scryfall\u0026ref=card-profile\u0026utm_campaign=affiliate\u0026utm_medium=card\u0026utm_source=scryfall"}}`;
  s.push(card);
  s.push(null);

  setTimeout(() => {
    let token_map_i = -1;
    for (let i = 0; i < c.mapTemplate!.data!.maps!.length; ++i) {
      if (c.mapTemplate!.data!.maps![i].name === "IDToTokenStrings") {
        token_map_i = i;
        break;
      }
    }
    expect(token_map_i).toBeGreaterThanOrEqual(0);
    if (token_map_i === -1) {
      done();
      return;
    }

    const token_map = c.mapTemplate!.mapData[token_map_i];
    expect(token_map["ba3b5e35-5448-4115-a9c5-6ac14013c904"]).toContain(
      "55greenwurmcreaturetrample"
    );
    done();
  }, 0);
});

test("Treasure map", async (done) => {
  const c = new IndividualMapConstructor(
    await new Promise((resolve) => {
      fs.readFile("./mapfiles/defaultMaps.json", {}, (_err, data) => {
        resolve(data.toString());
      });
    })
  );
  const s = new stream.Readable();
  await c.attachStream(s);
  // eslint-disable-next-line max-len, quotes
  const card = `{"object":"card","id":"1f6213d9-c65d-48da-a501-279db5f31d6a","oracle_id":"0b55eac6-a745-4bf4-8926-5ce83bc38d7d","multiverse_ids":[],"tcgplayer_id":151718,"cardmarket_id":313036,"name":"Treasure Map // Treasure Cove","lang":"en","released_at":"2017-11-24","uri":"https://api.scryfall.com/cards/1f6213d9-c65d-48da-a501-279db5f31d6a","scryfall_uri":"https://scryfall.com/card/pxtc/250/treasure-map-treasure-cove?utm_source=api","layout":"transform","highres_image":true,"image_status":"highres_scan","cmc":2.0,"type_line":"Artifact // Land","color_identity":[],"keywords":["Transform","Scry"],"produced_mana":["B","C","G","R","U","W"],"card_faces":[{"object":"card_face","name":"Treasure Map","mana_cost":"{2}","type_line":"Artifact","oracle_text":"{1}, {T}: Scry 1. Put a landmark counter on Treasure Map. Then if there are three or more landmark counters on it, remove those counters, transform Treasure Map, and create three Treasure tokens. (They're artifacts with \\"{T}, Sacrifice this artifact: Add one mana of any color.\\")","colors":[],"watermark":"set","artist":"Cliff Childs","artist_id":"ed6f7e03-20ba-4c73-bdda-4a4928480721","illustration_id":"f7970d54-58c3-40aa-ad1d-45e4536c9c73","image_uris":{"small":"https://c1.scryfall.com/file/scryfall-cards/small/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","normal":"https://c1.scryfall.com/file/scryfall-cards/normal/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","large":"https://c1.scryfall.com/file/scryfall-cards/large/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","png":"https://c1.scryfall.com/file/scryfall-cards/png/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.png?1562271919","art_crop":"https://c1.scryfall.com/file/scryfall-cards/art_crop/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","border_crop":"https://c1.scryfall.com/file/scryfall-cards/border_crop/front/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919"}},{"object":"card_face","name":"Treasure Cove","mana_cost":"","type_line":"Land","oracle_text":"(Transforms from Treasure Map.)\\n{T}: Add {C}.\\n{T}, Sacrifice a Treasure: Draw a card.","colors":[],"flavor_text":"Half the treasure is the glory of finding it.","artist":"Jared Blando","artist_id":"61b8414b-31e8-4c43-893d-7efe72293d3c","illustration_id":"f4242de5-45ee-401d-8e67-27e10492fb14","image_uris":{"small":"https://c1.scryfall.com/file/scryfall-cards/small/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","normal":"https://c1.scryfall.com/file/scryfall-cards/normal/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","large":"https://c1.scryfall.com/file/scryfall-cards/large/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","png":"https://c1.scryfall.com/file/scryfall-cards/png/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.png?1562271919","art_crop":"https://c1.scryfall.com/file/scryfall-cards/art_crop/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919","border_crop":"https://c1.scryfall.com/file/scryfall-cards/border_crop/back/1/f/1f6213d9-c65d-48da-a501-279db5f31d6a.jpg?1562271919"}}],"legalities":{"standard":"not_legal","future":"not_legal","historic":"legal","gladiator":"legal","pioneer":"legal","modern":"legal","legacy":"legal","pauper":"not_legal","vintage":"legal","penny":"not_legal","commander":"legal","brawl":"not_legal","duel":"legal","oldschool":"not_legal","premodern":"not_legal"},"games":["paper"],"reserved":false,"foil":true,"nonfoil":false,"oversized":false,"promo":true,"reprint":true,"variation":false,"set":"pxtc","set_name":"XLN Treasure Chest","set_type":"promo","set_uri":"https://api.scryfall.com/sets/2b5230c7-25a8-4521-9f6a-7e3cefb07213","set_search_uri":"https://api.scryfall.com/cards/search?order=set\u0026q=e%3Apxtc\u0026unique=prints","scryfall_set_uri":"https://scryfall.com/sets/pxtc?utm_source=api","rulings_uri":"https://api.scryfall.com/cards/1f6213d9-c65d-48da-a501-279db5f31d6a/rulings","prints_search_uri":"https://api.scryfall.com/cards/search?order=released\u0026q=oracleid%3A0b55eac6-a745-4bf4-8926-5ce83bc38d7d\u0026unique=prints","collector_number":"250","digital":false,"rarity":"rare","card_back_id":"0aeebaf5-8c7d-4636-9e82-8c27447861f7","artist":"Cliff Childs \u0026 Jared Blando","artist_ids":["ed6f7e03-20ba-4c73-bdda-4a4928480721","61b8414b-31e8-4c43-893d-7efe72293d3c"],"border_color":"black","frame":"2015","frame_effects":["compasslanddfc"],"full_art":false,"textless":false,"booster":false,"story_spotlight":false,"promo_types":["buyabox"],"edhrec_rank":1291,"prices":{"usd":null,"usd_foil":"23.42","eur":null,"eur_foil":"6.95","tix":null},"related_uris":{"tcgplayer_infinite_articles":"https://infinite.tcgplayer.com/search?contentMode=article\u0026game=magic\u0026partner=scryfall\u0026q=Treasure+Map+%2F%2F+Treasure+Cove\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","tcgplayer_infinite_decks":"https://infinite.tcgplayer.com/search?contentMode=deck\u0026game=magic\u0026partner=scryfall\u0026q=Treasure+Map+%2F%2F+Treasure+Cove\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","edhrec":"https://edhrec.com/route/?cc=Treasure+Map","mtgtop8":"https://mtgtop8.com/search?MD_check=1\u0026SB_check=1\u0026cards=Treasure+Map"},"purchase_uris":{"tcgplayer":"https://shop.tcgplayer.com/product/productsearch?id=151718\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","cardmarket":"https://www.cardmarket.com/en/Magic/Products/Search?referrer=scryfall\u0026searchString=Treasure+Map\u0026utm_campaign=card_prices\u0026utm_medium=text\u0026utm_source=scryfall","cardhoarder":"https://www.cardhoarder.com/cards?affiliate_id=scryfall\u0026data%5Bsearch%5D=Treasure+Map\u0026ref=card-profile\u0026utm_campaign=affiliate\u0026utm_medium=card\u0026utm_source=scryfall"}}`;
  s.push(card);
  s.push(null);

  setTimeout(() => {
    let token_map_i = -1;
    for (let i = 0; i < c.mapTemplate!.data!.maps!.length; ++i) {
      if (c.mapTemplate!.data!.maps![i].name === "IDToTokenStrings") {
        token_map_i = i;
        break;
      }
    }
    expect(token_map_i).toBeGreaterThanOrEqual(0);
    if (token_map_i === -1) {
      done();
      return;
    }

    const token_map = c.mapTemplate!.mapData[token_map_i];
    expect(token_map["1f6213d9-c65d-48da-a501-279db5f31d6a"]).toContain(
      "treasureartifact"
    );
    done();
  }, 0);
});
