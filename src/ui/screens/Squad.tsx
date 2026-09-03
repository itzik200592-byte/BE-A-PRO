import { useMemo, useState } from 'react';
import * as G from '../../game/state.ts';
import type { Player, Position } from '../../engine/matchEngine.ts';
import { overall } from '../../engine/matchEngine.ts';
import { ovrColor } from '../../game/cards.ts';
import type { Trait } from '../../data/personalities.ts';
import { headlineTrait, assignTraits, renderLine, TONE_COLOR } from '../../data/personalities.ts';
import type { Squad } from '../../data/squadGen.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { Stepper } from '../components/Stepper.tsx';
import { CoachGuide } from '../components/CoachGuide.tsx';
import { PlayerCard } from '../components/PlayerCard.tsx';

export const LINE_OF: Record<Position, 'gk' | 'def' | 'mid' | 'atk'> = {
  GK: 'gk', CB: 'def', LB: 'def', RB: 'def',
  CDM: 'mid', CM: 'mid', CAM: 'mid',
  LW: 'atk', RW: 'atk', ST: 'atk',
};
export const LINE_LABEL = { gk: 'שוער', def: 'הגנה', mid: 'קישור', atk: 'התקפה' } as const;
export const LINE_COLOR = { gk: 'var(--pos-gk)', def: 'var(--pos-def)', mid: 'var(--pos-mid)', atk: 'var(--pos-atk)' } as const;

// one source of truth for the rating color, shared with the card system
export { ovrColor };

/** The little captain armband badge, an inline gold "C". */
export function CaptainMark({ size = 18 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 5, flex: 'none',
      display: 'inline-grid', placeItems: 'center', verticalAlign: 'middle',
      background: 'linear-gradient(180deg,var(--gold-hi),var(--gold))', color: '#1B1305',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.62, lineHeight: 1,
    }} title="קפטן">C</span>
  );
}

export function PlayerRow({ p, traits, state, onOpen, swap, onSwap, captain }: {
  p: Player;
  /** squad-assigned traits, falls back to standalone when omitted */
  traits?: Trait[];
  state?: 'idle' | 'selected' | 'target' | 'blocked';
  /** tap anywhere on the row body, opens the player card */
  onOpen?: () => void;
  /** show the swap side control, with its visual state */
  swap?: 'off' | 'arm' | 'armed' | 'in';
  onSwap?: () => void;
  /** wears the armband */
  captain?: boolean;
}) {
  const o = overall(p);
  const line = LINE_OF[p.position];
  const young = p.age <= 21;
  const st = state ?? 'idle';
  const bg = st === 'selected' ? 'rgba(232,182,76,.18)'
    : st === 'target' ? 'rgba(51,194,122,.12)'
    : 'transparent';
  // an explicit array (even empty) is authoritative, only undefined falls back
  const trait = traits ? (traits[0] ?? null) : headlineTrait(p);

  const inner = (
    <>
      <span className="chip" style={{ background: 'rgba(255,255,255,.07)', color: LINE_COLOR[line], minWidth: 36, textAlign: 'center' }}>{p.position}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {captain && <><CaptainMark size={16} /> </>}
          {p.name}
          {young && <span className="chip" style={{ marginInlineStart: 6, background: 'rgba(51,194,122,.18)', color: 'var(--win)' }}>כישרון</span>}
        </div>
        <div className="sub" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trait
            ? <><span style={{ color: TONE_COLOR[trait.tone], fontWeight: 700 }}>{trait.label}</span>
                <span style={{ opacity: .5 }}> · </span>
                גיל <span className="num">{p.age}</span></>
            : <>גיל <span className="num">{p.age}</span> · מהי <span className="num">{p.attrs.pace}</span> · בעי <span className="num">{p.attrs.shooting}</span></>}
        </div>
      </div>
      <div className="score-face" style={{ fontSize: 26, color: ovrColor(o), width: 34, textAlign: 'center' }}>{o}</div>
    </>
  );

  const bodyStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
    padding: '10px 8px', background: bg,
    textAlign: 'start', borderRadius: 8, opacity: st === 'blocked' ? 0.35 : 1,
    transition: 'background .15s ease',
  };

  const body = onOpen
    ? <button style={{ ...bodyStyle, minHeight: 56 }} onClick={onOpen}
        aria-label={`הכרטיס של ${p.name}, ${p.position}, דירוג ${o}`}>{inner}</button>
    : <div style={bodyStyle}>{inner}</div>;

  if (!swap || swap === 'off') {
    return <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid var(--line)' }}>{body}</div>;
  }

  const swapColor = swap === 'armed' ? 'var(--gold)' : swap === 'in' ? 'var(--win)' : 'var(--ink-faint)';
  const swapLabel = swap === 'arm' ? `הוצא את ${p.name}` : swap === 'in' ? `הכנס את ${p.name}` : 'בטל החלפה';
  // The control says what it does. A bare arrow icon read as decoration: once a
  // starter is armed, the bench buttons say הכנס and the armed man says בטל,
  // and the swap stops needing to be explained in a banner above the list.
  const word = swap === 'armed' ? 'בטל' : swap === 'in' ? 'הכנס' : null;
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderTop: '1px solid var(--line)' }}>
      {body}
      <button onClick={onSwap} aria-label={swapLabel} disabled={st === 'blocked'}
        style={{
          flex: 'none', minWidth: word ? 62 : 44, minHeight: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          color: swapColor, borderRadius: 8, opacity: st === 'blocked' ? 0.3 : 1,
          fontWeight: 800, fontSize: 13,
          background: swap === 'armed' ? 'rgba(233,185,73,.14)' : swap === 'in' ? 'rgba(51,194,122,.14)' : 'transparent',
          border: swap === 'in' ? '1px solid rgba(51,194,122,.4)' : swap === 'armed' ? '1px solid rgba(233,185,73,.4)' : '1px solid transparent',
        }}>
        <Icon name="sub" size={word ? 14 : 18} />{word}
      </button>
    </div>
  );
}

