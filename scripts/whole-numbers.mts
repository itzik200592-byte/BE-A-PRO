/**
 * Nothing the manager reads is allowed to be a fraction.
 *
 * Morale printed itself as 76.36000000000001 on Itzik's phone, because the
 * coach's motivation is worth a fraction of a point per match and the meter
 * simply accumulated it. Rounding where it is DRAWN would have hidden the same
 * bug everywhere else it is stored, so this walks whole seasons round by round
 * and checks every number that reaches the screen.
 *
 * It drives the loop by hand rather than calling demoSeason, for two reasons:
 * the meter has to be audited after EVERY round rather than at the whistle, and
 * the coach needs attributes that actually produce a fractional bias. Audited
 * only at the end, with a winning side pinned to 100 morale, the ceiling hides
 * the fraction and the check passes while the bug is live.
 *
 *   node --experimental-strip-types scripts/whole-numbers.mts
 */

import * as G from '../src/game/state.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';

const bad: string[] = [];

function whole(where: string, name: string, v: unknown) {
  if (typeof v !== 'number') return;
  if (!Number.isFinite(v)) { bad.push(`${where}.${name} is ${v}`); return; }
  if (!Number.isInteger(v)) bad.push(`${where}.${name} = ${v}`);
}

function audit(gs: G.GameState, where: string) {
  whole(where, 'meters.money', gs.meters.money);
  whole(where, 'meters.morale', gs.meters.morale);
  whole(where, 'meters.prestige', gs.meters.prestige);
  whole(where, 'gems', gs.gems);
  whole(where, 'stadium.capacity', gs.stadium.capacity);
  const l = gs.lastLedger as unknown as Record<string, number> | null;
  if (l) for (const k of ['prize', 'gate', 'net', 'total', 'wages', 'pitch', 'security']) whole(`${where}.ledger`, k, l[k]);
  for (const st of Object.values(gs.league.table)) {
    whole(`${where}.table`, 'pts', st.pts);
    whole(`${where}.table`, 'gf', st.gf);
    whole(`${where}.table`, 'ga', st.ga);
  }
}

/** A season, audited every round, under a coach whose bias is not a whole number. */
function season(gs: G.GameState, label: string): G.GameState {
  gs = G.enterSeason(gs);
  audit(gs, `${label} kickoff`);
  for (let w = 1; w <= gs.league.rounds; w++) {
    const inp = G.liveMatchInput(gs);
    const res = simulateMatch(
      { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
      { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
      inp.seed);
    gs = G.commitRound(gs, res);
    audit(gs, `${label} round ${w}`);
    gs = G.continueFromResult(gs);
    if (gs.phase === 'press') gs = G.answerPress(gs, w % 3);
    if (gs.phase === 'chat') gs = G.closeChat(gs);
    audit(gs, `${label} round ${w} after the press`);
    if (gs.phase === 'season-end') break;
  }
  return gs;
}

let gs = G.newGame(4242);
gs = G.setProfile(gs, { name: 'איציק', nickname: '', age: 38, type: 'mental' });
gs = G.pickClub(gs, gs.league.clubs[0].id);
gs = G.afterSigning(gs, {});
// a coach whose motivation is worth a fraction of a point a match, which is
// exactly what put 76.36000000000001 on the screen
gs = { ...gs, coach: { ...gs.coach, attrs: { ...gs.coach.attrs, motivation: 11, determination: 7 } } };

let rounds = 0;
for (let s = 1; s <= 4; s++) {
  gs = season(gs, `season ${s}`);
  rounds += gs.league.rounds;
  gs = G.startNextSeason(gs);
  audit(gs, `season ${s + 1} start`);
}

console.log(`${rounds} rounds audited, four seasons`);
console.log(`final meters   money ${gs.meters.money}  morale ${gs.meters.morale}  prestige ${gs.meters.prestige}`);
console.log(bad.length
  ? `\nFAIL, fractions reached the screen (${bad.length}):\n - ${bad.slice(0, 10).join('\n - ')}`
  : '\nOK, every number the manager reads is whole');
process.exit(bad.length ? 1 : 0);
