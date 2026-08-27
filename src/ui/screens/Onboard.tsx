import { useState } from 'react';
import * as G from '../../game/state.ts';
import { LEAGUE_C, LEAGUE_NAMES } from '../../data/clubs.ts';
import { MANAGERS } from '../../data/managers.ts';
import type { ManagerId } from '../../data/managers.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { Stepper } from '../components/Stepper.tsx';
import { formatMoney } from '../components/bits.tsx';

/* ------------------------------------------------------------ 1. the manager */

/**
 * Two fields and out. Who you are as a manager is not picked from a menu here,
 * it is earned later from the decisions you make, see styleTitle in state.ts.
 */
export function OnboardManager({ gs, onDone }: { gs: G.GameState; onDone: (p: G.ManagerProfile) => void }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const ready = name.trim().length >= 2;

  function submit() {
    if (!ready) return;
    onDone({ name: name.trim(), nickname: nickname.trim(), age: 40, type: 'calm' });
  }

  return (
    <div className="screen pad stack pad-b" style={{ gap: 16, minHeight: '100%' }}>
      <Stepper current={1} />
      <div style={{ marginTop: 'clamp(8px,4vh,32px)' }}>
        <span className="eyebrow">BE A PRO</span>
        <h1 className="h1" style={{ marginTop: 12 }}>איך קוראים לך?</h1>
        <p className="sub">שתי שורות וזהו. את מי שאתה באמת, כבר תגלה על הדרך.</p>
      </div>

      <div className="tile-hero stack" style={{ gap: 16, padding: 18 }}>
        <div>
          <label className="lbl" htmlFor="mgr-name">השם שלך</label>
          <input
            id="mgr-name" className="field" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="השם המלא שלך" maxLength={22} autoComplete="off" autoFocus
          />
        </div>

        <div>
          <label className="lbl" htmlFor="mgr-nick">כינוי, לא חובה</label>
          <input
            id="mgr-nick" className="field" value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="איך יקראו לך ביציע" maxLength={14} autoComplete="off"
          />
          <p className="hint">ככה יקראו לך ביציע ובעיתונות.</p>
        </div>
      </div>

      {ready && (
        <div className="row" style={{ gap: 12, animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
          <Icon name="mic" size={20} color="var(--gold)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {name.trim()}{nickname.trim() ? ` "${nickname.trim()}"` : ''}
            </div>
            <div className="hint" style={{ marginTop: 1 }}>ככה יציגו אותך לפני המשחק</div>
          </div>
        </div>
      )}

      <div className="spacer" />
      <button className="btn" disabled={!ready} onClick={submit}>
        {ready ? 'בוחרים מועדון' : 'תכתוב שם כדי להמשיך'}
        {ready && <Icon name="chevron" size={17} />}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- 2. the club */

export function OnboardClub({ gs, onPick }: { gs: G.GameState; onPick: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const m = MANAGERS.find(x => x.id === gs.profile.type)!;

  return (
    <div className="screen pad stack pad-b" style={{ gap: 14 }}>
      <Stepper current={2} />
      <div style={{ marginTop: 6 }}>
        <span className="eyebrow">{gs.profile.name}{gs.profile.nickname ? ` "${gs.profile.nickname}"` : ''}</span>
        <h1 className="h1" style={{ marginTop: 12 }}>איזה מועדון לוקח אותך?</h1>
        <p className="sub">{LEAGUE_NAMES[1]}, תחתית הכדורגל. לכל מועדון יש אופי משלו, בחר את מי שמתאים לדרך שלך.</p>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {LEAGUE_C.map((c, i) => {
          const isOpen = open === c.id;
          const budget = Math.round(400_000 * m.budgetBias * c.traits.budget);
          return (
            <div key={c.id} className="tile select" data-on={isOpen ? '1' : '0'}
              style={{ animation: `riseIn .25s ease ${i * 0.03}s both`, padding: 0, overflow: 'hidden' }}>
              <button className="row" style={{ width: '100%', textAlign: 'start', background: 'transparent', padding: 14, gap: 12 }}
                onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}>
                <Crest club={c} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                  <div className="sub" style={{ fontSize: 12.5 }}>{c.city} · נוסד <span className="num">{c.founded}</span></div>
                </div>
                <span style={{ display: 'inline-block', color: 'var(--gold-hi)', fontWeight: 800, fontSize: 18, transform: isOpen ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }}>‹</span>
              </button>

              {isOpen && (
                <div className="stack" style={{ padding: '0 14px 14px', gap: 10, animation: 'riseIn .2s ease' }}>
                  <p className="sub" style={{ fontStyle: 'italic' }}>{c.blurb}</p>
                  <div className="stack" style={{ gap: 6 }}>
                    <span className="chip" style={{ background: 'rgba(51,194,122,.16)', color: 'var(--win)', textAlign: 'start' }}>+ {c.strength}</span>
                    <span className="chip" style={{ background: 'rgba(255,90,95,.14)', color: 'var(--loss)', textAlign: 'start' }}>- {c.weakness}</span>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Stat label="תקציב" value={formatMoney(budget)} />
                    <Stat label="מעמד" value={String(c.traits.prestige)} />
                    <Stat label="נוער" value={c.traits.youth >= 0.3 ? 'חזק' : c.traits.youth >= 0.15 ? 'בינוני' : 'חלש'} />
                  </div>
                  <button className="btn" onClick={() => onPick(c.id)}>קח אותי ל{c.short} ‹</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
      <div className="num" style={{ fontWeight: 900, fontSize: 14 }}>{value}</div>
      <div className="sub" style={{ fontSize: 11 }}>{label}</div>
    </div>
  );
}
