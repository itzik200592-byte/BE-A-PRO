/**
 * Draw the pitch. Same simulation the game runs, sampled every few seconds and
 * written out as one SVG so the shape can actually be looked at instead of
 * argued about.
 *
 *   node --experimental-strip-types scripts/pitch-snap.mts out.svg
 */

import fs from 'node:fs';
import { PitchSim } from '../src/game/pitchSim.ts';
import type { PitchSlot } from '../src/game/pitchSim.ts';
import { formation } from '../src/data/formations.ts';
import type { FormationId } from '../src/data/formations.ts';

const HOME: FormationId = (process.argv[3] as FormationId) || '4-4-2';
const AWAY: FormationId = (process.argv[4] as FormationId) || '4-3-3';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const fh = formation(HOME), fa = formation(AWAY);
const slots: PitchSlot[] = [
  ...fh.slots.map((_, i) => ({ id: `h${i}`, home: true, i, fm: fh })),
  ...fa.slots.map((_, i) => ({ id: `a${i}`, home: false, i, fm: fa })),
];

const sim = new PitchSim();
sim.rnd = rng(20260830);
sim.setSlots(slots);

const DT = 1 / 60;
const SHOTS_AT = [6, 18, 32, 48, 64, 82];    // seconds into the run
const frames: { t: number; men: { x: number; y: number; home: boolean; gk: boolean }[]; b: { x: number; y: number } }[] = [];

const ev = rng(99);
let nextEvent = 25;
let want = 0;
for (let n = 0; n * DT < SHOTS_AT[SHOTS_AT.length - 1] + 1; n++) {
  const t = n * DT;
  if (t > nextEvent) { nextEvent = t + 25 + ev() * 40; sim.event(ev() < 0.5, ev() < 0.4); }
  const all = sim.step(DT, t, 0.5, false);
  if (want < SHOTS_AT.length && t >= SHOTS_AT[want]) {
    want++;
    frames.push({
      t,
      men: all.map(a => ({ x: a.p.x, y: a.p.y, home: a.sl.home, gk: a.sl.i === 0 })),
      b: { x: sim.B.x, y: sim.B.y },
    });
  }
}

const W = 300, H = 186, GAP = 14, COLS = 2;
const rows = Math.ceil(frames.length / COLS);
const svgW = COLS * W + (COLS + 1) * GAP;
const svgH = rows * (H + 22) + (rows + 1) * GAP;

const cell = (f: typeof frames[0], ox: number, oy: number) => `
  <g transform="translate(${ox},${oy})">
    <rect width="${W}" height="${H}" rx="6" fill="#1b6e3c"/>
    <g fill="none" stroke="rgba(255,255,255,.30)" stroke-width="1.2">
      <rect x="6" y="6" width="${W - 12}" height="${H - 12}"/>
      <line x1="${W / 2}" y1="6" x2="${W / 2}" y2="${H - 6}"/>
      <circle cx="${W / 2}" cy="${H / 2}" r="${H * 0.14}"/>
      <rect x="6" y="${H * 0.23}" width="${W * 0.13}" height="${H * 0.54}"/>
      <rect x="${W - 6 - W * 0.13}" y="${H * 0.23}" width="${W * 0.13}" height="${H * 0.54}"/>
    </g>
    ${f.men.map(m => `<circle cx="${(m.x * W).toFixed(1)}" cy="${(m.y * H).toFixed(1)}" r="${m.gk ? 4 : 5}" fill="${m.home ? '#3b82f6' : '#ef4444'}" stroke="rgba(0,0,0,.5)" stroke-width="1.2"/>`).join('')}
    <circle cx="${(f.b.x * W).toFixed(1)}" cy="${(f.b.y * H).toFixed(1)}" r="4" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="4" y="${H + 15}" fill="#cbd5e1" font-family="monospace" font-size="12">t=${f.t.toFixed(0)}s   ball x=${(f.b.x * 100).toFixed(0)}%</text>
  </g>`;

const body = frames.map((f, i) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  return cell(f, GAP + c * (W + GAP), GAP + r * (H + 22 + GAP));
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
<rect width="${svgW}" height="${svgH}" fill="#0b0f0c"/>
<text x="${GAP}" y="${GAP - 3}" fill="#e9b949" font-family="monospace" font-size="11">home ${HOME} (blue, attacks right)   ·   away ${AWAY} (red, attacks left)</text>
${body}
</svg>`;

const out = process.argv[2] || 'pitch.svg';
fs.writeFileSync(out, svg);
console.log('wrote', out, `(${frames.length} frames)`);