function Line({ title, color, players, render }: {
  title: string; color: string; players: Player[]; render: (p: Player) => React.ReactNode;
}) {
  if (!players.length) return null;
  return (
    <div className="tile" style={{ padding: '4px 10px 8px' }}>
      <div className="row" style={{ gap: 8, padding: '8px 2px 2px' }}>
        <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
        <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink-dim)' }}>{title}</span>
      </div>
      {players.map(p => <div key={p.id}>{render(p)}</div>)}
    </div>
  );
}

export function SquadScreen({ gs, firstTime, onSwap, onDone }: {
  gs: G.GameState;
  firstTime: boolean;
  onSwap: (starterId: string, benchId: string) => void;
  onDone: () => void;
}) {
  const c = G.club(gs);
  const sq = G.mySquad(gs);
  const [picked, setPicked] = useState<string | null>(null);   // a starter waiting for a sub
  const [flash, setFlash] = useState<string | null>(null);
  const [card, setCard] = useState<Player | null>(null);       // the open player card

  // one personality pass over the whole squad, so no two players repeat
  const traitMap = useMemo(() => assignTraits([...sq.starters, ...sq.bench]), [sq]);
  const tr = (p: Player): Trait[] => traitMap.get(p.id) ?? [];
  const captainId = G.currentCaptainId(gs);

  const pickedPlayer = picked ? sq.starters.find(p => p.id === picked) ?? null : null;
  const avg = Math.round(sq.starters.reduce((s, p) => s + overall(p), 0) / sq.starters.length);
  const byLine = (line: 'gk' | 'def' | 'mid' | 'atk') => sq.starters.filter(p => LINE_OF[p.position] === line);

  // the swap side icon arms a starter, then completes onto a bench player
  function armStarter(p: Player) {
    setFlash(null);
    setPicked(picked === p.id ? null : p.id);
  }
  function subInBench(p: Player) {
    if (!pickedPlayer) { setFlash('קודם בחר שחקן מההרכב, לחץ על החצים שלידו'); return; }
    const reason = G.swapBlockedReason(pickedPlayer, p);
    if (reason) { setFlash(reason); return; }
    onSwap(pickedPlayer.id, p.id);
    setPicked(null);
    setFlash(`${p.name} נכנס במקום ${pickedPlayer.name}`);
  }

  return (
    <div className="screen pad stack pad-b" style={{ gap: 12 }}>
      {firstTime && <Stepper current={5} />}
      {firstTime && <CoachGuide text="אלה השחקנים שקיבלת. תכיר אותם טוב, לחץ על כל אחד לכרטיס. איתם אנחנו מתחילים לטפס." />}
      <div className="row" style={{ marginTop: 8 }}>
        <Crest club={c} size={46} />
        <div style={{ flex: 1 }}>
          <div className="h2">הסגל שלך</div>
          <div className="sub" style={{ fontSize: 14 }}>
            {firstTime ? `${gs.profile.name}, אלה השחקנים שלך. תכיר אותם.` : `${c.name} · ${G.squadSize(gs)} שחקנים`}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="score-face" style={{ fontSize: 31, color: 'var(--gold-hi)' }}>{avg}</div>
          <div className="sub" style={{ fontSize: 12.5 }}>ממוצע</div>
        </div>
      </div>

      {firstTime && <DressingRoom sq={sq} traitMap={traitMap} onOpen={setCard} />}

      <div className="tile" style={{ padding: '10px 12px', background: pickedPlayer ? 'rgba(232,182,76,.12)' : 'var(--surface)', borderColor: pickedPlayer ? 'var(--gold)' : 'var(--line)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }} aria-live="polite">
          {pickedPlayer
            ? `${pickedPlayer.name} יוצא. עכשיו לחץ על החצים שליד מי שנכנס מהספסל.`
            : flash ?? 'לחץ על שחקן כדי לפתוח את הכרטיס שלו. החצים שבצד מחליפים הרכב.'}
        </div>
      </div>

      <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink-dim)', marginTop: 2 }}>ההרכב הפותח</div>
      {(['gk', 'def', 'mid', 'atk'] as const).map(line => (
        <Line key={line} title={LINE_LABEL[line]} color={LINE_COLOR[line]} players={byLine(line)}
          render={p => (
            <PlayerRow p={p} traits={tr(p)} state={picked === p.id ? 'selected' : 'idle'}
              captain={p.id === captainId}
              onOpen={() => setCard(p)}
              swap={picked === p.id ? 'armed' : 'arm'} onSwap={() => armStarter(p)} />
          )} />
      ))}

      <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink-dim)', marginTop: 4 }}>ספסל החילופים</div>
      <div className="tile" style={{ padding: '4px 10px 8px' }}>
        {sq.bench.map(p => {
          const blocked = !!pickedPlayer && !!G.swapBlockedReason(pickedPlayer, p);
          return (
            <PlayerRow key={p.id} p={p} traits={tr(p)}
              state={blocked ? 'blocked' : pickedPlayer ? 'target' : 'idle'}
              captain={p.id === captainId}
              onOpen={() => setCard(p)}
              swap={pickedPlayer ? 'in' : 'off'} onSwap={() => subInBench(p)} />
          );
        })}
      </div>

      <div className="spacer" />
      <button className="btn" onClick={onDone}>{firstTime ? 'ממשיכים לשוק ההעברות' : 'חזרה'}</button>

      {card && (
        <PlayerCard p={card} club={c} season={gs.seasonStats[card.id]} career={G.careerOf(gs, card.id)} traits={tr(card)} onClose={() => setCard(null)} />
      )}
    </div>
  );
}

