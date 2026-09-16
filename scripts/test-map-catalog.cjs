const assert = require("node:assert/strict");
const test = require("node:test");
const { KNOWN_UNRATED_MAPS, unratedMaps } = require("../server/known-zero-maps.cjs");

test("Nordfeld client maps remain visible until the open database catches up", () => {
  assert.deepEqual(KNOWN_UNRATED_MAPS.map((map) => map.map_code), ["nrd_fild01", "nrd_fild02", "nrd_dun01", "nrd_dun02"]);
  assert.equal(unratedMaps().length, 4);
  assert.deepEqual(unratedMaps(["nrd_fild01"]).map((map) => map.map_code), ["nrd_fild02", "nrd_dun01", "nrd_dun02"]);
});
