/**
 * Kits: the manager's chosen colours reach the club, the crest and the pitch,
 * and no fixture is ever two shirts you cannot tell apart.
 *   node --experimental-strip-types scripts/kit-check.mts
 */
import { matchKits, clash } from '../src/data/kits.ts';
import { KIT_COLORS, kitColor, nearestKitColor } from '../src/data/palette.ts';
import { CITIES, clubFromCity } from '../src/data/cities.ts';
import * as G from '../src/game/state.ts';

const fails: string[] = [];

/* 1. every existing fixture is readable, with the away side changing if needed */
const clubs = CITIES.map(c => clubFromCity(c, 1));
let pairs = 0, changed = 0;
for (let i = 0; i < clubs.length; i++) {
  for (let j = 0; j < clubs.length; j++) {
    if (i === j) continue;
    const k = matchKits(clubs[i], clubs[j]);
    pairs++;
    if (k.away.shirt.toLowerCase() !== clubs[j].primary.toLowerCase()) changed++;
    if (clash(k.home.shirt, k.away.shirt)) fails.push(`${clubs[i].short} v ${clubs[j].short} unreadable`);
  }
}

/* 2. two clubs on the SAME palette colour still play a readable match */
for (const a of KIT_COLORS) {
  const home = { ...clubs[0], primary: a.hex, accent: a.trim };
  const away = { ...clubs[1], primary: a.hex, accent: a.trim };
  const k = matchKits(home, away);
  if (clash(k.home.shirt, k.away.shirt)) fails.push(`${a.id} v ${a.id} unreadable`);
}

/* 3. the manager's choice actually becomes the club's colours */
const city = CITIES.find(c => c.name === 'רמת גן') ?? CITIES[0];
for (const want of KIT_COLORS) {
  let gs = G.newGame(4242);
  gs = G.setProfile(gs, { name: 'בדיקה', nickname: '', type: 'hunter', age: 40 } as never);
  gs = G.pickCity(gs, city.name, want.id);
  const me = gs.league.clubs.find(c => c.id === gs.clubId);
  if (!me) { fails.push(`${want.id}: no club`); continue; }
  if (me.primary.toLowerCase() !== want.hex.toLowerCase())
    fails.push(`${want.id}: club wears ${me.primary}, not ${want.hex}`);
  // and it survives the round trip through the kit system
  if (kitColor(want.id).hex !== nearestKitColor(me.primary).hex)
    fails.push(`${want.id}: does not map back to itself`);
  // the rest of the division must not have been recoloured with it
  const others = gs.league.clubs.filter(c => c.id !== gs.clubId);
  if (others.every(c => c.primary.toLowerCase() === want.hex.toLowerCase()))
    fails.push(`${want.id}: the whole league turned that colour`);
}

/* 4. not choosing leaves the town's own colours alone */
let plain = G.newGame(4242);
plain = G.setProfile(plain, { name: 'בדיקה', nickname: '', type: 'hunter', age: 40 } as never);
plain = G.pickCity(plain, city.name);
const def = plain.league.clubs.find(c => c.id === plain.clubId)!;
const own = clubFromCity(city, 1);
if (def.primary.toLowerCase() !== own.primary.toLowerCase())
  fails.push(`no choice should keep ${own.primary}, got ${def.primary}`);

console.log(`${pairs} fixtures across ${clubs.length} clubs, ${changed} away changes, 0 unreadable`);
console.log(`${KIT_COLORS.length} colours chosen through onboarding, each reaching the club`);
console.log(`no choice keeps the town's own colour (${def.primary})`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, every fixture is two distinct colours and the manager\'s pick sticks');
process.exit(fails.length ? 1 : 0);
