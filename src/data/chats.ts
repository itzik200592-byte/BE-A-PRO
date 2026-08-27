/**
 * The phone after the whistle. Not every week, only the ones that actually
 * moved something: a hammering you gave or took, a derby, or a run that people
 * have started to talk about. The rest of the time the phone stays quiet, which
 * is exactly what makes it land when it does buzz.
 *
 * The voice is a real Israeli group chat, short bursts, no full stops, people
 * talking over each other. Slots are filled from the live save so the fans
 * shout your actual scoreline at your actual rival.
 */

import type { Rng } from '../engine/matchEngine.ts';

export type ChatTrigger =
  | 'derby_win' | 'derby_loss' | 'hot_streak' | 'cold_streak' | 'big_win' | 'big_loss';

export interface ChatLine {
  /** the sender's display name, empty string means the manager himself */
  from: string;
  text: string;
}

export interface ChatThreadTemplate {
  id: string;
  trigger: ChatTrigger;
  contact: string;
  subtitle: string;
  group: boolean;
  /** avatar tint, kept per contact so the same chat always looks the same */
  accent: string;
  lines: ChatLine[];
}

export interface ChatCtx {
  club: string;
  rival: string;
  score: string;     // "3 - 0" from your point of view
  star: string;
  mgr: string;       // the manager's nickname
}

const FANS = 'האולטראס';
const GOLD = '#d9a441', GREEN = '#2fa96b', RED = '#e2484d', BLUE = '#5b8dd6';

export const THREADS: ChatThreadTemplate[] = [
  /* ------------------------------------------------------------- big wins */
  {
    id: 'fans_big_win',
    trigger: 'big_win',
    contact: `${FANS} 🔥`, subtitle: '4 משתתפים', group: true, accent: GOLD,
    lines: [
      { from: 'מוקי', text: '{score}' },
      { from: 'מוקי', text: 'תגידו לי שזה קרה באמת' },
      { from: 'רפי', text: 'אחייי איזה משחק' },
      { from: 'שמעון', text: '30 שנה אני בא ליציע המזרחי, מזמן לא ראיתי כזה דבר' },
      { from: 'אלי צ׳יקו', text: 'אמרתי לכם. אמרתי לכם על {star}' },
      { from: 'רפי', text: 'המכולת פתוחה עד מאוחר היום, הכל על חשבוני 😂' },
      { from: 'מוקי', text: '{mgr} תותח' },
    ],
  },
  {
    id: 'captain_big_win',
    trigger: 'big_win',
    contact: 'הקפטן', subtitle: 'מקוון', group: false, accent: GREEN,
    lines: [
      { from: 'הקפטן', text: 'מאמן' },
      { from: 'הקפטן', text: 'רציתי להגיד לך משהו לפני שאני נוסע הביתה' },
      { from: 'הקפטן', text: 'החבר׳ה בחדר לא הפסיקו לדבר על מה שאמרת לפני המשחק' },
      { from: 'הקפטן', text: 'תמשיך ככה ואנחנו הולכים רחוק העונה' },
    ],
  },

  /* ------------------------------------------------------------ big losses */
  {
    id: 'board_big_loss',
    trigger: 'big_loss',
    contact: 'מנכ״ל המועדון', subtitle: 'מקוון', group: false, accent: BLUE,
    lines: [
      { from: 'מנכ״ל המועדון', text: 'ראיתי את המשחק' },
      { from: 'מנכ״ל המועדון', text: '{score} מול {rival}. אין לי מילים' },
      { from: 'מנכ״ל המועדון', text: 'הטלפון שלי לא מפסיק לצלצל מאז שריקת הסיום' },
      { from: 'מנכ״ל המועדון', text: 'אני צריך ממך הסבר על צורת המשחק. לא לתקשורת, לי' },
      { from: 'מנכ״ל המועדון', text: 'מחר בתשע במשרד' },
    ],
  },
  {
    id: 'fans_big_loss',
    trigger: 'big_loss',
    contact: `${FANS} 🔥`, subtitle: '4 משתתפים', group: true, accent: RED,
    lines: [
      { from: 'מוקי', text: 'מישהו יכול להסביר לי מה ראיתי היום' },
      { from: 'שמעון', text: 'אל תשאל' },
      { from: 'רפי', text: 'נסעתי שעה וחצי בשביל {score}' },
      { from: 'אלי צ׳יקו', text: 'הבעיה היא לא השחקנים. הבעיה היא שאין שיטה' },
      { from: 'מוקי', text: 'אלי תעזוב אותך משיטה, לא רצו בכלל' },
      { from: 'שמעון', text: 'בשבוע הבא אני בא בכל מקרה. תמיד באתי' },
    ],
  },

  /* --------------------------------------------------------------- derbies */
  {
    id: 'fans_derby_win',
    trigger: 'derby_win',
    contact: `${FANS} 🔥`, subtitle: '4 משתתפים', group: true, accent: GOLD,
    lines: [
      { from: 'רפי', text: 'דרררררבי!!!' },
      { from: 'מוקי', text: 'אני צרוד לגמרי' },
      { from: 'מוקי', text: 'הם היו צריכים לראות את הפרצופים שלהם ביציע ממול' },
      { from: 'אלי צ׳יקו', text: 'שנה שלמה אני אזכיר להם את {score} הזה' },
      { from: 'שמעון', text: 'הבן שלי בא איתי היום פעם ראשונה לדרבי. לא אשכח את זה' },
      { from: 'רפי', text: '{mgr} מגיע לך על חשבון הבית לכל החיים' },
    ],
  },
  {
    id: 'fans_derby_loss',
    trigger: 'derby_loss',
    contact: `${FANS} 🔥`, subtitle: '4 משתתפים', group: true, accent: RED,
    lines: [
      { from: 'מוקי', text: 'לא מדבר עם אף אחד שבוע' },
      { from: 'רפי', text: 'מכל המשחקים בעולם, דווקא זה' },
      { from: 'אלי צ׳יקו', text: 'אני עובד מול העבודה שלהם. אתם מבינים מה עובר עליי מחר בבוקר' },
      { from: 'שמעון', text: 'חבר׳ה מספיק. הפסדנו דרבי, לא נגמר העולם' },
      { from: 'מוקי', text: 'שמעון עם כל הכבוד, כן נגמר' },
    ],
  },

  /* ---------------------------------------------------------------- streaks */
  {
    id: 'captain_hot_streak',
    trigger: 'hot_streak',
    contact: 'הקפטן', subtitle: 'מקוון', group: false, accent: GREEN,
    lines: [
      { from: 'הקפטן', text: 'מאמן שלושה ברצף' },
      { from: 'הקפטן', text: 'החבר׳ה מגיעים לאימונים חצי שעה לפני, מעצמם' },
      { from: 'הקפטן', text: 'לא ראיתי דבר כזה מאז שאני במועדון' },
      { from: 'הקפטן', text: 'רק תשמור עלינו קרקעיים, אני מכיר את החבורה הזאת' },
    ],
  },
  {
    id: 'fans_hot_streak',
    trigger: 'hot_streak',
    contact: `${FANS} 🔥`, subtitle: '4 משתתפים', group: true, accent: GOLD,
    lines: [
      { from: 'אלי צ׳יקו', text: 'שלוש ברצף חברים' },
      { from: 'רפי', text: 'מישהו כבר בדק כמה נקודות אנחנו מהעלייה' },
      { from: 'מוקי', text: 'רפי אל תקלל' },
      { from: 'שמעון', text: 'תשמעו לי, לא מדברים על זה. אף אחד לא מדבר על זה' },
      { from: 'אלי צ׳יקו', text: 'שמעון צודק. שקט. ממשיכים משחק משחק' },
      { from: 'רפי', text: 'טוב אבל בשקט אני כבר מסדר כרטיסים' },
    ],
  },
  {
    id: 'board_cold_streak',
    trigger: 'cold_streak',
    contact: 'הבעלים', subtitle: 'מקוון', group: false, accent: RED,
    lines: [
      { from: 'הבעלים', text: 'שלוש הפסדים ברצף' },
      { from: 'הבעלים', text: 'אני לא איש שמאבד סבלנות מהר, אתה יודע את זה' },
      { from: 'הבעלים', text: 'אבל אני יושב מול אנשים שכן' },
      { from: 'הבעלים', text: 'תגיד לי מה התוכנית שלך. במילים שלך, לא סיסמאות' },
      { from: 'הבעלים', text: 'ואל תגיד לי שצריך זמן' },
    ],
  },
  {
    id: 'captain_cold_streak',
    trigger: 'cold_streak',
    contact: 'הקפטן', subtitle: 'מקוון', group: false, accent: BLUE,
    lines: [
      { from: 'הקפטן', text: 'מאמן אני מדבר איתך בפתיחות כי אני חושב שמגיע לך' },
      { from: 'הקפטן', text: 'החדר לחוץ. שומעים את היציע ומתחילים לפחד לקבל כדור' },
      { from: 'הקפטן', text: 'הצעירים במיוחד' },
      { from: 'הקפטן', text: 'אם תדבר איתם השבוע זה יעשה הבדל. הם מחכים שתגיד משהו' },
    ],
  },
];

