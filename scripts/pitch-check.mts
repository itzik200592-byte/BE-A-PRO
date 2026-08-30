/**
 * Drive the 2D pitch for a full match, headless, and report what actually
 * happened. The browser pane here does not composite, so requestAnimationFrame
 * never ticks and the pitch cannot be watched; this is how it gets checked.
 *
 *   node --experimental-strip-types scripts/pitch-check.mts
 *
 * What it looks for, all of it straight from what the game looked like on a
 * phone: twenty men camped around one penalty area, the keeper and a forward
 * passing it back and forth, every pass through the middle, and goals landing
 * with the ball on the halfway line.
 */

import { PitchSim } from '../src/game/pitchSim.ts';
import type { PitchSlot } from '../src/game/pitchSim.ts';
import { FORMATIONS, formation } from '../src/data/formations.ts';
import type { FormationId } from '../src/data/formations.ts';

/* deterministic rng so a regression is reproducible */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function build(hf: FormationId, af: FormationId): PitchSlot[] {
  const fh = formation(hf), fa = formation(af);
  return [
    ...fh.slots.map((_, i) => ({ id: `h${i}`, home: true, i, fm: fh })),
    ...fa.slots.map((_, i) => ({ id: `a${i}`, home: false, i, fm: fa })),
  ];
}

interface Report {
  thirds: [number, number, number];      // share of time the ball spent in each third
  boxTime: number;                       // share of time inside either penalty area
  longestBoxSpell: number;               // seconds the ball never left one box
  spread: number;                        // mean x range covered by all 22, 0..1
  emptyHalf: number;                     // share of time one half held under 4 players
  gkPingPong: number;                    // keeper -> mate -> same keeper sequences
  gkToGk: number;                        // balls kicked from one keeper toward the other
  wide: number;                          // share of passes received outside the middle third of the width
  goals: number;
  goalsAtMidfield: number;               // goals registered with the ball nowhere near a goal
  shots: number;
  shotsFromRange: number;                // shots taken from outside 35% of the pitch
  crowd: number;                         // mean count of players within 12% of the ball
  lineGapDM: number;                     // mean distance from the defensive line to the midfield line
  lineGapMF: number;                     // and from midfield to the front line
  lineOrder: number;                     // share of frames where def, mid, fwd are in the right order
  slotDrift: number;                     // mean distance a player sits from his own slot's lane
}

