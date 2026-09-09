/**
 * The summer window tells you whether you used it.
 *   node --experimental-strip-types scripts/summer-check.mts
 *
 * Two faults, one cause: pressing continue in the transfer window looked
 * exactly like pressing nothing. The market refreshed off screen, the round
 * number changed in a corner, and a manager could walk through all three summer
 * rounds without noticing he had skipped the only part of the year when the
 * squad can actually be changed.
 *
 * So: a round nobody touched asks once before it is spent, and every round
 * change gets a beat that says time moved. This holds up the first half, which
 * is the half with logic in it.
 */
import * as G from '../src/game/state.ts';
import { PRE_ROUNDS } from '../src/game/preseason.ts';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

function summer(seed = 4242): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'בדיקה', nickname: 'הכריש', type: 'hunter', age: 40 } as never);
  gs = G.pickCity(gs, 'רמת גן');
  return G.enterPreseason({ ...gs, phase: 'preseason-market' } as never);
}

/* 1. a fresh round reads as untouched */
{
  const gs = summer();
  checked += 2;
  if (!gs.summerMark) fails.push('the round opened without a mark, so nothing can be compared');
  if (!G.summerUntouched(gs)) fails.push('a round nobody has touched does not read as untouched');
}

/* 2. every kind of action counts, and the fingerprint is not fooled */
{
  /**
   * A career opens on exactly the minimum squad, so selling and releasing are
   * both legally blocked until somebody has been signed. That is the game
   * working, not a fault, so those two start from a squad with room in it.
   */
  const withRoom = (gs: G.GameState): G.GameState => {
    const fa = gs.market.find(f => !G.signBlockedReason(gs, f));
    return fa ? G.signPlayer(gs, fa.player.id) : gs;
  };
  const actions: [string, (gs: G.GameState) => G.GameState | null][] = [
    ['signing a free agent', gs => {
      const fa = gs.market.find(f => !G.signBlockedReason(gs, f));
      return fa ? G.signPlayer(gs, fa.player.id) : null;
    }],
    ['selling from the bench', gs => {
      const room = withRoom(gs);
      const p = G.mySquad(room).bench[0];
      return p && !G.sellBlockedReason(room) ? G.sellPlayer(room, p.id) : null;
    }],
    ['releasing a player', gs => {
      const room = withRoom(gs);
      const p = G.mySquad(room).bench[1];
      return p ? G.releasePlayer(room, p.id) : null;
    }],
  ];
  for (const [what, act] of actions) {
    const gs = summer();
    const after = act(gs);
    checked++;
    if (!after) { fails.push(`${what}: could not be performed, this guard needs a better fixture`); continue; }
    if (G.summerUntouched(after)) fails.push(`${what} left the round reading as untouched`);
  }
}

/* 3. each round is judged on its own: using round one does not excuse round two */
{
  let gs = summer();
  const fa = gs.market.find(f => !G.signBlockedReason(gs, f));
  if (fa) gs = G.signPlayer(gs, fa.player.id);
  checked++;
  if (G.summerUntouched(gs)) fails.push('a used round still read as untouched');
  gs = G.advancePreseason(gs);
  checked += 2;
  if (gs.preWeek !== 2) fails.push(`advancing left preWeek at ${gs.preWeek}`);
  if (!G.summerUntouched(gs)) fails.push('the new round inherited the previous one, so it never asks again');
}

/* 4. the mark survives a save and reload, or the question returns after a refresh */
{
  let gs = summer();
  const fa = gs.market.find(f => !G.signBlockedReason(gs, f));
  if (fa) gs = G.signPlayer(gs, fa.player.id);
  const roundTrip = JSON.parse(JSON.stringify(gs)) as G.GameState;
  checked++;
  if (G.summerUntouched(roundTrip)) {
    fails.push('after a save and reload a used round reads as untouched again');
  }
}

/* 5. the fingerprint moves only for things a manager did, not for the clock */
{
  const gs = summer();
  const same = { ...gs, week: gs.week + 5, seasonSeed: gs.seasonSeed + 1 };
  checked++;
  if (G.summerFingerprint(same) !== G.summerFingerprint(gs)) {
    fails.push('the fingerprint changed without the manager doing anything');
  }
}

/* 6. the screen actually uses it, and the beat is escapable. The behaviour was
      measured in the browser; these keep it from being quietly removed. */
{
  const pre = readFileSync('src/ui/screens/PreSeason.tsx', 'utf8');
  const turn = readFileSync('src/ui/components/RoundTurn.tsx', 'utf8');
  checked += 5;
  if (!pre.includes('G.summerUntouched(gs)')) fails.push('the summer screen never asks about an unused round');
  if (!pre.includes('<RoundTurn')) fails.push('there is no beat when the round changes');
  if (!pre.includes('onClick={tryAdvance}')) fails.push('continue skips the check');
  // never on the way into the season, where the decision has already been made
  if (!pre.includes('!lastRound && G.summerUntouched(gs)')) {
    fails.push('the question would also fire on the way into the season');
  }
  if (!turn.includes('onClick={finish}')) fails.push('the beat cannot be tapped away');
}

/* 7. the beat is short enough to sit through three times */
{
  const turn = readFileSync('src/ui/components/RoundTurn.tsx', 'utf8');
  const m = /const endAt = reduced \? \d+ : (\d+)/.exec(turn);
  checked += 2;
  if (!m) fails.push('cannot find how long the beat runs');
  else {
    const ms = Number(m[1]);
    if (ms > 1600) fails.push(`the beat runs ${ms}ms, long enough to become a toll gate`);
    if (ms < 600) fails.push(`the beat runs ${ms}ms, too short to read`);
    console.log(`  the calendar beat runs ${ms}ms, tappable, ${PRE_ROUNDS - 1} times a summer`);
  }
  checked++;
  if (!turn.includes('prefers-reduced-motion')) fails.push('the beat ignores reduced motion');
}

console.log(`${checked} checks`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, an unused round is asked about once and every round change is felt');
process.exit(fails.length ? 1 : 0);
