const {prices}=require('../assets/economy-sources/prices.json');
function npcPrice(item){
 if(!item)return null;
 const ref=prices[item.id];
 return ref && item.aegis && ref.aegis===item.aegis && Number.isFinite(ref.sell) ? ref.sell : null;
}
function npcBuyPrice(item){
 if(!item)return null;
 const ref=prices[item.id];
 return ref && item.aegis && ref.aegis===item.aegis && Number.isFinite(ref.buy) ? ref.buy : null;
}
module.exports={npcPrice,npcBuyPrice};