function run(hf: FormationId, af: FormationId, seed: number): Report {
  const sim = new PitchSim();
  sim.rnd = rng(seed);
  sim.setSlots(build(hf, af));

  const r = rng(seed ^ 0x9e3779b9);
  const DT = 1 / 60;
  const MINUTES = 90;
  const SECS = MINUTES * 3.0;            // the view runs a match in about 4.5 min of wall clock
  const steps = Math.round(SECS / DT);

  const thirds: [number, number, number] = [0, 0, 0];
  let boxTime = 0, spellStart = -1, longestSpell = 0;
  let spreadSum = 0, emptyHalf = 0, crowdSum = 0, frames = 0;
  let goals = 0, goalsAtMidfield = 0, shots = 0, shotsFromRange = 0;
  let gapDM = 0, gapMF = 0, ordered = 0, drift = 0, driftN = 0;
  let passes = 0, widePasses = 0, gkToGk = 0, pingPong = 0;

  // keeper ping pong: keeper A gives it away, and it comes straight back to him
  let lastGkKick: string | null = null;

  sim.trace = {
    onKick(from, to, tx) {
      if (from && /^[ha]0$/.test(from)) {
        lastGkKick = from;
        // a ball aimed at the far keeper's goal line is the bug we hunted
        const toFarGoal = from === 'h0' ? tx > 0.86 : tx < 0.14;
        if (toFarGoal) gkToGk++;
      } else if (from) {
        if (to && lastGkKick && to === lastGkKick) pingPong++;
        lastGkKick = null;
      }
      if (to) {
        passes++;
        const p = sim.pos.get(to);
        if (p && (p.y < 0.34 || p.y > 0.66)) widePasses++;
      }
    },
    onShot(x) { shots++; if (Math.abs(x - 0.5) < 0.15) shotsFromRange++; },
    onGoal(x) { goals++; if (x > 0.20 && x < 0.80) goalsAtMidfield++; },
  };

  let nextEvent = 20 + r() * 90;
  for (let n = 0; n < steps; n++) {
    const t = n * DT;
    // the live engine fires a chance or a goal every so often; the pitch has to
    // play each one out at the right end
    if (t > nextEvent) {
      nextEvent = t + 20 + r() * 90;
      sim.event(r() < 0.5, r() < 0.35);
    }
    const all = sim.step(DT, t, 0.5, false);
    frames++;

    const bx = sim.B.x;
    thirds[bx < 1 / 3 ? 0 : bx < 2 / 3 ? 1 : 2]++;
    const inBox = bx < 0.16 || bx > 0.84;
    if (inBox) {
      boxTime++;
      if (spellStart < 0) spellStart = t;
      longestSpell = Math.max(longestSpell, t - spellStart);
    } else spellStart = -1;

    let lo = 1, hi = 0, left = 0, right = 0, near = 0;
    for (const { p } of all) {
      lo = Math.min(lo, p.x); hi = Math.max(hi, p.x);
      if (p.x < 0.5) left++; else right++;
      if (Math.hypot(p.x - bx, p.y - sim.B.y) < 0.12) near++;
    }
    // does the shape still read as a shape? measured per side, in that side's
    // own attacking direction, so a back four is always "behind" its midfield
    for (const home of [true, false]) {
      const dir = home ? 1 : -1;
      const lines: Record<string, number[]> = { DEF: [], MID: [], FWD: [] };
      for (const { sl, p } of all) {
        if (sl.home !== home || sl.i === 0) continue;
        const ln = sl.fm.slots[sl.i].line;
        if (ln === 'GK') continue;
        lines[ln].push(p.x * dir);
        drift += Math.abs(p.y - sl.fm.slots[sl.i].y); driftN++;
      }
      const m = (xs: number[]) => xs.reduce((s2, x) => s2 + x, 0) / (xs.length || 1);
      const d = m(lines.DEF), mi = m(lines.MID), f = m(lines.FWD);
      gapDM += mi - d; gapMF += f - mi;
      if (d < mi && mi < f) ordered++;
    }
    spreadSum += hi - lo;
    if (left < 4 || right < 4) emptyHalf++;
    crowdSum += near;
  }

  return {
    thirds: [thirds[0] / frames, thirds[1] / frames, thirds[2] / frames],
    boxTime: boxTime / frames,
    longestBoxSpell: longestSpell,
    spread: spreadSum / frames,
    emptyHalf: emptyHalf / frames,
    gkPingPong: pingPong,
    gkToGk,
    wide: passes ? widePasses / passes : 0,
    goals, goalsAtMidfield, shots, shotsFromRange,
    crowd: crowdSum / frames,
    lineGapDM: gapDM / (frames * 2),
    lineGapMF: gapMF / (frames * 2),
    lineOrder: ordered / (frames * 2),
    slotDrift: drift / driftN,
  };
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

console.log('=== 2D pitch, 90 simulated minutes per run ===\n');
const combos: [FormationId, FormationId][] = [];
for (const a of FORMATIONS) for (const b of FORMATIONS) combos.push([a.id, b.id]);

const agg: Report[] = [];
for (const [hf, af] of combos) {
  for (let s = 1; s <= 4; s++) agg.push(run(hf, af, s * 7919 + hf.length * 31 + af.charCodeAt(0)));
}
const mean = (f: (r: Report) => number) => agg.reduce((s, r) => s + f(r), 0) / agg.length;
const sum = (f: (r: Report) => number) => agg.reduce((s, r) => s + f(r), 0);
const max = (f: (r: Report) => number) => Math.max(...agg.map(f));

console.log(`runs                        ${agg.length}`);
console.log(`ball, defensive third       ${pct(mean(r => r.thirds[0]))}`);
console.log(`ball, middle third          ${pct(mean(r => r.thirds[1]))}`);
console.log(`ball, attacking third       ${pct(mean(r => r.thirds[2]))}`);
console.log(`ball inside a penalty area  ${pct(mean(r => r.boxTime))}`);
console.log(`longest unbroken box spell  ${max(r => r.longestBoxSpell).toFixed(1)}s`);
console.log(`mean spread of the 22       ${pct(mean(r => r.spread))} of the pitch length`);
console.log(`a half left near empty      ${pct(mean(r => r.emptyHalf))} of the time`);
console.log(`players within 12% of ball  ${mean(r => r.crowd).toFixed(1)} of 22`);
console.log(`passes received out wide    ${pct(mean(r => r.wide))}`);
console.log(`keeper -> mate -> keeper    ${sum(r => r.gkPingPong)}`);
console.log(`keeper aimed at far goal    ${sum(r => r.gkToGk)}`);
console.log(`shots                       ${sum(r => r.shots)}, from range ${sum(r => r.shotsFromRange)}`);
console.log(`goals                       ${sum(r => r.goals)}, scored at midfield ${sum(r => r.goalsAtMidfield)}`);
console.log(`
shape held`);
console.log(`defence -> midfield gap     ${pct(mean(r => r.lineGapDM))} of the pitch`);
console.log(`midfield -> attack gap      ${pct(mean(r => r.lineGapMF))} of the pitch`);
console.log(`lines in the right order    ${pct(mean(r => r.lineOrder))} of frames`);
console.log(`mean drift off his lane     ${pct(mean(r => r.slotDrift))} of the width`);

const fails: string[] = [];
if (sum(r => r.goalsAtMidfield) > 0) fails.push('a goal registered away from a goal');
if (sum(r => r.gkToGk) > 0) fails.push('a keeper aimed at the other keeper');
if (sum(r => r.gkPingPong) > agg.length) fails.push('keeper and mate ping ponging the ball');
if (mean(r => r.thirds[1]) < 0.22) fails.push('play never crosses the middle third');
if (max(r => r.longestBoxSpell) > 30) fails.push('the ball camps in one box');
if (mean(r => r.spread) < 0.55) fails.push('the 22 are bunched into too little of the pitch');
if (mean(r => r.wide) < 0.30) fails.push('everything goes through the middle');
if (mean(r => r.lineOrder) < 0.90) fails.push('the lines cross over, the formation does not read');
if (mean(r => r.lineGapDM) < 0.09 || mean(r => r.lineGapMF) < 0.09) fails.push('the lines sit on top of each other');
if (mean(r => r.slotDrift) > 0.16) fails.push('players wander too far off their lane');

console.log(fails.length ? `\nFAIL\n - ${fails.join('\n - ')}` : '\nOK, all checks passed');
process.exit(fails.length ? 1 : 0);
