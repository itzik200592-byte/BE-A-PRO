/**
 * The Israeli ladder above ליגה ג'.
 *
 * Every club here is invented, in the spirit of the legal strategy for this
 * project: made up towns, original colours, no real badge or trademark. The
 * higher the tier, the bigger the club sounds, so promotion feels like walking
 * into a different world rather than the same league with new names.
 *
 * Tier 1 (ליגה ג') lives in clubs.ts because those are the ones the manager can
 * actually pick at the start. Everything from ליגה ב' upward lives here.
 */

import type { Club, ClubTraits, CrestShape, CrestPattern } from './clubs.ts';

interface Spec {
  id: string; name: string; short: string; city: string;
  c: [string, string, string];          // primary, secondary, accent
  shape: CrestShape; pattern: CrestPattern; founded: number;
  atk: number; def: number;             // squad nudge in OVR points
  blurb: string; strength: string; weakness: string;
}

/** Prestige and money grow with the division, the rest comes from the spec. */
function build(tier: number, s: Spec): Club {
  const traits: ClubTraits = {
    attack: s.atk, defence: s.def,
    budget: 1 + (tier - 1) * 0.35,
    prestige: 26 + tier * 11,
    youth: 0.16,
  };
  return {
    id: s.id, name: s.name, short: s.short, city: s.city,
    primary: s.c[0], secondary: s.c[1], accent: s.c[2],
    shape: s.shape, pattern: s.pattern, founded: s.founded, tier,
    blurb: s.blurb, strength: s.strength, weakness: s.weakness,
    traits,
  };
}

/* ------------------------------------------------------------ ליגה ב' */
const T2: Spec[] = [
  { id: 'kerem-oren', name: 'הפועל כרם אורן', short: 'כרם אורן', city: 'כרם אורן',
    c: ['#1f7a4d', '#f2f2f2', '#f1c40f'], shape: 'shield', pattern: 'stripes', founded: 1958, atk: 2, def: -1,
    blurb: 'מועדון כפרי שגדל מהר מדי.', strength: 'אגפים מהירים', weakness: 'חסרי ניסיון בלחץ' },
  { id: 'maale-shaked', name: 'מכבי מעלה שקד', short: 'מעלה שקד', city: 'מעלה שקד',
    c: ['#2c3e94', '#ffffff', '#e74c3c'], shape: 'round', pattern: 'half', founded: 1963, atk: -1, def: 3,
    blurb: 'מסורת של הגנה חונקת.', strength: 'קו אחורי ממושמע', weakness: 'מתקשים להבקיע' },
  { id: 'neve-gilad', name: 'בני נווה גלעד', short: 'נווה גלעד', city: 'נווה גלעד',
    c: ['#8e44ad', '#f5f5f5', '#f39c12'], shape: 'diamond', pattern: 'sash', founded: 1971, atk: 1, def: 1,
    blurb: 'קבוצה משפחתית עם יציע נאמן.', strength: 'אווירה ביתית קשה', weakness: 'קורסים בחוץ' },
  { id: 'sdot-rimon', name: 'הפועל שדות רימון', short: 'שדות רימון', city: 'שדות רימון',
    c: ['#c0392b', '#2c2c2c', '#ecf0f1'], shape: 'shield', pattern: 'solid', founded: 1949, atk: 3, def: -2,
    blurb: 'משחקים קדימה תמיד, יהיה מה שיהיה.', strength: 'התקפה חסרת פחד', weakness: 'נפתחים מאחור' },
  { id: 'givat-brosh', name: 'מכבי גבעת ברוש', short: 'גבעת ברוש', city: 'גבעת ברוש',
    c: ['#16a085', '#1a1a1a', '#ffffff'], shape: 'round', pattern: 'chevron', founded: 1966, atk: 0, def: 2,
    blurb: 'מועדון מסודר עם תקציב קטן.', strength: 'ארגון טקטי', weakness: 'סגל דק' },
  { id: 'tel-erez', name: 'הפועל תל ארז', short: 'תל ארז', city: 'תל ארז',
    c: ['#d35400', '#ffffff', '#34495e'], shape: 'shield', pattern: 'stripes', founded: 1955, atk: 1, def: 0,
    blurb: 'עולים ויורדים כל שנתיים.', strength: 'קישור עובד', weakness: 'חוסר יציבות' },
  { id: 'ein-haruv', name: 'בני עין חרוב', short: 'עין חרוב', city: 'עין חרוב',
    c: ['#2980b9', '#f1c40f', '#ffffff'], shape: 'diamond', pattern: 'half', founded: 1974, atk: -2, def: 2,
    blurb: 'סבלנות, בלי פאניקה.', strength: 'משמעת', weakness: 'איטיים' },
  { id: 'kfar-tamar', name: 'מכבי כפר תמר', short: 'כפר תמר', city: 'כפר תמר',
    c: ['#27ae60', '#2c2c2c', '#f39c12'], shape: 'round', pattern: 'solid', founded: 1961, atk: 2, def: 1,
    blurb: 'מפעל נוער שמתחיל להניב.', strength: 'צעירים מוכשרים', weakness: 'ירוקים מדי' },
];

