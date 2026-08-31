/**
 * The shirt sponsor.
 *
 * The club had exactly one income that mattered, prize money, which is why the
 * economy nearly bankrupted every new manager and why the ground was worth
 * building only for the promotion rules. A sponsor fixes both: it is steady
 * money a small club can plan around, and one of the three deals pays on how
 * full the ground is, so a stand finally earns twice.
 *
 * It is also a decision rather than a number. Safe money, money that only
 * arrives if you go up, or money that follows the crowd: the same three
 * temperaments the rest of the game asks about.
 *
 * ULTRASKIT is a placeholder, standing in for real advertisers later.
 */

import { TOP_TIER } from './career.ts';

export type SponsorId = 'base' | 'results' | 'crowd';

export interface SponsorOffer {
  id: SponsorId;
  /** who is on the shirt */
  brand: string;
  /** what the deal is called */
  name: string;
  blurb: string;
  /** paid every round, before the crowd multiplier */
  perRound: number;
  /** a lump the day you go up, 0 on the deals that do not pay for it */
  promotionBonus: number;
  /** true when the round payment scales with how full the ground is */
  followsCrowd: boolean;
}

export interface Sponsor {
  id: SponsorId;
  brand: string;
  name: string;
  perRound: number;
  promotionBonus: number;
  followsCrowd: boolean;
  /** the season it was signed for, so it is re-negotiated every summer */
  season: number;
}

export const SPONSOR_BRAND = 'ULTRASKIT';

/** What the brand will spend on a club in this division, across a season. */
const SEASON_VALUE = [0, 45_000, 85_000, 280_000, 575_000, 1_350_000];

/** The crowd a division expects, which the crowd deal is measured against. */
// kept in step with career.ts DEMAND, so the crowd deal pays 1.0 for a normal
// turnout and up to 2.0 for a ground that is genuinely packed
const EXPECTED_CROWD = [0, 250, 700, 1_500, 4_500, 16_000];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * The three offers on the table, sized to the division and to how well known
 * the club is. A bigger name is worth more to a sponsor, which is most of what
 * prestige is for.
 */
export function sponsorOffers(tier: number, prestige: number, rounds: number): SponsorOffer[] {
  const t = clamp(Math.round(tier), 1, TOP_TIER);
  const value = SEASON_VALUE[t] * (0.75 + clamp(prestige, 0, 100) / 200);
  const r = Math.max(1, rounds);
  const round100 = (n: number) => Math.round(n / 100) * 100;

  return [
    {
      id: 'base',
      brand: SPONSOR_BRAND,
      name: 'חוזה בסיס',
      blurb: 'סכום קבוע כל מחזור. בלי הפתעות, בלי בונוסים.',
      perRound: round100(value / r),
      promotionBonus: 0,
      followsCrowd: false,
    },
    {
      id: 'results',
      brand: SPONSOR_BRAND,
      name: 'חוזה הישגים',
      blurb: 'פחות כל מחזור, אבל מענק גדול אם תעלה ליגה.',
      perRound: round100((value * 0.6) / r),
      promotionBonus: round100(value * 1.35),
      followsCrowd: false,
    },
    {
      id: 'crowd',
      brand: SPONSOR_BRAND,
      name: 'חוזה יציע',
      blurb: 'משתלם לפי כמה שהיציע מלא. אצטדיון גדול שווה כאן כפול.',
      perRound: round100((value * 0.55) / r),
      promotionBonus: 0,
      followsCrowd: true,
    },
  ];
}

export function signSponsor(offer: SponsorOffer, season: number): Sponsor {
  return {
    id: offer.id, brand: offer.brand, name: offer.name,
    perRound: offer.perRound, promotionBonus: offer.promotionBonus,
    followsCrowd: offer.followsCrowd, season,
  };
}

/**
 * What the sponsor pays for a single round.
 *
 * The crowd deal is measured against what the division expects to draw, so
 * filling a small ground is worth something and a big one is worth a lot,
 * capped at twice so a huge stadium in a low division cannot break the economy.
 */
export function sponsorRound(s: Sponsor | null, tier: number, attendance: number): number {
  if (!s) return 0;
  if (!s.followsCrowd) return s.perRound;
  const t = clamp(Math.round(tier), 1, TOP_TIER);
  const share = clamp(Math.max(0, attendance) / EXPECTED_CROWD[t], 0, 2);
  return Math.round(s.perRound * (0.35 + 0.85 * share));
}
