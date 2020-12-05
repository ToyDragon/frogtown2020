import checkForCard, { Range } from "./check_for_card";

test("Parses simple card.", () => {
    const rawCard = `{"object":"card",images: {}}`;
    expect(checkForCard(rawCard)).toEqual<Range>({
        start: 0,
        end: rawCard.length - 1,
    });
});

test("Identifies missing close bracket.", () => {
    const rawCard = `{"object":"card",images: {}`;
    expect(checkForCard(rawCard)).toBe(null);
});

test("Preceding close bracket.", () => {
    const rawCard = `}{"object":"card",images: {}}`;
    expect(checkForCard(rawCard)).toEqual<Range>({
        start: 1,
        end: rawCard.length - 1,
    });
});

/*
test("idk", () => {
    const rawCard = `om/file/scryfall-cards/normal/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg?1562894979","large":"https://c1.scryfall.com/file/scryfall-cards/large/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg?1562894979","png":"https://c1.scryfall.com/file/scryfall-cards/png/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.png?1562894979","art_crop":"https://c1.scryfall.com/file/scryfall-cards/art_crop/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg?1562894979","border_crop":"https://c1.scryfall.com/file/scryfall-cards/border_crop/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg?1562894979"},"mana_cost":"{5}{R}","cmc":6.0,"type_line":"Creature — Sliver","oracle_text":"All Sliver creatures have double strike.","power":"3","toughness":"3","colors":["R"],"color_identity":["R"],"keywords":[],"legalities":{"standard":"not_legal","future":"not_legal","historic":"not_legal","pioneer":"not_legal","modern":"legal","legacy":"legal","pauper":"not_legal","vintage":"legal","penny":"not_legal","commander":"legal","brawl":"not_legal","duel":"legal","oldschool":"not_legal"},"games":["paper","mtgo"],"reserved":false,"foil":true,"nonfoil":true,"oversized":false,"promo":false,"reprint":false,"variation":false,"set":"tsp","set_name":"Time Spiral","set_type":"expansion","set_uri":"https://api.scryfall.com/sets/c1d109bc-ffd8-428f-8d7d-3f8d7e648046","set_search_uri":"https://api.scryfall.com/cards/search?order=set\u0026q=e%3Atsp\u0026unique=prints","scryfall_set_uri":"https://scryfall.com/sets/tsp?utm_source=api","rulings_uri":"https://api.scryfall.com/cards/0000579f-7b35-4ed3-b44c-db2a538066fe/rulings","prints_search_uri":"https://api.scryfall.com/cards/search?order=released\u0026q=oracleid%3A44623693-51d6-49ad-8cd7-140505caf02f\u0026unique=prints","collector_number":"157","digital":false,"rarity":"uncommon","flavor_text":"\"A rift opened, and our arrows were abruptly stilled. To move was to push the world. But the sliver's claw still twitched, red wounds appeared in Thed's chest, and ribbons of blood hung in the air.\"\n—Adom Capashen, Benalish hero","card_back_id":"0aeebaf5-8c7d-4636-9e82-8c27447861f7","artist":"Paolo Parente","artist_ids":["d48dd097-720d-476a-8722-6a02854ae28b"],"illustration_id":"2fcca987-364c-4738-a75b-099d8a26d614","border_color":"black","frame":"2003","full_art":false,"textless":false,"booster":true,"story_spotlight":false,"edhrec_rank":4813,"prices":{"usd":"0.98","usd_foil":"2.00","eur":"0.21","eur_foil":"0.88","tix":"0.02"},"related_uris":{"gatherer":"https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=109722","tcgplayer_decks":"https://decks.tcgplayer.com/magic/deck/search?contains=Fury+Sliver\u0026page=1\u0026utm_campaign=affiliate\u0026utm_medium=api\u0026utm_source=scryfall","edhrec":"https://edhrec.com/route/?cc=Fury+Sliver","mtgtop8":"https://mtgtop8.com/search?MD_check=1\u0026SB_check=1\u0026cards=Fury+Sliver"}},
  {"object":"card","id":"00006596-1166-4a79-8443-ca9f82e6db4e","oracle_id":"8ae3562f-28b7-4462-96ed-be0cf7052ccc","multiverse_ids":[189637],"mtgo_id":34586,"mtgo_foil_id":34587,"tcgplayer_id":33`;
  expect(checkForCard(rawCard)).toEqual<Range>({
      start: 609,
      end: 611
  });
});
*/