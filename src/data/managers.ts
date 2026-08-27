/**
 * Manager personality. A cheap, high emotion system: the player picks who they
 * are, and it changes real modifiers plus the tone of the chat dilemmas.
 */

export type ManagerId = 'calm' | 'fighter' | 'accountant' | 'dreamer';

export interface ManagerType {
  id: ManagerId;
  name: string;
  tagline: string;
  perk: string;
  cost: string;
  /** multipliers applied in the game layer */
  moraleBias: number;       // baseline morale drift per week
  derbyMorale: number;      // extra morale in big games
  youthGrowth: number;      // talent development multiplier
  budgetBias: number;       // starting budget multiplier
  cardBias: number;         // discipline, higher = more cards
}

export const MANAGERS: ManagerType[] = [
  {
    id: 'calm', name: 'הרוגע', tagline: 'אנחנו לא נלחצים, ממשיכים לעבוד',
    perk: 'מורל יציב לאורך כל העונה', cost: 'השחקנים מתפתחים לאט יותר',
    moraleBias: +2, derbyMorale: 0, youthGrowth: 0.85, budgetBias: 1.0, cardBias: 0.9,
  },
  {
    id: 'fighter', name: 'הלוחם', tagline: 'היום נכנסים בהם מהדקה הראשונה',
    perk: 'מורל גבוה בדרבי ובמשחקים גדולים', cost: 'חוטף יותר כרטיסים',
    moraleBias: 0, derbyMorale: +8, youthGrowth: 1.0, budgetBias: 1.0, cardBias: 1.25,
  },
  {
    id: 'accountant', name: 'הכספן', tagline: 'כל שקל נספר, אחי',
    perk: 'מתחיל עם תקציב גדול יותר', cost: 'הקהל קצת פחות מתלהב',
    moraleBias: -1, derbyMorale: 0, youthGrowth: 1.0, budgetBias: 1.4, cardBias: 1.0,
  },
  {
    id: 'dreamer', name: 'החולם', tagline: 'אני בונה פה משהו לשנים',
    perk: 'כישרונות צעירים מתפתחים מהר', cost: 'מתחיל עם תקציב קטן',
    moraleBias: 0, derbyMorale: 0, youthGrowth: 1.35, budgetBias: 0.75, cardBias: 1.0,
  },
];

export function getManager(id: ManagerId): ManagerType {
  return MANAGERS.find(m => m.id === id) ?? MANAGERS[0];
}