/** Which conversation, if any, this round deserves. Derby beats a run, a run beats a scoreline. */
export function pickTrigger(input: {
  margin: number; isDerby: boolean; form: ('W' | 'D' | 'L')[];
}): ChatTrigger | null {
  const { margin, isDerby, form } = input;
  const last3 = form.slice(-3);
  const streak = (r: 'W' | 'L') => last3.length === 3 && last3.every(x => x === r);

  if (isDerby && margin > 0) return 'derby_win';
  if (isDerby && margin < 0) return 'derby_loss';
  if (streak('W')) return 'hot_streak';
  if (streak('L')) return 'cold_streak';
  if (margin >= 3) return 'big_win';
  if (margin <= -3) return 'big_loss';
  return null;
}

export interface RolledChat {
  id: string;
  contact: string;
  subtitle: string;
  group: boolean;
  accent: string;
  lines: ChatLine[];
}

function fill(t: string, ctx: ChatCtx): string {
  return t.replace(/\{(\w+)\}/g, (_, k) => {
    const v = (ctx as unknown as Record<string, string>)[k];
    return v == null || v === '' ? `{${k}}` : v;
  });
}

/** Build the conversation for a trigger, avoiding the one shown most recently. */
export function rollChat(trigger: ChatTrigger, ctx: ChatCtx, rng: Rng, recent: string[]): RolledChat | null {
  const all = THREADS.filter(t => t.trigger === trigger);
  if (!all.length) return null;
  const fresh = all.filter(t => !recent.includes(t.id));
  const pool = fresh.length ? fresh : all;
  const t = pool[Math.floor(rng() * pool.length)];
  return {
    id: t.id, contact: t.contact, subtitle: t.subtitle, group: t.group, accent: t.accent,
    lines: t.lines.map(l => ({ from: l.from, text: fill(l.text, ctx) })),
  };
}
