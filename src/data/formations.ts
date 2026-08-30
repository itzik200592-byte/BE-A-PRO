/**
 * The three formations you can pick, and the shape each one draws on the pitch.
 *
 * One source of truth: the tactics screen reads the labels, the match engine
 * reads the att/def multipliers, and the 2D pitch reads the slots. Change a
 * number here and every one of them moves together.
 *
 * A slot is (d, y) inside the team's own block, never an absolute pitch spot:
 * d 0 is the deepest line, d 1 the highest, y 0 the left touchline. The pitch
 * stretches that block forward or squeezes it back depending on where play is,
 * which is what keeps the lines apart instead of collapsing into a clump.
 */

import type { Player } from '../engine/matchEngine.ts';

export type FormationId = '4-4-2' | '4-3-3' | '5-4-1';
export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface FormationSlot {
  d: number;
  y: number;
  line: Line;
  /** how this slot breaks shape when his team is on top, see LivePitch */
  brk?: { d: number; y: number };
}

export interface Formation {
  id: FormationId;
  /** the numbers, for the big label */
  label: string;
  name: string;
  desc: string;
  /** defenders, midfielders, forwards */
  counts: [number, number, number];
  /** what it is worth in the rating model */
  att: number;
  def: number;
  /**
   * Where the block sits before play pulls it about. A back five defends ten
   * metres deeper than a front three does, and that shows up on the map.
   */
  line: number;
  slots: FormationSlot[];   // 11, index 0 is always the keeper
}

export const FORMATIONS: Formation[] = [
  {
    id: '4-4-2',
    label: '4-4-2',
    name: 'מאוזן',
    desc: 'שני בלמים ומגן בכל צד, ארבעה בקישור, שני חלוצים באמצע. בלי הפתעות, בלי חורים.',
    counts: [4, 4, 2],
    att: 1.00, def: 1.00, line: 0.00,
    slots: [
      { d: 0.00, y: 0.50, line: 'GK' },
      { d: 0.09, y: 0.13, line: 'DEF', brk: { d: 0.52, y: -0.09 } },   // מגן שמאל עולה על הקו
      { d: 0.00, y: 0.37, line: 'DEF', brk: { d: 0.26, y: 0.04 } },
      { d: 0.00, y: 0.63, line: 'DEF', brk: { d: 0.26, y: -0.04 } },
      { d: 0.09, y: 0.87, line: 'DEF', brk: { d: 0.52, y: 0.09 } },    // מגן ימין עולה על הקו
      { d: 0.50, y: 0.11, line: 'MID', brk: { d: 0.28, y: -0.05 } },   // קשר אגף
      { d: 0.40, y: 0.39, line: 'MID', brk: { d: 0.40, y: 0.04 } },    // ריצה מאוחרת מהאמצע
      { d: 0.40, y: 0.61, line: 'MID', brk: { d: 0.40, y: -0.04 } },
      { d: 0.50, y: 0.89, line: 'MID', brk: { d: 0.28, y: 0.05 } },
      { d: 0.92, y: 0.39, line: 'FWD', brk: { d: -0.30, y: 0.06 } },   // חלוץ יורד לקבל
      { d: 0.92, y: 0.61, line: 'FWD', brk: { d: 0.06, y: -0.06 } },
    ],
  },
  {
    id: '4-3-3',
    label: '4-3-3',
    name: 'התקפי',
    desc: 'שני בלמים ומגן בכל צד, שלושה קשרים, שלושה קדימה. יוצרים הרבה יותר, נפתחים מאחור.',
    counts: [4, 3, 3],
    att: 1.06, def: 0.95, line: 0.055,
    slots: [
      { d: 0.00, y: 0.50, line: 'GK' },
      { d: 0.10, y: 0.14, line: 'DEF', brk: { d: 0.56, y: -0.10 } },
      { d: 0.00, y: 0.37, line: 'DEF', brk: { d: 0.28, y: 0.05 } },
      { d: 0.00, y: 0.63, line: 'DEF', brk: { d: 0.28, y: -0.05 } },
      { d: 0.10, y: 0.86, line: 'DEF', brk: { d: 0.56, y: 0.10 } },
      { d: 0.52, y: 0.25, line: 'MID', brk: { d: 0.36, y: 0.05 } },
      { d: 0.40, y: 0.50, line: 'MID', brk: { d: 0.32, y: 0.00 } },
      { d: 0.52, y: 0.75, line: 'MID', brk: { d: 0.36, y: -0.05 } },
      { d: 0.90, y: 0.13, line: 'FWD', brk: { d: 0.08, y: 0.20 } },    // כנף חותך פנימה
      { d: 1.00, y: 0.50, line: 'FWD', brk: { d: -0.34, y: 0.00 } },   // חלוץ יורד
      { d: 0.90, y: 0.87, line: 'FWD', brk: { d: 0.08, y: -0.20 } },
    ],
  },
  {
    id: '5-4-1',
    label: '5-4-1',
    name: 'הגנתי',
    desc: 'שלושה בלמים ומגן בכל צד, ארבעה בקישור, חלוץ בודד. קשה לפרוץ, קשה גם לצאת.',
    counts: [5, 4, 1],
    att: 0.90, def: 1.09, line: -0.065,
    slots: [
      { d: 0.00, y: 0.50, line: 'GK' },
      { d: 0.16, y: 0.09, line: 'DEF', brk: { d: 0.58, y: -0.05 } },   // מגן כנף רץ את כל הקו
      { d: 0.00, y: 0.28, line: 'DEF', brk: { d: 0.20, y: 0.04 } },
      { d: 0.00, y: 0.50, line: 'DEF', brk: { d: 0.16, y: 0.00 } },
      { d: 0.00, y: 0.72, line: 'DEF', brk: { d: 0.20, y: -0.04 } },
      { d: 0.16, y: 0.91, line: 'DEF', brk: { d: 0.58, y: 0.05 } },
      { d: 0.48, y: 0.13, line: 'MID', brk: { d: 0.30, y: -0.04 } },
      { d: 0.36, y: 0.40, line: 'MID', brk: { d: 0.34, y: 0.04 } },
      { d: 0.36, y: 0.60, line: 'MID', brk: { d: 0.34, y: -0.04 } },
      { d: 0.48, y: 0.87, line: 'MID', brk: { d: 0.30, y: 0.04 } },
      { d: 0.94, y: 0.50, line: 'FWD', brk: { d: -0.26, y: 0.10 } },   // החלוץ הבודד רץ לערוצים
    ],
  },
];

