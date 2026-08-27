/**
 * The terrace. Not four jokers, a whole cast of regulars with different heads
 * on their shoulders, because a real crowd is not one voice. Some are funny,
 * one is a prophet of doom, one counts goal difference in his sleep, and the
 * loudest of the lot is the veteran who is convinced he understands the game
 * better than the man in the dugout and never lets you forget it.
 *
 * Everything they say is keyed to the real save: who stopped scoring, the run
 * of results, the derby, where you sit, and even the tactic you picked. A big
 * pool plus slots plus a short memory means you rarely hear the same line twice.
 */

import type { Rng, Approach } from '../engine/matchEngine.ts';

/** The head a fan watches football with. Drives which lines are his to say. */
export type Voice =
  | 'sage'       // knows better than the coach, always
  | 'doom'       // it will end badly, it always does
  | 'nostalgic'  // in my day
  | 'hope'       // this is our year, you'll see
  | 'super'      // do not jinx it
  | 'hot'        // pure blood pressure
  | 'numbers'    // quotes the table at you
  | 'heart';     // takes every result personally

export interface Fan {
  id: string;
  name: string;
  bio: string;
  voice: Voice;
}

/**
 * The cast. Weighted toward the everyman voices, with the know-it-all veteran
 * well represented, because that is the one the manager is meant to feel.
 */
export const FANS: Fan[] = [
  { id: 'chico',   name: 'אלי צ׳יקו', bio: 'נהג אוטובוס בדימוס, מבין בכדורגל יותר מכולם', voice: 'sage' },
  { id: 'yair',    name: 'יאיר הפרשן', bio: 'צופה ב-800 משחקים בשנה מהספה', voice: 'sage' },
  { id: 'buzi',    name: 'בוזי', bio: 'שלושים שנה ביציע, כולם יודעים שהוא מבין', voice: 'sage' },
  { id: 'shimon',  name: 'שמעון', bio: 'מנוי מאז 1974, יושב ביציע המזרחי', voice: 'nostalgic' },
  { id: 'yosef',   name: 'יוסי הזקן', bio: 'ראה את הקבוצה עולה וגם יורדת, פעמיים', voice: 'nostalgic' },
  { id: 'david',   name: 'דוד הנביא', bio: 'תמיד יודע איך זה ייגמר, לרעה', voice: 'doom' },
  { id: 'chanan',  name: 'חנן', bio: 'יודע בעל פה את הפרש השערים של כל הליגה', voice: 'numbers' },
  { id: 'rafi',    name: 'רפי', bio: 'בעל המכולת ממול לאצטדיון', voice: 'hope' },
  { id: 'moki',    name: 'מוקי', bio: 'לא פספס משחק בית 30 שנה', voice: 'super' },
  { id: 'avram',   name: 'אברם', bio: 'לוקח כל תוצאה הביתה ולשבת', voice: 'heart' },
  { id: 'nissim',  name: 'ניסים', bio: 'צועק מהדקה הראשונה, לא באמת כועס', voice: 'hot' },
];

export type FanTiming = 'pre' | 'post';

export interface FanContext {
  timing: FanTiming;
  isDerby: boolean;
  isHome: boolean;
  rival: string;
  /** the club's home town, so the terrace can say its own name */
  city: string;
  /** a starter who has gone a long time without scoring, if there is one */
  coldStriker: string | null;
  coldWeeks: number;
  /** the most tired starter after the match, or the youngest talent */
  youngster: string | null;
  /** the tactical approach currently set, which the know-it-all loves to judge */
  approach: Approach;
  /** last result, only for post */
  result?: 'win' | 'draw' | 'loss';
  scoreLine?: string;
  scorer?: string | null;
  streak?: number;        // losses in a row before this match
  tablePos: number;
  totalTeams: number;
}

export interface FanMessage {
  fan: Fan;
  text: string;
  /** stable id of the chosen line, used to avoid repeating it soon */
  id: string;
}

type Line = {
  id: string;
  voice?: Voice;
  when: (c: FanContext) => boolean;
  text: (c: FanContext, r: Rng) => string;
};

