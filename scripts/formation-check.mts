/**
 * Are the three formations actually different, and is any of them strictly
 * better? Identical squads, only the shape changes, thousands of matches.
 *   node --experimental-strip-types scripts/formation-check.mts
 */
import { simulateMatch, createRng } from '../src/engine/matchEngine.ts';
import type { TeamInput } from '../src/engine/matchEngine.ts';
import { makeSquad } from '../src/data/squadGen.ts';
import { FORMATIONS } from '../src/data/formations.ts';
import type { FormationId } from '../src/data/formations.ts';

const rng = createRng(4242);
const sq = makeSquad(60, rng);

const team = (id: string, f: FormationId, isHome: boolean): TeamInput => ({
  id, name: id, players: sq.starters.map(p => ({ ...p })),
  tactic: { formation: f, approach: 'balanced', press: 'mid' },
  chemistry: 0.7, isHome,
});

console.log('=== formations, identical squads, 4000 matches per pairing ===\n');
for (const a of FORMATIONS) {
  for (const b of FORMATIONS) {
    if (a.id >= b.id) continue;
    let w = 0, d = 0, l = 0, gf = 0, ga = 0;
    for (let i = 0; i < 4000; i++) {
      // alternate home so the home edge cancels out
      const swap = i % 2 === 1;
      const r = simulateMatch(team('A', swap ? b.id : a.id, true), team('B', swap ? a.id : b.id, false), i * 7919 + 13);
      const [ag, bg] = swap ? [r.score[1], r.score[0]] : [r.score[0], r.score[1]];
      gf += ag; ga += bg;
      if (ag > bg) w++; else if (ag === bg) d++; else l++;
    }
    const p = (v: number) => `${(v / 40).toFixed(1)}%`;
    console.log(`${a.id} vs ${b.id}   ${p(w)} / ${p(d)} / ${p(l)}   goals ${(gf / 4000).toFixed(2)} - ${(ga / 4000).toFixed(2)}`);
  }
}
