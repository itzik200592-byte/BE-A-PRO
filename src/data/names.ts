/**
 * Generated Israeli player names.
 *
 * Two SEPARATE pools, Jewish and Arab. A player is drawn from one pool only,
 * first name and family name together, so a name is never mixed across sectors.
 * Roughly 15% of generated players are Arab, which mirrors the real league.
 *
 * Surname lists come from Itzik. Do not merge the two arrays.
 */

import type { Rng } from '../engine/matchEngine.ts';

export type Origin = 'jewish' | 'arab';

/** Share of generated players drawn from the Arab pool. */
export const ARAB_SHARE = 0.15;

const JEWISH_FIRST = [
  'יוסי', 'איתי', 'עומר', 'דור', 'ניב', 'שגיא', 'רועי', 'אלון', 'גיא', 'עידן',
  'ליאור', 'טל', 'נדב', 'אורי', 'עמית', 'רן', 'בר', 'יונתן', 'אסף', 'אייל',
  'אלמוג', 'רותם', 'עוז', 'ספיר', 'נתי', 'חן', 'עידו', 'שון', 'איתמר', 'יובל',
  'אריאל', 'מתן', 'שי', 'אביב', 'תומר', 'נועם', 'ערן', 'ברק', 'דניאל', 'עומרי',
  'משה', 'שלומי', 'אורן', 'זיו', 'גל', 'אלכס', 'רפאל', 'בניה', 'שקד', 'עידו',
];

const JEWISH_LAST = [
  'כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'דהן', 'אברהם', 'פרידמן', 'אזולאי', 'מלכה',
  'כץ', 'יוסף', 'דוד', 'אוחנה', 'קליין', 'שפירא', 'חן', 'טל', 'שחר', 'מור',
  'גולן', 'אוחיון', 'סוויסה', 'גבאי', 'ואקנין', 'עמר', 'גולדברג', 'ברקוביץ׳', 'לוין', 'מילר',
  'סמירנוב', 'טספה', 'מנגיסטו', 'לביא', 'ארז', 'בנימיני', 'זהבי', 'פלג', 'סיבוני', 'עוזיאל',
  'ייני', 'פרחי', 'יוגב', 'עצמון', 'גלנטי',
];

const ARAB_FIRST = [
  'מוחמד', 'אחמד', 'סאמי', 'ראמי', 'ואאל', 'בשאר', 'חליל', 'מחמוד', 'עלי', 'זיאד',
  'סמיר', 'פאדי', 'נור', 'איברהים', 'מאלכ', 'יוסוף', 'כרים', 'עדנאן', 'טארק', 'מאזן',
  'חוסיין', 'ג׳מאל', 'ראאד', 'מוסא',
];

const ARAB_LAST = [
  'ג׳בארין', 'אגבאריה', 'מחאמיד', 'ח׳ורי', 'זועבי', 'נאסר',
];

/** Real active players, never produce these exact combinations. */
const BLOCK = new Set<string>([
  'מנור סולומון', 'עומר אצילי', 'אלירן אטר', 'מוחמד אבו פאני', 'דור פרץ',
]);

function draw(first: string[], last: string[], rng: Rng, used?: Set<string>): string {
  let fallback = '';
  for (let tries = 0; tries < 40; tries++) {
    const f = first[Math.floor(rng() * first.length)];
    const l = last[Math.floor(rng() * last.length)];
    if (f === l) continue;                      // no "טל טל"
    const full = `${f} ${l}`;
    if (BLOCK.has(full)) continue;
    fallback ||= full;
    if (used?.has(full)) continue;              // no two identical names in one squad
    used?.add(full);
    return full;
  }
  return fallback || `${first[0]} ${last[0]}`;
}

export function pickOrigin(rng: Rng): Origin {
  return rng() < ARAB_SHARE ? 'arab' : 'jewish';
}

/**
 * A full name drawn from a single pool.
 * Pass `used` to keep every name inside one squad unique.
 */
export function makeName(rng: Rng, origin: Origin = pickOrigin(rng), used?: Set<string>): string {
  return origin === 'arab'
    ? draw(ARAB_FIRST, ARAB_LAST, rng, used)
    : draw(JEWISH_FIRST, JEWISH_LAST, rng, used);
}

/** Exported for the mixing test. */
export const POOLS = { JEWISH_FIRST, JEWISH_LAST, ARAB_FIRST, ARAB_LAST };
