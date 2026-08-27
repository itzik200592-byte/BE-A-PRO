/**
 * Israeli cities, so the player manages the club of their own town. Picking
 * your city and seeing it become your club is the belonging hook, and it is
 * far stronger than choosing from a list of invented names.
 *
 * Each city has rough coordinates, used to fill the bottom division with the
 * nearest real towns and to make the derby the closest neighbour. A curated set
 * of the better known towns gets a hand picked club identity, everyone else
 * gets a stable one derived from the name, so every city produces something.
 *
 * Legal note, same as clubs.ts: specific real club names are trademarks. These
 * lean on generic movement words (מ.ס, איחוד, צעירי, בני) plus the real town,
 * and deliberately avoid a city's famous flagship, both because the underdog
 * fits starting in ליגה ג׳ and because it is safer. A store launch still needs
 * a legal pass.
 */
import type { Club, ClubTraits, CrestShape, CrestPattern } from './clubs.ts';

export interface City {
  name: string;
  lat: number;
  lon: number;
  /** 1 small town, 2 mid, 3 big city. Nudges prestige and budget. */
  size: 1 | 2 | 3;
}

/** ~90 towns across the country. Enough that any region fills with real names. */
export const CITIES: City[] = [
  // --- Gush Dan / center ---
  { name: 'תל אביב', lat: 32.08, lon: 34.78, size: 3 },
  { name: 'ראשון לציון', lat: 31.96, lon: 34.80, size: 3 },
  { name: 'פתח תקווה', lat: 32.09, lon: 34.89, size: 3 },
  { name: 'חולון', lat: 32.01, lon: 34.77, size: 3 },
  { name: 'בני ברק', lat: 32.08, lon: 34.83, size: 3 },
  { name: 'רמת גן', lat: 32.07, lon: 34.82, size: 3 },
  { name: 'בת ים', lat: 32.02, lon: 34.75, size: 2 },
  { name: 'גבעתיים', lat: 32.07, lon: 34.81, size: 2 },
  { name: 'קריית אונו', lat: 32.06, lon: 34.86, size: 2 },
  { name: 'אור יהודה', lat: 32.03, lon: 34.85, size: 2 },
  { name: 'יהוד', lat: 32.03, lon: 34.89, size: 2 },
  { name: 'ראש העין', lat: 32.09, lon: 34.95, size: 2 },
  { name: 'אלעד', lat: 32.05, lon: 34.95, size: 2 },
  { name: 'גני תקווה', lat: 32.06, lon: 34.87, size: 1 },
  { name: 'סביון', lat: 32.05, lon: 34.87, size: 1 },
  { name: 'כפר קאסם', lat: 32.11, lon: 34.98, size: 2 },
  { name: 'ג׳לג׳וליה', lat: 32.15, lon: 34.95, size: 1 },
  // --- Sharon ---
  { name: 'נתניה', lat: 32.33, lon: 34.86, size: 3 },
  { name: 'כפר סבא', lat: 32.18, lon: 34.91, size: 3 },
  { name: 'רעננה', lat: 32.18, lon: 34.87, size: 2 },
  { name: 'הרצליה', lat: 32.16, lon: 34.84, size: 2 },
  { name: 'הוד השרון', lat: 32.15, lon: 34.89, size: 2 },
  { name: 'רמת השרון', lat: 32.14, lon: 34.84, size: 2 },
  { name: 'טירה', lat: 32.23, lon: 35.00, size: 2 },
  { name: 'טייבה', lat: 32.27, lon: 35.01, size: 2 },
  { name: 'קלנסווה', lat: 32.28, lon: 34.98, size: 1 },
  { name: 'קדימה צורן', lat: 32.28, lon: 34.92, size: 1 },
  { name: 'אבן יהודה', lat: 32.27, lon: 34.89, size: 1 },
  { name: 'תל מונד', lat: 32.25, lon: 34.92, size: 1 },
  { name: 'כפר יונה', lat: 32.31, lon: 34.93, size: 1 },
  // --- Shfela / south center ---
  { name: 'רחובות', lat: 31.89, lon: 34.81, size: 3 },
  { name: 'נס ציונה', lat: 31.93, lon: 34.80, size: 2 },
  { name: 'לוד', lat: 31.95, lon: 34.89, size: 2 },
  { name: 'רמלה', lat: 31.93, lon: 34.87, size: 2 },
  { name: 'יבנה', lat: 31.88, lon: 34.74, size: 2 },
  { name: 'גדרה', lat: 31.81, lon: 34.78, size: 1 },
  { name: 'גן יבנה', lat: 31.79, lon: 34.70, size: 1 },
  { name: 'מודיעין', lat: 31.90, lon: 35.01, size: 3 },
  { name: 'שוהם', lat: 31.99, lon: 34.95, size: 1 },
  { name: 'בית שמש', lat: 31.75, lon: 34.99, size: 3 },
  // --- Jerusalem area ---
  { name: 'ירושלים', lat: 31.77, lon: 35.21, size: 3 },
  { name: 'מעלה אדומים', lat: 31.77, lon: 35.30, size: 2 },
  { name: 'ביתר עילית', lat: 31.70, lon: 35.12, size: 2 },
  { name: 'מבשרת ציון', lat: 31.80, lon: 35.15, size: 1 },
  { name: 'מודיעין עילית', lat: 31.93, lon: 35.04, size: 2 },
  // --- North / Haifa ---
  { name: 'חיפה', lat: 32.79, lon: 34.99, size: 3 },
  { name: 'קריית אתא', lat: 32.81, lon: 35.11, size: 2 },
  { name: 'קריית ביאליק', lat: 32.83, lon: 35.08, size: 2 },
  { name: 'קריית מוצקין', lat: 32.84, lon: 35.08, size: 2 },
  { name: 'קריית ים', lat: 32.85, lon: 35.07, size: 2 },
  { name: 'נשר', lat: 32.77, lon: 35.04, size: 1 },
  { name: 'טירת כרמל', lat: 32.76, lon: 34.97, size: 1 },
  { name: 'עכו', lat: 32.93, lon: 35.08, size: 2 },
  { name: 'נהריה', lat: 33.01, lon: 35.10, size: 2 },
  { name: 'כרמיאל', lat: 32.92, lon: 35.30, size: 2 },
  { name: 'מעלות תרשיחא', lat: 33.02, lon: 35.29, size: 2 },
  { name: 'שפרעם', lat: 32.81, lon: 35.17, size: 2 },
  { name: 'סחנין', lat: 32.86, lon: 35.30, size: 2 },
  { name: 'טמרה', lat: 32.85, lon: 35.20, size: 2 },
  { name: 'מגאר', lat: 32.89, lon: 35.41, size: 1 },
  { name: 'כפר כנא', lat: 32.75, lon: 35.34, size: 1 },
  { name: 'באקה אל גרביה', lat: 32.42, lon: 35.04, size: 2 },
  // --- Valleys / Galilee ---
  { name: 'נצרת', lat: 32.70, lon: 35.30, size: 3 },
  { name: 'נוף הגליל', lat: 32.71, lon: 35.32, size: 2 },
  { name: 'עפולה', lat: 32.61, lon: 35.29, size: 2 },
  { name: 'מגדל העמק', lat: 32.68, lon: 35.24, size: 2 },
  { name: 'יקנעם', lat: 32.66, lon: 35.11, size: 1 },
  { name: 'בית שאן', lat: 32.50, lon: 35.50, size: 1 },
  { name: 'טבריה', lat: 32.79, lon: 35.53, size: 2 },
  { name: 'צפת', lat: 32.96, lon: 35.50, size: 2 },
  { name: 'קריית שמונה', lat: 33.21, lon: 35.57, size: 2 },
  { name: 'ראש פינה', lat: 32.97, lon: 35.54, size: 1 },
  // --- Coast north-center ---
  { name: 'חדרה', lat: 32.43, lon: 34.92, size: 3 },
  { name: 'אור עקיבא', lat: 32.51, lon: 34.92, size: 1 },
  { name: 'פרדס חנה כרכור', lat: 32.47, lon: 34.97, size: 2 },
  { name: 'זכרון יעקב', lat: 32.57, lon: 34.95, size: 1 },
  { name: 'בנימינה', lat: 32.52, lon: 34.95, size: 1 },
  { name: 'אום אל פחם', lat: 32.52, lon: 35.15, size: 2 },
  // --- South ---
  { name: 'אשדוד', lat: 31.80, lon: 34.65, size: 3 },
  { name: 'אשקלון', lat: 31.67, lon: 34.57, size: 3 },
  { name: 'קריית גת', lat: 31.61, lon: 34.77, size: 2 },
  { name: 'קריית מלאכי', lat: 31.73, lon: 34.75, size: 1 },
  { name: 'באר שבע', lat: 31.25, lon: 34.79, size: 3 },
  { name: 'רהט', lat: 31.39, lon: 34.75, size: 2 },
  { name: 'נתיבות', lat: 31.42, lon: 34.59, size: 2 },
  { name: 'שדרות', lat: 31.52, lon: 34.60, size: 1 },
  { name: 'אופקים', lat: 31.31, lon: 34.62, size: 1 },
  { name: 'דימונה', lat: 31.07, lon: 35.03, size: 2 },
  { name: 'ערד', lat: 31.26, lon: 35.21, size: 1 },
  { name: 'אילת', lat: 29.56, lon: 34.95, size: 2 },
  { name: 'מצפה רמון', lat: 30.61, lon: 34.80, size: 1 },
];

