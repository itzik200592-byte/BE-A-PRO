/**
 * The question about the match itself.
 *
 * The old press room knew only the result, so it asked the same thing after
 * every defeat. These questions are built from what the reporter watched: the
 * sending off in the fortieth minute, the penalty put over the bar, the two
 * goal lead handed back. One of them opens the press conference whenever the
 * match gave him something to open with, and the wider question about the
 * table follows it.
 */

import type { PressContext, PressQuestion, Outlet } from './press.ts';
import { pickPressQuestion } from './press.ts';
import type { FactKind, MatchFact } from './matchFacts.ts';

type FactQ = (c: PressContext, f: MatchFact) => PressQuestion;

const BY_FACT: Partial<Record<FactKind, FactQ>> = {
  hat_trick: (_c, f) => ({
    tone: 'serious',
    text: `שלושה שערים ל${f.who} בערב אחד. הוא נשאר אצלך בקיץ או שכבר מצלצלים אליו?`,
    answers: [
      { label: 'הוא לא הולך לשום מקום', effect: { morale: +4, prestige: +2 }, reply: 'הודעה ברורה. השחקן שמע, והסוכן שלו גם.' },
      { label: 'לכל שחקן יש מחיר, גם לו', effect: { prestige: +2, morale: -3 }, reply: 'כנות שעולה. בחדר ההלבשה זה נשמע אחרת.' },
    ],
  }),

  brace: (_c, f) => ({
    tone: 'serious',
    text: `שני שערים ל${f.who}. מה הוא עשה הערב שלא עשה בשבועות האחרונים?`,
    answers: [
      { label: 'עבד על זה כל השבוע באימונים', effect: { morale: +3 }, reply: 'קרדיט לעבודה. השחקנים אוהבים לשמוע את זה.' },
      { label: 'כישרון. פשוט כישרון', effect: { prestige: +2, morale: +1 }, reply: 'קצר וקולע. הכותרת כותבת את עצמה.' },
    ],
  }),

  red_card: (_c, f) => ({
    tone: 'brutal',
    text: `${f.who} קיבל אדום בדקה ${f.minute} והשארתם עשרה. אתה מגבה אותו או שזאת חוסר משמעת?`,
    answers: [
      { label: 'הוא שלנו, נטפל בזה בפנים', effect: { morale: +4, prestige: -1 }, reply: 'הגנת עליו בפומבי. הקבוצה רשמה לעצמה.' },
      { label: 'אין לזה מקום, והוא ישלם על זה', effect: { prestige: +3, morale: -3 }, reply: 'קו ברור. חלק מהחדר לא אהב.' },
    ],
  }),

  their_red: (_c, f) => ({
    tone: 'funny',
    text: `הם שיחקו בעשרה מדקה ${f.minute}. זה עדיין נחשב?`,
    answers: [
      { label: 'שיחקנו נגד מי שהיה על הדשא', effect: { prestige: +2 }, reply: 'תשובה שקטה. אף אחד לא מצא במה לתפוס אותך.' },
      { label: 'האדום שינה את המשחק, בלי להתחמק', effect: { morale: +2, prestige: +1 }, reply: 'הגינות. באולפן העריכו את זה.' },
    ],
  }),

  collapse: (_c, f) => ({
    tone: 'brutal',
    text: `הובלתם ב${f.n} שערים ולא לקחתם את המשחק. איך קבוצה מאבדת ככה יתרון?`,
    answers: [
      { label: 'הפסקנו לשחק, וזה עליי', effect: { prestige: +3, morale: +2 }, reply: 'לקחת אחריות. זה מרגיע את החדר.' },
      { label: 'חוסר ניסיון, נלמד מזה', effect: { morale: +1 }, reply: 'תשובה בטוחה. גם משעממת.' },
    ],
  }),

  comeback: () => ({
    tone: 'serious',
    text: `הייתם בפיגור והפכתם את זה. מה אמרת להם כשהיו מאחור?`,
    answers: [
      { label: 'שלא יפסיקו לשחק את מה שאימנו', effect: { morale: +4, prestige: +2 }, reply: 'תשובה של מאמן. השחקנים קראו את זה בבוקר.' },
      { label: 'צעקתי. לפעמים צריך', effect: { morale: +2, prestige: +1 }, reply: 'כנות. האוהדים אהבו את הסיפור.' },
    ],
  }),

  late_winner: (_c, f) => ({
    tone: 'serious',
    text: `שער ניצחון בדקה ${f.minute}. זה מזל, או שהקבוצה הזאת פשוט לא מוותרת?`,
    answers: [
      { label: 'הקבוצה הזאת לא מוותרת, נקודה', effect: { morale: +4, prestige: +2 }, reply: 'משפט לכותרת. היציע אימץ אותו.' },
      { label: 'גם מזל צריך, והפעם הוא היה שלנו', effect: { morale: +2 }, reply: 'ענווה מחויכת. עבר טוב.' },
    ],
  }),

  late_equaliser: (_c, f) => ({
    tone: 'serious',
    text: `שער שוויון בדקה ${f.minute}. נקודה שלקחתם או שתיים שאיבדתם?`,
    answers: [
      { label: 'נקודה שלקחנו בשיניים', effect: { morale: +3 }, reply: 'מסגור חיובי. החדר קנה אותו.' },
      { label: 'שתיים שאיבדנו, בואו לא נשקר', effect: { prestige: +2, morale: -2 }, reply: 'ישר וקשה. העיתונות אהבה, השחקנים פחות.' },
    ],
  }),

  late_concede: (_c, f) => ({
    tone: 'brutal',
    text: `ספגתם בדקה ${f.minute} ואיבדתם את זה בסוף. איפה הריכוז נגמר?`,
    answers: [
      { label: 'הריכוז עליי, זאת העבודה שלי', effect: { prestige: +3, morale: +2 }, reply: 'לקחת את זה עליך. מקצועי.' },
      { label: 'שחקנים צריכים לסגור משחק לבד', effect: { prestige: +1, morale: -3 }, reply: 'האצבע הופנתה פנימה. זה נרשם.' },
    ],
  }),

  penalty_miss: (_c, f) => ({
    tone: 'brutal',
    text: `${f.who} החמיץ פנדל בדקה ${f.minute}. מי בועט בפעם הבאה?`,
    answers: [
      { label: 'הוא בועט. גם בפעם הבאה', effect: { morale: +4, prestige: -1 }, reply: 'אמון פומבי. הוא לא ישכח את זה.' },
      { label: 'נחשוב על זה במהלך השבוע', effect: { prestige: +1, morale: -2 }, reply: 'התחמקות מנומסת. הבועט הבין.' },
    ],
  }),

  own_goal: (_c, f) => ({
    tone: 'brutal',
    text: `שער עצמי של ${f.who} בדקה ${f.minute}. איך מרימים שחקן אחרי ערב כזה?`,
    answers: [
      { label: 'זה קורה לכל מגן בעולם', effect: { morale: +4 }, reply: 'חיבוק פומבי. החדר ראה.' },
      { label: 'הוא מקצוען, הוא יסתדר עם זה', effect: { prestige: +1, morale: -1 }, reply: 'קר. נכון, אבל קר.' },
    ],
  }),

  keeper_hero: (_c, f) => ({
    tone: 'serious',
    text: `${f.who} החזיק אתכם בשער הערב. הוא מספר אחת שלך לשארית העונה?`,
    answers: [
      { label: 'הוא מספר אחת, אין ויכוח', effect: { morale: +3, prestige: +1 }, reply: 'החלטה ברורה. השוער יצא מהאולם מחייך.' },
      { label: 'כל אחד משחק לפי מה שהוא נותן', effect: { prestige: +2, morale: -1 }, reply: 'תחרות פתוחה. מסר שנשמע גם בספסל.' },
    ],
  }),

  star_rating: (_c, f) => ({
    tone: 'serious',
    text: `${f.who} היה הטוב במגרש הערב. איפה מצאת אותו?`,
    answers: [
      { label: 'הוא היה פה כל הזמן, רק חיכה', effect: { morale: +3, prestige: +1 }, reply: 'קרדיט לשחקן. יפה.' },
      { label: 'עבדנו עליו יחד, זה לא במקרה', effect: { prestige: +3 }, reply: 'לקחת חלק מהקרדיט. מקובל.' },
    ],
  }),

  toothless: () => ({
    tone: 'brutal',
    text: `כמעט לא הגעתם לשער היריב. איפה ההתקפה הזאת?`,
    answers: [
      { label: 'לא מספיק טוב, נעבוד על זה', effect: { prestige: +2, morale: +1 }, reply: 'הודאה מדודה. הוגן.' },
      { label: 'היריבה סגרה טוב, זה כדורגל', effect: { morale: +1, prestige: -1 }, reply: 'תירוץ מנומס. לא כולם קנו.' },
    ],
  }),

  // the floor: a quiet night still had a best player in it, so there is always
  // something about THIS match to open with rather than about the table
  top_man: (_c, f) => ({
    tone: 'funny',
    text: `לא בדיוק ערב לזכור. ${f.who} היה הכי טוב שלך, וגם הוא לא קרע את המגרש. מה חסר?`,
    answers: [
      { label: 'קצב. אנחנו משחקים לאט מדי', effect: { prestige: +2, morale: +1 }, reply: 'אבחנה מקצועית. מי שמבין הנהן.' },
      { label: 'כלום. ניקח את מה שיש ונמשיך', effect: { morale: +2, prestige: -1 }, reply: 'תשובה מגוננת. באולפן צחקו קצת.' },
    ],
  }),

  clean_sheet: () => ({
    tone: 'serious',
    text: `שער נקי. ההגנה הזאת סוף סוף מסודרת?`,
    answers: [
      { label: 'ההגנה מתחילה מהחלוצים', effect: { morale: +3, prestige: +1 }, reply: 'משפט של מאמן. כולם רשמו.' },
      { label: 'מחזור אחד לא אומר כלום', effect: { prestige: +2 }, reply: 'רגליים על הקרקע.' },
    ],
  }),
};