/* ------------------------------------------------------------ ליגה א' */
const T3: Spec[] = [
  { id: 'ramat-yahalom', name: 'הפועל רמת יהלום', short: 'רמת יהלום', city: 'רמת יהלום',
    c: ['#c0392b', '#ffffff', '#1a1a1a'], shape: 'shield', pattern: 'sash', founded: 1946, atk: 2, def: 2,
    blurb: 'מועדון עם עבר, שרוצה עתיד.', strength: 'ניסיון בליגות בכירות', weakness: 'סגל מזדקן' },
  { id: 'har-kramim', name: 'מכבי הר כרמים', short: 'הר כרמים', city: 'הר כרמים',
    c: ['#1abc9c', '#0f2027', '#ffffff'], shape: 'round', pattern: 'stripes', founded: 1952, atk: 3, def: 0,
    blurb: 'כדורגל התקפי, יציע דורשני.', strength: 'קו התקפה איכותי', weakness: 'לחץ מהיציע' },
  { id: 'nahal-ela', name: 'בני נחל אלה', short: 'נחל אלה', city: 'נחל אלה',
    c: ['#34495e', '#e67e22', '#ffffff'], shape: 'diamond', pattern: 'chevron', founded: 1968, atk: 0, def: 3,
    blurb: 'הכי קשה לשבור בליגה.', strength: 'הגנה אטומה', weakness: 'עקרים בהתקפה' },
  { id: 'givat-marva', name: 'הפועל גבעת מרווה', short: 'גבעת מרווה', city: 'גבעת מרווה',
    c: ['#9b59b6', '#f5f5f5', '#f1c40f'], shape: 'shield', pattern: 'half', founded: 1959, atk: 1, def: 1,
    blurb: 'קבוצה שמנהלת את עצמה נכון.', strength: 'איזון', weakness: 'בלי כוכב' },
  { id: 'sde-teena', name: 'מכבי שדה תאנה', short: 'שדה תאנה', city: 'שדה תאנה',
    c: ['#f39c12', '#1a1a1a', '#ffffff'], shape: 'round', pattern: 'solid', founded: 1964, atk: 2, def: -1,
    blurb: 'מהירים, פרועים, לא צפויים.', strength: 'מעברים מהירים', weakness: 'ריכוז' },
  { id: 'maayan-zohar', name: 'הפועל מעיין זוהר', short: 'מעיין זוהר', city: 'מעיין זוהר',
    c: ['#2980b9', '#ffffff', '#c0392b'], shape: 'shield', pattern: 'stripes', founded: 1950, atk: -1, def: 2,
    blurb: 'ותיקה, עקשנית, לא מוותרת.', strength: 'אופי', weakness: 'איכות טכנית' },
  { id: 'kfar-lotem', name: 'בני כפר לוטם', short: 'כפר לוטם', city: 'כפר לוטם',
    c: ['#16a085', '#f1c40f', '#1a1a1a'], shape: 'diamond', pattern: 'sash', founded: 1977, atk: 1, def: 2,
    blurb: 'תקציב בינוני, ראש גדול.', strength: 'קישור חזק', weakness: 'עומק ספסל' },
  { id: 'tel-barkan', name: 'מכבי תל ברקן', short: 'תל ברקן', city: 'תל ברקן',
    c: ['#e74c3c', '#2c3e50', '#ffffff'], shape: 'round', pattern: 'half', founded: 1957, atk: 3, def: 1,
    blurb: 'הפייבוריטית הנצחית לעלייה.', strength: 'סגל עמוק', weakness: 'לחץ ציפיות' },
];

