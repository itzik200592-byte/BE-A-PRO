import { useEffect, useReducer, useRef, useState } from 'react';
import { asset } from '../asset.ts';
import * as G from '../../game/state.ts';
import * as L from '../../game/liveMatch.ts';
import type { LiveState, Corner } from '../../game/liveMatch.ts';
import type { MatchResult, Player } from '../../engine/matchEngine.ts';
import { overall } from '../../engine/matchEngine.ts';
import type { Club } from '../../data/clubs.ts';
import { Crest } from '../components/Crest.tsx';
import { ScorePair } from '../components/bits.tsx';
import { Icon } from '../components/Icon.tsx';
import { Portal } from '../components/Portal.tsx';
import { LivePitch } from '../components/LivePitch.tsx';
import { ovrColor } from './Squad.tsx';
import type { IconName } from '../components/Icon.tsx';

const CORNERS: { id: Corner; label: string }[] = [
  { id: 'left', label: 'שמאל' }, { id: 'center', label: 'מרכז' }, { id: 'right', label: 'ימין' },
];
const SPEEDS = [1, 2, 3] as const;
const MS_PER_MIN = 780;

/** The penalty popup carries a start image, and a result image per corner. */
const PEN_BUILDUP = asset('/moments/penalty/buildup.webp');
function penOutcomeImg(corner: Corner, scored: boolean): string {
  return asset(`/moments/penalty/${scored ? 'goal' : 'save'}-${corner}.webp`);
}

/** Same shape for free kicks, with a third outcome, hitting the wall. */
const FK_BUILDUP = asset('/moments/free-kick/buildup.webp');
function fkOutcomeImg(corner: Corner, outcome: L.FreeKickOutcome): string {
  if (outcome === 'wall') return asset('/moments/free-kick/wall.webp');
  return asset(`/moments/free-kick/${outcome === 'goal' ? 'goal' : 'save'}-${corner}.webp`);
}

/** Open-play shot, three outcomes. Wide has no centre image, we pick a side. */
const SHOT_BUILDUP = asset('/moments/shot/buildup.webp');
function shotOutcomeImg(corner: Corner, outcome: L.ShotOutcome): string {
  if (outcome === 'wide') {
    // Wide of centre is not a visual we shot; fall back to a side deterministically.
    const side = corner === 'right' ? 'right' : 'left';
    return asset(`/moments/shot/wide-${side}.webp`);
  }
  return asset(`/moments/shot/${outcome}-${corner}.webp`);
}

/** One-on-one, four outcomes keyed by choice-outcome. */
const ONE_ON_ONE_BUILDUP = asset('/moments/one-on-one/buildup.webp');
function oneOnOneOutcomeImg(outcome: L.OneOnOneOutcome): string {
  return asset(`/moments/one-on-one/${outcome}.webp`);
}

/** Danger vs our keeper, four outcomes: rush/stay × save/goal. */
const DEF_KEEPER_BUILDUP = asset('/moments/def-keeper/buildup.webp');
function defKeeperOutcomeImg(outcome: L.DefKeeperOutcome): string {
  return asset(`/moments/def-keeper/${outcome}.webp`);
}

/** Danger vs our defender at the box edge, six outcomes. */
const DEF_TACKLE_BUILDUP = asset('/moments/def-tackle/buildup.webp');
function defTackleOutcomeImg(outcome: L.DefTackleOutcome): string {
  return asset(`/moments/def-tackle/${outcome}.webp`);
}

/** The manager pondering the shout, dressed for the stage his club is on. */
function tacticImg(tier: number): string {
  const band = tier >= 6 ? 'tier3' : tier >= 5 ? 'tier2' : 'tier1';
  return asset(`/moments/tactic/${band}.webp`);
}

/** What every moment opens on, so these are the ones that must be there first. */
const BUILDUP_IMAGES = [
  PEN_BUILDUP, FK_BUILDUP, SHOT_BUILDUP, ONE_ON_ONE_BUILDUP,
  DEF_KEEPER_BUILDUP, DEF_TACKLE_BUILDUP,
  ...['tier1', 'tier2', 'tier3'].map(s => asset(`/moments/tactic/${s}.webp`)),
];

/** Warm the moment images so the first popup does not flash-load. */
const MOMENT_IMAGES = [
  PEN_BUILDUP, FK_BUILDUP, SHOT_BUILDUP, ONE_ON_ONE_BUILDUP, DEF_KEEPER_BUILDUP, DEF_TACKLE_BUILDUP, asset('/moments/tactic.webp'),
  ...['goal-left', 'goal-center', 'goal-right', 'save-left', 'save-center', 'save-right'].map(s => asset(`/moments/penalty/${s}.webp`)),
  ...['goal-left', 'goal-center', 'goal-right', 'save-left', 'save-center', 'save-right', 'wall'].map(s => asset(`/moments/free-kick/${s}.webp`)),
  ...['goal-left', 'goal-center', 'goal-right', 'save-left', 'save-center', 'save-right', 'wide-left', 'wide-right'].map(s => asset(`/moments/shot/${s}.webp`)),
  ...['dribble-goal', 'dribble-save', 'finish-goal', 'finish-miss'].map(s => asset(`/moments/one-on-one/${s}.webp`)),
  ...['rush-save', 'rush-goal', 'stay-save', 'stay-goal'].map(s => asset(`/moments/def-keeper/${s}.webp`)),
  ...['slide-clear', 'slide-yellow', 'slide-red', 'slide-beaten', 'hold-contain', 'hold-2v1'].map(s => asset(`/moments/def-tackle/${s}.webp`)),
  ...['tier1', 'tier2', 'tier3'].map(s => asset(`/moments/tactic/${s}.webp`)),
];
let momentsPrefetched = false;
/**
 * Warm the moment art without drowning the connection. Firing every outcome
 * image at once was several megabytes in parallel, which on a phone meant the
 * popup at minute 24 could still be waiting on its picture and showed nothing
 * but the dark fallback. The build ups are what a moment opens on, so they go
 * first and alone; the outcome frames trickle in behind them, a few at a time.
 */
