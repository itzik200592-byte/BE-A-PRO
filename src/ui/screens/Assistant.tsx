import { TopBack } from '../components/TopBack.tsx';
import * as G from '../../game/state.ts';
import { Meters } from '../components/bits.tsx';
import { Icon } from '../components/Icon.tsx';

/**
 * The assistant coach. Hire him and he will agree with everything, repeat your
 * questions back as answers, and love the club more than sense allows. He does
 * not help. He is not supposed to. He is here for the ride, until the day the
 * club reaches ליגה א' and someone, inexplicably, hands him a team of his own.
 */
export function AssistantScreen({ gs, onHire, onFire, onBack }: {
  gs: G.GameState; onHire: () => void; onFire: () => void; onBack: () => void;
}) {
  const a = gs.assistant;
  const sample = a.hired && !a.departed
    ? G.assistantEcho(gs, ['יוסי', 'אבי'], 3)
    : G.assistantEcho({ ...gs, assistant: { hired: true, name: 'הוא', departed: false } }, ['יוסי', 'אבי'], 3);

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack pad-b" style={{ gap: 13 }}>
        <TopBack onBack={onBack} />
        <div className="row" style={{ gap: 10, marginTop: 2 }}>
          <Icon name="mic" size={22} color="var(--sky)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h2">עוזר מאמן</div>
            <div className="sub" style={{ marginTop: 2 }}>אוהב כדורגל בטירוף, מבין בו בערך כלום.</div>
          </div>
        </div>

        {a.departed ? (
          <div className="tile" style={{ padding: 16, textAlign: 'center' }}>
            <Icon name="trophy" size={30} color="var(--gold)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{a.name} כבר לא כאן</div>
            <div className="sub">עלינו לליגה א׳, והוא קיבל קבוצה לנהל. לא הבין כלום, אהב הכל. בהצלחה לו.</div>
          </div>
        ) : a.hired ? (
          <>
            <div className="tile-hero" style={{ padding: 16 }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="h2" style={{ fontSize: 24 }}>{a.name}</div>
                  <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>העוזר שלך · חבר לחיים</div>
                </div>
              </div>
              <div style={{
                marginTop: 13, background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
                border: '1px solid var(--line)', borderRadius: '5px 16px 16px 16px',
                padding: '11px 13px', fontSize: 13.5, lineHeight: 1.55,
              }}>
                “{sample}”
              </div>
              <div className="hint" style={{ marginTop: 9 }}>
                ככה זה נשמע כשמתייעצים איתו. הוא פשוט חוזר על השאלה. אבל הלב שלו זהב.
              </div>
            </div>
            <div className="spacer" />
            <button className="btn ghost" onClick={onFire}>מוותר על {a.name}</button>
            <button className="btn" onClick={onBack}>סגור</button>
          </>
        ) : (
          <>
            <div className="tile" style={{ padding: 16 }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar dim />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>מחפש עבודה במועדון</div>
                  <div className="sub" style={{ fontSize: 12.5, marginTop: 3 }}>
                    בא לכל אימון ראשון ויוצא אחרון. יודע את השם של כל שחקן בליגה ואת התוצאה של כל משחק מ-1998. טקטיקה? פחות.
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 13, background: 'var(--bg)', border: '1px solid var(--line)',
                borderRadius: '5px 16px 16px 16px', padding: '11px 13px', fontSize: 13, lineHeight: 1.55, color: 'var(--ink-dim)',
              }}>
                “{sample}”
              </div>
            </div>
            <div className="hint">
              הוא לא באמת יעזור לך לנצח. הוא כן יהיה שם בכל החלטה, יחזור על מה שתגיד, וייתן תחושה שלא לבד. חינם.
            </div>
            <div className="spacer" />
            <button className="btn" onClick={onHire}>קח אותו לצוות</button>
            <button className="btn ghost" onClick={onBack}>אולי בפעם אחרת</button>
          </>
        )}
      </div>
    </>
  );
}

function Avatar({ dim }: { dim?: boolean }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 16, flex: 'none', display: 'grid', placeItems: 'center',
      background: dim ? 'var(--surface-2)' : 'radial-gradient(100% 100% at 50% 0%, rgba(76,155,232,.28), transparent 70%), var(--surface-2)',
      border: `1px solid ${dim ? 'var(--line-2)' : 'rgba(76,155,232,.45)'}`,
    }}>
      <Icon name="mic" size={26} color={dim ? 'var(--ink-faint)' : 'var(--sky)'} />
    </div>
  );
}