/* ------------------------------------------------- הליגה הלאומית */
const T4: Spec[] = [
  { id: 'ashed-yarden', name: 'הפועל אשד הירדן', short: 'אשד הירדן', city: 'אשד הירדן',
    c: ['#c0392b', '#f4f4f4', '#f1c40f'], shape: 'shield', pattern: 'stripes', founded: 1938, atk: 3, def: 2,
    blurb: 'מועדון היסטורי שנפל וחוזר.', strength: 'קהל ענק', weakness: 'הנהלה לא יציבה' },
  { id: 'marom-galil', name: 'מכבי מרום גליל', short: 'מרום גליל', city: 'מרום גליל',
    c: ['#27ae60', '#1a1a1a', '#ffffff'], shape: 'round', pattern: 'solid', founded: 1943, atk: 2, def: 3,
    blurb: 'עבודה שקטה, תוצאות עקביות.', strength: 'יציבות', weakness: 'חוסר ניצוץ' },
  { id: 'hof-almog', name: 'הפועל חוף אלמוג', short: 'חוף אלמוג', city: 'חוף אלמוג',
    c: ['#2980b9', '#ffffff', '#e67e22'], shape: 'diamond', pattern: 'half', founded: 1955, atk: 4, def: 0,
    blurb: 'כדורגל יפה, הגנה פחות.', strength: 'יצירתיות', weakness: 'רכות הגנתית' },
  { id: 'ramat-shaham', name: 'בית"ר רמת שחם', short: 'רמת שחם', city: 'רמת שחם',
    c: ['#f1c40f', '#1a1a1a', '#ffffff'], shape: 'shield', pattern: 'chevron', founded: 1947, atk: 2, def: 2,
    blurb: 'יציע רותח, לחץ בלתי פוסק.', strength: 'אווירת בית', weakness: 'משמעת' },
  { id: 'emek-dekel', name: 'מכבי עמק דקל', short: 'עמק דקל', city: 'עמק דקל',
    c: ['#8e44ad', '#f5f5f5', '#1abc9c'], shape: 'round', pattern: 'sash', founded: 1961, atk: 1, def: 3,
    blurb: 'שיטה לפני שמות.', strength: 'טקטיקה', weakness: 'סגל ממוצע' },
  { id: 'har-nitzan', name: 'הפועל הר ניצן', short: 'הר ניצן', city: 'הר ניצן',
    c: ['#d35400', '#2c2c2c', '#ffffff'], shape: 'shield', pattern: 'stripes', founded: 1951, atk: 3, def: 1,
    blurb: 'עולים על כל כדור.', strength: 'עוצמה פיזית', weakness: 'כרטיסים' },
  { id: 'shaar-hadas', name: 'מכבי שער הדס', short: 'שער הדס', city: 'שער הדס',
    c: ['#16a085', '#ffffff', '#c0392b'], shape: 'diamond', pattern: 'solid', founded: 1966, atk: 2, def: 2,
    blurb: 'מפעל נוער מהטובים בארץ.', strength: 'כישרונות צעירים', weakness: 'מוכרים מוקדם' },
  { id: 'karmey-zayit', name: 'הפועל כרמי זית', short: 'כרמי זית', city: 'כרמי זית',
    c: ['#2c3e50', '#f39c12', '#ffffff'], shape: 'round', pattern: 'half', founded: 1940, atk: 4, def: 2,
    blurb: 'הכי קרובה לעלייה, כל שנה.', strength: 'איכות רוחבית', weakness: 'נשברים בסוף עונה' },
];

