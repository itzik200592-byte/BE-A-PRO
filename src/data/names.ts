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

/** Share of generated players drawn from the Arab pool, in a mixed context. */
export const ARAB_SHARE = 0.15;

/** First names added by Itzik. Kept separate so the test can track them. */
export const ADDED_FIRST = [
  'ניראל', 'נהוראי', 'אוראל', 'אלירן', 'נריה', 'ינון', 'ניר', 'עילאי', 'יאיר',
  'ניתאי', 'חגי', 'שימי', 'לידור', 'אדם', 'שחר',
];

const JEWISH_FIRST = [
  'יוסי', 'איתי', 'עומר', 'דור', 'ניב', 'שגיא', 'רועי', 'אלון', 'גיא', 'עידן',
  'ליאור', 'טל', 'נדב', 'אורי', 'עמית', 'רן', 'בר', 'יונתן', 'אסף', 'אייל',
  'אלמוג', 'רותם', 'עוז', 'ספיר', 'נתי', 'חן', 'עידו', 'שון', 'איתמר', 'יובל',
  'אריאל', 'מתן', 'שי', 'אביב', 'תומר', 'נועם', 'ערן', 'ברק', 'דניאל', 'עומרי',
  'משה', 'שלומי', 'אורן', 'זיו', 'גל', 'אלכס', 'רפאל', 'בניה', 'שקד',
  ...ADDED_FIRST,
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

/**
 * Arab majority towns in the game's city list. A club from one of these is an
 * Arab club, and its squad is drawn from the Arab pool. Matching is by token,
 * so "סחנין" and the club "בני סח׳" both resolve, and a generated club whose
 * name carries the town resolves too.
 */
const ARAB_TOWNS = [
  'כפר קאסם', 'ג׳לג׳וליה', 'טירה', 'טייבה', 'קלנסווה', 'שפרעם', 'סחנין', 'סח׳',
  'טמרה', 'מגאר', 'כפר כנא', 'באקה', 'נצרת', 'אום אל פחם', 'רהט',
];

/**
 * Which sector a club belongs to, from its town. Israeli clubs field a Jewish
 * squad, Arab clubs an Arab one, each with room for a single player from the
 * other side, mirroring the real league.
 */
export function sectorForCity(cityName: string | undefined): Origin {
  if (!cityName) return 'jewish';
  return ARAB_TOWNS.some(t => cityName.includes(t)) ? 'arab' : 'jewish';
}

/**
 * The origin of each player in a squad of a given sector. Everyone is from the
 * club's own sector, but a squad may carry one player from the other side, the
 * way an Israeli club sometimes has an Arab player and an Arab club an Israeli
 * one. The token is more common in an Arab club, by design.
 */
export function squadOrigins(sector: Origin, size: number, rng: Rng): Origin[] {
  const other: Origin = sector === 'arab' ? 'jewish' : 'arab';
  const origins: Origin[] = Array(size).fill(sector);
  const tokenChance = sector === 'arab' ? 0.7 : 0.5;
  if (rng() < tokenChance) origins[Math.floor(rng() * size)] = other;
  return origins;
}

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

/** Read a generated name back to its pool, by its first or family name. */
export function originOfName(name: string): Origin {
  const parts = name.split(' ');
  const first = parts[0];
  const last = parts[parts.length - 1];
  return ARAB_LAST.includes(last) || ARAB_FIRST.includes(first) ? 'arab' : 'jewish';
}

/**
 * The sector a squad already belongs to, from its players' names. Used when a
 * club signs or promotes players over the years, so an Arab club stays Arab and
 * an Israeli one stays Israeli instead of drifting into a mix.
 */
export function majoritySector(names: string[]): Origin {
  let arab = 0;
  for (const n of names) if (originOfName(n) === 'arab') arab++;
  return arab * 2 > names.length ? 'arab' : 'jewish';
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
