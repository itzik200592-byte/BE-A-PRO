import { useEffect, useState } from 'react';
import * as G from '../../game/state.ts';
import type { Club } from '../../data/clubs.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';

/**
 * The cinematic head to head, right before kickoff. Two crests fly in from the
 * wings, the ratings count up, and the whole thing lands on the VS clash. It is
 * the moment that tells you this match matters, borrowed from the games that do
 * their pre-match well and rebuilt in our floodlit style.
 */
export function VsScreen({ gs, onGo }: { gs: G.GameState; onGo: () => void }) {
  const p = G.matchPreview(gs);
  if (!p) { onGo(); return null; }

  const homeMine = p.iAmHome;
  const verdictColor = p.verdict === 'favourite' ? 'var(--win)' : p.verdict === 'underdog' ? 'var(--loss)' : 'var(--gold)';

  return (
    <div className="vs-screen">
      <div className="vs-flood" aria-hidden="true" />

      <div className="vs-top stagger">
        <span className="label-cap" style={{ '--i': 0 } as React.CSSProperties}>{LEAGUE_NAMES[p.home.tier]} · המשחק הבא</span>
        {p.isDerby
          ? <span className="vs-derby" style={{ '--i': 1 } as React.CSSProperties}>דרבי</span>
          : <span className="vs-side" style={{ '--i': 1 } as React.CSSProperties}>{p.iAmHome ? 'בית' : 'חוץ'}</span>}
      </div>

      <div className="vs-clash">
        <TeamSide club={p.home} ovr={p.homeOvr} mine={homeMine} side="home" />

        <div className="vs-mark" aria-hidden="true">
          <span>VS</span>
        </div>

        <TeamSide club={p.away} ovr={p.awayOvr} mine={!homeMine} side="away" />
      </div>

      {/* my recent form */}
      {p.myForm.length > 0 && (
        <div className="vs-form" style={{ animation: 'fadeIn .4s ease .9s both' }}>
          <span className="label-cap">הכושר שלך</span>
          <div className="row" style={{ gap: 5 }}>
            {p.myForm.map((r, i) => (
              <span key={i} className="vs-form-dot" data-r={r}>{r === 'W' ? 'נ' : r === 'D' ? 'ת' : 'ה'}</span>
            ))}
          </div>
        </div>
      )}

      <div className="vs-line" style={{ animation: 'riseIn .4s var(--ease-out) 1.05s both', borderColor: `color-mix(in srgb, ${verdictColor} 40%, transparent)` }}>
        <Icon name="clipboard" size={15} color={verdictColor} />
        <span>{p.line}</span>
      </div>

      <div className="spacer" />
      <button className="btn" style={{ animation: 'riseIn .4s var(--ease-out) 1.2s both' }} onClick={onGo}>
        יוצאים למגרש <Icon name="chevron" size={17} />
      </button>
    </div>
  );
}

function TeamSide({ club, ovr, mine, side }: { club: Club; ovr: number; mine: boolean; side: 'home' | 'away' }) {
  const shown = useCountUp(ovr);
  return (
    <div className={`vs-team vs-${side}`}>
      <div className="vs-crest"><Crest club={club} size={92} /></div>
      <div className="vs-name">{club.short}</div>
      {mine && <div className="vs-you">הקבוצה שלך</div>}
      <div className="vs-ovr score-face" style={{ color: mine ? 'var(--gold-hi)' : 'var(--ink)' }}>{shown}</div>
      <div className="vs-ovr-cap">דירוג</div>
    </div>
  );
}

/** count from a base up to the value, so the rating lands with a bit of drama */
function useCountUp(to: number, ms = 850, delay = 450): number {
  const [v, setV] = useState(Math.max(30, to - 12));
  useEffect(() => {
    let raf = 0; let start = 0;
    const from = Math.max(30, to - 12);
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const id = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [to, ms, delay]);
  return v;
}