/* ----------------------------------------------------------------- slots */

const pick = (r: Rng, arr: string[]) => arr[Math.floor(r() * arr.length)];

const FORMATION = ['4-4-2', '4-3-3', 'חמישה מאחורה', 'שלישיית בלמים', '4-2-3-1', 'שני קשרים אחורה'];
const OTHER_JOB = ['שופצניק', 'נהג משאית', 'הבן של חנן', 'כל ילד ביציע', 'אשתי', 'המוכר בפלאפל'];
const OLD_NAME = ['שיקו', 'אליקים', 'בוזגלו הזקן', 'רחמים', 'הפנתר'];

/** How the know-it-all sees the tactic you actually set. */
function tacticGripe(c: FanContext): string {
  if (c.approach === 'attacking') return 'אתה נפתח יותר מדי, שוכח שיש גם הגנה במגרש';
  if (c.approach === 'defensive') return 'למה להסתגר ככה, קבוצה טובה משחררת ולא מפחדת';
  return 'הכל אצלך באמצע, בלי אופי, לא כאן ולא שם';
}

/* ------------------------------------------------------------- pre match */

const PRE: Line[] = [
  // the know-it-all, tactics. always eligible, so this voice is a constant
  { id: 'sage-tactic', voice: 'sage',
    when: () => true,
    text: c => `אני לא מאמן, אבל אם היית שואל אותי, ${tacticGripe(c)}. אתה כמובן תעשה מה שאתה רוצה, כמו תמיד.` },
  { id: 'sage-formation', voice: 'sage',
    when: () => true,
    text: (c, r) => `תשמע אותי טוב, מול קבוצה כזאת משחקים ${pick(r, FORMATION)} וזהו. שנים אני אומר את זה ואף אחד לא מקשיב.` },
  { id: 'sage-listen', voice: 'sage',
    when: () => true,
    text: (c, r) => `הבעיה שלך זה לא השחקנים, זה מה שאתה עושה איתם. ${pick(r, OTHER_JOB)} היה מבין את זה, למה אתה לא.` },
  { id: 'sage-experience', voice: 'sage',
    when: () => true,
    text: () => `בזמן שאני צופה ביציע הזה עוד לא נולדת. תקשיב לאנשים שראו כדורגל, לא רק קראו עליו.` },
  { id: 'sage-derby', voice: 'sage',
    when: c => c.isDerby,
    text: c => `דרבי מול ${c.rival}. יש דרך אחת לשחק את זה נכון, ואתה כנראה תבחר בשנייה. תוכיח לי שאני טועה.` },
  { id: 'sage-fav', voice: 'sage',
    when: c => c.tablePos <= 2,
    text: () => `מקום ראשון ומשחקים ככה. תאר לך איפה היינו אם היו מקשיבים לי מההתחלה.` },

  // doom
  { id: 'doom-generic', voice: 'doom',
    when: () => true,
    text: () => `יש לי הרגשה רעה על מחר. אל תגידו שלא אמרתי, אני תמיד יודע מראש.` },
  { id: 'doom-derby', voice: 'doom',
    when: c => c.isDerby,
    text: c => `דרבי מול ${c.rival}, ואנחנו נכנסים לזה בדיוק כמו כל שנה. אני כבר מכין את עצמי לרע.` },
  { id: 'doom-streak', voice: 'doom',
    when: c => (c.streak ?? 0) >= 2,
    text: () => `שני הפסדים ומחר יהיה שלישי, סימנתי לך. הלוואי ותוכיח שאני שחור, אבל אני לא.` },

  // nostalgic
  { id: 'nost-day', voice: 'nostalgic',
    when: (c) => true,
    text: (c, r) => `בזמני ${pick(r, OLD_NAME)} היה משחק פצוע ולא בוכה. היום ילד מקבל מכה ורוצה חילוף. תזכיר להם מאיפה באנו.` },
  { id: 'nost-home', voice: 'nostalgic',
    when: c => c.isHome,
    text: () => `פעם היו באים 3000 איש למשחק כזה. גם אם באים פחות היום, על המגרש חייבים לכבד את החולצה.` },

  // hope
  { id: 'hope-generic', voice: 'hope',
    when: () => true,
    text: () => `יש לי הרגשה טובה השבוע. הכנתי אפילו נקניקיות לחבר׳ה. הולכים על שלוש נקודות, אני מאמין בך.` },
  { id: 'hope-top', voice: 'hope',
    when: c => c.tablePos <= 4,
    text: c => `מקום ${c.tablePos}, ואתה יודע מה, זו השנה שלנו. אני מרגיש את זה בעצמות.` },

  // superstition
  { id: 'super-derby', voice: 'super',
    when: c => c.isDerby,
    text: () => `לובש את אותה חולצה מהניצחון הקודם בדרבי, לא כיבסתי בכוונה. אתה תעשה את שלך, אני אעשה את שלי.` },
  { id: 'super-top', voice: 'super',
    when: c => c.tablePos <= 2,
    text: c => `אני לא אומר בקול איפה אנחנו בטבלה, שלא נעשה עין הרע. רק תמשיך, בשקט, בלי לספר לאף אחד.` },

  // hot head
  { id: 'hot-generic', voice: 'hot',
    when: () => true,
    text: c => `מחר אני צרוד עד סוף השבוע, כרגיל. תביא לי סיבה לצעוק מרוב שמחה ולא מרוב עצבים.` },

  // numbers
  { id: 'num-table', voice: 'numbers',
    when: () => true,
    text: c => `מקום ${c.tablePos} מתוך ${c.totalTeams}. ניצחון מחר וקופצים, תיקו ונשארים תקועים. אני כבר חישבתי הכל, סמוך עליי.` },
  { id: 'num-away', voice: 'numbers',
    when: c => !c.isHome,
    text: c => `בחוץ מול ${c.rival} מספיק לא להפסיד. נקודה שם שווה שתיים אצלנו, תשחק לפי המספרים.` },

  // heart
  { id: 'heart-generic', voice: 'heart',
    when: () => true,
    text: () => `אני לא ישן טוב לפני משחק, אתה יודע את זה. תעשו את זה בשבילנו, זה כל מה שיש לנו בשבוע.` },
  { id: 'heart-away', voice: 'heart',
    when: c => !c.isHome,
    text: c => `נוסעים ל${c.rival}, יוצאים בצהריים בשביל משחק בערב. אל תביישו אותנו שם, באנו מרחוק.` },

  // the town itself, this is what makes it your club and not just a club
  { id: 'city-hope', voice: 'hope',
    when: () => true,
    text: c => `כל ${c.city} מדברת רק על המשחק הזה. תביא לעיר יום כזה, אנחנו צריכים את זה.` },
  { id: 'city-heart', voice: 'heart',
    when: () => true,
    text: c => `אני נולדתי ב${c.city}, אבא שלי בא לפה לפניי. תעשה שנלך גאים ברחוב אחרי המשחק.` },
  { id: 'city-sage', voice: 'sage',
    when: () => true,
    text: c => `אני רואה כדורגל ב${c.city} עוד לפני שהיה לך שיער בפרצוף. תקשיב למי שמכיר את הקבוצה הזאת.` },
  { id: 'city-nost', voice: 'nostalgic',
    when: c => c.isHome,
    text: c => `פעם חצי ${c.city} הייתה במגרש במשחק כזה. תזכיר להם על מה אנחנו משחקים פה.` },
  { id: 'city-num', voice: 'numbers',
    when: () => true,
    text: c => `${c.city} מחכה לעלייה כבר שנים. אני יודע כמה נקודות צריך, רק תעשה את שלך על המגרש.` },

  // context lines that any everyman voice can carry
  { id: 'ctx-cold',
    when: c => c.coldStriker !== null && c.coldWeeks >= 3,
    text: c => `${c.coldStriker} כבר ${c.coldWeeks} מחזורים לא נגע ברשת. אני לא מאמן, אבל אולי תנוח אותו קצת, מה כבר יש להפסיד.` },
  { id: 'ctx-young',
    when: c => c.youngster !== null,
    text: c => `ראיתי את ${c.youngster} בנוער ואמרתי אז שהילד הזה משהו אחר. תן לו דקות, אתה עוד תודה לי.` },
  { id: 'ctx-streak',
    when: c => (c.streak ?? 0) >= 2,
    text: () => `שני הפסדים ברצף, בבית כבר מסתכלים עליי בעין עקומה. תביא ניצחון אחד, קטן, רק שנוכל להרים ראש.` },
  { id: 'ctx-generic',
    when: () => true,
    text: () => `מחר משחק. הצעיף מוכן, המכולת סוגרת מוקדם, אנחנו שם. תעשו שיהיה שווה את זה.` },
];

