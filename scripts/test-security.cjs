const assert = require("node:assert/strict");
const test = require("node:test");
const { trustedExternalUrl } = require("../server/external-links.cjs");

test("allows only explicitly trusted HTTPS destinations", () => {
  assert.equal(trustedExternalUrl("https://ragnadex.com/en/api/"), "https://ragnadex.com/en/api/");
  assert.equal(trustedExternalUrl("https://github.com/rathena/rathena"), "https://github.com/rathena/rathena");
});

test("rejects unsafe protocols, lookalike hosts and credentials", () => {
  assert.equal(trustedExternalUrl("http://ragnadex.com"), null);
  assert.equal(trustedExternalUrl("file:///C:/Windows/System32/calc.exe"), null);
  assert.equal(trustedExternalUrl("custom-protocol://launch"), null);
  assert.equal(trustedExternalUrl("https://ragnadex.com.attacker.example"), null);
  assert.equal(trustedExternalUrl("https://user:secret@ragnadex.com/path"), "https://ragnadex.com/path");
  assert.equal(trustedExternalUrl("not a url"), null);
});
