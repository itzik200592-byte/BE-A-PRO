import type { Club } from '../../data/clubs.ts';
import { Crest } from './Crest.tsx';
import { Icon } from './Icon.tsx';
import { Gem } from './Gem.tsx';

/** Every club mark in the game is the vector crest. */
export function Badge({ club, size = 44 }: { club: Club; size?: number }) {
  return <Crest club={club} size={size} />;
}

export function Meters({ money, morale, prestige, gems }: {
  money: number; morale: number; prestige: number;
  /** premium currency, shown as a compact pill when provided */
  gems?: number;
}) {
  return (
    <div className="meters">
      <Meter icon="coins" label="תקציב" value={formatMoney(money)} pct={100} color="var(--gold)" />
      <Meter icon="star" label="מעמד" value={String(prestige)} pct={prestige} color="var(--gold)" />
      <Meter
        icon="flame" label="מורל" value={String(morale)} pct={morale}
        color={morale >= 55 ? 'var(--win)' : morale >= 35 ? 'var(--gold)' : 'var(--loss)'}
      />
      {gems !== undefined && <GemPill n={gems} />}
    </div>
  );
}

/** The gem balance, always on screen so the premium currency reads as real. */
function GemPill({ n }: { n: number }) {
  return (
    <div className="gem-pill" title="יהלומים">
      <Gem size={19} />
      <span className="v num">{n}</span>
    </div>
  );
}

function Meter({ icon, label, value, pct, color }: {
  icon: 'coins' | 'star' | 'flame'; label: string; value: string; pct: number; color: string;
}) {
  return (
    <div className="meter">
      <div className="top">
        <span className="k">{label}</span>
        <Icon name={icon} size={13} color={color} style={{ opacity: .85 }} />
      </div>
      <div className="v num">{value}</div>
      <div className="bar"><i style={{ width: `${Math.max(4, Math.min(100, pct))}%`, background: color }} /></div>
    </div>
  );
}

/**
 * A scoreline that stays glued to its teams under RTL.
 * A bare "0:1" string is a single LTR number run, so its digits do not follow
 * the right-to-left flow of the crests around it. Here home and away are
 * separate elements inside an RTL inline-flex, so home sits on the right (next
 * to the home crest, which is the first child of an RTL row) and away on the left.
 */
export function ScorePair({ h, a, size = 20, color }: { h: number; a: number; size?: number; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', direction: 'rtl', alignItems: 'center',
      gap: Math.round(size * 0.16),
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: Math.round(size * 1.18), lineHeight: 1, color,
      letterSpacing: '-.01em',
    }}>
      <span>{h}</span>
      <span style={{ opacity: .4, fontSize: Math.round(size * 0.95) }}>:</span>
      <span>{a}</span>
    </span>
  );
}

/** Small labelled stat block used across screens. */
export function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      flex: 1, background: 'var(--bg)', border: '1px solid var(--line)',
      borderRadius: 'var(--plate-sm)', padding: '10px 6px', textAlign: 'center',
    }}>
      <div className="score-face" style={{ fontSize: 21, color: color ?? 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 700, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function formatMoney(n: number): string {
  // the sign belongs in front of the currency, not between it and the digits:
  // a purse in the red read as "₪-95K", which is not how anyone writes money
  const sign = n < 0 ? '-' : '';
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${sign}₪${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${sign}₪${Math.round(v / 1000)}K`;
  return `${sign}₪${v}`;
}
