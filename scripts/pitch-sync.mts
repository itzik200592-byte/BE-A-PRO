/**
 * The contract the broadcast depends on: hand the pitch a move, and it always
 * reports back, with the ball where the commentary says it is.
 */
import { PitchSim } from '../src/game/pitchSim.ts';
import type { PitchSlot } from '../src/game/pitchSim.ts';
import { formation } from '../src/data/formations.ts';
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const fh = formation('4-4-2'), fa = formation('4-3-3');
const slots: PitchSlot[] = [
  ...fh.slots.map((_, i) => ({ id: `h${i}`, home: true, i, fm: fh })),
  ...fa.slots.map((_, i) => ({ id: `a${i}`, home: false, i, fm: fa })),
];
let never = 0, wrongEnd = 0, notInGoal = 0, n = 0;
const lat: number[] = [];
for (let seed = 1; seed <= 400; seed++) {
  const sim = new PitchSim(); sim.rnd = rng(seed * 7919); sim.setSlots(slots);
  const r = rng(seed * 31);
  const home = r() < 0.5, scored = r() < 0.5;
  let fired = -1, got = -1, ballX = -1;
  sim.onPlayed = () => { got = ballX; };
  let accepted = false;
  for (let k = 0; k < 60 * 60; k++) {
    const t = k / 60;
    if (fired < 0 && t > 6 + r() * 6) { fired = t; }
    if (fired >= 0 && !accepted) accepted = sim.event(home, scored);
    sim.step(1 / 60, t, 0.5, false);
    ballX = sim.B.x;
    if (got >= 0) { lat.push(t - fired); break; }
  }
  n++;
  if (got < 0) { never++; continue; }
  const goal = PitchSim.goalOf(home);
  if (Math.abs(got - goal) > 0.5) wrongEnd++;
  // a goal must be reported with the ball actually in the goal
  if (scored && Math.abs(got - goal) > 0.06) notInGoal++;
}
lat.sort((a, b) => a - b);
const mean = lat.reduce((s, x) => s + x, 0) / (lat.length || 1);
console.log(`moves handed to the pitch     ${n}`);
console.log(`never reported back           ${never}`);
console.log(`reported at the wrong end     ${wrongEnd}`);
console.log(`"goal" with the ball not in   ${notInGoal}`);
console.log(`caption held for              mean ${mean.toFixed(2)}s, median ${lat[Math.floor(lat.length / 2)].toFixed(2)}s, worst ${lat[lat.length - 1].toFixed(2)}s`);
const bad = never + wrongEnd + notInGoal;
console.log(bad ? '\nFAIL' : '\nOK, the pitch always reports back with the ball where it says');
process.exit(bad ? 1 : 0);