/** Which facts we actually have a question for. */
export function askableFacts(facts: MatchFact[]): MatchFact[] {
  return facts.filter(f => BY_FACT[f.kind]);
}

/**
 * Halve what an answer moves.
 *
 * The meters were tuned when a press conference was one question. Asking two
 * without touching the numbers quietly doubled how far a week could swing the
 * mood and the standing, which showed up straight away as careers being sacked
 * that should not have been. Two questions should be two decisions, not twice
 * the consequence, so the match question carries half a question's weight and
 * the pair lands about where one used to. The scaled figures are the ones the
 * manager is shown, so the chips never promise more than they pay.
 */
function soften(q: PressQuestion): PressQuestion {
  const half = (v: number | undefined): number | undefined => {
    if (!v) return v;
    // never round a real effect away to nothing
    return Math.sign(v) * Math.max(1, Math.round(Math.abs(v) / 2));
  };
  return {
    ...q,
    answers: q.answers.map(a => ({
      ...a,
      effect: { morale: half(a.effect.morale), prestige: half(a.effect.prestige) },
    })),
  };
}

/**
 * The pair the manager faces. First the match, then the table, so a press
 * conference covers both the night he just had and the season he is having.
 * A match with nothing to say about it still gets its one wider question.
 */
export function pickPressQuestions(
  c: PressContext, rng: number, facts: MatchFact[] = [],
): { outlet: Outlet; qs: PressQuestion[] } {
  const wide = pickPressQuestion(c, rng);
  const usable = askableFacts(facts);
  if (!usable.length) return { outlet: wide.outlet, qs: [wide.q] };

  // the biggest story leads, but not invariably the very same one, so two
  // similar nights do not produce the identical press conference
  const pick = usable[rng > 0.72 && usable.length > 1 ? 1 : 0];
  return { outlet: wide.outlet, qs: [soften(BY_FACT[pick.kind]!(c, pick)), soften(wide.q)] };
}