function preloadMoments() {
  if (momentsPrefetched || typeof document === 'undefined') return;
  momentsPrefetched = true;

  const load = (src: string) => new Promise<void>(res => {
    const i = new Image();
    i.onload = i.onerror = () => res();
    i.src = src;
  });

  const rest = MOMENT_IMAGES.filter(s => !BUILDUP_IMAGES.includes(s));
  void (async () => {
    await Promise.all(BUILDUP_IMAGES.map(load));
    for (let i = 0; i < rest.length; i += 4) {
      await Promise.all(rest.slice(i, i + 4).map(load));
    }
  })();
}

export function MatchBroadcast({ gs, onDone }: { gs: G.GameState; onDone: (r: MatchResult) => void }) {
  const liveRef = useRef<LiveState | null>(null);
  if (!liveRef.current) liveRef.current = L.createLive(G.liveMatchInput(gs));
  const st = liveRef.current;
  useEffect(preloadMoments, []);

  const [, force] = useReducer(x => x + 1, 0);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [paused, setPaused] = useState(false);
  const [subOpen, setSubOpen] = useState(false);   // the substitution sheet
  const [subFocus, setSubFocus] = useState<string | null>(null);   // a player tapped for a quick swap
  const [penOutcome, setPenOutcome] = useState<{ corner: Corner; scored: boolean } | null>(null);
  const [fkOutcome, setFkOutcome] = useState<{ corner: Corner; outcome: L.FreeKickOutcome } | null>(null);
  const [shotOutcome, setShotOutcome] = useState<{ corner: Corner; outcome: L.ShotOutcome } | null>(null);
  const [oneOnOneOutcome, setOneOnOneOutcome] = useState<L.OneOnOneOutcome | null>(null);
  const [defKeeperOutcome, setDefKeeperOutcome] = useState<L.DefKeeperOutcome | null>(null);
  const [defTackleOutcome, setDefTackleOutcome] = useState<L.DefTackleOutcome | null>(null);

  const fx = G.playerFixture(gs)!;
  const homeClub = gs.league.clubs.find(c => c.id === fx.homeId)!;
  const awayClub = gs.league.clubs.find(c => c.id === fx.awayId)!;
  const myId = G.club(gs).id;

  // the clock also stops while the bench sheet is open, so managing a sub is not
  // a race against the minute, and the sheet is not re-rendered out from under you
  const running = st.phase === 'play' && !paused && !st.pending && !subOpen && !penOutcome && !fkOutcome && !shotOutcome && !oneOnOneOutcome && !defKeeperOutcome && !defTackleOutcome;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => { L.step(st); force(); }, MS_PER_MIN / speed);
    return () => window.clearInterval(id);
  }, [running, speed, st]);

  const [flash, setFlash] = useState<L.LiveEvent | null>(null);
  const lastGoal = useRef(0);
  const bigCount = st.events.reduce((n, e) => n + (e.big ? 1 : 0), 0);
  // raise the banner only when a new goal lands
  useEffect(() => {
    if (bigCount > lastGoal.current) {
      lastGoal.current = bigCount;
      const goals = st.events.filter(e => e.big);
      setFlash(goals[goals.length - 1]);
    }
  }, [bigCount, st.events]);
  // and lower it on its own timer, decoupled from the per minute re-renders
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [flash]);

  const pending = st.pending;
  const feed = [...st.events].reverse();
  const total = 90 + st.addedTime;

  return (
    <div className="screen pad stack pad-b" style={{ gap: 12, minHeight: '100%' }}>
      {/* broadcast bar */}
      <div className="tile-hero" style={{ padding: '14px 14px 12px' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <TeamSide club={homeClub} />
          <div style={{ textAlign: 'center', minWidth: 104 }}>
            <ScorePair h={st.score[0]} a={st.score[1]} size={44} />
            <div className="pill" style={{
              marginTop: 7,
              background: st.phase === 'done' ? 'rgba(255,255,255,.06)' : 'rgba(226,72,77,.16)',
              color: st.phase === 'done' ? 'var(--ink-dim)' : 'var(--live)',
              border: '1px solid ' + (st.phase === 'done' ? 'var(--line)' : 'rgba(226,72,77,.3)'),
            }}>
              {st.phase !== 'done' && <span className="live-dot" />}
              {st.phase === 'done'
                ? 'שריקת סיום'
                : <span className="num">{st.minute}′{st.minute > 90 ? `+${st.minute - 90}` : ''}</span>}
            </div>
          </div>
          <TeamSide club={awayClub} />
        </div>

        <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, marginTop: 13, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, (st.minute / total) * 100)}%`, background: 'linear-gradient(90deg,var(--gold-lo),var(--gold-hi))', transition: 'width .25s linear' }} />
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <Stat label="שליטה" value={`${Math.round(st.possession * 100)}%`} />
          <Stat label="בעיטות" value={`${st.shots[0]} - ${st.shots[1]}`} />
          <Stat label="חילופים" value={`${st.subsUsed}/${L.MAX_SUBS}`} />
        </div>
      </div>

      {st.phase === 'halftime' ? (
        /* the dressing room takes over the screen, nothing else matters now */
        <HalfTime st={st}
          onTalk={id => { L.halfTimeTalk(st, id); force(); }}
          onSub={() => setSubOpen(true)} />
      ) : (
        <>
          {/* THE PITCH, front and centre. Dots and ball read the flow of play. */}
          <div className="tile" style={{ flex: 1, minHeight: 240, padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="label-cap">המגרש</span>
              {st.phase !== 'done' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, color: 'var(--live)' }}><span className="live-dot" />LIVE</span>}
            </div>

            <div style={{ position: 'relative' }}>
              <LivePitch st={st} home={homeClub} away={awayClub} myId={myId} />
              {flash && <GoalFlash ev={flash} mine={flash.teamId === myId} overlay />}
            </div>

            <Ticker feed={feed} myId={myId} />
          </div>

          {/* the bench brings tiring players and their best replacement to you */}
          <BenchBar st={st}
            onOpen={id => { setSubFocus(id ?? null); setSubOpen(true); }}
            onQuickSub={(off, on) => { L.makeSub(st, off, on); force(); }} />
        </>
      )}

      {/* decisions, each pops up as a full-screen moment (portaled) */}
      {pending?.kind === 'penalty' && <MomentPopup m={pending} kind="penalty" onPickCorner={c => { const scored = L.resolvePenalty(st, c); setPenOutcome({ corner: c, scored }); force(); }} />}
      {penOutcome && <PenaltyOutcome corner={penOutcome.corner} scored={penOutcome.scored} onDone={() => setPenOutcome(null)} />}
      {pending?.kind === 'shot' && <MomentPopup m={pending} kind="shot" onPickCorner={c => { const outcome = L.resolveShot(st, c); setShotOutcome({ corner: c, outcome }); force(); }} />}
      {shotOutcome && <ShotOutcomeCard corner={shotOutcome.corner} outcome={shotOutcome.outcome} onDone={() => setShotOutcome(null)} />}
      {pending?.kind === 'free_kick' && <MomentPopup m={pending} kind="free_kick" onPickCorner={c => { const outcome = L.resolveFreeKick(st, c); setFkOutcome({ corner: c, outcome }); force(); }} />}
      {fkOutcome && <FreeKickOutcomeCard corner={fkOutcome.corner} outcome={fkOutcome.outcome} onDone={() => setFkOutcome(null)} />}
      {pending?.kind === 'one_on_one' && <MomentPopup m={pending} kind="one_on_one" onPickOption={id => { const outcome = L.resolveOneOnOne(st, id); setOneOnOneOutcome(outcome); force(); }} />}
      {oneOnOneOutcome && <OneOnOneOutcomeCard outcome={oneOnOneOutcome} onDone={() => setOneOnOneOutcome(null)} />}
      {pending?.kind === 'def_keeper' && <MomentPopup m={pending} kind="def_keeper" onPickOption={id => { const outcome = L.resolveDefKeeper(st, id); setDefKeeperOutcome(outcome); force(); }} />}
      {defKeeperOutcome && <DefKeeperOutcomeCard outcome={defKeeperOutcome} onDone={() => setDefKeeperOutcome(null)} />}
      {pending?.kind === 'def_tackle' && <MomentPopup m={pending} kind="def_tackle" onPickOption={id => { const outcome = L.resolveDefTackle(st, id); setDefTackleOutcome(outcome); force(); }} />}
      {defTackleOutcome && <DefTackleOutcomeCard outcome={defTackleOutcome} onDone={() => setDefTackleOutcome(null)} />}
      {pending?.kind === 'tactic' && <MomentPopup m={pending} kind="tactic" imgOverride={tacticImg(G.club(gs).tier)} onPickOption={id => { L.resolveTactic(st, id); force(); }} />}

      {st.phase === 'done' ? (
        <button className="btn" onClick={() => onDone(L.finalize(st))}>
          לתוצאות <Icon name="chevron" size={17} />
        </button>
      ) : st.phase !== 'halftime' && (
        <div className="row" style={{ gap: 8 }}>
          <button className="btn dark btn-sm" style={{ width: 'auto', paddingInline: 16 }} onClick={() => setPaused(p => !p)}>
            <Icon name={paused ? 'play' : 'pause'} size={15} color="var(--gold)" />
          </button>
          <div className="seg" style={{ flex: 1 }}>
            {SPEEDS.map(s => (
              <button key={s} data-on={speed === s ? '1' : '0'} onClick={() => setSpeed(s)}>
                <span className="num">x{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* the bench, opened on demand so it never buries the action */}
      {subOpen && (
        <SubSheet st={st} focusId={subFocus}
          onSub={(off, on) => { L.makeSub(st, off, on); force(); }}
          onClose={() => { setSubOpen(false); setSubFocus(null); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function TeamSide({ club }: { club: Club }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 7, flex: 1 }}>
      <Crest club={club} size={42} />
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-dim)', textAlign: 'center', lineHeight: 1.2 }}>{club.short}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div className="num" style={{ fontSize: 13.5, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700, marginTop: 1 }}>{label}</div>
    </div>
  );
}

/** Fitness colour, shared by the strip and the sub sheet. */
function fitColor(f: number): string {
  return f >= 75 ? 'var(--win)' : f >= 60 ? 'var(--gold)' : f >= 50 ? '#e8863f' : 'var(--loss)';
}

/** One player line with a live fitness bar. Bench players read dimmer. */
function FitRow({ p, bench, onTap, selected }: {
  p: Player; bench?: boolean; onTap?: () => void; selected?: boolean;
}) {
  const f = Math.round(p.fitness);
  const o = overall(p);
  const inner = (
    <>
      <span className="chip" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--ink-faint)', minWidth: 34, justifyContent: 'center' }}>{p.position}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <span style={{ width: 44, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.09)', overflow: 'hidden', display: 'block' }}>
            <span style={{ display: 'block', width: `${f}%`, height: '100%', background: fitColor(f), transition: 'width var(--t-slow) var(--ease)' }} />
          </span>
          <span className="num" style={{ fontSize: 10.5, color: fitColor(f), fontWeight: 800 }}>{f}%</span>
        </span>
      </span>
      <span className="score-face" style={{ fontSize: 21, color: ovrColor(o), width: 28, textAlign: 'center' }}>{o}</span>
    </>
  );

  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'start',
    padding: '8px 6px', borderTop: '1px solid var(--line)', borderRadius: 8,
    opacity: bench ? .72 : 1,
    background: selected ? 'rgba(233,185,73,.14)' : 'transparent',
    transition: 'background var(--t-fast)',
  };

  if (!onTap) return <div style={style}>{inner}</div>;
  return (
    <button style={{ ...style, minHeight: 46 }} onClick={onTap}
      aria-label={`${p.name}, כושר ${f}, להחלפה`}>{inner}</button>
  );
}

/** The dressing room at 45 minutes: what you say, and who you change. */
function HalfTime({ st, onTalk, onSub }: { st: LiveState; onTalk: (id: L.TalkId) => void; onSub: () => void }) {
  const idx = st.iAmHome ? 0 : 1;
  const diff = st.score[idx] - st.score[1 - idx];
  const mood = diff > 0 ? 'אתה מוביל. עכשיו לא מתפרקים.'
    : diff === 0 ? 'שוויון. המחצית השנייה תקבע.'
    : 'אתה בפיגור. יש עוד 45 דקות.';

  return (
    <div style={{
      animation: 'pop .35s var(--ease-out)', borderRadius: 'var(--r-lg)', padding: 16,
      border: '1px solid rgba(233,185,73,.4)', boxShadow: 'var(--e3)',
      background: 'radial-gradient(120% 100% at 50% -10%, rgba(233,185,73,.16), transparent 62%), linear-gradient(180deg,var(--surface-3),var(--surface))',
    }}>
      <div className="stack" style={{ alignItems: 'center', gap: 5, marginBottom: 13 }}>
        <Icon name="whistle" size={26} color="var(--gold)" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, color: 'var(--gold)' }}>מחצית</div>
        <div className="sub" style={{ textAlign: 'center' }}>{mood}</div>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 13 }}>
        <Stat label="שליטה" value={`${Math.round(st.possession * 100)}%`} />
        <Stat label="בעיטות" value={`${st.shots[0]} - ${st.shots[1]}`} />
        <Stat label="חילופים" value={`${st.subsUsed}/${L.MAX_SUBS}`} />
      </div>

      {L.canSub(st) && (
        <button className="btn dark btn-sm" style={{ marginBottom: 13 }} onClick={onSub}>
          <Icon name="sub" size={15} color="var(--gold)" /> חילופים והרכב
        </button>
      )}

      <div className="label-cap" style={{ marginBottom: 8 }}>מה אתה אומר להם</div>
      <div className="stack" style={{ gap: 8 }}>
        {L.TALKS.map(t => (
          <button key={t.id} className="btn dark" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'start', minHeight: 56 }}
            onClick={() => onTalk(t.id)}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{t.label}</span>
            <span className="sub" style={{ fontSize: 12 }}>{t.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The compact lineup, one thin row of eleven fitness bars that sits under the
 * live feed. It stays out of the way of the action, and a tap opens the bench
 * for a substitution. Tired players make it glow so you notice without hunting.
 */
/**
 * The bench, surfaced. Instead of a thin diagram to hunt through, it brings the
 * decision to you: the players who are tiring float up as cards with their name
 * and fitness, each with a one tap swap for the best replacement (name and
 * rating shown). The full lineup and manual control stay one tap away.
 */
function BenchBar({ st, onOpen, onQuickSub }: {
  st: LiveState; onOpen: (focusId?: string) => void; onQuickSub: (offId: string, onId: string) => void;
}) {
  const side = st.iAmHome ? st.home : st.away;
  const canSub = L.canSub(st);
  const tired = [...side.onPitch]
    .filter(p => p.position !== 'GK' && p.fitness < 70)
    .sort((a, b) => a.fitness - b.fitness)
    .slice(0, 2);

  return (
    <div className="tile" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="row" style={{ gap: 8 }}>
          <Icon name="sub" size={16} color="var(--gold)" />
          <span style={{ fontWeight: 800, fontSize: 12.5 }}>ספסל וחילופים</span>
        </span>
        <span className="chip" style={{ background: canSub ? 'rgba(233,185,73,.14)' : 'rgba(255,255,255,.05)', color: canSub ? 'var(--gold)' : 'var(--ink-faint)' }}>
          <span className="num">{st.subsUsed}/{L.MAX_SUBS}</span>
        </span>
      </div>

      {!canSub ? (
        <div className="sub" style={{ fontSize: 12.5, textAlign: 'center', padding: '4px 0' }}>נגמרו החילופים למשחק</div>
      ) : tired.length === 0 ? (
        <button className="btn dark btn-sm" onClick={() => onOpen()} style={{ minHeight: 46 }}>
          <Icon name="shirt" size={14} color="var(--gold)" /> הסגל טרי, פתיחת הרכב וספסל
        </button>
      ) : (
        <>
          {tired.map(p => {
            const rep = L.suggestSubs(st, p.id)[0];
            const f = Math.round(p.fitness);
            const diff = rep ? overall(rep.player) - overall(p) : 0;
            return (
              <div key={p.id} className="row" style={{
                gap: 8, justifyContent: 'space-between',
                background: 'var(--bg)', border: '1px solid rgba(226,72,77,.22)',
                borderRadius: 'var(--r-sm)', padding: '7px 9px',
              }}>
                <span className="row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
                  <span className="chip" style={{ background: 'rgba(226,72,77,.16)', color: 'var(--loss)', minWidth: 30, justifyContent: 'center' }}>{p.position}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span className="num" style={{ fontSize: 10.5, color: fitColor(f), fontWeight: 800 }}>{f}% כושר, מתעייף</span>
                  </span>
                </span>
                {rep ? (
                  <button className="btn btn-sm" style={{ width: 'auto', paddingInline: 11, minHeight: 42, flex: 'none', gap: 6 }}
                    onClick={() => onQuickSub(p.id, rep.player.id)}
                    aria-label={`הכנס ${rep.player.name} במקום ${p.name}`}>
                    <Icon name="sub" size={13} />
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, maxWidth: 92, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rep.player.name}</span>
                      <span className="num" style={{ fontSize: 9.5, fontWeight: 800, opacity: .85 }}>
                        {overall(rep.player)}{diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}
                      </span>
                    </span>
                  </button>
                ) : (
                  <button className="chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ink-dim)', border: 'none' }} onClick={() => onOpen(p.id)}>בחר מחליף</button>
                )}
              </div>
            );
          })}
          <button onClick={() => onOpen()} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold)', textAlign: 'center', paddingTop: 1 }}>
            הרכב וספסל מלא ‹
          </button>
        </>
      )}
    </div>
  );
}

/**
 * The bench as a bottom sheet, opened on demand. It holds the full lineup with
 * live fitness and the two tap substitution flow, so the action screen behind
 * it stays clean.
 */
function SubSheet({ st, onSub, onClose, focusId }: {
  st: LiveState; onSub: (offId: string, onId: string) => void; onClose: () => void; focusId?: string | null;
}) {
  const [picked, setPicked] = useState<string | null>(focusId ?? null);
  const side = st.iAmHome ? st.home : st.away;
  const canSub = L.canSub(st) && (st.phase === 'play' || st.phase === 'halftime');

  return (
    <Portal>
      <div className="sheet-scrim" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '84vh', overflowY: 'auto' }} role="dialog" aria-label="הרכב וחילופים">
          <div className="sheet-grip" />
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="h2">ההרכב שלי</div>
            <span className="chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ink-dim)' }}>
              חילופים <span className="num">{st.subsUsed}/{L.MAX_SUBS}</span>
            </span>
          </div>

          <p className="hint" style={{ margin: '0 0 8px' }}>
            {canSub ? 'לחץ על שחקן כדי לראות מי יכול להחליף אותו.' : 'נגמרו החילופים, אבל אפשר עדיין לעקוב אחרי הכושר.'}
          </p>

          {side.onPitch.map(p => (
            <div key={p.id}>
              <FitRow p={p} selected={picked === p.id}
                onTap={canSub ? () => setPicked(picked === p.id ? null : p.id) : undefined} />
              {picked === p.id && (
                <SubOptions st={st} off={p}
                  onSub={(off, on) => { onSub(off, on); setPicked(null); }}
                  onClose={() => setPicked(null)} />
              )}
            </div>
          ))}

          <div className="row" style={{ gap: 8, marginTop: 12, paddingTop: 9, borderTop: '1px solid var(--line-2)' }}>
            <Icon name="sub" size={13} color="var(--ink-faint)" />
            <span className="label-cap">ספסל</span>
            <span className="spacer" />
            <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700 }}>
              <span className="num">{side.bench.length}</span> זמינים
            </span>
          </div>
          {side.bench.length === 0
            ? <div className="sub" style={{ fontSize: 12, padding: '6px 0' }}>הספסל ריק</div>
            : side.bench.map(p => <FitRow key={p.id} p={p} bench />)}

          <button className="btn" style={{ marginTop: 14 }} onClick={onClose}>חזרה למשחק</button>
        </div>
      </div>
    </Portal>
  );
}

/**
 * The replacements offered for one specific player, right under their row.
 * Two taps and the change is done, no separate screen.
 */
function SubOptions({ st, off, onSub, onClose }: {
  st: LiveState; off: Player; onSub: (offId: string, onId: string) => void; onClose: () => void;
}) {
  const options = L.suggestSubs(st, off.id);
  const offOvr = overall(off);

  return (
    <div className="stack" style={{
      gap: 7, margin: '4px 0 10px', padding: '11px 12px',
      background: 'var(--bg)', border: '1px solid rgba(233,185,73,.32)',
      borderRadius: 'var(--r-sm)', animation: 'riseIn var(--t-fast) var(--ease-out)',
    }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>
          מי נכנס במקום {off.name} <span className="num" style={{ color: ovrColor(offOvr) }}>({offOvr})</span>?
        </span>
        <button onClick={onClose} style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>ביטול</button>
      </div>

      {options.length === 0 ? (
        <div className="sub" style={{ fontSize: 12 }}>
          {off.position === 'GK' ? 'אין שוער נוסף בספסל' : 'אין מחליף מתאים בספסל'}
        </div>
      ) : options.map(o => {
        return (
          <button key={o.player.id} className="btn dark btn-sm"
            style={{ justifyContent: 'space-between', minHeight: 50, padding: '9px 12px' }}
            onClick={() => onSub(off.id, o.player.id)}>
            <span className="row" style={{ gap: 8 }}>
              <span className="chip" style={{ background: o.exact ? 'rgba(47,169,107,.18)' : 'rgba(255,255,255,.06)', color: o.exact ? 'var(--win)' : 'var(--ink-dim)', minWidth: 34, justifyContent: 'center' }}>
                {o.player.position}
              </span>
              <span style={{ textAlign: 'start' }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5 }}>{o.player.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>{o.reason}</span>
              </span>
            </span>
            {/* quality coming on, and whether that is a step up on the man going off */}
            <span className="row" style={{ gap: 6 }}>
              <span className="num" style={{
                fontSize: 10.5, fontWeight: 900,
                color: overall(o.player) - offOvr > 0 ? 'var(--win)' : overall(o.player) - offOvr < 0 ? 'var(--loss)' : 'var(--ink-faint)',
              }}>
                {overall(o.player) - offOvr > 0 ? `+${overall(o.player) - offOvr}` : overall(o.player) - offOvr < 0 ? `${overall(o.player) - offOvr}` : '='}
              </span>
              <span className="score-face" style={{ fontSize: 20, color: ovrColor(overall(o.player)) }}>{overall(o.player)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GoalFlash({ ev, mine, overlay }: { ev: L.LiveEvent; mine: boolean; overlay?: boolean }) {
  return (
    <div style={{
      position: overlay ? 'absolute' : 'relative', overflow: 'hidden', animation: 'pop .45s var(--ease-out)',
      ...(overlay ? { left: 14, right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 4, pointerEvents: 'none' as const } : null),
      borderRadius: 'var(--r-lg)', padding: '16px 18px', textAlign: 'center',
      border: '1px solid ' + (mine ? 'rgba(47,169,107,.45)' : 'rgba(226,72,77,.4)'),
      background: mine
        ? 'linear-gradient(135deg,rgba(47,169,107,.4),rgba(10,25,17,.94))'
        : 'linear-gradient(135deg,rgba(226,72,77,.36),rgba(25,10,12,.94))',
      boxShadow: 'var(--e2)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(75deg,transparent 42%,rgba(255,255,255,.16) 50%,transparent 58%)', animation: 'sweep 1.1s var(--ease-out)' }} />
      <div className="row" style={{ justifyContent: 'center', gap: 10, position: 'relative' }}>
        <Icon name="ball" size={26} color={mine ? 'var(--win)' : 'var(--loss)'} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '-.01em' }}>גוווול</span>
      </div>
      <div style={{ fontWeight: 800, marginTop: 4, position: 'relative' }}>{ev.playerName}</div>
    </div>
  );
}

/** A slim two line commentary ticker under the pitch, keeps the words alive
 *  without the pitch competing with a tall feed. */
function Ticker({ feed, myId }: { feed: L.LiveEvent[]; myId: string }) {
  const show = feed.slice(0, 2);
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 0, minHeight: 62 }}>
      {show.length === 0 ? (
        <div className="row" style={{ gap: 8, opacity: .7, padding: '8px 2px' }}>
          <Icon name="whistle" size={16} color="var(--ink-faint)" />
          <span className="sub" style={{ fontSize: 12.5 }}>שריקת פתיחה, יוצאים לדרך.</span>
        </div>
      ) : show.map((e, i) => (
        <FeedRow key={`${e.minute}-${i}-${e.text}`} ev={e} mine={e.teamId === myId} fresh={i === 0} dim={i * 0.4} />
      ))}
    </div>
  );
}

const EVENT_ICON: Record<string, { name: IconName; color: string }> = {
  goal: { name: 'ball', color: 'var(--win)' },
  penalty_goal: { name: 'ball', color: 'var(--win)' },
  penalty_miss: { name: 'target', color: 'var(--loss)' },
  yellow: { name: 'cardYellow', color: '#EFC94C' },
  red: { name: 'cardRed', color: 'var(--loss)' },
  injury: { name: 'injury', color: 'var(--loss)' },
  chance: { name: 'alert', color: 'var(--gold)' },
  sub: { name: 'sub', color: 'var(--sky)' },
  tactic: { name: 'clipboard', color: 'var(--ink-dim)' },
  ambient: { name: 'whistle', color: 'var(--ink-faint)' },
};

function FeedRow({ ev, mine, fresh, dim }: { ev: L.LiveEvent; mine: boolean; fresh: boolean; dim: number }) {
  const ic = EVENT_ICON[ev.type] ?? { name: 'alert' as IconName, color: 'var(--ink-dim)' };
  const big = ev.type === 'goal' || ev.type === 'penalty_goal';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px',
      borderRadius: 'var(--r-sm)', opacity: 1 - dim,
      background: big ? (mine ? 'rgba(47,169,107,.09)' : 'rgba(226,72,77,.07)') : 'transparent',
      borderInlineStart: big ? `2px solid ${mine ? 'var(--win)' : 'var(--loss)'}` : '2px solid transparent',
      animation: fresh ? 'slidein var(--t-mid) var(--ease-out)' : undefined,
    }}>
      <span className="num" style={{ color: 'var(--ink-faint)', fontWeight: 800, width: 30, fontSize: 12.5 }}>{ev.minute}′</span>
      <Icon name={ic.name} size={17} color={ic.color} />
      <span style={{ fontSize: 13.5, fontWeight: big ? 700 : 400, lineHeight: 1.4 }}>{ev.text}</span>
    </div>
  );
}

/**
 * A full screen popup for the moments in the match. The generated cover image
 * carries most of the drama, so the layout keeps it front and centre and only
 * the choices sit on top. The scrim blocks the rest of the UI so the player
 * stays in the moment.
 */

type MomentKind = 'penalty' | 'shot' | 'one_on_one' | 'tactic' | 'free_kick' | 'def_keeper' | 'def_tackle';

const MOMENT_LOOK: Record<MomentKind, { img: string; accent: string; kicker: string }> = {
  penalty:    { img: PEN_BUILDUP,                accent: 'var(--blood)', kicker: 'פנדל' },
  shot:       { img: SHOT_BUILDUP,               accent: 'var(--gold)',  kicker: 'הזדמנות' },
  one_on_one: { img: ONE_ON_ONE_BUILDUP,         accent: 'var(--win)',   kicker: 'אחד על אחד' },
  tactic:     { img: asset('/moments/tactic.webp'),     accent: 'var(--gold)',  kicker: 'בקווים' },
  free_kick:  { img: FK_BUILDUP,                 accent: 'var(--sky)',   kicker: 'בעיטה חופשית' },
  def_keeper: { img: DEF_KEEPER_BUILDUP,         accent: 'var(--loss)',  kicker: 'סכנה, מול השוער' },
  def_tackle: { img: DEF_TACKLE_BUILDUP,         accent: 'var(--loss)',  kicker: 'סכנה, חדירה' },
};

/**
 * The payoff after the player picks a corner on a penalty. It holds the match
 * on a full frame of the outcome, the ball in the net or the keeper's save, so
 * the choice lands before the feed moves on. One tap continues.
 */
function PenaltyOutcome({ corner, scored, onDone }: { corner: Corner; scored: boolean; onDone: () => void }) {
  const img = penOutcomeImg(corner, scored);
  const accent = scored ? 'var(--win)' : 'var(--loss)';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: scored ? 40 : 30, color: accent, lineHeight: 1 }}>
              {scored ? 'גוווול!' : 'נעצר.'}
            </div>
            <div className="sub" style={{ marginTop: 6 }}>
              {scored ? 'הכדור ברשת, היציע מתפוצץ' : 'השוער קרא את זה, הזדמנות שנשרפה'}
            </div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Free-kick payoff card, three outcomes, same shape as the penalty one. */
function FreeKickOutcomeCard({ corner, outcome, onDone }: { corner: Corner; outcome: L.FreeKickOutcome; onDone: () => void }) {
  const img = fkOutcomeImg(corner, outcome);
  const accent = outcome === 'goal' ? 'var(--win)' : 'var(--loss)';
  const head = outcome === 'goal' ? 'גוווול!' : outcome === 'save' ? 'נעצר.' : 'בחומה.';
  const sub = outcome === 'goal' ? 'מסובב מעל החומה, היציע בטירוף'
    : outcome === 'save' ? 'השוער עף והודף את הכדור'
    : 'הכדור פוגע בחומה ונחסם';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: outcome === 'goal' ? 40 : 30, color: accent, lineHeight: 1 }}>{head}</div>
            <div className="sub" style={{ marginTop: 6 }}>{sub}</div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Open-play shot payoff, three outcomes. */
function ShotOutcomeCard({ corner, outcome, onDone }: { corner: Corner; outcome: L.ShotOutcome; onDone: () => void }) {
  const img = shotOutcomeImg(corner, outcome);
  const accent = outcome === 'goal' ? 'var(--win)' : 'var(--loss)';
  const head = outcome === 'goal' ? 'גוווול!' : outcome === 'save' ? 'נעצר.' : 'החמצה.';
  const sub = outcome === 'goal' ? 'הכדור ברשת, היציע מתפוצץ'
    : outcome === 'save' ? 'השוער ניחש נכון וקלט'
    : 'הכיוון היה שם, אבל הכדור שרק ליד הקורה';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: outcome === 'goal' ? 40 : 30, color: accent, lineHeight: 1 }}>{head}</div>
            <div className="sub" style={{ marginTop: 6 }}>{sub}</div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** One-on-one payoff, four combinations of choice and outcome. */
function OneOnOneOutcomeCard({ outcome, onDone }: { outcome: L.OneOnOneOutcome; onDone: () => void }) {
  const img = oneOnOneOutcomeImg(outcome);
  const scored = outcome === 'dribble-goal' || outcome === 'finish-goal';
  const accent = scored ? 'var(--win)' : 'var(--loss)';
  const head = scored ? 'גוווול!' : outcome === 'dribble-save' ? 'השוער אסף.' : 'החטאה.';
  const sub = outcome === 'dribble-goal' ? 'עגל את השוער והכניס לשער ריק'
    : outcome === 'finish-goal' ? 'שיגר לפינה, השוער לא הגיע'
    : outcome === 'dribble-save' ? 'השוער קרא את המהלך. היה עדיף לתת פס לפינה ולסגור סיפור'
    : 'בעט מעל השער, החמצה כואבת';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: scored ? 40 : 30, color: accent, lineHeight: 1 }}>{head}</div>
            <div className="sub" style={{ marginTop: 6 }}>{sub}</div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Danger vs our keeper payoff, four choice-outcome combinations. */
function DefKeeperOutcomeCard({ outcome, onDone }: { outcome: L.DefKeeperOutcome; onDone: () => void }) {
  const img = defKeeperOutcomeImg(outcome);
  const saved = outcome === 'rush-save' || outcome === 'stay-save';
  const accent = saved ? 'var(--win)' : 'var(--loss)';
  const head = saved ? 'הצלה!' : 'ספגנו שער';
  const sub = outcome === 'rush-save' ? 'השוער יצא בזמן ולקח את הכדור בזמן'
    : outcome === 'stay-save' ? 'השוער עמד גדול על הקו'
    : outcome === 'rush-goal' ? 'השחקן עבר את השוער וסיים מול שער ריק'
    : 'מצא את הפינה, לשוער לא היה סיכוי';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: saved ? 40 : 30, color: accent, lineHeight: 1 }}>{head}</div>
            <div className="sub" style={{ marginTop: 6 }}>{sub}</div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Danger vs our defender payoff, six outcomes. */
function DefTackleOutcomeCard({ outcome, onDone }: { outcome: L.DefTackleOutcome; onDone: () => void }) {
  const img = defTackleOutcomeImg(outcome);
  const good = outcome === 'slide-clear' || outcome === 'hold-contain';
  const accent = good ? 'var(--win)' : 'var(--loss)';
  const head = outcome === 'slide-clear' ? 'תיקול נקי!'
    : outcome === 'hold-contain' ? 'עוצר!'
    : outcome === 'slide-yellow' ? 'צהוב.'
    : outcome === 'slide-red' ? 'אדום.'
    : outcome === 'slide-beaten' ? 'עברו את הבלם.'
    : '2 על 1.';
  const sub = outcome === 'slide-clear' ? 'גליץ׳ מושלם, הכדור הרחק לקרן'
    : outcome === 'hold-contain' ? 'הבלם עצר אותו, אין למי למסור'
    : outcome === 'slide-yellow' ? 'הפיל אותו, השופט הוציא כרטיס צהוב'
    : outcome === 'slide-red' ? 'כניסה פראית של הבלם האחרון שלנו, הוא בחוץ'
    : outcome === 'slide-beaten' ? 'הגליץ׳ פספס, הוא חדר'
    : 'תוקף נוסף הצטרף בזמן, הבלם נחשף';
  return (
    <Portal>
      <div className="moment-scrim" onClick={onDone}>
        <div className="moment" style={{ borderColor: `${accent}55` }} onClick={e => e.stopPropagation()}>
          <div className="moment-hero" style={{ backgroundImage: `url('${img}')`, aspectRatio: '9 / 12', backgroundPosition: 'center 34%' }} aria-hidden="true">
            <div className="moment-hero-fade" />
          </div>
          <div className="moment-body" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: good ? 40 : 30, color: accent, lineHeight: 1 }}>{head}</div>
            <div className="sub" style={{ marginTop: 6 }}>{sub}</div>
            <button className="btn" style={{ marginTop: 16 }} onClick={onDone}>המשך <Icon name="chevron" size={17} /></button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function MomentPopup({ m, kind, onPickCorner, onPickOption, imgOverride }: {
  m: L.Moment;
  kind: MomentKind;
  onPickCorner?: (c: Corner) => void;
  onPickOption?: (id: string) => void;
  imgOverride?: string;
}) {
  const look = MOMENT_LOOK[kind];
  const img = imgOverride ?? look.img;
  const tend = m.keeperDir === 'left' ? 'נוטה לצלול שמאלה'
    : m.keeperDir === 'right' ? 'נוטה לצלול ימינה'
    : 'בדרך כלל נשאר במרכז';

  return (
    <Portal>
    <div className="moment-scrim">
      <div className="moment" style={{ borderColor: `${look.accent}55` }}>
        {/* image + gradient overlay, sits at the top edge of the popup */}
        <div className="moment-hero" style={{ backgroundImage: `url('${img}')` }} aria-hidden="true">
          <div className="moment-hero-fade" />
          <div className="moment-hero-badge" style={{ background: `${look.accent}22`, borderColor: `${look.accent}55`, color: look.accent }}>
            <span className="num" style={{ fontSize: 12, fontWeight: 900 }}>{m.minute}′</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.01em' }}>{look.kicker}</span>
          </div>
        </div>

        <div className="moment-body">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: look.accent, textAlign: 'center', lineHeight: 1.1 }}>
            {m.title}
          </div>
          <div className="sub" style={{ textAlign: 'center', marginTop: 6 }}>
            {onPickCorner ? `${m.subtitle}. המודיעין: השוער ${tend}.` : m.subtitle}
          </div>

          {onPickCorner && (
            /* ltr on purpose: 'שמאל' must sit on screen left, matching the keeper hint above */
            <div className="row" style={{ gap: 8, marginTop: 16, direction: 'ltr' }}>
              {CORNERS.map(c => (
                <button key={c.id} className="btn btn-sm" style={{ flex: 1 }} onClick={() => onPickCorner(c.id)}>{c.label}</button>
              ))}
            </div>
          )}

          {onPickOption && (
            <div className="stack" style={{ gap: 9, marginTop: 16 }}>
              {m.options!.map(o => (
                <button key={o.id} className="btn dark" style={{ justifyContent: 'flex-start', textAlign: 'start', minHeight: 58, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }} onClick={() => onPickOption(o.id)}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{o.label}</span>
                  {o.hint && <span className="sub" style={{ fontSize: 12 }}>{o.hint}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </Portal>
  );
}
