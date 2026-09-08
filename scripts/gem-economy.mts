/**
 * What a career actually earns in gems, and what that buys.
 *   node --experimental-strip-types scripts/gem-economy.mts
 *
 * Referrals opened a new tap, so the sinks have to be priced against measured
 * income rather than a guess. This plays real careers, counts every gem that
 * comes in, and reports how many packs of each kind a manager can afford, for
 * somebody who invites nobody and for somebody who invites friends.
 */
import * as G from '../src/game/state.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { PACKS, GEMS_PER_AD, ADS_PER_SEASON, GEMS_ON_PROMOTION, GEMS_AT_START } from '../src/game/packs.ts';
import { GEMS_PER_FRIEND, FRIENDS_PER_SEASON, FRIENDS_LIFETIME } from '../src/game/invite.ts';

const SEASONS = 8;

function play(gs: G.GameState, seed: number): G.GameState {
  const inp = G.liveMatchInput(gs);
  const res = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
    inp.seed + seed);
  gs = G.continueFromResult(G.commitRound(gs, res));
  while (gs.phase === 'press') gs = G.answerPress(gs, 0);
  if (gs.phase === 'chat') gs = G.closeChat(gs);
  return gs;
}

const SEEDS = [4242, 777, 31, 9091, 555, 12007, 88, 4004];

let promotions = 0, seasonsPlayed = 0, sacked = 0;

for (const seed of SEEDS) {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'א', nickname: '', age: 38, type: 'mental' });
  gs = G.pickClub(gs, gs.league.clubs[0].id);
  gs = G.afterSigning(gs, {});

  for (let s = 1; s <= SEASONS; s++) {
    gs = G.enterSeason(gs);
    if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
    const tierBefore = G.club(gs).tier;
    for (let w = 1; w <= gs.league.rounds; w++) {
      gs = play(gs, 0);
      if (gs.sacking || gs.phase === 'season-end') break;
    }
    seasonsPlayed++;
    if (gs.sacking) { sacked++; break; }
    gs = G.startNextSeason(gs);
    if (G.club(gs).tier > tierBefore) promotions++;
  }
}

const promoRate = seasonsPlayed ? promotions / seasonsPlayed : 0;
const perSeason = GEMS_PER_AD * ADS_PER_SEASON + GEMS_ON_PROMOTION * promoRate;

console.log(`${SEEDS.length} careers, ${seasonsPlayed} seasons played, ${sacked} sacked, promoted in ${(promoRate * 100).toFixed(0)}% of seasons\n`);

const rows: [string, number][] = [
  ['invites nobody', perSeason],
  ['invites 3 friends, once', perSeason + (GEMS_PER_FRIEND * 3) / SEASONS],
  // the lifetime cap is the real bound: a whole career of inviting, averaged
  [`brings all ${FRIENDS_LIFETIME}, over a career`, perSeason + (GEMS_PER_FRIEND * FRIENDS_LIFETIME) / SEASONS],
  // and the most that can land in any single season
  [`the busiest single season (${FRIENDS_PER_SEASON})`, perSeason + GEMS_PER_FRIEND * FRIENDS_PER_SEASON],
];

console.log('gems a season, and seasons of saving per pack');
const head = PACKS.map(p => `${p.name.replace('חבילת ', '')} ${p.cost}`.padStart(12)).join('');
console.log('  ' + 'manager'.padEnd(26) + 'gems/season' + head);
for (const [who, gems] of rows) {
  const cells = PACKS.map(p => (gems > 0 ? (p.cost / gems).toFixed(1) + ' עונות' : '-').padStart(12)).join('');
  console.log('  ' + who.padEnd(26) + gems.toFixed(1).padStart(11) + cells);
}

console.log(`\nstart of career: ${GEMS_AT_START} gems, cheapest pack ${Math.min(...PACKS.map(p => p.cost))}`);
console.log(`a full career of ${SEASONS} seasons, inviting nobody: about ${Math.round(perSeason * SEASONS + GEMS_AT_START)} gems`);
