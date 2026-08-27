import type { Player, Position, Rng } from '../engine/matchEngine.ts';
import { overall } from '../engine/matchEngine.ts';
import { makePlayer, playerValue, NEUTRAL_TRAITS } from '../data/squadGen.ts';
import { leagueCeiling } from '../data/clubs.ts';

/**
 * Transfer windows during the league. The summer's business now happens in the
 * pre season, before a ball is kicked, so mid season there is only the short
 * winter window. Outside it the market is shut, which is what makes squad
 * building matter.
 */
export const WINTER_WEEKS: [number, number] = [8, 9];

export interface WindowState {
  open: boolean;
  label: string;
  weeksLeft: number;
  nextOpensWeek: number | null;
}

export function windowState(week: number, _totalRounds: number): WindowState {
  if (week >= WINTER_WEEKS[0] && week <= WINTER_WEEKS[1]) {
    return { open: true, label: 'חלון החורף', weeksLeft: WINTER_WEEKS[1] - week + 1, nextOpensWeek: null };
  }
  const next = week < WINTER_WEEKS[0] ? WINTER_WEEKS[0] : null;
  return { open: false, label: 'החלון סגור', weeksLeft: 0, nextOpensWeek: next };
}

/** Squad size limits, keeps the market a decision and not a hoard. */
export const MIN_SQUAD = 16;
export const MAX_SQUAD = 20;

export interface FreeAgent {
  player: Player;
  fee: number;
  /** short pitch in the manager's language */
  note: string;
}

const POOL_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CB', 'ST'];

const NOTES_YOUNG = ['יצא מהנוער של קבוצה גדולה', 'סוכן דוחף אותו חזק', 'לא קיבל צ׳אנס בקבוצה הקודמת'];
const NOTES_PRIME = ['חופשי אחרי סיום חוזה', 'רוצה לשחק קרוב לבית', 'ירד ליגה ומחפש להוכיח'];
const NOTES_OLD = ['ותיק, יביא ניסיון לחדר ההלבשה', 'בשנים האחרונות שלו', 'מכיר את הליגה בעל פה'];

/**
 * Build the market for a season. Quality respects the league ceiling.
 * `taken` holds names already in use so a free agent never shares a name
 * with someone in your own squad.
 */
export function makeMarket(tier: number, rng: Rng, size = 10, taken?: Set<string>): FreeAgent[] {
  const ceiling = leagueCeiling(tier);
  const used = new Set<string>(taken ?? []);
  const out: FreeAgent[] = [];
  for (let i = 0; i < size; i++) {
    const pos = POOL_POSITIONS[Math.floor(rng() * POOL_POSITIONS.length)];
    const base = ceiling - 10 + Math.round(rng() * 12);
    const traits = { ...NEUTRAL_TRAITS, youth: i < 3 ? 0.75 : 0.1 };
    const player = makePlayer(pos, base, rng, traits, used);
    const notes = player.age <= 21 ? NOTES_YOUNG : player.age >= 31 ? NOTES_OLD : NOTES_PRIME;
    out.push({
      player,
      fee: playerValue(player),
      note: notes[Math.floor(rng() * notes.length)],
    });
  }
  return out.sort((a, b) => overall(b.player) - overall(a.player));
}

/** What you get back when you let a player go. */
export function sellPrice(p: Player): number {
  return Math.round(playerValue(p) * 0.8);
}

/** Proposed contract terms for a signing, derived from rating and age. */
export interface ContractTerms {
  wagePerWeek: number;   // shekels
  years: number;
  signOn: number;        // one time signing fee, the transfer fee
}

export function contractTerms(fa: FreeAgent): ContractTerms {
  const age = fa.player.age;
  const years = age <= 23 ? 3 : age >= 31 ? 1 : 2;
  // weekly wage tracks the size of the deal, rounded to a clean hundred
  const wage = Math.max(300, Math.round((fa.fee * 0.006) / 100) * 100);
  return { wagePerWeek: wage, years, signOn: fa.fee };
}
