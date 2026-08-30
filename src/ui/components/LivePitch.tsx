import { useEffect, useRef } from 'react';
import type { LiveState, Side } from '../../game/liveMatch.ts';
import type { Club } from '../../data/clubs.ts';
import { formation, fillFormation } from '../../data/formations.ts';
import { PitchSim, eventToPlay } from '../../game/pitchSim.ts';
import type { PitchSlot } from '../../game/pitchSim.ts';

/**
 * The live 2D pitch.
 *
 * All the football lives in game/pitchSim.ts, which is plain data in and plain
 * data out so it can be driven ninety minutes at a time from a Node harness
 * (scripts/pitch-check.mts). This file only wires it to the match: it lines
 * both sides up in the formation their manager picked, feeds commentary events
 * in so a goal on the ticker is a goal on the pitch, and writes the positions
 * straight to the DOM, so a 60fps pitch costs no React renders.
 */

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function LivePitch({ st, home, away, myId }: { st: LiveState; home: Club; away: Club; myId: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLSpanElement>());
  const ballEl = useRef<HTMLSpanElement>(null);
  const stRef = useRef(st); stRef.current = st;

  const fHome = formation(st.home.tactic.formation);
  const fAway = formation(st.away.tactic.formation);
  const slots: PitchSlot[] = [
    ...fillFormation(st.home.onPitch, fHome).map((p, i) => ({ id: `h${p.id}`, home: true, i, fm: fHome })),
    ...fillFormation(st.away.onPitch, fAway).map((p, i) => ({ id: `a${p.id}`, home: false, i, fm: fAway })),
  ];
  const slotsRef = useRef(slots); slotsRef.current = slots;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const box = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver(() => { box.w = el.clientWidth; box.h = el.clientHeight; });
    ro.observe(el);

    const sim = new PitchSim();
    sim.setSlots(slotsRef.current);
    let seen = stRef.current.events.length;

    let raf = 0;
    let last = performance.now();

    const write = (n: HTMLSpanElement, x: number, y: number, size: number) => {
      n.style.transform = `translate3d(${x * box.w - size / 2}px, ${y * box.h - size / 2}px, 0)`;
    };

    const frame = (now: number) => {
      const s = stRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const off = s.phase === 'halftime' || s.phase === 'done';

      sim.setSlots(slotsRef.current);

      // A goal in the commentary has to be a goal on the pitch, at the right end.
      //
      // `seen` is a read cursor into the event list, and only events past it are
      // ever acted on. It used to be a length, and the search then ran backwards
      // over the WHOLE history, so any event at all, an ambient line, a booking,
      // a substitution, re-fired the most recent goal. Score in the ninth minute
      // and every commentary line for the rest of the match replayed that goal on
      // the pitch, which is why goals arrived from nowhere with nothing on the
      // ticker to match them.
      if (s.events.length > seen) {
        const fire = eventToPlay(s.events, seen, s.home.id);
        seen = s.events.length;
        if (fire) sim.event(fire.home, fire.scored);
      }

      const all = sim.step(dt, t, s.possession, off);

      for (const { sl, p } of all) {
        const node = nodes.current.get(sl.id);
        if (node) {
          const me = (sl.home ? s.home : s.away).id === myId;
          write(node, p.x, p.y, me ? 13 : 11);
        }
      }
      if (ballEl.current) write(ballEl.current, sim.B.x, sim.B.y, 9);

      raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      for (const sl of slotsRef.current) {
        const node = nodes.current.get(sl.id);
        const slot = sl.fm.slots[sl.i] ?? sl.fm.slots[sl.fm.slots.length - 1];
        if (node) write(node, sl.home ? 0.06 + slot.d * 0.4 : 0.94 - slot.d * 0.4, 0.09 + slot.y * 0.82, 11);
      }
      if (ballEl.current) write(ballEl.current, 0.5, 0.5, 9);
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [myId]);

  return (
    <div ref={wrap} role="img" aria-label="מפת המגרש החי" style={{
      position: 'relative', width: '100%', aspectRatio: '100 / 62', borderRadius: 'var(--r-md)',
      overflow: 'hidden', border: '1px solid rgba(255,255,255,.09)',
      background: 'repeating-linear-gradient(90deg, #1f7a43 0 10%, #1b6e3c 10% 20%)',
      boxShadow: 'inset 0 0 40px rgba(0,0,0,.4)',
    }}>
      <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="0.4">
          <rect x="2" y="2" width="96" height="58" />
          <line x1="50" y1="2" x2="50" y2="60" />
          <circle cx="50" cy="31" r="8.5" />
          <circle cx="50" cy="31" r="0.7" fill="rgba(255,255,255,.28)" stroke="none" />
          <rect x="2" y="16" width="13" height="30" />
          <rect x="85" y="16" width="13" height="30" />
          <rect x="2" y="24" width="5" height="14" />
          <rect x="93" y="24" width="5" height="14" />
        </g>
        <rect x="0.4" y="27" width="1.6" height="8" fill="rgba(255,255,255,.5)" />
        <rect x="98" y="27" width="1.6" height="8" fill="rgba(255,255,255,.5)" />
      </svg>

      {slots.map(sl => {
        const side: Side = sl.home ? st.home : st.away;
        const club = sl.home ? home : away;
        const me = side.id === myId;
        return (
          <span key={sl.id} ref={n => { if (n) nodes.current.set(sl.id, n); else nodes.current.delete(sl.id); }}
            aria-hidden="true" style={{
              position: 'absolute', left: 0, top: 0,
              width: me ? 13 : 11, height: me ? 13 : 11, borderRadius: '50%',
              background: club.primary, border: `1.5px solid ${me ? '#fff' : 'rgba(0,0,0,.45)'}`,
              boxShadow: me ? '0 0 7px rgba(255,255,255,.5)' : '0 1px 3px rgba(0,0,0,.5)',
              willChange: 'transform', zIndex: 2,
            }} />
        );
      })}

      <span ref={ballEl} aria-hidden="true" style={{
        position: 'absolute', left: 0, top: 0, width: 9, height: 9, borderRadius: '50%',
        background: '#fff', border: '1px solid rgba(0,0,0,.55)',
        boxShadow: '0 0 8px rgba(255,255,255,.8)', willChange: 'transform', zIndex: 3,
      }} />
    </div>
  );
}