export const DEFAULT_FORMATION: FormationId = '4-4-2';

const BY_ID = new Map(FORMATIONS.map(f => [f.id, f]));

export function formation(id: FormationId | undefined | null): Formation {
  return BY_ID.get(id as FormationId) ?? BY_ID.get(DEFAULT_FORMATION)!;
}

/** The AI teams do not all line up the same way, but each club is consistent. */
export function formationForClub(clubId: string): FormationId {
  let h = 2166136261;
  for (let i = 0; i < clubId.length; i++) { h ^= clubId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return FORMATIONS[(h >>> 0) % FORMATIONS.length].id;
}

/* ------------------------------------------------------------ filling it */

const LINE_OF: Record<string, Line> = {
  GK: 'GK',
  LB: 'DEF', RB: 'DEF', CB: 'DEF', LWB: 'DEF', RWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', DM: 'MID', AM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD', CF: 'FWD', SS: 'FWD',
};

/**
 * Put eleven men into eleven slots, keeping the shape the manager picked.
 *
 * The squad does not always hold the exact line counts a formation wants, so a
 * short line borrows from the one next to it: a five at the back takes the
 * spare midfielder as a wing back rather than leaving the slot empty and the
 * formation broken. The returned array lines up index for index with slots.
 */
export function fillFormation(players: Player[], f: Formation): Player[] {
  const pool = players.slice();
  const grab = (want: Line[], n: number): Player[] => {
    const out: Player[] = [];
    for (const w of want) {
      for (let i = 0; i < pool.length && out.length < n; i++) {
        if (LINE_OF[pool[i].position] === w) out.push(...pool.splice(i--, 1));
      }
      if (out.length >= n) break;
    }
    while (out.length < n && pool.length) out.push(pool.shift()!);
    return out;
  };
  const [nd, nm, nf] = f.counts;
  return [
    ...grab(['GK'], 1),
    ...grab(['DEF', 'MID'], nd),
    ...grab(['MID', 'FWD', 'DEF'], nm),
    ...grab(['FWD', 'MID'], nf),
  ].slice(0, 11);
}
