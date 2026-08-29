import { useState } from 'react';
import { MANAGERS, ATTR_LABEL, TRAINING_KEYS, MENTAL_KEYS } from '../../data/managers.ts';
import type { ManagerId, ManagerType, CoachAttrs } from '../../data/managers.ts';
import { Icon } from '../components/Icon.tsx';
import { Stepper } from '../components/Stepper.tsx';
import { CoachGuide } from '../components/CoachGuide.tsx';

/**
 * Step one of a career: the CV you turn up with. Every archetype starts on the
 * same total of ability, spread differently, so this picks a style of football
 * rather than a difficulty. Whatever you choose, the club still takes you.
 */
export function ArchetypeScreen({ onPick }: { onPick: (id: ManagerId) => void }) {
  const [open, setOpen] = useState<ManagerId | null>(null);

  return (
    <div className="screen pad stack pad-b" style={{ gap: 13 }}>
      <Stepper current={1} />
      <CoachGuide who="owner" text="ברוך הבא, נעים מאוד. אני מנהל הקבוצה, ולפני שאנחנו מתקדמים חשוב לי להבין איזה מאמן אתה. אני צריך לדעת מה אני מביא למועדון." />

      <div style={{ marginTop: 2 }}>
        <span className="eyebrow">הרזומה שלך</span>
        <h1 className="h1" style={{ marginTop: 10 }}>איזה מאמן אתה?</h1>
        <p className="sub">
          כל מאמן מתחיל עם אותה כמות יכולת, רק מחולקת אחרת. זו בחירה של סגנון, לא של קלות.
        </p>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {MANAGERS.map((m, i) => (
          <ArchetypeCard
            key={m.id} m={m} i={i}
            open={open === m.id}
            onToggle={() => setOpen(open === m.id ? null : m.id)}
            onPick={() => onPick(m.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ArchetypeCard({ m, i, open, onToggle, onPick }: {
  m: ManagerType; i: number; open: boolean; onToggle: () => void; onPick: () => void;
}) {
  return (
    <div className="tile select" data-on={open ? '1' : '0'}
      style={{ animation: `riseIn .25s ease ${i * 0.03}s both`, padding: 0, overflow: 'hidden' }}>
      <button className="row" style={{ width: '100%', textAlign: 'start', background: 'transparent', padding: 14, gap: 12 }}
        onClick={onToggle} aria-expanded={open}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>{m.name}</div>
          <div className="sub" style={{ fontSize: 13, fontStyle: 'italic', marginTop: 3 }}>"{m.tagline}"</div>
        </div>
        <span style={{
          display: 'inline-block', color: 'var(--gold-hi)', fontWeight: 800, fontSize: 18,
          transform: open ? 'rotate(-90deg)' : 'none', transition: 'transform .2s',
        }}>‹</span>
      </button>

      {open && (
        <div className="stack" style={{ padding: '0 14px 14px', gap: 11, animation: 'riseIn .2s ease' }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="chip" style={{ background: 'rgba(51,194,122,.16)', color: 'var(--win)', textAlign: 'start' }}>+ {m.perk}</span>
            <span className="chip" style={{ background: 'rgba(255,90,95,.14)', color: 'var(--loss)', textAlign: 'start' }}>- {m.cost}</span>
          </div>

          <AttrGroup title="אימון" keys={TRAINING_KEYS} attrs={m.base} color="var(--gold)" />
          <AttrGroup title="מנטלי" keys={MENTAL_KEYS} attrs={m.base} color="var(--sky)" />

          <button className="btn" onClick={onPick}>זה אני <Icon name="chevron" size={16} /></button>
        </div>
      )}
    </div>
  );
}

/** One group of abilities as labelled bars, 1..20. */
export function AttrGroup({ title, keys, attrs, color }: {
  title: string; keys: readonly (keyof CoachAttrs)[]; attrs: CoachAttrs; color: string;
}) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="label-cap" style={{ color }}>{title}</div>
      {keys.map(k => (
        <div key={k} className="row" style={{ gap: 9 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-dim)', width: 72, flex: 'none' }}>
            {ATTR_LABEL[k]}
          </span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
            <i style={{ display: 'block', height: '100%', width: `${(attrs[k] / 20) * 100}%`, background: color, borderRadius: 3 }} />
          </div>
          <span className="num" style={{ fontSize: 13, fontWeight: 900, width: 20, textAlign: 'end' }}>{attrs[k]}</span>
        </div>
      ))}
    </div>
  );
}
