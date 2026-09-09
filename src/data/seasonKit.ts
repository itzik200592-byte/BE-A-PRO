/**
 * This season's shirt.
 *
 * Real clubs release a kit every summer, and the good ones are never a new
 * club: the colour is the identity and it does not move. What changes is the
 * design, and the best ones carry something from the year before. A gold trim
 * because you won it. A darker shade for the year you went up.
 *
 * So a season kit here is always the club's own colour, restyled, and what it
 * is restyled INTO is decided by what the manager just did. Over a career the
 * wardrobe becomes a record: you can see the promotion season and the title
 * season without reading a word.
 *
 * Deterministic from the club, the season and last season's result, so the same
 * career always produces the same shirts and a save reopens on the right one.
 */

import type { Club } from './clubs.ts';
import type { KitPattern } from './kits.ts';
import { clash, lightness } from './kits.ts';

/** How last season ended, which is what the new shirt is about. */
export type KitReason = 'champion' | 'promoted' | 'relegated' | 'stayed' | 'first';

export interface SeasonKit {
  season: number;
  /** whose shirt it was. A sacked manager's wardrobe spans more than one club */
  clubId: string;
  shirt: string;
  trim: string;
  pattern: KitPattern;
  /** what it is called, which is the whole point of a season kit */
  name: string;
  /** one line on why it looks like this */
  note: string;
  reason: KitReason;
}

/** Gold, for the only thing that earns it. */
const GOLD = '#e9b949';

const PATTERNS: KitPattern[] = ['solid', 'stripes', 'hoops', 'sash', 'half'];

/* --------------------------------------------------------------- shading */

function rgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/**
 * The same colour, deeper or brighter. Never a different hue: a club that plays
 * in blue plays in blue, and a "new kit" that changed colour would just be a
 * different club.
 */
function shade(base: string, amount: number): string {
  const [r, g, b] = rgb(base);
  if (amount >= 0) return hex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  const k = 1 + amount;
  return hex(r * k, g * k, b * k);
}

/** Stable 0..1 from a string, so a club's wardrobe is its own. */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

/* ------------------------------------------------------------ the design */

const NAME: Record<KitReason, string> = {
  champion: 'מדי האלופה',
  promoted: 'מדי העלייה',
  relegated: 'מדי החזרה',
  stayed: 'מדי הבית',
  first: 'מדי הבית',
};

const NOTE: Record<KitReason, string> = {
  champion: 'אחרי האליפות, זהב על החזה. שיראו מי אתם.',
  promoted: 'ליגה חדשה, מדים חדשים. הפעם באים מוכנים.',
  relegated: 'ירדנו, אבל לא מוותרים. הצבעים נשארים.',
  stayed: 'עונה חדשה, אותם צבעים, גזרה חדשה.',
  first: 'המדים הראשונים שלך במועדון הזה.',
};

/**
 * Build the shirt for a season.
 *
 * `previous` keeps the wardrobe honest: a new kit never repeats last year's
 * pattern, because a "new kit" that looks identical is the thing that makes
 * these feel cheap.
 */
export function seasonKit(
  club: Club, season: number, reason: KitReason, previous?: SeasonKit | null,
): SeasonKit {
  const roll = seedOf(`${club.id}|${season}|${reason}`);

  // the pattern moves on every year, and never lands on last season's
  const options = PATTERNS.filter(p => p !== previous?.pattern);
  const pattern = options[Math.floor(roll * options.length) % options.length];

  // the shade shifts a little year to year so two seasons never look identical,
  // deeper after a promotion, deeper still for a title
  const shift =
    reason === 'champion' ? -0.22 :
    reason === 'promoted' ? -0.12 :
    reason === 'relegated' ? -0.06 :
    (roll < 0.5 ? -0.07 : 0.07);
  let shirt = shade(club.primary, shift);

  // Gold belongs to the champion and nobody else, so the shirt has to be a
  // colour gold can be seen against. An orange club came out with the gold
  // silently swapped for black while the line under it still promised gold, so
  // the champion kit goes as deep as it needs to for its own trim to read.
  let trim: string = club.accent;
  if (reason === 'champion') {
    trim = GOLD;
    for (let step = 0; step < 6 && clash(shirt, trim); step++) {
      shirt = shade(shirt, -0.14);
    }
  }
  if (clash(shirt, trim)) trim = lightness(shirt) > 0.55 ? '#15181f' : '#f2f5f8';

  return {
    season, clubId: club.id, shirt, trim, pattern,
    name: `${NAME[reason]} ${seasonLabel(season)}`,
    note: NOTE[reason],
    reason,
  };
}

/**
 * The shirt a manager arrives in, recorded rather than invented.
 *
 * At a club's first season he has just chosen his colours and his pattern
 * himself, on the way in. Generating a kit over the top would restyle a choice
 * he made two screens ago, so the first entry in the wardrobe is simply what he
 * picked — which also gives every later kit something real to be a change from.
 */
export function firstKit(club: Club, season: number): SeasonKit {
  const c = club as Club & { kitPattern?: KitPattern; kitShirt?: string; kitTrim?: string };
  return {
    season,
    clubId: club.id,
    shirt: c.kitShirt ?? club.primary,
    trim: c.kitTrim ?? club.accent,
    pattern: c.kitPattern ?? (club.pattern === 'chevron' ? 'hoops' : club.pattern),
    name: `${NAME.first} ${seasonLabel(season)}`,
    note: NOTE.first,
    reason: 'first',
  };
}

/** Seasons read like a football season, because that is what they are. */
export function seasonLabel(season: number): string {
  const start = 2025 + season;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

/** What last season's result means for this season's shirt. */
export function reasonFor(result: string | undefined, season: number): KitReason {
  if (season <= 1 || !result) return 'first';
  if (result === 'champion') return 'champion';
  if (result === 'promoted') return 'promoted';
  if (result === 'relegated') return 'relegated';
  return 'stayed';
}