/* ------------------------------------------------------------ post match */

const POST: Line[] = [
  // the know-it-all takes the credit or says he told you so
  { id: 'sage-win', voice: 'sage',
    when: c => c.result === 'win',
    text: () => `סוף סוף עשית מה שאני אומר כבר חודש. רואה, לא צריך תואר במאמנות, צריך רק להקשיב לי.` },
  { id: 'sage-win-score', voice: 'sage',
    when: c => c.result === 'win' && !!c.scorer,
    text: c => `${c.scoreLine}. ${c.scorer} הבקיע בדיוק מאיפה שאמרתי שצריך לשחק. אני לא מתפאר, אני רק מדייק.` },
  { id: 'sage-loss', voice: 'sage',
    when: c => c.result === 'loss',
    text: c => `אמרתי לך לא לשחק ככה, ${tacticGripe(c)}. עכשיו כולם חכמים אחרי המשחק, אבל אני אמרתי לפני.` },
  { id: 'sage-draw', voice: 'sage',
    when: c => c.result === 'draw',
    text: () => `תיקו, וגם אותו היית יכול להפוך לניצחון אם היית משנה בזמן. אני ראיתי את זה מהיציע, איך אתה לא ראית מהקווים.` },

  // doom
  { id: 'doom-loss', voice: 'doom',
    when: c => c.result === 'loss',
    text: () => `אמרתי שזה ייגמר ככה, לא אמרתי. אני לא נהנה לצדוק, פשוט אני מכיר את הקבוצה הזאת שנים.` },
  { id: 'doom-draw', voice: 'doom',
    when: c => c.result === 'draw',
    text: () => `תיקו היום, הפסד בשבוע הבא, אני כבר מריח את זה. תוכיח לי שאני טועה, באמת שאשמח.` },
  { id: 'doom-win', voice: 'doom',
    when: c => c.result === 'win',
    text: () => `ניצחנו, יופי, אבל אל תתרגלו. אחרי ניצחון כזה תמיד באה נפילה, ראיתי את הסרט הזה מיליון פעם.` },

  // nostalgic
  { id: 'nost-any', voice: 'nostalgic',
    when: () => true,
    text: (c, r) => `${c.scoreLine}. ${pick(r, OLD_NAME)} היה סוגר משחק כזה בעיניים עצומות. משהו בכדורגל של פעם היה אחר, אני אומר לך.` },

  // numbers
  { id: 'num-win', voice: 'numbers',
    when: c => c.result === 'win',
    text: c => `שלוש נקודות, ${c.scoreLine}, ועכשיו אנחנו במקום ${c.tablePos}. עשיתי את החשבון בראש עוד לפני השריקה.` },
  { id: 'num-loss', voice: 'numbers',
    when: c => c.result === 'loss',
    text: c => `הפסד, וזה הפרש שערים שלא נשכח בסוף העונה. אני סופר כל שער, גם אלה שנספגים בזבל.` },

  // hope
  { id: 'hope-loss', voice: 'hope',
    when: c => c.result === 'loss',
    text: () => `הפסדנו, בסדר, קמים וממשיכים. עוד לא נגמר כלום, אני עדיין מאמין בחבר׳ה האלה ובך.` },
  { id: 'hope-draw', voice: 'hope',
    when: c => c.result === 'draw',
    text: () => `נקודה זו נקודה, לוקחים והולכים הביתה בראש מורם. השבוע הבא שלנו, אתה תראה.` },

  // heart
  { id: 'heart-win', voice: 'heart',
    when: c => c.result === 'win',
    text: () => `רקדתי ביציע כמו ילד. תמסור לחבר׳ה שהם עשו לי את השבוע, שיידעו כמה זה חשוב לנו.` },
  { id: 'heart-loss', voice: 'heart',
    when: c => c.result === 'loss',
    text: () => `נכנס לי ישר ללב, אני לוקח את זה הביתה עד שבת. תעשו משהו במחזור הבא, בשביל הראש שלי.` },

  // hot
  { id: 'hot-win', voice: 'hot',
    when: c => c.result === 'win' && c.isDerby,
    text: c => `ניצחנו את הדרבי מול ${c.rival}! צרחתי עד שהשכן דפק בקיר. שווה כל דקה, אלוף.` },
  { id: 'hot-loss', voice: 'hot',
    when: c => c.result === 'loss',
    text: () => `יצאתי צרוד ועצבני, אבל מחר כבר אחשוב על המשחק הבא. ככה זה כשאוהבים, תעשה שיהיה שווה.` },

  // the town, after the whistle
  { id: 'city-win', voice: 'heart',
    when: c => c.result === 'win',
    text: c => `הלילה כל ${c.city} חוגגת. עברתי ברחוב וכולם מחייכים, זה מה שאנחנו אוהבים אצלך.` },
  { id: 'city-win-hope', voice: 'hope',
    when: c => c.result === 'win',
    text: c => `${c.scoreLine}. עוד כאלה ו${c.city} חוזרת למפה של הכדורגל. אמרתי לך שזו השנה שלנו.` },
  { id: 'city-loss', voice: 'heart',
    when: c => c.result === 'loss',
    text: c => `כל ${c.city} הולכת לישון עצובה הלילה. תחזיר לנו את החיוך במחזור הבא, בשביל העיר.` },

  // context
  { id: 'ctx-win-derby',
    when: c => c.result === 'win' && c.isDerby,
    text: c => `ניצחנו את ${c.rival}. עברתי ליד המכולת שלהם ולא אמרתי מילה, רק חייכתי. זה הספיק.` },
  { id: 'ctx-loss-derby',
    when: c => c.result === 'loss' && c.isDerby,
    text: c => `הפסדנו את הדרבי ל${c.rival}. אני מנתק את הטלפון עד יום רביעי, אל תחפש אותי.` },
  { id: 'ctx-loss-cold',
    when: c => c.result === 'loss' && c.coldStriker !== null,
    text: c => `${c.scoreLine}. ושוב, ${c.coldStriker} לא במצב. אני לא מאמן, אבל יש לי עיניים בראש.` },
  { id: 'ctx-draw',
    when: c => c.result === 'draw',
    text: () => `תיקו. חצי יציע יצא מרוצה וחצי קילל, וזה בערך מסכם הכל. אין על מה לבכות ואין על מה לחגוג.` },
  { id: 'ctx-loss',
    when: c => c.result === 'loss',
    text: () => `הפסד. שילמתי חניה, קניתי גרעינים, ובשביל מה. תעשה משהו עד המחזור הבא.` },
];

/**
 * Choose a line that fits what actually happened, prefer one not heard lately,
 * then hand it to a fan whose head matches the line. Deterministic for a given
 * rng, so it is stable across re renders of the same week.
 */
export function fanMessage(ctx: FanContext, rng: Rng, recent: string[] = []): FanMessage {
  const pool = ctx.timing === 'pre' ? PRE : POST;
  const seen = new Set(recent);
  const fits = pool.filter(l => l.when(ctx));
  const base = fits.length ? fits : [pool[pool.length - 1]];
  const fresh = base.filter(l => !seen.has(l.id));
  const from = fresh.length ? fresh : base;
  const line = from[Math.floor(rng() * from.length)];

  // a fan whose voice owns the line, or anyone when the line is voice neutral
  const candidates = line.voice ? FANS.filter(f => f.voice === line.voice) : FANS;
  const roster = candidates.length ? candidates : FANS;
  const fan = roster[Math.floor(rng() * roster.length)];

  return { fan, text: line.text(ctx, rng), id: line.id };
}