const CITY_BY_NAME = new Map(CITIES.map(c => [c.name, c]));
export function findCity(name: string): City | undefined {
  return CITY_BY_NAME.get(name.trim());
}

/** Type-ahead: match on prefix first, then substring, capped. */
export function searchCities(q: string, limit = 8): City[] {
  const s = q.trim();
  if (!s) return [];
  const pre: City[] = [], sub: City[] = [];
  for (const c of CITIES) {
    if (c.name.startsWith(s)) pre.push(c);
    else if (c.name.includes(s)) sub.push(c);
  }
  return [...pre, ...sub].slice(0, limit);
}

/* --------------------------------------------------------- club identity */

type Prefix = 'מ.ס' | 'הפועל' | 'מכבי' | 'בית"ר' | 'בני' | 'צעירי' | 'איחוד' | 'הכוח' | 'עירוני';

interface CitySpec {
  prefix: Prefix;
  /** shown club name overrides `${prefix} ${city}` when set (e.g. abbreviations) */
  name?: string;
  short?: string;
  primary: string;
  secondary: string;
  accent?: string;
  shape?: CrestShape;
  pattern?: CrestPattern;
  founded?: number;
}

/**
 * Curated identities for the better known towns. These pick the SECONDARY club
 * of a city, never the famous flagship, so you are always the underdog of your
 * town, which is the right feeling for starting at the bottom.
 */
