/**
 * The fourteen kit colours.
 *
 * One canonical list, so the artwork, the colour picker and the pitch all agree.
 * Every club colour in the game maps onto one of these by nearest match, which
 * means a kit exists for any club, including ones invented for towns that have
 * no hand picked identity.
 *
 * The first seven cover every club currently in the game. The rest are there so
 * the manager choosing his own colours has a real choice and not a shortlist.
 */

export type KitColorId =
  | 'red' | 'maroon' | 'orange' | 'yellow' | 'green' | 'teal' | 'sky'
  | 'blue' | 'navy' | 'purple' | 'pink' | 'black' | 'white' | 'silver';

export interface KitColor {
  id: KitColorId;
  /** what the manager reads when he picks it */
  name: string;
  /** the shirt body */
  hex: string;
  /** the trim, sleeves and collar; always readable against the body */
  trim: string;
}

export const KIT_COLORS: KitColor[] = [
  { id: 'red',    name: 'אדום',    hex: '#c0392b', trim: '#f4e7d8' },
  { id: 'maroon', name: 'בורדו',   hex: '#7d1128', trim: '#e9c46a' },
  { id: 'orange', name: 'כתום',    hex: '#e67e22', trim: '#3a2109' },
  { id: 'yellow', name: 'צהוב',    hex: '#f1c40f', trim: '#1a1a1a' },
  { id: 'green',  name: 'ירוק',    hex: '#27ae60', trim: '#04331b' },
  { id: 'teal',   name: 'טורקיז',  hex: '#16a085', trim: '#04302a' },
  { id: 'sky',    name: 'תכלת',    hex: '#56b4e8', trim: '#0b2540' },
  { id: 'blue',   name: 'כחול',    hex: '#2472c8', trim: '#ffd233' },
  { id: 'navy',   name: 'כחול כהה', hex: '#14274e', trim: '#eef2f6' },
  { id: 'purple', name: 'סגול',    hex: '#8e44ad', trim: '#f0e4f7' },
  { id: 'pink',   name: 'ורוד',    hex: '#e75480', trim: '#15181f' },
  { id: 'black',  name: 'שחור',    hex: '#15181f', trim: '#f1c40f' },
  { id: 'white',  name: 'לבן',     hex: '#eef2f6', trim: '#15181f' },
  { id: 'silver', name: 'כסוף',    hex: '#9aa5b1', trim: '#15181f' },
];

const BY_ID = new Map(KIT_COLORS.map(c => [c.id, c]));

export function kitColor(id: KitColorId): KitColor {
  return BY_ID.get(id) ?? KIT_COLORS[0];
}

/**
 * The closest kit colour to an arbitrary hex. Clubs carry their own hand picked
 * shades, so this is how a club's identity finds the kit art that goes with it,
 * and why three slightly different reds all wear the same red shirt.
 */
export function nearestKitColor(hex: string): KitColor {
  const [r, g, b] = rgb(hex);
  let best = KIT_COLORS[0];
  let bestD = Infinity;
  for (const c of KIT_COLORS) {
    const [cr, cg, cb] = rgb(c.hex);
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

function rgb(hex: string): [number, number, number] {
  const m = typeof hex === 'string' ? /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim()) : null;
  if (!m) return [128, 128, 128];
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
