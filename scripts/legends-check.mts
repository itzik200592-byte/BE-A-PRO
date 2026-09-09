/**
 * The ראש העין regulars.
 *   node --experimental-strip-types scripts/legends-check.mts
 *
 * Ten written characters who belong to one club and nowhere else. The rules
 * that make them work, and every one of them is easy to break by accident:
 * only ראש העין, exactly one at a time, never the manager himself, top of a
 * ליגה ג׳ dressing room, and he never asks to leave.
 */
import * as G from '../src/game/state.ts';
import {
  LEGENDS, LEGEND_TOWN, LEGEND_AGE, isLegend, legendByName, pickLegend,
  makeLegendPlayer, withLegend,
} from '../src/data/legends.ts';
import { overall, createRng } from '../src/engine/matchEngine.ts';
import { assignTraits } from '../src/data/personalities.ts';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

const career = (manager: string, town = LEGEND_TOWN, seed = 4242) => {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: manager, nickname: '', type: 'hunter', age: 40 } as never);
  return G.pickCity(gs, town);
};
const squadOf = (gs: G.GameState, clubId = gs.clubId) => {
  const sq = gs.league.squads[clubId];
  return [...sq.starters, ...sq.bench];
};

/* 1. the ten themselves: all thirty, all distinct, all top of a ליגה ג׳ squad */
{
  checked += 3;
  if (LEGENDS.length !== 10) fails.push(`there are ${LEGENDS.length} of them, not 10`);
  if (new Set(LEGENDS.map(l => l.name)).size !== LEGENDS.length) fails.push('two of them share a name');
  if (new Set(LEGENDS.map(l => l.key)).size !== LEGENDS.length) fails.push('two of them share a key');
  for (const l of LEGENDS) {
    const p = makeLegendPlayer(l, 'x');
    checked += 3;
    if (p.age !== LEGEND_AGE) fails.push(`${l.name} is ${p.age}, they are all ${LEGEND_AGE}`);
    if (!l.says.trim()) fails.push(`${l.name} has no reputation written`);
    const o = overall(p);
    if (o < 55 || o > 66) fails.push(`${l.name} rates ${o}, outside the band a ליגה ג׳ star sits in`);
  }
}

/* 2. ONLY the ראש העין club, whoever is managing it.
      They belong to the club, not to the player, so if ראש העין turns up in
      your division as an opponent it still fields one. What must never happen
      is one of them appearing in any OTHER club's dressing room. */
{
  let asOpponent = 0;
  for (const town of ['תל אביב', 'חיפה', 'באר שבע', 'פתח תקווה', 'נתניה', 'רמת גן']) {
    const gs = career('בדיקה', town);
    for (const c of gs.league.clubs) {
      const mine = squadOf(gs, c.id).filter(isLegend);
      checked++;
      if (c.city === LEGEND_TOWN) {
        if (mine.length !== 1) fails.push(`${town}: ${c.short} is a ${LEGEND_TOWN} club with ${mine.length} regulars`);
        else asOpponent++;
      } else if (mine.length) {
        fails.push(`${town}: ${c.short} (${c.city}) has ${mine[0].name}, who only plays for ${LEGEND_TOWN}`);
      }
    }
  }
  console.log(`  seen ${asOpponent} times as an opponent's club, and in no other town's squad`);
}

/* 3. ראש העין always has exactly one, never two */
{
  let found = 0;
  for (let seed = 0; seed < 25; seed++) {
    const gs = career('בדיקה', LEGEND_TOWN, 1000 + seed * 7);
    const mine = squadOf(gs).filter(isLegend);
    checked++;
    if (mine.length !== 1) fails.push(`seed ${seed}: ${mine.length} regulars in the squad, wanted exactly 1`);
    else found++;
  }
  console.log(`  ${found} of 25 careers in ${LEGEND_TOWN} opened with exactly one of them`);
}

/* 4. THE RULE: a manager is never handed himself */
{
  for (const l of LEGENDS) {
    let sawHimself = 0, careers = 0;
    for (let seed = 0; seed < 30; seed++) {
      const gs = career(l.name, LEGEND_TOWN, 2000 + seed * 13);
      careers++;
      if (squadOf(gs).some(p => p.name === l.name)) sawHimself++;
    }
    checked++;
    if (sawHimself > 0) fails.push(`${l.name} managed and was handed himself in ${sawHimself} of ${careers} careers`);
  }
  // and he can still be given any of the other nine
  const seen = new Set<string>();
  for (let seed = 0; seed < 60; seed++) {
    const gs = career('איציק עוזיאל', LEGEND_TOWN, 3000 + seed * 11);
    for (const p of squadOf(gs)) if (isLegend(p)) seen.add(p.name);
  }
  checked++;
  if (seen.size < 5) fails.push(`managing as himself, only ${seen.size} different team mates ever turned up`);
  if (seen.has('איציק עוזיאל')) fails.push('he was handed himself after all');
  console.log(`  managing as איציק עוזיאל: ${seen.size} of the other 9 seen, himself never`);
}

