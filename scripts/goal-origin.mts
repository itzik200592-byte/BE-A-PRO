/**
 * Where do goals actually come from?
 *
 * Itzik's rule: a goal must never happen without the manager having made a
 * call. This drives whole matches with an auto-manager and counts every goal by
 * origin, so "no silent goals" is a number rather than an opinion, and so the
 * scoreline can be kept sane while the silent paths are closed.
 *
 *   node --experimental-strip-types scripts/goal-origin.mts
 */

import * as L from '../src/game/liveMatch.ts';
import type { LiveState, Corner } from '../src/game/liveMatch.ts';
import { makeSquad } from '../src/data/squadGen.ts';
import { createRng } from '../src/engine/matchEngine.ts';

const CORNERS: Corner[] = ['left', 'center', 'right'];

interface Tally {
  goals: number;
  mine: number;
  theirs: number;
  wins: number; draws: number; losses: number;
  fromDecision: number;
  silent: number;
  moments: number;
  byKind: Record<string, number>;
  goalsByKind: Record<string, number>;
}

function blank(): Tally {
  return { goals: 0, mine: 0, theirs: 0, wins: 0, draws: 0, losses: 0, fromDecision: 0, silent: 0, moments: 0, byKind: {}, goalsByKind: {} };
}

/**
 * Play one match to the whistle, answering every moment the way a manager
 * would: at random, since what is being measured is the plumbing and not the
 * quality of the calls.
 */
function playMatch(seed: number, t: Tally, myLvl = 58, oppLvl = 58) {
  const rng = createRng(seed);
  const mine = makeSquad(myLvl, rng);
  const theirs = makeSquad(oppLvl, rng);
  const st: LiveState = L.createLive({
    seed,
    homeId: 'me', homeName: 'שלי', awayId: 'them', awayName: 'שלהם',
    iAmHome: true,
    playerStarters: mine.starters, playerBench: mine.bench,
    playerTactic: { approach: 'balanced', press: 'mid' },
    oppStarters: theirs.starters, oppBench: theirs.bench,
    moraleBias: 0,
  });

  const pick = <T,>(xs: T[]) => xs[Math.floor(rng() * xs.length)];
  let before = 0;
  let guard = 0;

  while (st.phase !== 'done' && guard++ < 4000) {
    if (st.phase === 'halftime') { L.resumeFromHalfTime(st); continue; }

    if (st.phase === 'moment' && st.pending) {
      const m = st.pending;
      t.moments++;
      t.byKind[m.kind] = (t.byKind[m.kind] ?? 0) + 1;
      before = st.score[0] + st.score[1];

      switch (m.kind) {
        case 'penalty': L.resolvePenalty(st, pick(CORNERS)); break;
        case 'shot': L.resolveShot(st, pick(CORNERS)); break;
        case 'free_kick': L.resolveFreeKick(st, pick(CORNERS)); break;
        case 'one_on_one': L.resolveOneOnOne(st, pick(['dribble', 'finish'])); break;
        case 'def_keeper': L.resolveDefKeeper(st, pick(['rush', 'stay'])); break;
        case 'def_tackle': L.resolveDefTackle(st, pick(['slide', 'contain'])); break;
        case 'tactic': L.resolveTactic(st, m.options?.[0]?.id ?? ''); break;
      }
      const after = st.score[0] + st.score[1];
      if (after > before) {
        t.fromDecision += after - before;
        t.goalsByKind[m.kind] = (t.goalsByKind[m.kind] ?? 0) + (after - before);
      }
      // a resolved moment hands the clock back
      if (st.phase === 'moment') st.phase = 'play';
      continue;
    }

    const was = st.score[0] + st.score[1];
    L.step(st);
    const now = st.score[0] + st.score[1];
    // the score moved inside a plain minute: nobody was asked anything
    if (now > was) t.silent += now - was;
  }
  t.goals += st.score[0] + st.score[1];
  t.mine += st.score[0]; t.theirs += st.score[1];
  if (st.score[0] > st.score[1]) t.wins++; else if (st.score[0] === st.score[1]) t.draws++; else t.losses++;
}

const N = 400;
const t = blank();
for (let i = 1; i <= N; i++) playMatch(i * 7919 + 5, t);

const per = (v: number) => (v / N).toFixed(2);
console.log(`=== ${N} matches, every moment answered ===\n`);
console.log(`goals per match             ${per(t.goals)}`);
console.log(`  from a decision           ${per(t.fromDecision)}  (${((t.fromDecision / t.goals) * 100).toFixed(0)}%)`);
console.log(`  SILENT, nobody was asked  ${per(t.silent)}  (${((t.silent / t.goals) * 100).toFixed(0)}%)`);
console.log(`decisions per match         ${per(t.moments)}`);
console.log(`
scoreline, equal squads at home`);
console.log(`  you                       ${per(t.mine)}`);
console.log(`  them                      ${per(t.theirs)}`);
console.log(`  W/D/L                     ${(t.wins / N * 100).toFixed(0)}% / ${(t.draws / N * 100).toFixed(0)}% / ${(t.losses / N * 100).toFixed(0)}%`);
console.log('\nmoments per match, by kind');
for (const [k, v] of Object.entries(t.byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(12)} ${per(v)}   goals ${per(t.goalsByKind[k] ?? 0)}`);
}
// and does a better squad still win more? the model must stay honest
const strong = blank(), weak = blank();
for (let i = 1; i <= 300; i++) playMatch(i * 5171 + 3, strong, 66, 52);
for (let i = 1; i <= 300; i++) playMatch(i * 5171 + 3, weak, 52, 66);
console.log('\nstrength still decides');
console.log(`  66 vs 52 at home          ${(strong.wins / 300 * 100).toFixed(0)}% W, ${(strong.mine / 300).toFixed(2)} - ${(strong.theirs / 300).toFixed(2)}`);
console.log(`  52 vs 66 at home          ${(weak.wins / 300 * 100).toFixed(0)}% W, ${(weak.mine / 300).toFixed(2)} - ${(weak.theirs / 300).toFixed(2)}`);

console.log(t.silent === 0
  ? '\nOK, every goal came from a call the manager made'
  : `\nFAIL, ${t.silent} goals happened with nobody asked`);
process.exit(t.silent === 0 ? 0 : 1);
