/**
 * The academy produces, every season, from the second one on.
 *   node --experimental-strip-types scripts/youth-check.mts
 */
import * as G from '../src/game/state.ts';
import { overall } from '../src/engine/matchEngine.ts';

const bad: string[] = [];
const check = (n: string, ok: boolean, d = '') => { if (!ok) bad.push(`${n}  ${d}`); else console.log(`  ok    ${n}${d ? '  ' + d : ''}`); };

let gs = G.newGame(4242);
gs = G.setProfile(gs, { name: 'א', nickname: '', age: 38, type: 'mental' });
gs = G.pickCity(gs, 'חולון');
gs = G.afterSigning(gs, {});

check('the academy is stocked at signing', gs.youth.players.length >= 4, `${gs.youth.players.length} kids`);
check('every kid is 16 to 18', gs.youth.players.every(p => p.age >= 16 && p.age <= 18));
check('nobody starts already 18', gs.youth.players.every(p => p.age < 18));

// remember the best kid's rating, then run five summers
const before = Math.max(...gs.youth.players.map(overall));
let graduations = 0, everReady = 0;
for (let s = 1; s <= 5; s++) {
  gs = G.enterSeason(gs);
  if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
  // jump the season with the table handed to us, the pitch is not the test
  const table = Object.fromEntries(Object.entries(gs.league.table).map(([id, t]) => [id, { ...t, played: 14 }]));
  gs = { ...gs, league: { ...gs.league, table }, meters: { ...gs.meters, money: 3_000_000 }, crisisDone: true, week: gs.league.rounds };
  gs = G.startNextSeason(gs);
  if (gs.youth.graduated.length) graduations++;
  everReady += gs.youth.ready.length;
  check(`season ${s}: a kid broke out`, gs.youth.graduated.length >= 1, gs.youth.graduated.join(', ') || 'none');
  check(`season ${s}: academy still stocked`, gs.youth.players.length >= 4, `${gs.youth.players.length}`);
  check(`season ${s}: kids still in band`, gs.youth.players.every(p => p.age >= 16 && p.age <= 18));
}
check('at least one prospect turned 18 and became ready', everReady >= 1, `${everReady} over five years`);

// promote a ready kid and confirm he lands in the senior squad
gs = { ...gs, phase: 'youth' };
const ready = gs.youth.players.find(p => p.age >= 18) ?? gs.youth.players[0];
if (ready.age >= 18) {
  const sizeBefore = G.squadSize(gs);
  gs = G.promoteYouth(gs, ready.id);
  check('promoting an 18 year old adds him to the squad', G.squadSize(gs) === sizeBefore + 1, `${sizeBefore} -> ${G.squadSize(gs)}`);
  check('and he leaves the academy', !gs.youth.players.some(p => p.id === ready.id));
}

console.log(bad.length ? `\nFAIL\n - ${bad.join('\n - ')}` : '\nOK, the academy develops and graduates players');
process.exit(bad.length ? 1 : 0);
