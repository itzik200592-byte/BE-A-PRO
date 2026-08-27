import { useState } from 'react';
import * as G from '../../game/state.ts';
import { Meters } from '../components/bits.tsx';
import type { PressTone } from '../../data/press.ts';

const TONE: Record<PressTone, { label: string; color: string; bg: string }> = {
  funny: { label: 'קליל', color: '#4aa3ff', bg: 'rgba(74,163,255,.14)' },
  serious: { label: 'ענייני', color: 'var(--gold-hi)', bg: 'rgba(232,182,76,.14)' },
  brutal: { label: 'קוטל', color: 'var(--loss)', bg: 'rgba(255,90,95,.14)' },
};

export function PressScreen({ gs, onAnswer }: { gs: G.GameState; onAnswer: (i: number) => void }) {
  const press = gs.press!;
  const q = press.q;
  const tone = TONE[q.tone];
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const reply = answered ? q.answers[picked!].reply : null;

  return (
    <>
      <Meters {...gs.meters} />
      <div className="screen pad stack pad-b" style={{ gap: 14 }}>
        <div className="row" style={{ marginTop: 4, justifyContent: 'space-between' }}>
          <span className="eyebrow">מסיבת עיתונאים</span>
          <span className="chip" style={{ background: tone.bg, color: tone.color }}>{tone.label}</span>
        </div>

        {/* reporter */}
        <div className="row" style={{ alignItems: 'flex-start', gap: 12, animation: 'riseIn .25s ease' }}>
          <MicIcon color={tone.color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: tone.color, marginBottom: 4 }}>{press.outlet}</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '4px 16px 16px 16px', padding: '13px 15px', fontSize: 15.5, lineHeight: 1.55 }}>
              {q.text}
            </div>
          </div>
        </div>

        {!answered && (
          <div className="stack" style={{ gap: 10, marginTop: 4 }}>
            {q.answers.map((a, i) => (
              <button key={i} className="btn dark" style={{ textAlign: 'start' }} onClick={() => setPicked(i)}>
                <div style={{ fontWeight: 800 }}>"{a.label}"</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  {a.effect.morale ? <Delta label="מורל" v={a.effect.morale} /> : null}
                  {a.effect.prestige ? <Delta label="מעמד" v={a.effect.prestige} /> : null}
                </div>
              </button>
            ))}
          </div>
        )}

        {answered && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'riseIn .2s ease' }}>
              <div style={{ background: 'linear-gradient(180deg,var(--gold-hi),var(--gold))', color: '#1e1608', borderRadius: '16px 16px 4px 16px', padding: '11px 14px', fontSize: 16.5, maxWidth: '82%', fontWeight: 700 }}>
                "{q.answers[picked!].label}"
              </div>
            </div>
            <div className="tile" style={{ fontSize: 16, animation: 'riseIn .25s ease .1s both' }}>
              <span style={{ color: 'var(--ink-dim)', fontWeight: 700, fontSize: 14.5 }}>התגובה </span>
              {reply}
            </div>
            <div className="spacer" />
            <button className="btn" onClick={() => onAnswer(picked!)}>סיום, {gs.seasonOver ? 'לסיכום העונה' : 'למחזור הבא'} ‹</button>
          </>
        )}
      </div>
    </>
  );
}

function Delta({ label, v }: { label: string; v: number }) {
  const good = v > 0;
  return (
    <span className="chip" style={{ background: good ? 'rgba(51,194,122,.16)' : 'rgba(255,90,95,.14)', color: good ? 'var(--win)' : 'var(--loss)' }}>
      {label} <span className="num">{good ? '+' : ''}{v}</span>
    </span>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }} aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
      <path d="M6 11a6 6 0 0 0 12 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17v4M9 21h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
