import { useState } from 'react';
import { asset } from '../asset.ts';
import { Icon } from '../components/Icon.tsx';

/**
 * A soft gate on the front door. Not real security, just a code so the game can
 * be sent to a picked group of testers rather than the whole internet. Once the
 * code is right it is remembered on the device, so a tester enters it once.
 */
const CODE = '100';
const KEY = 'beapro.gate';

export function hasEntry(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  function submit() {
    if (value.trim() === CODE) {
      try { localStorage.setItem(KEY, '1'); } catch { /* private mode, still let them in */ }
      onUnlock();
    } else {
      setWrong(true);
      setValue('');
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', justifyContent: 'center', padding: 24 }}>
      <div className="stack" style={{ alignItems: 'center', gap: 8, marginBottom: 26 }}>
        <img src={asset('/logo.webp')} alt="BE A PRO" style={{
          width: 132, height: 132, objectFit: 'contain',
          animation: 'pop .6s var(--ease-out)',
          filter: 'drop-shadow(0 10px 28px rgba(233,185,73,.26))',
        }} />
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(40px,13vw,58px)',
          margin: '10px 0 0', letterSpacing: '-.02em',
          backgroundImage: 'linear-gradient(180deg,#fff 16%,var(--gold-hi) 58%,var(--gold-lo))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>BE A PRO</h1>
        <p className="sub" style={{ textAlign: 'center' }}>גרסת בדיקה סגורה. הזן את קוד הכניסה כדי לשחק.</p>
      </div>

      <div className="stack" style={{ gap: 12, maxWidth: 320, width: '100%', margin: '0 auto' }}>
        <input
          className="field" value={value} inputMode="numeric" autoFocus
          style={{ textAlign: 'center', letterSpacing: '.3em', fontSize: 20, fontWeight: 800, ...(wrong ? { borderColor: 'var(--loss)', animation: 'shake .3s' } : null) }}
          placeholder="קוד כניסה"
          onChange={e => { setValue(e.target.value); setWrong(false); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
        {wrong && <p className="hint" style={{ textAlign: 'center', color: 'var(--loss)', fontWeight: 700, margin: 0 }}>קוד שגוי, נסה שוב.</p>}
        <button className="btn" onClick={submit} disabled={!value.trim()}>
          כניסה <Icon name="chevron" size={17} />
        </button>
      </div>
    </div>
  );
}
