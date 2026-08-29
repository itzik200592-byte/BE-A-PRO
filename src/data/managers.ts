/**
 * The manager you are. Picked at the very start, it sets your coaching CV: a
 * style, not a power level. Every archetype starts on the same total of ability
 * points, spread differently, so the choice is about how you win rather than
 * how much you win.
 *
 * Attributes run 1..20, the coaching scale, deliberately unlike the 40..99 the
 * players use so the two are never confused.
 */

export type ManagerId = 'youth' | 'recruiter' | 'mental' | 'charismatic' | 'tactician';

/** What a coach is actually good at. Two groups, see CoachAttrs below. */
export interface CoachAttrs {
  /* training */
  attack: number;
  defence: number;
  tactics: number;
  fitness: number;
  /* mental */
  determination: number;   // the drive to prove himself and his players
  motivation: number;      // the ability to inspire and lift a dressing room
  discipline: number;      // how hard he is. Fewer complaints, less warmth
}

export const TRAINING_KEYS = ['attack', 'defence', 'tactics', 'fitness'] as const;
export const MENTAL_KEYS = ['determination', 'motivation', 'discipline'] as const;

export const ATTR_LABEL: Record<keyof CoachAttrs, string> = {
  attack: 'התקפה', defence: 'הגנה', tactics: 'טקטיקה', fitness: 'כושר גופני',
  determination: 'נחישות', motivation: 'מוטיבציה', discipline: 'רמת משמעת',
};

export const ATTR_HINT: Record<keyof CoachAttrs, string> = {
  attack: 'כמה הקבוצה מסוכנת קדימה',
  defence: 'כמה קשה להבקיע לכם',
  tactics: 'כמה ההוראות שלך באמת עובדות על המגרש',
  fitness: 'כמה מהר השחקנים מתאוששים בין מחזורים',
  determination: 'הרצון והדחף שלך להצליח ולהוכיח, ולהוציא את זה מהשחקנים',
  motivation: 'היכולת להלהיב ולעורר השראה בשחקנים',
  discipline: 'כמה אתה קשוח. מונע תלונות, אבל קשה יותר להתחבר אליך אישית',
};

export interface ManagerType {
  id: ManagerId;
  name: string;
  tagline: string;
  perk: string;
  cost: string;
  /** starting ability, before any course */
  base: CoachAttrs;
  /** starting budget multiplier, the one thing the CV changes off the pitch */
  budgetBias: number;
}

/** every archetype starts on the same total, so this is style and not power */
export const START_TOTAL = 56;

export const MANAGERS: ManagerType[] = [
  {
    id: 'youth', name: 'מפתח הנוער', tagline: 'חושב על העתיד. יודע לקחת ילד ממחלקת הנוער ולהפוך אותו לשחקן.',
    perk: 'צעירים מתפתחים אצלך הרבה יותר מהר', cost: 'פחות שליטה טקטית ביום המשחק',
    base: { attack: 6, defence: 6, tactics: 9, fitness: 11, determination: 9, motivation: 9, discipline: 6 },
    budgetBias: 0.9,
  },
  {
    id: 'recruiter', name: 'הצייד', tagline: 'יודע בדיוק את מי להביא, ובכל תקציב.',
    perk: 'תקציב פתיחה גדול יותר, ועין לשחקנים מוכחים', cost: 'לא באמת מפתח את מי שכבר יש לך',
    base: { attack: 9, defence: 9, tactics: 9, fitness: 6, determination: 11, motivation: 6, discipline: 6 },
    budgetBias: 1.35,
  },
  {
    id: 'mental', name: 'המנטליסט', tagline: 'קודם כל דרך ארץ, ואחר כך הכדורגל. אהוב על השחקנים.',
    perk: 'חדר הלבשה חזק, מורל שלא נשבר', cost: 'לא מביא יתרון טקטי או פיזי',
    base: { attack: 6, defence: 6, tactics: 7, fitness: 7, determination: 12, motivation: 12, discipline: 6 },
    budgetBias: 1.0,
  },
  {
    id: 'charismatic', name: 'הכריזמטי', tagline: 'מלהיב את הקבוצה מהשנייה הראשונה ועד האחרונה. משחקים בשבילך, אבל לא מבין בטקטיקה.',
    perk: 'מלהיב שחקנים כמו אף אחד', cost: 'ידע טקטי כמעט אפסי',
    base: { attack: 8, defence: 7, tactics: 3, fitness: 8, determination: 10, motivation: 14, discipline: 6 },
    budgetBias: 1.0,
  },
  {
    id: 'tactician', name: 'הטקטיקן', tagline: 'מחושב מאוד, יודע לנתח את הקבוצה היריבה. פחות אוהב דיבורים, לוח המשחק חשוב יותר.',
    perk: 'הוראות שעובדות, קבוצה מסודרת בשני הצדדים', cost: 'קר, לא מצליח להלהיב',
    base: { attack: 10, defence: 10, tactics: 14, fitness: 7, determination: 7, motivation: 3, discipline: 5 },
    budgetBias: 1.0,
  },
];

export function getManager(id: ManagerId): ManagerType {
  return MANAGERS.find(m => m.id === id) ?? MANAGERS[2];
}
