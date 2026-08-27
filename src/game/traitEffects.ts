/**
 * How personality touches the match, on purpose only a little.
 *
 * These effects are deliberately small. A trait should be a texture the manager
 * notices over a season, never the thing that decides a game: a couple of
 * fitness points, a slightly steeper stamina curve, a nudge to which tired
 * player picks up the booking. Nothing here changes a scoreline on its own.
 *
 * Scope is tight too. Only the player's live match (liveMatch.ts) reads these.
 * The calibrated matchEngine that simulates the rest of the round is never
 * touched, so the 2.7 goals a game stays exactly where it was tuned.
 */

import type { Trait } from '../data/personalities.ts';

export interface PlayerMods {
  /** one-off change to fitness at kickoff */
  fitnessStart: number;
  /** multiplier on per-minute stamina drain, 1 is normal */
  fatigueMul: number;
  /** relative weight for being the one who picks up a card, 1 is normal */
  cardProne: number;
}

/** Per trait, what it does. Absent traits do nothing, which is most of them. */
const PLAYER_FX: Record<string, Partial<PlayerMods>> = {
  // engines last the ninety, and it shows late
  engine:          { fitnessStart: +3, fatigueMul: 0.90 },
  iron:            { fitnessStart: +3, fatigueMul: 0.92 },
  'no-running':    { fatigueMul: 1.12 },
  // the friday reality: a heavy thursday, a new baby, coming back from reserves
  thursday:        { fitnessStart: -4 },
  'new-baby':      { fitnessStart: -3 },
  reserves:        { fitnessStart: -3, fatigueMul: 1.04 },
  'hummus-friday': { fitnessStart: +3 },
  'day-job':       { fatigueMul: 1.05 },
  commute:         { fatigueMul: 1.03 },
  // temperament decides who sees the card, not whether one is shown
  hothead:         { cardProne: 3 },
  diver:           { cardProne: 2 },
  'ref-talker':    { cardProne: 2 },
  grudge:          { cardProne: 1.6 },
};

/** Traits that lift the whole dressing room a touch at kickoff. */
const TEAM_FX: Record<string, number> = {
  captain: 2, clown: 2, mentor: 1, 'kiss-crest': 1, local: 1,
};

/** The combined match modifiers a single player carries. */
export function playerMods(traits: Trait[]): PlayerMods {
  const m: PlayerMods = { fitnessStart: 0, fatigueMul: 1, cardProne: 1 };
  for (const t of traits) {
    const fx = PLAYER_FX[t.id];
    if (!fx) continue;
    if (fx.fitnessStart) m.fitnessStart += fx.fitnessStart;
    if (fx.fatigueMul) m.fatigueMul *= fx.fatigueMul;
    if (fx.cardProne) m.cardProne = Math.max(m.cardProne, fx.cardProne);
  }
  return m;
}

/**
 * Team morale bump from the personalities in the starting eleven. Capped low so
 * a room full of leaders is a small edge, not a cheat code.
 */
export function teamMoraleBump(startersTraits: Trait[][]): number {
  let sum = 0;
  for (const ts of startersTraits) for (const t of ts) sum += TEAM_FX[t.id] ?? 0;
  return Math.min(4, sum);
}
