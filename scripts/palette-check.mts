/**
 * The fourteen kit colours: every club wears one, no two look the same in the
 * picker, and any two that would clash on the pitch get resolved by a change
 * strip. Near colours in the palette are fine and expected; that is what the
 * away kit is for. What is not fine is two swatches a manager cannot tell apart.
 *   node --experimental-strip-types scripts/palette-check.mts
 */
import { KIT_COLORS, nearestKitColor } from '../src/data/palette.ts';
import { CITIES, clubFromCity } from '../src/data/cities.ts';
import { matchKits, clash } from '../src/data/kits.ts';

const fails: string[] = [];

// 1. the picker: no two swatches are near-identical
const SWATCH_MIN = 40;
for (let i = 0; i < KIT_COLORS.length; i++) {
  for (let j = i + 1; j < KIT_COLORS.length; j++) {
    const a = KIT_COLORS[i], b = KIT_COLORS[j];
    const d = dist(a.hex, b.hex);
    if (d < SWATCH_MIN) fails.push(`swatches ${a.id}/${b.id} only ${d.toFixed(0)} apart`);
  }
}

// 2. the trim reads against its own shirt
for (const c of KIT_COLORS) {
  if (dist(c.hex, c.trim) < 90) fails.push(`${c.id} trim vanishes into the shirt`);
}

// 3. every club finds a kit
const clubs = CITIES.map(c => clubFromCity(c, 1));
const tally = new Map<string, number>();
for (const c of clubs) {
  const k = nearestKitColor(c.primary);
  if (!k) { fails.push(`${c.short} has no kit`); continue; }
  tally.set(k.id, (tally.get(k.id) ?? 0) + 1);
}

// 4. two clubs on the same palette colour still play a readable match
let resolved = 0, unresolved = 0;
for (const a of KIT_COLORS) {
  for (const b of KIT_COLORS) {
    const home = { ...clubs[0], primary: a.hex, accent: a.trim };
    const away = { ...clubs[1], primary: b.hex, accent: b.trim };
    const k = matchKits(home, away);
    if (clash(k.home.shirt, k.away.shirt)) { unresolved++; fails.push(`${a.id} v ${b.id} unreadable`); }
    else resolved++;
  }
}

console.log(`${KIT_COLORS.length} kit colours, closest swatches ${minGap().toFixed(0)} apart (min ${SWATCH_MIN})`);
console.log(`${clubs.length} clubs mapped onto ${tally.size} colours: ${[...tally].sort((x, y) => y[1] - x[1]).map(([i, n]) => `${i} ${n}`).join(', ')}`);
console.log(`${resolved + unresolved} colour-on-colour fixtures, ${unresolved} unreadable`);
if (fails.length) console.log('\n  ' + fails.slice(0, 6).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, fourteen colours a manager can tell apart, and no unreadable fixture');
process.exit(fails.length ? 1 : 0);

function dist(a: string, b: string): number {
  const [ar, ag, ab] = rgb(a), [br, bg, bb] = rgb(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}
function minGap(): number {
  let m = Infinity;
  for (let i = 0; i < KIT_COLORS.length; i++)
    for (let j = i + 1; j < KIT_COLORS.length; j++)
      m = Math.min(m, dist(KIT_COLORS[i].hex, KIT_COLORS[j].hex));
  return m;
}
function rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
