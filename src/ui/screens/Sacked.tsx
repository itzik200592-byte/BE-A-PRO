import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { asset } from '../asset.ts';

/**
 * The letter. The owner covered the losses for as long as he was going to, and
 * this is the end of the career, not a setback: the save goes with it.
 *
 * It is deliberately quiet. No red flashing, no exclamation marks; a chairman
 * telling you the club cannot carry it any more lands harder that way, and the
 * numbers do the arguing.
 */
export function SackedScreen({ gs, onNewCareer }: { gs: G.GameState; onNewCareer: () => void }) {
  const s = gs.sacking!;
  const c = G.club(gs);
  const money = (n: number) => `${n < 0 ? '-' : ''}₪${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

  return (
    <div className="screen pad stack" style={{ gap: 16, minHeight: '100%', justifyContent: 'center' }}>
      <div className="sack-head">
        <img src={asset('/coach/owner.webp')} alt="" className="sack-owner"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="row" style={{ gap: 11, justifyContent: 'center' }}>
          <Crest club={c} size={40} />
          <div style={{ textAlign: 'start' }}>
            <div className="label-cap">{s.league}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{s.club}</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--loss)', lineHeight: 1.1 }}>
          פוטרת
        </div>
        <div className="sub" style={{ marginTop: 6, fontSize: 14 }}>
          עונה <span className="num">{s.season}</span> · מחזור <span className="num">{s.week}</span>
        </div>
      </div>

      <div className="tile" style={{ padding: 15, lineHeight: 1.65, fontSize: 14.5 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold)', marginBottom: 7 }}>הבעלים</div>
        כיסיתי כל חודש. אמרתי לך פעמיים שזה לא יכול להימשך, וזה נמשך.
        המועדון במינוס של {money(s.debt)}, וזה מעבר לכל מה שסיכמנו.
        אני לא כועס עליך, אבל אני חייב לעצור את זה כאן. תודה על העבודה, ובהצלחה בהמשך.
      </div>

      <div className="sack-figs">
        <Fig label="החוב" value={money(s.debt)} tone="var(--loss)" />
        <Fig label="הגבול" value={money(s.limit)} />
        <Fig label="בטבלה" value={`${s.position}/${s.teams}`} />
      </div>

      <div className="spacer" />
      <button className="btn" onClick={onNewCareer}>
        <Icon name="flag" size={18} /> להתחיל קריירה חדשה
      </button>
      <p className="hint" style={{ textAlign: 'center' }}>
        הקריירה הזאת נסגרה. הכרוניקה שלה נשמרת בסיפור שלך.
      </p>
    </div>
  );
}

function Fig({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: tone ?? 'var(--ink)' }}>{value}</span>
      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>{label}</span>
    </div>
  );
}
