import { useState } from 'react';
import * as G from '../../game/state.ts';
import { Meters } from '../components/bits.tsx';
import { Icon } from '../components/Icon.tsx';
import { TopBack } from '../components/TopBack.tsx';
import { Gem } from '../components/Gem.tsx';
import {
  myCode, inviteLink, GEMS_PER_FRIEND, GEMS_FOR_JOINING, FRIENDS_PER_SEASON, ROUNDS_TO_COUNT,
} from '../../game/invite.ts';

/**
 * Bring a friend.
 *
 * Two things live here and they are deliberately kept apart: sending the game
 * to somebody, which is one tap, and collecting for a friend who has actually
 * played, which is a code he sends back. The screen only shows the second half
 * once there is a reason to, so a manager opening this for the first time sees
 * one button and not a form.
 */
export function InviteScreen({ gs, onRedeem, onBack }: {
  gs: G.GameState;
  onRedeem: (code: string) => { ok: boolean; message: string };
  onBack: () => void;
}) {
  const code = myCode();
  const link = inviteLink(code);
  const counted = gs.invite?.claimed.length ?? 0;
  const thisSeason = G.friendsThisSeason(gs);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<'link' | 'thanks' | null>(null);

  // what I owe the manager who brought ME in, once I have played enough
  const owed = G.thanksCode(gs);
  const toGo = G.roundsUntilThanks(gs);
  const invitedBy = gs.invite?.invitedBy ?? null;

  const share = async () => {
    const text = `בוא תנהל קבוצה איתי ב-BE A PRO. מליגה ג׳ עד אלופת אירופה.\n${link}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'BE A PRO', text, url: link }); return; }
    } catch { /* the sheet was dismissed, which is not an error */ }
    copy(link, 'link');
  };

  const copy = (text: string, what: 'link' | 'thanks') => {
    try {
      navigator.clipboard?.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1800);
    } catch { /* nothing to do, the text is on screen to read */ }
  };

  const whatsapp = () => {
    const text = encodeURIComponent(`בוא תנהל קבוצה איתי ב-BE A PRO. מליגה ג׳ עד אלופת אירופה.\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  function redeem() {
    const r = onRedeem(paste);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setPaste('');
  }

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack pad-b" style={{ gap: 13 }}>
        <TopBack onBack={onBack} />

        <div className="row" style={{ gap: 11, marginTop: 2 }}>
          <Icon name="crowd" size={22} color="var(--gold)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h2">תביא חבר</div>
            <div className="sub" style={{ fontSize: 14 }}>
              על כל חבר ששיחק <span className="num">{ROUNDS_TO_COUNT}</span> מחזורים אתה מקבל <span className="num">{GEMS_PER_FRIEND}</span> יהלומים
            </div>
          </div>
        </div>

        {/* the one button that matters */}
        <div className="tile-hero" style={{ padding: 16 }}>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <span className="label-cap">הקוד שלך</span>
          </div>
          <div className="num" style={{
            fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 900,
            letterSpacing: '.08em', color: 'var(--gold-hi)', textAlign: 'center', margin: '6px 0 14px',
          }}>{code}</div>

          <button className="btn" onClick={share}>
            <Icon name="crowd" size={17} /> שתף את המשחק
          </button>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn dark btn-sm" style={{ flex: 1 }} onClick={whatsapp}>וואטסאפ</button>
            <button className="btn dark btn-sm" style={{ flex: 1 }} onClick={() => copy(link, 'link')}>
              {copied === 'link' ? 'הועתק' : 'העתק קישור'}
            </button>
          </div>
          <p className="hint" style={{ margin: '11px 0 0' }}>
            הקישור פותח את המשחק לחבר בלי קוד כניסה, והוא מתחיל עם <span className="num">{GEMS_FOR_JOINING}</span> יהלומים מתנה.
          </p>
        </div>

        {/* the tally */}
        <div className="row" style={{ gap: 8 }}>
          <Stat label="חברים שנספרו" value={String(counted)} />
          <Stat label="העונה" value={`${thisSeason}/${FRIENDS_PER_SEASON}`} />
          <Stat label="יהלומים" value={String(counted * GEMS_PER_FRIEND)} gem />
        </div>

        {/* what I owe whoever brought me in */}
        {invitedBy && (
          <div className="tile" style={{ padding: 13, borderColor: 'color-mix(in srgb, var(--gold) 30%, transparent)' }}>
            <div className="label-cap" style={{ marginBottom: 6 }}>הוזמנת על ידי <span className="num">{invitedBy}</span></div>
            {owed ? (
              <>
                <p className="hint" style={{ margin: '0 0 9px' }}>שיחקת מספיק. שלח לו את הקוד הזה והוא יקבל את היהלומים שלו.</p>
                <div className="num" style={{
                  background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10,
                  padding: '10px 12px', fontSize: 14.5, fontWeight: 800, textAlign: 'center', wordBreak: 'break-all',
                }}>{owed}</div>
                <button className="btn dark btn-sm" style={{ marginTop: 8 }} onClick={() => copy(owed, 'thanks')}>
                  {copied === 'thanks' ? 'הועתק' : 'העתק ושלח לו'}
                </button>
              </>
            ) : (
              <p className="hint" style={{ margin: 0 }}>
                עוד <span className="num">{toGo}</span> מחזורים ותוכל לשלוח לו קוד תודה שמזכה אותו ביהלומים.
              </p>
            )}
          </div>
        )}

        {/* collecting for a friend */}
        <div className="tile" style={{ padding: 13 }}>
          <div className="label-cap" style={{ marginBottom: 7 }}>קיבלת קוד תודה מחבר?</div>
          <input
            value={paste}
            onChange={e => { setPaste(e.target.value); setMsg(null); }}
            placeholder="BP-XXXXXX-XXXXXX-05XXX"
            autoComplete="off" autoCorrect="off" spellCheck={false}
            style={{
              width: '100%', background: 'var(--bg)', border: '1px solid var(--line-2)',
              borderRadius: 10, padding: '12px 13px', color: 'var(--ink)',
              fontSize: 15, fontWeight: 700, direction: 'ltr', textAlign: 'left',
            }} />
          <button className="btn btn-sm" style={{ marginTop: 8, opacity: paste.trim() ? 1 : 0.4 }}
            disabled={!paste.trim()} onClick={redeem}>
            אשר וקבל יהלומים
          </button>
          {msg && (
            <p className="hint" style={{ margin: '9px 0 0', color: msg.ok ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>
              {msg.text}
            </p>
          )}
        </div>

        <p className="hint" style={{ margin: 0 }}>
          הקוד נספר רק אחרי שהחבר באמת שיחק, וכל חבר נספר פעם אחת. אי אפשר להזמין את עצמך.
        </p>
      </div>
    </>
  );
}

function Stat({ label, value, gem }: { label: string; value: string; gem?: boolean }) {
  return (
    <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
      <div className="row" style={{ gap: 4, justifyContent: 'center' }}>
        {gem && <Gem size={15} />}
        <span className="num" style={{ fontWeight: 900, fontSize: 17 }}>{value}</span>
      </div>
      <div className="sub" style={{ fontSize: 11.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}
