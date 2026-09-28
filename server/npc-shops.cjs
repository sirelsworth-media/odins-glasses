const { shops } = require('../assets/economy-sources/shops.json');
const { prices } = require('../assets/economy-sources/prices.json');
const { npcBuyPrice } = require('./npc-prices.cjs');

function npcVendors(item) {
  if (!item?.aegis) return [];
  const priceReference = prices[item.id];
  if (!priceReference || priceReference.aegis !== item.aegis) return [];
  const defaultPrice = npcBuyPrice(item);
  return (shops[item.id] || []).map((vendor) => ({
    ...vendor,
    price: vendor.price ?? defaultPrice,
    navigation: `/navi ${vendor.map} ${vendor.x}/${vendor.y}`,
    source: 'rAthena reference',
    zero_verified: false,
  }));
}

module.exports = { npcVendors };