const CURATED: Record<string, CitySpec> = {
  'תל אביב':   { prefix: 'מ.ס', primary: '#1f6fd6', secondary: '#0b1f3a', accent: '#ffd233', shape: 'shield', pattern: 'sash' },
  'ירושלים':   { prefix: 'מכבי', primary: '#e23a3a', secondary: '#f4e7d8', accent: '#111111', shape: 'shield', pattern: 'half' },
  'חיפה':      { prefix: 'מ.ס', primary: '#2e8b57', secondary: '#04331b', accent: '#ffffff', shape: 'round', pattern: 'stripes' },
  'באר שבע':   { prefix: 'צעירי', name: 'צעירי ב"ש', short: 'צעירי ב"ש', primary: '#e2001a', secondary: '#1a1a1a', accent: '#ffffff', shape: 'shield', pattern: 'chevron' },
  'ראש העין':  { prefix: 'מ.ס', primary: '#e67e22', secondary: '#3a2109', accent: '#fff1e0', shape: 'shield', pattern: 'stripes' },
  'לוד':       { prefix: 'מכבי', primary: '#f1c40f', secondary: '#1a1a1a', accent: '#ffffff', shape: 'round', pattern: 'half' },
  'רמלה':      { prefix: 'הפועל', primary: '#c0392b', secondary: '#f4e7d8', accent: '#f1c40f', shape: 'round', pattern: 'sash' },
  'נתניה':     { prefix: 'בני', primary: '#f5c518', secondary: '#0b2540', accent: '#ffffff', shape: 'diamond', pattern: 'stripes' },
  'אשדוד':     { prefix: 'מ.ס', primary: '#c0392b', secondary: '#f5c518', accent: '#ffffff', shape: 'shield', pattern: 'half' },
  'אשקלון':    { prefix: 'הפועל', primary: '#e2001a', secondary: '#0b2540', accent: '#ffffff', shape: 'round', pattern: 'chevron' },
  'ראשון לציון': { prefix: 'הפועל', primary: '#c0392b', secondary: '#0b2540', accent: '#ecf6ff', shape: 'shield', pattern: 'stripes' },
  'פתח תקווה': { prefix: 'איחוד', primary: '#1a7a3a', secondary: '#f4e7d8', accent: '#111111', shape: 'shield', pattern: 'half' },
  'רחובות':    { prefix: 'מכבי', name: 'מכבי שעריים', short: 'שעריים', primary: '#e23a3a', secondary: '#f5c518', accent: '#111111', shape: 'round', pattern: 'sash' },
  'בת ים':     { prefix: 'הפועל', primary: '#2980b9', secondary: '#0b2540', accent: '#ecf6ff', shape: 'round', pattern: 'stripes' },
  'חולון':     { prefix: 'הפועל', primary: '#e2001a', secondary: '#1a1a1a', accent: '#ffffff', shape: 'shield', pattern: 'sash' },
  'רמת גן':    { prefix: 'הכוח', primary: '#16a085', secondary: '#04302a', accent: '#e0fbf6', shape: 'diamond', pattern: 'solid' },
  'הרצליה':    { prefix: 'הפועל', primary: '#8e44ad', secondary: '#2a123a', accent: '#f0e4f7', shape: 'diamond', pattern: 'half' },
  'כפר סבא':   { prefix: 'הפועל', primary: '#1a7a3a', secondary: '#f4e7d8', accent: '#111111', shape: 'shield', pattern: 'stripes' },
  'רעננה':     { prefix: 'מכבי', primary: '#2980b9', secondary: '#f4e7d8', accent: '#f1c40f', shape: 'round', pattern: 'half' },
  'טבריה':     { prefix: 'עירוני', name: 'עירוני טבריה', short: 'טבריה', primary: '#e67e22', secondary: '#0b2540', accent: '#ffffff', shape: 'shield', pattern: 'chevron' },
  'עכו':       { prefix: 'הפועל', primary: '#16a085', secondary: '#f4e7d8', accent: '#111111', shape: 'round', pattern: 'stripes' },
  'נצרת':      { prefix: 'הפועל', primary: '#e2001a', secondary: '#04331b', accent: '#ffffff', shape: 'shield', pattern: 'half' },
  'עפולה':     { prefix: 'הפועל', primary: '#27ae60', secondary: '#04331b', accent: '#eafaf1', shape: 'round', pattern: 'chevron' },
  'קריית שמונה': { prefix: 'עירוני', name: 'עירוני קריית שמונה', short: 'ק.שמונה', primary: '#e23a3a', secondary: '#1a1a1a', accent: '#ffffff', shape: 'shield', pattern: 'sash' },
  'טירה':      { prefix: 'מכבי', primary: '#1a7a3a', secondary: '#ffffff', accent: '#111111', shape: 'round', pattern: 'half' },
  'סחנין':     { prefix: 'בני', name: 'בני סח\'נין', short: 'סח\'נין', primary: '#e2001a', secondary: '#1a1a1a', accent: '#ffffff', shape: 'shield', pattern: 'chevron' },
  'אום אל פחם': { prefix: 'הפועל', primary: '#1a7a3a', secondary: '#f4e7d8', accent: '#111111', shape: 'round', pattern: 'stripes' },
  'דימונה':    { prefix: 'הפועל', primary: '#8e44ad', secondary: '#2a123a', accent: '#ffffff', shape: 'diamond', pattern: 'sash' },
  'קריית גת':  { prefix: 'מכבי', primary: '#2980b9', secondary: '#f5c518', accent: '#ffffff', shape: 'shield', pattern: 'half' },
  'נהריה':     { prefix: 'עירוני', name: 'עירוני נהריה', short: 'נהריה', primary: '#2980b9', secondary: '#ffffff', accent: '#f1c40f', shape: 'round', pattern: 'chevron' },
  'אילת':      { prefix: 'הפועל', primary: '#e67e22', secondary: '#0b2540', accent: '#ffffff', shape: 'diamond', pattern: 'stripes' },
  'מודיעין':   { prefix: 'מ.ס', name: 'מ.ס מודיעין', short: 'מודיעין', primary: '#1f6fd6', secondary: '#f4e7d8', accent: '#f1c40f', shape: 'shield', pattern: 'half' },
  'בית שמש':   { prefix: 'הפועל', primary: '#c0392b', secondary: '#1a1a1a', accent: '#ffffff', shape: 'shield', pattern: 'sash' },
};

