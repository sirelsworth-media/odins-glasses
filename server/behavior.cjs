const data = require('../assets/rathena-behavior/behavior.json');
const labels = {
  CanMove: 'Can Move', Looter: 'Loots Items', Aggressive: 'Aggressive', Assist: 'Assists Allies',
  CastSensorIdle: 'Cast Sensor (Idle)', NoRandomWalk: 'No Random Walk', NoCast: 'Cannot Cast',
  CanAttack: 'Can Attack', CastSensorChase: 'Cast Sensor (Chase)', ChangeChase: 'Changes Chase Target',
  Angry: 'Enraged State', ChangeTargetMelee: 'Changes Target on Melee', ChangeTargetChase: 'Changes Target When Attacked',
  TargetWeak: 'Targets Weak Players', RandomTarget: 'Random Target',
};
function behaviorFor(raw) {
  const row = data.monsters[Number(raw.id)];
  // Require both identities. Never inherit behavior from a variant's base monster.
  if (!row || !raw.aegis || row.aegis.toUpperCase() !== raw.aegis.toUpperCase()) return { behavior_attributes: [], behavior_reference: null };
  return {
    behavior_attributes: Object.entries(row.flags).filter(([, active]) => active).map(([key]) => ({ status_en: labels[key] || key })),
    behavior_reference: { source: 'rAthena Renewal', revision: data.revision, ai: row.ai, verified_global: false },
  };
}
module.exports = { behaviorFor };
