import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { asset } from '../asset.ts';

/**
 * The letter, and the box.
 *
 * The owner said the next defeat would end it, the defeat came, and this is
 * the corridor outside his office. It is deliberately quiet: no red flashing,
 * no exclamation marks. A chairman telling you the club cannot carry it any
 * more lands harder that way, and the numbers do the arguing.
 *
 * It is not the end of the career. The phone rings on the next screen.
 */
export function SackedScreen({ gs, onNext }: { gs: G.GameState; onNext: () => void }) {
  const s = gs.sacking!;
  const c = G.club(gs);
  const money = (n: number) => `${n < 0 ? '-' : ''}₪${Math.abs(Math.round(n)).toLocaleString('en-US')}`;

  return (
    <div className="screen pad stack pad-b" style={{ gap: 14, minHeight: '100%' }}>
      <div className="sack-photo">
        <img src={asset('/sacked.webp')} alt="" />
        <div className="sack-shade" aria-hidden="true" />
        <div className="sack-cap">
          <div className="row" style={{ gap: 9 }}>
            <Crest club={c} size={30} />
            <div style={{ minWidth: 0 }}>
              <div className="label-cap" style={{ letterSpacing: '.14em' }}>{s.league}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.2 }}>{s.club}</div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--loss)', marginTop: 8, lineHeight: 1 }}>
            פוטרת
          </div>
          <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>
            עונה <span className="num">{s.season}</span> · מחזור <span className="num">{s.week}</span>
          </div>
        </div>
      </div>

      <div className="tile" style={{ padding: 15, lineHeight: 1.7, fontSize: 14.5 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold)', marginBottom: 7 }}>הבעלים</div>
        אמרתי לך שההפסד הבא הוא האחרון, ולא נעים לי שצדקתי.
        המועדון במינוס של {money(s.debt)}, ואני לא יכול יותר.
        <div style={{ height: 9 }} />
        קח את הדברים שלך מהמשרד. אני לא אומר עליך מילה רעה לאף אחד,
        ואם תשאל אותי בעוד שנתיים, אני עוד אצטער על היום הזה.
      </div>

      <div className="sack-figs">
        <Fig label="החוב" value={money(-s.debt)} tone="var(--loss)" />
        <Fig label="הגבול" value={money(s.limit)} />
        <Fig label="בטבלה" value={`${s.position}/${s.teams}`} />
      </div>

      <div className="spacer" />
      <button className="btn" onClick={onNext}>
        לצאת מהמשרד <Icon name="chevron" size={17} />
      </button>
    </div>
  );
}

function Fig({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: tone ?? 'var(--ink)' }}>{value}</span>
      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>{label}</span>
    </div>
  );
}