/* 5. the draw is not stuck on one name */
{
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const l = pickLegend(createRng(9000 + i * 3));
    if (l) seen.add(l.name);
  }
  checked++;
  if (seen.size !== LEGENDS.length) fails.push(`only ${seen.size} of the ${LEGENDS.length} are ever drawn`);
}

/* 6. he stays. A squad that already has one is handed straight back. */
{
  const gs = career('בדיקה');
  const before = squadOf(gs).filter(isLegend)[0];
  const again = withLegend(gs.league.squads[gs.clubId], LEGEND_TOWN, 'בדיקה', createRng(77), () => 'p-new');
  const after = [...again.starters, ...again.bench].filter(isLegend);
  checked += 2;
  if (after.length !== 1) fails.push(`re-applying gave ${after.length} regulars`);
  if (after[0]?.name !== before?.name) fails.push('the regular was swapped for a different one instead of staying');
}

/* 7. the squad stays a legal size, and he is not conjured out of thin air */
{
  const plain = career('בדיקה', 'תל אביב');
  const roshHaayin = career('בדיקה', LEGEND_TOWN);
  checked++;
  if (squadOf(roshHaayin).length !== squadOf(plain).length) {
    fails.push(`the squad is ${squadOf(roshHaayin).length} men against ${squadOf(plain).length} elsewhere`);
  }
}

/* 8. he never asks to leave, and his own reputation is what the squad repeats */
{
  const gs = career('בדיקה');
  const him = squadOf(gs).find(isLegend)!;
  const traits = assignTraits(squadOf(gs));
  const his = traits.get(him.id) ?? [];
  checked += 3;
  if (his.length !== 1) fails.push(`${him.name} has ${his.length} traits, he should have exactly his own`);
  const said = his[0]?.line(him.name, (a) => a[0]);
  if (said !== legendByName(him.name)?.says) fails.push(`${him.name} is described by the general pool, not his own line`);
  if (his[0]?.label !== legendByName(him.name)?.label) fails.push(`${him.name} wears the wrong chip`);

  // the dilemma system must never pick him as the man making demands
  const src = readFileSync('src/game/state.ts', 'utf8');
  const ctx = src.slice(src.indexOf('function dilemmaCtx'), src.indexOf('function dilemmaCtx') + 1200);
  checked += 2;
  if (!ctx.includes('.filter(p => !isLegend(p))')) {
    fails.push('a regular can be picked as the player demanding a move or sulking');
  }
  if (!ctx.includes('const forgotten') || !/forgotten[\s\S]{0,120}isLegend/.test(ctx)) {
    fails.push('a regular can be picked as the forgotten man');
  }
}

/* 9. A CAREER ALREADY UNDER WAY gets one at the next season opening.
      This is the one that was missed and the one Itzik hit: he opened a season
      in ראש העין and nobody turned up, because his squad was built before any
      of this existed and a legend was only ever put in when a career BEGINS or
      when a season rolls over. The season opening is the boundary every career
      crosses, so that is where it has to happen too. */
{
  const strip = (gs: G.GameState): G.GameState => {
    const sq = G.mySquad(gs);
    return {
      ...gs,
      league: {
        ...gs.league,
        squads: {
          ...gs.league.squads,
          [gs.clubId]: {
            starters: sq.starters.filter(p => !isLegend(p)),
            bench: sq.bench.filter(p => !isLegend(p)),
          },
        },
      },
    };
  };

  let gs = career('בדיקה');
  gs = G.afterSigning(gs, {});
  gs = strip(gs);                       // a save from before the feature
  const sizeBefore = G.squadSize(gs);
  checked++;
  if (squadOf(gs).some(isLegend)) fails.push('the fixture failed to strip him');

  gs = G.enterSeason(gs);
  const now = squadOf(gs).filter(isLegend);
  checked += 2;
  if (now.length !== 1) {
    fails.push(`a career already under way opened a season with ${now.length} regulars, it has to be 1`);
  }
  // and he joins rather than displacing somebody the manager chose and paid for
  if (G.squadSize(gs) !== sizeBefore + 1) {
    fails.push(`he arrived by deleting a player: squad went ${sizeBefore} to ${G.squadSize(gs)}`);
  }
  console.log(`  a career already under way: ${now[0]?.name} joined at the season opening, squad ${sizeBefore} to ${G.squadSize(gs)}`);
}

/* 10. a fresh career is still the same size as everybody else's */
{
  const mine = career('בדיקה', LEGEND_TOWN);
  const other = career('בדיקה', 'תל אביב');
  checked++;
  if (squadOf(mine).length !== squadOf(other).length) {
    fails.push(`a new ${LEGEND_TOWN} career starts with ${squadOf(mine).length} men against ${squadOf(other).length}`);
  }
}

console.log(`\n${checked} checks`);
console.log(`${LEGENDS.length} regulars, ${Math.min(...LEGENDS.map(l => overall(makeLegendPlayer(l, 'x'))))} to ${Math.max(...LEGENDS.map(l => overall(makeLegendPlayer(l, 'x'))))} OVR, all aged ${LEGEND_AGE}`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : `\nOK, one of them at ${LEGEND_TOWN} and nowhere else, and never yourself`);
process.exit(fails.length ? 1 : 0);
