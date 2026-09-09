/**
 * The manager's standing, one to a hundred.
 *   node --experimental-strip-types scripts/coach-check.mts
 *
 * It replaced an average of his attributes, which opened at forty and only
 * moved when he paid for a course. A standing has to start at the bottom, only
 * ever go up on merit, and reserve a hundred for somebody who has actually done
 * it all.
 */
import { newCoach, applyCourse, coachRating, ratingBreakdown, standingName, LICENCE_ORDER } from '../src/game/coach.ts';
import type { Coach } from '../src/game/coach.ts';
import { MANAGERS } from '../src/data/managers.ts';
import { TRAINING_KEYS, MENTAL_KEYS } from '../src/data/managers.ts';
import type { CoachAttrs } from '../src/data/managers.ts';

const fails: string[] = [];
let checked = 0;

/* 1. every archetype opens at exactly 1. The CV you pick is a style, not a
      head start, so none of them may begin ahead of the others. */
for (const m of MANAGERS) {
  checked++;
  const r = coachRating(newCoach(m.id));
  if (r !== 1) fails.push(`${m.id} opens on ${r}, it has to be 1`);
}

/* 2. it only ever goes up, and never past a hundred */
{
  let c = newCoach('mental');
  let last = coachRating(c);
  const path: number[] = [last];
  // a full career: seasons, climbs, titles and every badge
  for (let season = 1; season <= 20; season++) {
    c = { ...c, seasons: season };
    if (season % 3 === 0) {
      c = { ...c, promotions: c.promotions + 1, bestTier: Math.min(5, c.bestTier + 1) };
    }
    if (season % 5 === 0) c = { ...c, titles: c.titles + 1 };
    const badge = LICENCE_ORDER[Math.min(LICENCE_ORDER.length - 1, Math.floor(season / 5))];
    if (badge !== c.licence) c = applyCourse(c, badge);
    const now = coachRating(c);
    checked++;
    if (now < last) fails.push(`season ${season}: the standing fell from ${last} to ${now}`);
    if (now > 100) fails.push(`season ${season}: the standing reached ${now}`);
    last = now;
    path.push(now);
  }
  console.log(`  a climbing career: ${path.filter((_, i) => i % 4 === 0).join(' -> ')} ... ${last}`);
}

/* 3. a hundred is reachable, but only by a manager who has done everything */
{
  const maxed: Coach = {
    archetype: 'mental', licence: 'international',
    seasons: 25, bestTier: 5, promotions: 10, titles: 8,
    attrs: Object.fromEntries([...TRAINING_KEYS, ...MENTAL_KEYS].map(k => [k, 20])) as CoachAttrs,
  };
  checked += 2;
  const top = coachRating(maxed);
  if (top !== 100) fails.push(`a manager who has done everything rates ${top}, not 100`);
  if (standingName(top) !== 'שם עולמי') fails.push(`a 100 is called ${standingName(top)}`);
  console.log(`  everything done: ${top}, ${standingName(top)}`);
}

/* 4. NOT reachable by grinding one thing. Each of these is a career spent
      maxing a single term, and none of them may pass for world class. */
{
  const base = newCoach('mental');
  const only: [string, Coach][] = [
    ['twenty five seasons and nothing else', { ...base, seasons: 25 }],
    ['every badge and nothing else', { ...applyCourse(applyCourse(applyCourse(base, 'certified'), 'pro'), 'international') }],
    ['ten titles in the bottom division', { ...base, titles: 10, promotions: 0, bestTier: 1 }],
  ];
  for (const [what, c] of only) {
    checked++;
    const r = coachRating(c);
    if (r >= 60) fails.push(`${what} rates ${r}, one thing should not carry a career`);
    console.log(`  ${what}: ${r}`);
  }
}

/* 5. the breakdown adds up to the number, or the screen lies */
{
  const c: Coach = { ...newCoach('hunter'), seasons: 7, bestTier: 3, promotions: 2, titles: 1 };
  const b = ratingBreakdown(applyCourse(c, 'certified'));
  const sum = b.parts.reduce((s, p) => s + p.got, 0);
  checked += 2;
  // rounding each part means the total can be a point out, no more
  if (Math.abs(sum + 1 - b.rating) > 2) fails.push(`the parts add to ${sum + 1} but the badge says ${b.rating}`);
  if (b.parts.some(p => p.got > p.of)) fails.push('a part scored more than it is worth');
  console.log(`  a mid career manager: ${b.rating}, ${standingName(b.rating)}`);
  for (const p of b.parts) console.log(`      ${String(p.got).padStart(2)}/${String(p.of).padEnd(2)}  ${p.label}`);
}

/* 6. a title is worth more than scraping up */
{
  const climbed: Coach = { ...newCoach('mental'), seasons: 4, bestTier: 2, promotions: 1, titles: 0 };
  const won: Coach = { ...climbed, titles: 1 };
  checked++;
  if (coachRating(won) <= coachRating(climbed)) {
    fails.push('winning the division is worth no more than being promoted');
  }
  console.log(`  promoted ${coachRating(climbed)}, champion ${coachRating(won)}`);
}

/* 7. whole numbers, always, like every other meter */
{
  let c = newCoach('tactical');
  for (let i = 0; i < 200; i++) {
    c = { ...c, seasons: i % 25, promotions: i % 11, titles: i % 7, bestTier: 1 + (i % 5) };
    checked++;
    const r = coachRating(c);
    if (!Number.isInteger(r)) fails.push(`the standing came out ${r}`);
    if (r < 1 || r > 100) fails.push(`the standing came out ${r}, outside 1 to 100`);
  }
}

console.log(`\n${checked} checks`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, a manager starts at 1 and only earns his way up');
process.exit(fails.length ? 1 : 0);
