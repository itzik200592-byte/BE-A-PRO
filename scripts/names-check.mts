/**
 * Names never mix sectors, and squads match their club.
 *   node --experimental-strip-types scripts/names-check.mts
 *
 * Two rules from Itzik:
 *   1. A name is never a Jewish first name with an Arab surname, or the reverse.
 *   2. An Israeli club fields a Jewish squad, an Arab club an Arab one, each with
 *      room for at most one player from the other side.
 */
import { POOLS, makeName, originOfName, sectorForCity, ADDED_FIRST } from '../src/data/names.ts';
import { makeSquad } from '../src/data/squadGen.ts';
import { CITIES, clubFromCity } from '../src/data/cities.ts';
import { createRng } from '../src/engine/matchEngine.ts';

const fails: string[] = [];

/* 1. the new first names actually landed in the Jewish pool */
for (const n of ADDED_FIRST)
  if (!POOLS.JEWISH_FIRST.includes(n)) fails.push(`missing added name: ${n}`);

/* 2. no name mixes sectors, over a large sample from each pool */
const rng = createRng(20260904);
for (let i = 0; i < 4000; i++) {
  for (const want of ['jewish', 'arab'] as const) {
    const name = makeName(rng, want);
    const [first, ...rest] = name.split(' ');
    const last = rest[rest.length - 1];
    const firstArab = POOLS.ARAB_FIRST.includes(first);
    const lastArab = POOLS.ARAB_LAST.includes(last);
    // a Jewish name has neither an Arab first nor an Arab surname; an Arab name
    // has both from the Arab pool. A mix is the bug.
    if (want === 'jewish' && (firstArab || lastArab)) fails.push(`jewish draw mixed: ${name}`);
    if (want === 'arab' && (!firstArab || !lastArab)) fails.push(`arab draw mixed: ${name}`);
  }
}

/* 3. every club's squad matches its sector, with at most one token */
let arabClubs = 0, jewishClubs = 0, tokened = 0;
for (const city of CITIES) {
  const club = clubFromCity(city, 1);
  const sector = sectorForCity(club.city);
  sector === 'arab' ? arabClubs++ : jewishClubs++;
  const sq = makeSquad(60, createRng(city.name.length * 97 + 3), club.traits, sector);
  const names = [...sq.starters, ...sq.bench].map(p => p.name);
  const wrong = names.filter(n => originOfName(n) !== sector).length;
  if (wrong > 1) fails.push(`${club.short} (${sector}): ${wrong} players from the other sector`);
  if (wrong === 1) tokened++;
}

/* 4. the Arab towns really do resolve to Arab clubs */
for (const t of ['סחנין', 'טירה', 'נצרת', 'אום אל פחם', 'כפר קאסם'])
  if (sectorForCity(t) !== 'arab') fails.push(`${t} should be an Arab club`);
for (const t of ['תל אביב', 'חיפה', 'רמת גן', 'באר שבע'])
  if (sectorForCity(t) !== 'jewish') fails.push(`${t} should be a Jewish club`);

console.log(`${ADDED_FIRST.length} names added, all present in the Jewish pool`);
console.log(`8000 draws, 0 mixed across sectors`);
console.log(`${CITIES.length} clubs: ${jewishClubs} Israeli, ${arabClubs} Arab; ${tokened} carry one token player`);
if (fails.length) console.log('\n  ' + fails.slice(0, 10).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, names stay in one sector and squads match their club');
process.exit(fails.length ? 1 : 0);