/**
 * First meeting with the squad. Nobody remembers eleven ratings, but everybody
 * remembers the keeper who goes out on Thursdays. Four players WITH a
 * personality get introduced, spread across the squad, stable for a given squad.
 */
function DressingRoom({ sq, traitMap, onOpen }: {
  sq: Squad; traitMap: Map<string, Trait[]>; onOpen: (p: Player) => void;
}) {
  const withTrait = [...sq.starters, ...sq.bench].filter(p => (traitMap.get(p.id) ?? []).length > 0);
  const step = Math.max(1, Math.floor(withTrait.length / 4));
  const picks = [0, 1, 2, 3]
    .map(i => withTrait[(i * step) % withTrait.length])
    .filter((p, i, a) => p && a.indexOf(p) === i);

  return (
    <div className="tile-hero" style={{ padding: '14px 14px 12px' }}>
      <div className="row" style={{ gap: 8, marginBottom: 11 }}>
        <Icon name="crowd" size={17} color="var(--gold)" />
        <span className="label-cap">מה שסיפרו לך על חדר ההלבשה</span>
      </div>
      <div className="stack stagger" style={{ gap: 10 }}>
        {picks.map((p, i) => {
          const t = (traitMap.get(p.id) ?? [])[0];
          if (!t) return null;
          return (
            <button key={p.id} onClick={() => onOpen(p)} style={{ ...({ '--i': i } as React.CSSProperties), textAlign: 'start', display: 'block' }}>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: TONE_COLOR[t.tone], marginTop: 6, flex: 'none' }} />
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-dim)' }}>
                  {renderLine(t, p)}
                  {t.tip && <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}> {t.tip}</span>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="hint" style={{ marginTop: 11 }}>לחץ על שחקן כדי לפתוח את הכרטיס שלו.</div>
    </div>
  );
}
