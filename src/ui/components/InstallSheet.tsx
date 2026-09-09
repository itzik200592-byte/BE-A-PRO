import { useEffect, useState } from 'react';
import { Portal } from './Portal.tsx';
import { asset } from '../asset.ts';
import { installKind, promptInstall, watchInstall } from '../install.ts';

/**
 * Put the game on the home screen.
 *
 * On Android this is a real install: one button, the browser's own dialog, done.
 * On an iPhone there is no API for it at all, so the sheet turns into three
 * drawn steps pointing at the Share button, because "open the Safari menu and
 * look for Add to Home Screen" is exactly the instruction people give up on.
 */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState(installKind);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'accepted' | 'dismissed' | null>(null);

  useEffect(() => watchInstall(() => setKind(installKind())), []);

  async function install() {
    setBusy(true);
    const r = await promptInstall();
    setBusy(false);
    if (r === 'unsupported') { setKind('ios'); return; }
    setDone(r);
    if (r === 'accepted') window.setTimeout(onClose, 1400);
  }

  return (
    <Portal>
      <div className="sheet-scrim" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label="התקנת המשחק">
          <div className="sheet-grip" />

          <div className="stack" style={{ alignItems: 'center', gap: 10, padding: '4px 0 2px' }}>
            <img src={asset('/icon-192.png')} alt="" width={62} height={62}
              style={{ borderRadius: 16, boxShadow: '0 8px 22px rgba(0,0,0,.5)' }} />
            <div className="h2" style={{ fontSize: 21 }}>שים את המשחק על מסך הבית</div>
            <p className="hint" style={{ margin: 0, textAlign: 'center', maxWidth: 300 }}>
              נפתח כמו אפליקציה, בלי שורת כתובת, ונשמר לך בטלפון.
            </p>
          </div>

          {kind === 'installed' && (
            <div className="tile" style={{ marginTop: 14, padding: 14, textAlign: 'center', borderColor: 'var(--win)' }}>
              <b style={{ color: 'var(--win)' }}>המשחק כבר על מסך הבית שלך.</b>
            </div>
          )}

          {kind === 'prompt' && (
            <div style={{ marginTop: 15 }}>
              <button className="btn" disabled={busy} onClick={install}>
                {busy ? 'רגע...' : 'התקן עכשיו'}
              </button>
              {done === 'dismissed' && (
                <p className="hint" style={{ margin: '10px 0 0', textAlign: 'center' }}>
                  ביטלת. אפשר לנסות שוב מתי שתרצה.
                </p>
              )}
              {done === 'accepted' && (
                <p className="hint" style={{ margin: '10px 0 0', textAlign: 'center', color: 'var(--win)', fontWeight: 700 }}>
                  נוסף למסך הבית.
                </p>
              )}
            </div>
          )}

          {kind === 'ios' && <IosSteps />}

          {kind === 'none' && (
            <div className="tile" style={{ marginTop: 14, padding: 14 }}>
              <p className="hint" style={{ margin: 0 }}>
                הדפדפן הזה לא מציע התקנה. פתח את המשחק בכרום באנדרואיד או בספארי באייפון,
                ומשם אפשר לשים אותו על מסך הבית.
              </p>
            </div>
          )}

          <button className="btn dark" style={{ marginTop: 12 }} onClick={onClose}>סגור</button>
        </div>
      </div>
    </Portal>
  );
}

/**
 * The iPhone route, spelled out.
 *
 * Apple exposes no install API whatsoever, so this is not us being lazy: tapping
 * Share and then Add to Home Screen is genuinely the only way. Drawing the
 * Share glyph is the difference between people doing it and people giving up,
 * because nobody recognises it by name.
 */
function IosSteps() {
  return (
    <div className="stack" style={{ gap: 9, marginTop: 15 }}>
      <Step n={1}>
        לחץ על <ShareGlyph /> בתחתית המסך, בשורת הכלים של ספארי
      </Step>
      <Step n={2}>
        גלול ברשימה ובחר <b style={{ color: 'var(--gold-hi)' }}>הוספה למסך הבית</b>
      </Step>
      <Step n={3}>
        לחץ <b style={{ color: 'var(--gold-hi)' }}>הוסף</b> למעלה, וזה שם
      </Step>
      <p className="hint" style={{ margin: '4px 0 0' }}>
        באייפון אפל לא מאפשרת לאפליקציה להתקין את עצמה, אז זה השלב היחיד שצריך לעשות ידנית.
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="row" style={{ gap: 11, alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '11px 12px' }}>
      <span className="num" style={{
        flex: 'none', width: 26, height: 26, borderRadius: 9, display: 'grid', placeItems: 'center',
        background: 'rgba(233,185,73,.16)', color: 'var(--gold-hi)', fontWeight: 900, fontSize: 14,
      }}>{n}</span>
      <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

/** Safari's share button. Nobody knows its name, everybody knows the shape. */
function ShareGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-label="שיתוף"
      style={{ verticalAlign: 'middle', margin: '0 2px' }}>
      <path d="M12 15V3m0 0L8 7m4-4 4 4" stroke="var(--gold-hi)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke="var(--gold-hi)" strokeWidth="2"
        strokeLinecap="round" />
    </svg>
  );
}