const PREFIX_POOL: Prefix[] = ['מ.ס', 'הפועל', 'מכבי', 'בני', 'איחוד', 'צעירי', 'הכוח'];
const PALETTE: [string, string, string][] = [
  ['#c0392b', '#f4e7d8', '#f1c40f'], ['#2980b9', '#0b2540', '#ecf6ff'],
  ['#27ae60', '#04331b', '#eafaf1'], ['#8e44ad', '#2a123a', '#f0e4f7'],
  ['#e67e22', '#3a2109', '#fff1e0'], ['#16a085', '#04302a', '#e0fbf6'],
  ['#f1c40f', '#1a1a1a', '#ffffff'], ['#1f6fd6', '#0b1f3a', '#ffd233'],
];
const SHAPES: CrestShape[] = ['shield', 'round', 'diamond'];
const PATTERNS: CrestPattern[] = ['solid', 'stripes', 'half', 'sash', 'chevron'];

/** small stable hash of a string, 0..2^31 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

const BLURBS = [
  'קבוצת שכונה עם יציע קטן ורועש.', 'מועדון ותיק שרוצה לחזור למפה.',
  'קבוצה משפחתית, כולם מכירים את כולם.', 'מגרש ביתי שקשה לנצח בו.',
  'מפעל נוער שמגדל שחקנים לכל הארץ.', 'קבוצה קשוחה שאף אחד לא אוהב לבקר אצלה.',
];
const STRENGTHS = ['חלוצים רעבים שיודעים להבקיע', 'הגנה כמו קיר', 'מפעל כישרונות צעירים', 'קהל ביתי שמפחיד יריבות', 'סגל מנוסה ומאוזן'];
const WEAKNESSES = ['ההגנה דולפת בקלות', 'מתקשים לייצר מצבים', 'תקציב קטן', 'סגל צעיר וחסר ניסיון', 'אין כוכב שיקח משחק'];

/** id kept ASCII and stable, derived from the name hash */
function cityClubId(name: string): string {
  return `c${hash(name).toString(36)}`;
}

