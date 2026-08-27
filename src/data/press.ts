/**
 * Post match press conference. A reporter from an Israeli sports outlet asks
 * one question, chosen to fit the match you just played and your standing.
 * Your answer nudges morale and prestige, so the media game is part of the loop.
 *
 * Outlets are invented so no real brand is used, but they read like the scene:
 * ספורט WOW, ספורט 555, ספורט ישראל, Yספורט, Nספורט.
 */

export const OUTLETS = ['ספורט WOW', 'ספורט 555', 'ספורט ישראל', 'Yספורט', 'Nספורט'] as const;
export type Outlet = typeof OUTLETS[number];

export type PressTone = 'funny' | 'serious' | 'brutal';

/** The situation after a match, used to pick a fitting question. */
export interface PressContext {
  result: 'big_win' | 'win' | 'draw' | 'loss' | 'thrashing';   // thrashing = heavy loss
  isDerby: boolean;
  lowMorale: boolean;
  highPrestige: boolean;
  tablePos: number;      // 1 = top
  totalTeams: number;
  star: string;          // your best player's family name
  rival: string;         // opponent short name
  city: string;          // the club's home town, for the local press angle
}

export interface PressAnswer {
  label: string;
  effect: { morale?: number; prestige?: number };
  reply: string;   // the reporter's or public reaction after you answer
}

export interface PressQuestion {
  tone: PressTone;
  text: string;
  answers: PressAnswer[];
}

type QGen = (c: PressContext) => PressQuestion;

/* Each generator returns a question already filled with the live context. */

const BY_RESULT: Record<PressContext['result'], QGen[]> = {
  big_win: [
    c => ({
      tone: 'serious',
      text: `ניצחון גדול. ${c.star} היה בלתי ניתן לעצירה. זו הקבוצה האמיתית או שהיריבה פשוט הייתה חלשה?`,
      answers: [
        { label: 'זאת הקבוצה שלנו, תתרגלו', effect: { prestige: +4, morale: +3 }, reply: 'הצהרה בטוחה. הכותרות מחר יאהבו את זה.' },
        { label: 'צעד אחד בכל פעם, בלי לעוף', effect: { morale: +4 }, reply: 'ענווה. השחקנים שמעו ואהבו.' },
      ],
    }),
    c => ({
      tone: 'funny',
      text: `אחרי הביצוע הזה, מתי אתה מבקש העלאה מהבעלים?`,
      answers: [
        { label: 'כבר שלחתי לו הודעה', effect: { morale: +2 }, reply: 'צחוק באולם. קטע נחמד לטיקטוק.' },
        { label: 'קודם נשמור על הרגליים על הקרקע', effect: { prestige: +2 }, reply: 'תשובה מקצועית, קצת משעממת.' },
      ],
    }),
  ],
  win: [
    c => ({
      tone: 'serious',
      text: `שלוש נקודות חשובות. הרגשת שהקבוצה בשליטה, או שזה היה יותר קרוב ממה שנראה?`,
      answers: [
        { label: 'שלטנו מהדקה הראשונה', effect: { prestige: +3, morale: +2 }, reply: 'הצגת ביטחון. היריבה תזכור.' },
        { label: 'עבדנו קשה על כל כדור', effect: { morale: +3 }, reply: 'הערכת את השחקנים. חדר ההלבשה מרוצה.' },
      ],
    }),
  ],
  draw: [
    c => ({
      tone: 'brutal',
      text: `עוד תיקו. בקצב הזה לא עולים ליגה. אתה לא מרגיש שאתה מבזבז עונה?`,
      answers: [
        { label: 'תשאל אותי בסוף העונה', effect: { prestige: +3, morale: -1 }, reply: 'עמדת מולו. חלק אהבו, חלק חשבו שהתחמקת.' },
        { label: 'צודק, חייבים יותר', effect: { morale: -3, prestige: +2 }, reply: 'הודית בבעיה. השחקנים קצת נלחצו.' },
      ],
    }),
    c => ({
      tone: 'serious',
      text: `נקודה בחוץ. אתה מרוצה או מאוכזב?`,
      answers: [
        { label: 'לוקחים את הנקודה וממשיכים', effect: { morale: +2 }, reply: 'תשובה מאוזנת.' },
        { label: 'באנו לנצח, זה מאכזב', effect: { prestige: +2, morale: -1 }, reply: 'שידרת רעב. היציע אוהב את זה.' },
      ],
    }),
  ],
  loss: [
    c => ({
      tone: 'brutal',
      text: `הפסד שכואב. יש אוהדים שכבר קוראים להחליף אותך. יש לך מה להגיד להם?`,
      answers: [
        { label: 'אני לא בורח מאחריות', effect: { prestige: +4, morale: +1 }, reply: 'עמדת זקוף. זה עובר טוב בעיתונות.' },
        { label: 'הם צודקים לכעוס, נתקן', effect: { morale: +3, prestige: -2 }, reply: 'הזדהית עם הכאב שלהם. היציע התרכך.' },
      ],
    }),
    c => ({
      tone: 'serious',
      text: `איפה המשחק נשבר לדעתך?`,
      answers: [
        { label: 'לקחתי אחריות, זו טעות שלי', effect: { morale: +3, prestige: -1 }, reply: 'הגנת על השחקנים. הם יזכרו את זה.' },
        { label: 'החמצנו את המצבים, זה הכל', effect: { morale: +1 }, reply: 'ניתוח יבש. עבר בשקט.' },
      ],
    }),
  ],
  thrashing: [
    c => ({
      tone: 'brutal',
      text: `ספגתם ביזיון. איך בכלל מסבירים משחק כזה לאוהדים שנסעו עד לכאן?`,
      answers: [
        { label: 'הביזיון עליי, לא על האוהדים', effect: { prestige: +3, morale: +2 }, reply: 'לקחת את הכדור. מהלך של מנהיג.' },
        { label: 'יום כזה לא יחזור, אני מבטיח', effect: { morale: +2, prestige: -2 }, reply: 'הבטחה גדולה. עכשיו תצטרך לעמוד בה.' },
      ],
    }),
    c => ({
      tone: 'funny',
      text: `בתוצאה כזאת, בא לך בכלל לענות לי או שאתה מעדיף ללכת הביתה?`,
      answers: [
        { label: 'אני פה, תשאל מה שבא לך', effect: { prestige: +2 }, reply: 'לא ברחת. מכובד.' },
        { label: 'בוא נגמור עם זה מהר', effect: { morale: -1 }, reply: 'קצר וקצת עצבני. מובן.' },
      ],
    }),
  ],
};

