import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';

/**
 * The warning, delivered in person, once.
 *
 * A manager should never be sacked by a number he had not been told about, so
 * the owner says it out loud before it happens: the club is past what he will
 * carry, and the next defeat ends it. That last part is the whole mechanic.
 * From here a win keeps the job and a loss loses it, which turns a spreadsheet
 * into a match you have to go and win.
 */
export function UltimatumScreen({ gs, onGo }: { gs: G.GameState; onGo: () => void }) {
  const c = G.club(gs);
  const d = G.debt(gs);
  const money = (n: number) => `₪${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

  return (
    <div className="screen pad stack" style={{ gap: 16, minHeight: '100%', justifyContent: 'center' }}>
      <div className="ult-top">
        <span className="ult-flash"><Icon name="alert" size={26} color="var(--loss)" /></span>
        <div className="row" style={{ gap: 10, justifyContent: 'center', marginTop: 12 }}>
          <Crest club={c} size={34} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{c.name}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--loss)', lineHeight: 1.15 }}>
          שיחה עם הבעלים
        </div>
      </div>

      <div className="tile" style={{
        padding: 15, fontSize: 14.5, lineHeight: 1.7,
        borderColor: 'color-mix(in srgb, var(--loss) 40%, transparent)',
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--loss)', marginBottom: 7 }}>הבעלים</div>
        {gs.crisisReason ? (
          <>
            סגרתי את הדלת בכוונה, כי מה שאני עומד להגיד לך לא יוצא מפה.
            <div style={{ height: 9 }} />
            <b style={{ color: 'var(--ink)' }}>{gs.crisisReason}</b>
            <div style={{ height: 9 }} />
            אנחנו במינוס {money(d.debt)}, ואני יכול לכסות עד {money(d.limit)}. זה לא באשמתך,
            ואני יודע את זה. אבל אני צריך לתת למישהו תשובה, ואתה המאמן.
          </>
        ) : (
          <>
            סגרתי את הדלת בכוונה. המועדון במינוס {money(d.debt)}, ואמרתי לך שאני מכסה עד {money(d.limit)}.
            אנחנו כמעט שם.
          </>
        )}
        <div style={{ height: 10 }} />
        אני לא מפטר אותך היום. אבל אני אומר לך בפנים:
        <b style={{ color: 'var(--ink)' }}> ההפסד הבא הוא האחרון שלך.</b> תמכור מי שצריך, תאזן,
        ותביא לי תוצאה. אני רוצה שתישאר, אבל זה כבר לא רק בידיים שלי.
      </div>

      <div className="ult-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, d.ratio * 100)}%` }} />
      </div>
      <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700 }}>
        <span style={{ color: 'var(--loss)' }}>−{money(d.debt)}</span>
        <span style={{ color: 'var(--ink-faint)' }}>הקו: {money(d.limit)}</span>
      </div>

      <div className="spacer" />
      <button className="btn" onClick={onGo}>
        <Icon name="whistle" size={18} /> הבנתי, יוצאים לעבודה
      </button>
    </div>
  );
}