/**
 * Build a club for a city at a given tier. Curated towns use their hand picked
 * identity, the rest get a stable one from the name. Traits scale gently with
 * town size, so a big city carries more prestige and budget than a village,
 * without changing the division you start in.
 */
export function clubFromCity(city: City, tier = 1): Club {
  const spec = CURATED[city.name];
  const h = hash(city.name);
  const prefix = spec?.prefix ?? PREFIX_POOL[h % PREFIX_POOL.length];
  const pal = PALETTE[(h >>> 3) % PALETTE.length];
  const primary = spec?.primary ?? pal[0];
  const secondary = spec?.secondary ?? pal[1];
  const accent = spec?.accent ?? pal[2];
  const shape = spec?.shape ?? SHAPES[(h >>> 6) % SHAPES.length];
  const pattern = spec?.pattern ?? PATTERNS[(h >>> 9) % PATTERNS.length];
  const name = spec?.name ?? `${prefix} ${city.name}`;
  const short = spec?.short ?? city.name;
  const founded = spec?.founded ?? 1948 + (h % 55);

  // traits: bigger town, more prestige and money, less reliance on youth
  const sizeBump = (city.size - 2) * 4;               // -4, 0, +4
  const attack = ((h >>> 2) % 9) - 4;                  // -4..+4
  const defence = ((h >>> 5) % 9) - 4;
  const traits: ClubTraits = {
    attack, defence,
    budget: Math.round((0.85 + city.size * 0.12 + ((h >>> 8) % 5) * 0.05) * 100) / 100,
    prestige: Math.max(20, Math.min(48, 30 + sizeBump + ((h >>> 11) % 7))),
    youth: Math.round((city.size === 1 ? 0.34 : city.size === 2 ? 0.2 : 0.12) * 100) / 100,
  };

  return {
    id: cityClubId(city.name),
    name, short, city: city.name,
    primary, secondary, accent, shape, pattern, founded, tier,
    blurb: BLURBS[(h >>> 4) % BLURBS.length],
    strength: STRENGTHS[(h >>> 7) % STRENGTHS.length],
    weakness: WEAKNESSES[(h >>> 10) % WEAKNESSES.length],
    traits,
  };
}

/** Rough km distance, good enough to rank neighbours. */
function distKm(a: City, b: City): number {
  const dLat = (a.lat - b.lat) * 111;
  const dLon = (a.lon - b.lon) * 95;   // cos(31.5°) ≈ 0.85 * 111
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** The n nearest towns to a city, closest first, excluding itself. */
export function nearestCities(city: City, n: number): City[] {
  return CITIES
    .filter(c => c.name !== city.name)
    .map(c => ({ c, d: distKm(city, c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(x => x.c);
}

/**
 * The whole starting division built from a real region: your town plus the
 * seven nearest, each a real club, with the closest neighbour set as your
 * derby. This is what makes ליגה ג׳ feel like your actual corner of the map.
 */
export function buildRegionLeague(cityName: string, tier = 1): { clubs: Club[]; myId: string; derbyId: string } {
  const city = findCity(cityName) ?? CITIES[0];
  const all = [city, ...nearestCities(city, 7)];
  const clubs = all.map(c => clubFromCity(c, tier));
  // rival = the nearest OTHER town inside this league, by index so the club and
  // its city stay aligned
  for (let i = 0; i < all.length; i++) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < all.length; j++) {
      if (j === i) continue;
      const d = distKm(all[i], all[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0) clubs[i].rivalId = clubs[best].id;
  }
  return { clubs, myId: clubs[0].id, derbyId: clubs[0].rivalId ?? clubs[1].id };
}