/* ----------------------------------------------------------- ליגת העל */
const T5: Spec[] = [
  { id: 'maccabi-tzafon', name: 'מכבי הצפון', short: 'הצפון', city: 'הצפון',
    c: ['#0e8f4d', '#ffffff', '#1a1a1a'], shape: 'round', pattern: 'solid', founded: 1913, atk: 5, def: 4,
    blurb: 'אלופה סדרתית, סגל של מיליונים.', strength: 'עומק ואיכות', weakness: 'שחצנות' },
  { id: 'hapoel-mifratz', name: 'הפועל המפרץ', short: 'המפרץ', city: 'המפרץ',
    c: ['#c0392b', '#f4f4f4', '#f1c40f'], shape: 'shield', pattern: 'stripes', founded: 1924, atk: 4, def: 4,
    blurb: 'יציע אדום שלא מפסיק לשיר.', strength: 'קהל ולחץ', weakness: 'עצבים במשחקים גדולים' },
  { id: 'beitar-habira', name: 'בית"ר הבירה', short: 'הבירה', city: 'הבירה',
    c: ['#f1c40f', '#1a1a1a', '#ffffff'], shape: 'shield', pattern: 'half', founded: 1936, atk: 4, def: 3,
    blurb: 'המועדון הכי רגשי בארץ.', strength: 'אנרגיה מטורפת', weakness: 'תנודתיות' },
  { id: 'maccabi-merkaz', name: 'מכבי המרכז', short: 'המרכז', city: 'המרכז',
    c: ['#f4d03f', '#1b4f9c', '#ffffff'], shape: 'round', pattern: 'stripes', founded: 1906, atk: 5, def: 3,
    blurb: 'הכי הרבה תארים, הכי הרבה ציפיות.', strength: 'תקציב עצום', weakness: 'סבלנות אפס' },
  { id: 'hapoel-darom', name: 'הפועל הדרום', short: 'הדרום', city: 'הדרום',
    c: ['#e74c3c', '#2c2c2c', '#ffffff'], shape: 'diamond', pattern: 'chevron', founded: 1949, atk: 4, def: 4,
    blurb: 'עלתה מהשוליים לצמרת.', strength: 'רוח קבוצתית', weakness: 'עומק סגל' },
  { id: 'maccabi-shfela', name: 'מכבי השפלה', short: 'השפלה', city: 'השפלה',
    c: ['#2980b9', '#ffffff', '#f39c12'], shape: 'round', pattern: 'sash', founded: 1928, atk: 3, def: 4,
    blurb: 'מסודרת, קשה, לא זוהרת.', strength: 'הגנה מצוינת', weakness: 'שערים' },
  { id: 'hapoel-sharon', name: 'הפועל השרון', short: 'השרון', city: 'השרון',
    c: ['#8e44ad', '#f5f5f5', '#1abc9c'], shape: 'shield', pattern: 'solid', founded: 1934, atk: 4, def: 2,
    blurb: 'כדורגל מודרני, מאמן צעיר.', strength: 'לחץ גבוה', weakness: 'ניסיון' },
  { id: 'bnei-galil', name: 'בני הגליל', short: 'הגליל', city: 'הגליל',
    c: ['#16a085', '#1a1a1a', '#f1c40f'], shape: 'diamond', pattern: 'half', founded: 1955, atk: 3, def: 3,
    blurb: 'הכי אוהבים לפוצץ את הגדולות.', strength: 'משחקי חוץ', weakness: 'עקביות' },
];

const POOLS: Record<number, Spec[]> = { 2: T2, 3: T3, 4: T4, 5: T5 };

/**
 * The other clubs in a division. Tier 1 comes from clubs.ts, so this covers
 * ליגה ב' upward. Returns fresh copies so callers can mutate freely.
 */
export function clubsForTier(tier: number): Club[] {
  const specs = POOLS[tier];
  if (!specs) return [];
  return specs.map(s => build(tier, s));
}
