/**
 * No two teams are ever the same colour on the pitch.
 *   node --experimental-strip-types scripts/kit-check.mts
 */
import { matchKits, clash, lightness } from '../src/data/kits.ts';
import { CITIES, clubFromCity } from '../src/data/cities.ts';

const clubs = CITIES.map(c => clubFromCity(c, 1));
let pairs = 0, bad = 0;
const fails: string[] = [];

for (let i = 0; i < clubs.length; i++) {
  for (let j = 0; j < clubs.length; j++) {
    if (i === j) continue;
    // every club hosting every other club
    const { home, away } = matchKits(clubs[i], clubs[j]);
    pairs++;
    if (clash(home.shirt, away.shirt)) {
      bad++;
      if (fails.length < 8) fails.push(`${clubs[i].short} (${home.shirt}) vs ${clubs[j].short} (${away.shirt})`);
    }
  }
}

// and a deliberately hard case: two greens
const g1 = { ...clubs[0], primary: '#27ae60', accent: '#fff' };
const g2 = { ...clubs[1], primary: '#2e8b57', accent: '#fff' };
const green = matchKits(g1, g2);
const greenOk = !clash(green.shirt, green.away.shirt);

console.log(`${pairs} match-ups across ${clubs.length} clubs`);
console.log(`clashes after the away change: ${bad}`);
console.log(`green hosts green: home ${green.home.shirt}, away ${green.away.shirt} -> ${greenOk ? 'distinct' : 'STILL CLASHES'}`);
if (fails.length) console.log('  ' + fails.join('\n  '));
const pass = bad === 0 && greenOk;
console.log(pass ? '\nOK, every fixture is two distinct colours' : '\nFAIL');
process.exit(pass ? 0 : 1);
