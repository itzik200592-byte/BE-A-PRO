/**
 * Pre season, the three summer rounds before the league kicks off. No match is
 * played, the market is open the whole time, and the club's real business gets
 * done: the star who wants to move up, the kid who wants a raise, and the men
 * whose contracts have run out and will walk for free if you ignore them.
 *
 * The engine never sees any of this. Contracts live on the save as a plain
 * map of years remaining, defaulted from a hash so old saves and freshly grown
 * youth need no migration.
 */

import type { Player } from '../engine/matchEngine.ts';
import { overall } from '../engine/matchEngine.ts';
import type { Squad } from '../data/squadGen.ts';
import { playerValue } from '../data/squadGen.ts';
import type { ContractTerms } from './transfers.ts';
import { transferFee } from './transfers.ts';
import { playerWage } from './career.ts';

export const PRE_ROUNDS = 3;

/* ----------------------------------------------------------------- contracts */

/** Stable hash in 0..999, same shape as the potential/dev hashes elsewhere. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1000;
}

/**
 * The contract length handed to a player the first time we ever see him, 1..3
 * years. After the opening summer's decrement this spreads to 0..2, so roughly
 * a third of an inherited squad is out of contract on day one and there is real
 * renewal business to do from the very first pre season.
 */
export function seedContract(id: string): number {
  return 1 + (hash(id + '|con') % 3);   // 1, 2 or 3
}

export function contractYears(contracts: Record<string, number>, id: string): number {
  return contracts[id] ?? seedContract(id);
}

/** Terms offered to keep a player who is already yours. Cheaper than the open
 *  market, because loyalty is worth a small discount. */
export function renewTerms(p: Player, tier: number): ContractTerms {
  const years = p.age <= 23 ? 3 : p.age >= 31 ? 1 : 2;
  const signOn = Math.round((transferFee(p, tier) * 0.15) / 1000) * 1000;   // a loyalty bonus, not a full fee
  const wage = playerWage(p, tier);
  return { wagePerWeek: wage, years, signOn };
}

/** What a raise costs to hand the young player who is asking for one. */
export function raiseBonus(p: Player): number {
  return Math.max(20_000, Math.round((playerValue(p) * 0.1) / 1000) * 1000);
}

/* ------------------------------------------------------------ who wants out */

const FIELD = new Set(['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST']);

/**
 * The best outfield player you have, the one a bigger club would come for. Only
 * counts men young enough to still be a target, so a fading veteran does not
 * trigger a transfer saga.
 */
export function starTarget(sq: Squad): Player | null {
  const pool = [...sq.starters, ...sq.bench].filter(p => FIELD.has(p.position) && p.age <= 30);
  if (!pool.length) return null;
  return pool.sort((a, b) => overall(b) - overall(a))[0];
}

/**
 * What a suitor pays for a player who is not even for sale.
 *
 * The raw value is priced for a real transfer market, and ליגה ג׳ does not have
 * one. A club there runs a season on about three hundred thousand shekel, so a
 * first offer of a hundred and fifty was very nearly the entire budget arriving
 * in one envelope, and the whole economy stopped mattering for two years.
 * Divisions below the לאומית pay a fraction of the book price, because that is
 * what amateur football pays.
 */
const FEE_SHARE = [0, 0.06, 0.14, 0.55, 1.0, 1.7];

export function starFee(p: Player, tier = 3): number {
  const t = Math.max(1, Math.min(5, Math.round(tier)));
  return Math.round((playerValue(p) * FEE_SHARE[t]) / 500) * 500;
}

/**
 * What else is in the deal, down where the money is not the point.
 *
 * A ליגה ג׳ transfer is settled over a plastic table with a handshake and
 * whatever the other club can spare, and that is genuinely funnier and more
 * Israeli than a number. Only the bottom two divisions get one.
 */
const SWEETENERS = [
  'שני שקים של כדורים',
  'סט מדים חדש לכל הסגל',
  'משכורת של אב הבית לחצי שנה',
  'מכונת כביסה למועדון',
  'הסעה לכל משחקי החוץ העונה',
  'שני סטים של קונוסים ומשרוקית',
  'צביעה מחדש של חדר ההלבשה',
  'מקרר חדש למזנון',
  'רשתות חדשות לשני השערים',
  'ארגז כדורים וקומקום',
];

export function feeSweetener(tier: number, seed: number): string | null {
  if (tier > 2) return null;
  return SWEETENERS[Math.abs(seed) % SWEETENERS.length];
}

/** The youngest player with real upside, the one who feels underpaid. */
export function youngTarget(sq: Squad): Player | null {
  const pool = [...sq.starters, ...sq.bench].filter(p => p.age <= 21);
  if (!pool.length) return null;
  // the highest rated of the kids, he is the one who knows his worth
  return pool.sort((a, b) => overall(b) - overall(a) || a.age - b.age)[0];
}
