import * as G from '../../game/state.ts';
import type { PreEvent } from '../../game/state.ts';
import { PRE_ROUNDS } from '../../game/preseason.ts';
import { overall } from '../../engine/matchEngine.ts';
import { Meters, formatMoney, StatBox } from '../components/bits.tsx';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { Stepper } from '../components/Stepper.tsx';
import { ovrColor } from './Squad.tsx';

/**
 * The summer board. Three rounds of business before the league starts, no match
 * in between. The market is open the whole time, and each round the manager's
 * desk fills up: who wants to leave, who wants paying, and whose contract has
 * run out. The feeling is ownership, you are building the team that will walk
 * out for round one.
 */
export function PreSeasonMarket({
  gs, firstCareer, onOpenMarket, onResolveDeparture, onRenew, onRelease, onDismissOutcome, onAdvance,
}: {
  gs: G.GameState;
  firstCareer: boolean;
  onOpenMarket: () => void;
  onResolveDeparture: (kind: 'star' | 'young', optionIndex: number) => void;
  onRenew: (playerId: string) => void;
  onRelease: (playerId: string) => void;
  onDismissOutcome: () => void;
  onAdvance: () => void;
}) {
  const c = G.club(gs);
  const sq = G.mySquad(gs);
  const avg = Math.round(sq.starters.reduce((s, p) => s + overall(p), 0) / sq.starters.length);
  const size = G.squadSize(gs);
  const events = G.preseasonEvents(gs);
  const lastRound = gs.preWeek >= PRE_ROUNDS;
  const blocked = G.preseasonBlockedReason(gs);

  // an answered piece of business shows its outcome, same grammar as the inbox
  if (gs.pendingOutcome != null) {
    return (
      <>
        <Meters {...gs.meters} />
        <div className="screen pad stack pad-b" style={{ gap: 13 }}>
          <span className="eyebrow" style={{ marginTop: 2 }}>קיץ · מחזור {gs.preWeek} מתוך {PRE_ROUNDS}</span>
          <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
            <div style={{
              background: 'linear-gradient(180deg,var(--grass),#1E7C4C)', color: '#04180C',
              borderRadius: '18px 5px 18px 18px', padding: '12px 15px', fontSize: 15.5,
              maxWidth: '86%', fontWeight: 700, lineHeight: 1.55, boxShadow: 'var(--e2)',
            }}>
              {gs.pendingOutcome}
            </div>
          </div>
          <div className="spacer" />
          <button className="btn" onClick={onDismissOutcome}>
            המשך <Icon name="chevron" size={17} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Meters {...gs.meters} />
      <div className="screen pad stack pad-b" style={{ gap: 13, minHeight: '100%' }}>
        {firstCareer && <Stepper current={5} />}

        {/* The banner. This is the one thing that has to be unmistakable: no
            football is played here, this is the window, and it lasts three rounds. */}
        <div className="tile-hero" style={{ padding: '16px 16px 14px', marginTop: firstCareer ? 2 : 6 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="eyebrow">אין משחקים · רק העברות</span>
            <RoundDots round={gs.preWeek} />
          </div>
          <h1 className="h1" style={{ fontSize: 'clamp(32px,10vw,44px)', lineHeight: 1 }}>חלון העברות</h1>
          <div className="row" style={{ gap: 8, marginTop: 11 }}>
            <span className="chip" style={{ background: 'rgba(233,185,73,.16)', color: 'var(--gold)', fontSize: 14 }}>
              מחזור קיץ <span className="num">{gs.preWeek}</span> מתוך <span className="num">{PRE_ROUNDS}</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink-dim)' }}>
              {gs.preWeek === 1 ? 'בונים את הקבוצה' : gs.preWeek === 2 ? 'סוגרים חוזים' : 'קריאה אחרונה'}
            </span>
          </div>
          <p className="sub" style={{ marginTop: 10 }}>
            {lastRound
              ? 'המחזור האחרון לפני שריקת הפתיחה. סגור את כל החוזים, ואז יוצאים לעונה.'
              : `העונה עוד לא התחילה. יש לך ${PRE_ROUNDS - gs.preWeek + 1} מחזורי קיץ להעברות, חוזים ובניית סגל, ורק אחריהם משחקים.`}
          </p>
        </div>

        <div className="tile-hero" style={{ padding: 16 }}>
          <div className="row" style={{ gap: 12, marginBottom: 13 }}>
            <Crest club={c} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
              <div className="sub" style={{ fontSize: 14 }}>{c.strength}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <StatBox label="תקציב" value={formatMoney(gs.meters.money)} color="var(--gold)" />
            <StatBox label="ממוצע סגל" value={String(avg)} />
            <StatBox label="שחקנים" value={String(size)} />
          </div>
        </div>

        {/* the desk: sagas and expiring deals */}
        {events.length > 0 && (
          <>
            <div className="label-cap">על הפרק</div>
            <div className="stack" style={{ gap: 10 }}>
              {events.map(ev => (
                ev.kind === 'renew'
                  ? <RenewCard key={ev.id} ev={ev} onRenew={() => onRenew(ev.player.id)} onRelease={() => onRelease(ev.player.id)} />
                  : <DepartureCard key={ev.id} ev={ev} onPick={oi => onResolveDeparture(ev.kind as 'star' | 'young', oi)} />
              ))}
            </div>
          </>
        )}

        {/* the open market, reachable every round */}
        <button className="tile select" onClick={onOpenMarket} style={{
          textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center',
          borderColor: 'color-mix(in srgb, var(--win) 34%, transparent)',
        }}>
          <Icon name="handshake" size={22} color="var(--win)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>שוק ההעברות</div>
            <div style={{ fontSize: 13.5, color: 'var(--win)', fontWeight: 600, marginTop: 2 }}>
              {gs.market.length} שחקנים חופשיים · קנייה, מכירה ושחרור
            </div>
          </div>
          <Icon name="chevron" size={17} color="var(--ink-faint)" />
        </button>

        <div className="spacer" />
        <button className="btn" onClick={onAdvance} disabled={!!blocked}>
          {blocked
            ? <>{blocked}</>
            : lastRound
              ? <>יוצאים לעונה <Icon name="whistle" size={18} /></>
              : <>סיימתי, למחזור הקיץ הבא <Icon name="chevron" size={17} /></>}
        </button>
        {blocked ? (
          <p className="hint" style={{ textAlign: 'center', color: 'var(--loss)', fontWeight: 700 }}>
            כל שחקן שהחוזה שלו נגמר חייב תשובה, חידוש או שחרור.
          </p>
        ) : !lastRound && (
          <p className="hint" style={{ textAlign: 'center' }}>
            נשארו <span className="num">{PRE_ROUNDS - gs.preWeek}</span> מחזורי קיץ לפני שהליגה מתחילה
          </p>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------- the cards */

/** A transfer saga, framed like a message from the player. */
function DepartureCard({ ev, onPick }: { ev: PreEvent; onPick: (optionIndex: number) => void }) {
  const p = ev.player;
  const o = overall(p);
  const star = ev.kind === 'star';
  const accent = star ? 'var(--loss)' : 'var(--sky)';
  const label = star ? 'רוצה לעלות ליגה' : 'רוצה חוזה חדש';
  const msg = star
    ? `יש עליי קבוצה מליגה בכירה יותר. אני מרגיש שהגיע הזמן שלי להתקדם. תשקול את זה.`
    : `מאמן, אני נותן הכל על המגרש. מגיע לי חוזה שמכבד אותי. אל תיתן לי סיבה לחפש במקום אחר.`;
  const options = star
    ? [{ label: `מכור תמורת ${formatMoney(ev.amount)}`, tone: 'money' as const }, { label: 'חסום, הוא נשאר', tone: 'hold' as const }]
    : [{ label: `תן העלאה, ${formatMoney(ev.amount)}`, tone: 'money' as const }, { label: 'סרב, שיוכיח קודם', tone: 'hold' as const }];

  return (
    <div className="tile" style={{ padding: '12px 13px', borderColor: `color-mix(in srgb, ${accent} 36%, transparent)` }}>
      <div className="row" style={{ gap: 11, alignItems: 'center' }}>
        <span style={{
          width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', flex: 'none',
          background: 'linear-gradient(180deg,var(--surface-3),var(--surface))', border: `1px solid ${accent}44`,
        }}>
          <Icon name={star ? 'flame' : 'star'} size={19} color={accent} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: accent, marginTop: 2 }}>{label}</div>
        </div>
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <div className="score-face" style={{ fontSize: 22, color: ovrColor(o), lineHeight: 1 }}>{o}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 700 }}>{p.position} · גיל {p.age}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '11px 0 12px' }}>
        <div style={{
          background: 'var(--surface-3)', color: 'var(--ink-dim)',
          borderRadius: '5px 16px 16px 16px', padding: '10px 13px', fontSize: 14.5, lineHeight: 1.5,
          maxWidth: '92%', fontWeight: 600,
        }}>{msg}</div>
      </div>

      <div className="row" style={{ gap: 9 }}>
        {options.map((opt, oi) => (
          <button key={oi} className={opt.tone === 'money' ? 'btn' : 'btn dark'}
            style={{ flex: 1, padding: '12px 10px', fontSize: 15 }}
            onClick={() => onPick(oi)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** An out of contract player, renew or let him walk. */
function RenewCard({ ev, onRenew, onRelease }: { ev: PreEvent; onRenew: () => void; onRelease: () => void }) {
  const p = ev.player;
  const o = overall(p);
  return (
    <div className="tile" style={{ padding: '12px 13px', borderColor: 'color-mix(in srgb, var(--gold) 30%, transparent)' }}>
      <div className="row" style={{ gap: 11, alignItems: 'center', marginBottom: 11 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', flex: 'none',
          background: 'linear-gradient(180deg,var(--surface-3),var(--surface))', border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)',
        }}>
          <Icon name="clipboard" size={19} color="var(--gold)" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>החוזה נגמר</div>
        </div>
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <div className="score-face" style={{ fontSize: 22, color: ovrColor(o), lineHeight: 1 }}>{o}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 700 }}>{p.position} · גיל {p.age}</div>
        </div>
      </div>
      <div className="row" style={{ gap: 9 }}>
        <button className="btn" style={{ flex: 2, padding: '12px 10px', fontSize: 15 }} onClick={onRenew}>
          חדש חוזה · {formatMoney(ev.amount)}
        </button>
        <button className="btn dark" style={{ flex: 1, padding: '12px 10px', fontSize: 15 }} onClick={onRelease}>
          שחרר
        </button>
      </div>
    </div>
  );
}

/** Three dots that fill as the summer runs down. */
function RoundDots({ round }: { round: number }) {
  return (
    <span className="row" style={{ gap: 5 }}>
      {Array.from({ length: PRE_ROUNDS }, (_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: 4,
          background: i < round ? 'var(--gold)' : 'var(--surface-3)',
          border: i < round ? 'none' : '1px solid var(--line)',
        }} />
      ))}
    </span>
  );
}