/** Special overrides that beat the result based questions when relevant. */
const DERBY: QGen = c => ({
  tone: 'serious',
  text: `דרבי מול ${c.rival} זה לא עוד משחק. הרגשת את הלחץ המיוחד היום?`,
  answers: [
    { label: 'בשביל זה נכנסתי לעבודה הזאת', effect: { prestige: +4, morale: +3 }, reply: 'היציע ישתה את המילים האלה.' },
    { label: 'לחץ זה חלק מהמשחק, התרגלנו', effect: { morale: +2 }, reply: 'קור רוח. מקצועי.' },
  ],
});

const RELEGATION: QGen = c => ({
  tone: 'brutal',
  text: `אתם מקום ${c.tablePos} מתוך ${c.totalTeams}, ממש בתחתית. אתה עדיין מאמין שאפשר להציל את העונה?`,
  answers: [
    { label: 'העונה רק מתחילה מבחינתי', effect: { prestige: +3, morale: +2 }, reply: 'ביטחון מול המצוקה. חלק ישתכנעו.' },
    { label: 'נילחם על כל נקודה, אין ויתור', effect: { morale: +3 }, reply: 'קריאת קרב. השחקנים הזדקפו.' },
  ],
});

/**
 * The local angle. The town paper cares less about the league table and more
 * about whether its own club is going somewhere, which is exactly the belonging
 * the city pick is built on.
 */
const LOCAL: QGen[] = [
  c => ({
    tone: 'serious',
    text: `כתב מקומון ${c.city} כאן. כל העיר שואלת אותי מתי סוף סוף חוזרים למקום שמגיע לנו. מה אני אגיד להם?`,
    answers: [
      { label: `${c.city} תהיה גאה בקבוצה הזאת`, effect: { prestige: +3, morale: +3 }, reply: 'הבטחה ישירה לתושבים. הרחוב אהב.' },
      { label: 'תגיד להם לבוא למגרש ולראות', effect: { morale: +2 }, reply: 'קריאה ליציע. פשוט ונכון.' },
    ],
  }),
  c => ({
    tone: 'funny',
    text: `ב${c.city} כבר מדברים עליך בבתי קפה יותר מאשר על ראש העיר. איך זה מרגיש?`,
    answers: [
      { label: 'שיפסיקו, אני בסך הכל עושה עבודה', effect: { morale: +2 }, reply: 'ענווה מקומית. חיבבו את זה.' },
      { label: 'ראש עיר מתחלף, מאמן טוב נשאר', effect: { prestige: +3 }, reply: 'שורה לכותרת. חצי חייכו, חצי הרימו גבה.' },
    ],
  }),
  c => ({
    tone: 'serious',
    text: `הרבה ילדים ב${c.city} התחילו ללבוש את הצבעים בזכות מה שאתה עושה. אתה מרגיש את האחריות הזאת?`,
    answers: [
      { label: 'זו הסיבה שאני פה', effect: { prestige: +2, morale: +3 }, reply: 'תשובה מהלב. המקומון יכתיר אותה.' },
      { label: 'קודם תוצאות, אחר כך רגש', effect: { prestige: +2 }, reply: 'ענייני. חלק ציפו ליותר חום.' },
    ],
  }),
];

const TOP: QGen = c => ({
  tone: 'serious',
  text: `אתם בפסגת הטבלה. המילה אליפות כבר לא מוגזמת. אתה מוכן להגיד אותה בקול?`,
  answers: [
    { label: 'אנחנו הולכים על האליפות', effect: { prestige: +5, morale: +2 }, reply: 'הכרזה נועזת. עכשיו כולם רודפים אותך.' },
    { label: 'מחזור מחזור, בלי להתרברב', effect: { morale: +3, prestige: +1 }, reply: 'ראש שקט. השחקנים אוהבים את היציבות.' },
  ],
});

/** Pick a fitting question. rng in [0,1) chooses among candidates. */
export function pickPressQuestion(c: PressContext, rng: number): { outlet: Outlet; q: PressQuestion } {
  const outlet = OUTLETS[Math.floor(rng * OUTLETS.length)];

  // priority overrides
  if (c.isDerby && rng > 0.4) return { outlet, q: DERBY(c) };
  if (c.tablePos >= c.totalTeams - 1 && (c.result === 'loss' || c.result === 'draw')) return { outlet, q: RELEGATION(c) };
  if (c.tablePos === 1 && (c.result === 'win' || c.result === 'big_win')) return { outlet, q: TOP(c) };

  // roughly a quarter of the time the town paper gets in first, with its own byline
  if (rng < 0.25) {
    const q = LOCAL[Math.floor(rng * 4) % LOCAL.length](c);
    return { outlet: `מקומון ${c.city}` as Outlet, q };
  }

  const pool = BY_RESULT[c.result];
  const q = pool[Math.floor(rng * pool.length)];
  return { outlet, q: q(c) };
}
