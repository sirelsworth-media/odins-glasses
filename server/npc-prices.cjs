const {prices}=require('../assets/economy-sources/prices.json');
function npcPrice(item){
 if(!item)return null;
 const ref=prices[item.id];
 return ref && item.aegis && ref.aegis===item.aegis ? ref.sell : null;
}
module.exports={npcPrice};
