import { useEffect, useRef } from 'react';
import type { LiveState, Side } from '../../game/liveMatch.ts';
import type { Player } from '../../engine/matchEngine.ts';
import type { Club } from '../../data/clubs.ts';

/**
 * The live 2D pitch.
 *
 * Two things drive it. The ball runs a possession state machine: it is held at
 * someone's feet, then played, a short pass, a switch across the pitch, a shot,
 * and shots turn into corners and goal kicks, so the rhythm is football rhythm
 * rather than a dot sliding around. And the players are individuals, not a
 * block: the man on the ball goes to the ball, the receiver runs onto the pass,
 * the nearest opponent presses, and each player breaks his slot now and then,
 * a full back overlaps, a midfielder makes a late run past the striker, a
 * winger cuts inside, a striker drops off. At the whistle they walk off.
 *
 * Presentational only. It reads LiveState, never drives the sim, and writes
 * positions straight to the DOM so a 60fps pitch costs no React renders.
 */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const rnd = Math.random;

/** 4-3-3 slots. d = depth inside the team block (0 deepest, 1 highest), y = lane. */
const SLOTS: { d: number; y: number }[] = [
  { d: 0.00, y: 0.50 },                                                        // GK, handled apart
  { d: 0.07, y: 0.15 }, { d: 0.00, y: 0.38 }, { d: 0.00, y: 0.62 }, { d: 0.07, y: 0.85 },
  { d: 0.50, y: 0.26 }, { d: 0.43, y: 0.50 }, { d: 0.50, y: 0.74 },
  { d: 0.88, y: 0.16 }, { d: 1.00, y: 0.50 }, { d: 0.88, y: 0.84 },
];

/** How each slot breaks shape when his team is on top. */
const BREAK: Record<number, { d: number; y: number }> = {
  1: { d: 0.55, y: -0.10 },   // left back overlaps, hugs the line
  2: { d: 0.30, y: 0.05 },    // centre half steps into midfield
  3: { d: 0.30, y: -0.05 },
  4: { d: 0.55, y: 0.10 },    // right back overlaps
  5: { d: 0.42, y: 0.06 },    // late runs from midfield
  6: { d: 0.36, y: 0.00 },
  7: { d: 0.42, y: -0.06 },
  8: { d: 0.10, y: 0.22 },    // winger cuts inside
  9: { d: -0.38, y: 0.00 },   // striker drops off the front
  10: { d: 0.10, y: -0.22 },
};

const DEF = ['LB', 'RB', 'CB', 'LWB', 'RWB'];
const MID = ['CDM', 'CM', 'CAM', 'DM', 'AM', 'LM', 'RM'];
const FWD = ['LW', 'RW', 'ST', 'CF', 'SS'];

function ordered(players: Player[]): Player[] {
  const pick = (t: (p: Player) => boolean) => players.filter(t);
  return [
    ...pick(p => p.position === 'GK'),
    ...pick(p => DEF.includes(p.position)),
    ...pick(p => MID.includes(p.position)),
    ...pick(p => FWD.includes(p.position)),
  ].slice(0, 11);
}

interface Slot { id: string; home: boolean; i: number }
interface Pt { x: number; y: number }
type B_After = '' | 'corner' | 'goalkick' | 'cross';

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function LivePitch({ st, home, away, myId }: { st: LiveState; home: Club; away: Club; myId: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLSpanElement>());
  const ballEl = useRef<HTMLSpanElement>(null);
  const stRef = useRef(st); stRef.current = st;

  const slots: Slot[] = [
    ...ordered(st.home.onPitch).map((p, i) => ({ id: `h${p.id}`, home: true, i })),
    ...ordered(st.away.onPitch).map((p, i) => ({ id: `a${p.id}`, home: false, i })),
  ];
  const slotsRef = useRef(slots); slotsRef.current = slots;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const box = { w: el.clientWidth, h: el.clientHeight };
    const ro = new ResizeObserver(() => { box.w = el.clientWidth; box.h = el.clientHeight; });
    ro.observe(el);

    const pos = new Map<string, Pt>();
    const runs = new Map<string, { until: number; next: number; d: number; y: number }>();
    let playX = 0.5, playY = 0.5;
    let seen = stRef.current.events.length;

    // the ball's possession machine
    const B = {
      x: 0.5, y: 0.5, tx: 0.5, ty: 0.5,
      fly: false, sp: 0.8, until: 0,
      holder: null as string | null,
      rx: null as string | null,      // who the ball is played to
      after: '' as B_After,
      set: '' as '' | 'cross',        // a set piece waiting on the taker
      surge: 0, surgeHome: true,      // bodies into the box for a corner
    };

    let raf = 0;
    let last = performance.now();

    const write = (n: HTMLSpanElement, x: number, y: number, size: number) => {
      n.style.transform = `translate3d(${x * box.w - size / 2}px, ${y * box.h - size / 2}px, 0)`;
    };
    const goalOf = (isHome: boolean) => (isHome ? 0.965 : 0.035);   // the goal that side attacks
    const gkOf = (isHome: boolean) => slotsRef.current.find(s => s.home === isHome && s.i === 0)?.id ?? null;

    const kick = (tx: number, ty: number, sp: number, rx: string | null, after: B_After = '') => {
      B.tx = clamp(tx, 0.02, 0.98); B.ty = clamp(ty, 0.03, 0.97);
      B.sp = sp; B.fly = true; B.rx = rx; B.after = after; B.holder = null;
    };

    /** Decide what the man on the ball does next. */
    const act = (t: number, all: { sl: Slot; p: Pt }[]) => {
      if (B.set === 'cross') {                       // the corner is whipped in
        B.set = '';
        kick(B.surgeHome ? 0.90 : 0.10, 0.5 + (rnd() - 0.5) * 0.28, 0.9, null);
        return;
      }
      const me = all.find(a => a.sl.id === B.holder);
      if (!me) {                                     // nobody has it, nearest player picks it up
        let best: { sl: Slot; p: Pt } | null = null, bd = Infinity;
        for (const a of all) { const d = (a.p.x - B.x) ** 2 + (a.p.y - B.y) ** 2; if (d < bd) { bd = d; best = a; } }
        B.holder = best ? best.sl.id : null;
        B.until = t + 0.35;                          // always advances, never busy loops
        return;
      }
      const mates = all.filter(a => a.sl.home === me.sl.home && a.sl.id !== me.sl.id && a.sl.i !== 0);
      const opps = all.filter(a => a.sl.home !== me.sl.home);
      const goal = goalOf(me.sl.home);
      const fwd = me.sl.home ? 1 : -1;
      const inFinal = me.sl.home ? me.p.x > 0.68 : me.p.x < 0.32;
      const r = rnd();

      if (inFinal && r < 0.20) {                     // shot
        kick(goal, 0.5 + (rnd() - 0.5) * 0.22, 1.5, null, rnd() < 0.55 ? 'corner' : 'goalkick');
        return;
      }
      if (r < 0.34) {                                // turnover, an opponent reads it
        const near = opps.sort((a, b) => (a.p.x - me.p.x) ** 2 + (a.p.y - me.p.y) ** 2 - ((b.p.x - me.p.x) ** 2 + (b.p.y - me.p.y) ** 2))[0];
        if (near) { kick(near.p.x, near.p.y, 0.75, near.sl.id); return; }
      }
      if (r < 0.50) {                                // switch of play, a long ball across
        const far = mates.sort((a, b) => Math.abs(b.p.y - me.p.y) - Math.abs(a.p.y - me.p.y))[0];
        if (far) { kick(far.p.x + fwd * 0.04, far.p.y, 0.62, far.sl.id); return; }
      }
      if (r < 0.60) { B.until = t + 0.5 + rnd() * 0.6; return; }   // carries it

      // short pass, one of the nearer options, nudged forward
      const near = mates
        .map(a => ({ a, d: (a.p.x - me.p.x) ** 2 + (a.p.y - me.p.y) ** 2 - (a.p.x - me.p.x) * fwd * 0.12 }))
        .sort((x, y) => x.d - y.d).slice(0, 4);
      const to = near[Math.floor(rnd() * near.length)]?.a;
      if (to) kick(to.p.x + fwd * 0.03, to.p.y, 0.85, to.sl.id);
      else B.until = t + 0.6;
    };

    /** The ball arrived somewhere. Set pieces branch from here. */
    const land = (t: number) => {
      B.fly = false;
      if (B.after === 'corner') {                     // shot went out, corner kick
        B.after = ''; B.surgeHome = B.x > 0.5; B.surge = 1;
        kick(B.x > 0.5 ? 0.975 : 0.025, rnd() < 0.5 ? 0.045 : 0.955, 1.2, null, 'cross');
        return;
      }
      if (B.after === 'cross') {                      // ball is on the flag, a taker walks over
        B.after = ''; B.set = 'cross'; B.rx = null;
        let taker: string | null = null, bd = Infinity;
        for (const sl of slotsRef.current) {
          if (sl.home !== B.surgeHome || sl.i === 0) continue;
          const p = pos.get(sl.id); if (!p) continue;
          const d = (p.x - B.x) ** 2 + (p.y - B.y) ** 2;
          if (d < bd) { bd = d; taker = sl.id; }
        }
        B.holder = taker;
        B.until = t + 1.2;                            // the beat before the delivery
        return;
      }
      if (B.after === 'goalkick') {                   // keeper restarts it
        B.after = '';
        const gk = gkOf(B.x > 0.5 ? false : true);
        if (gk) { B.holder = gk; B.until = t + 1.0; B.surge = 0; return; }
      }
      B.holder = B.rx; B.rx = null;
      B.until = t + 0.35 + rnd() * 0.7;
      // surge is not cleared here: bodies must still be in the box as a cross lands
    };

    const frame = (now: number) => {
      const s = stRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const off = s.phase === 'halftime' || s.phase === 'done';

      // a match event yanks the ball to that end
      if (s.events.length !== seen) {
        seen = s.events.length;
        const e = [...s.events].reverse().find(v =>
          v.type === 'goal' || v.type === 'penalty_goal' || v.type === 'chance' || v.type === 'penalty_miss');
        if (e) kick(e.teamId === s.home.id ? 0.94 : 0.06, 0.5 + (rnd() - 0.5) * 0.3, 1.4, null, 'goalkick');
      }

      // play follows the ball, the shape follows play
      const k = 1 - Math.exp(-dt * 1.3);
      playX = mix(playX, clamp(B.x + (s.possession - 0.5) * 0.1, 0.08, 0.92), k);
      playY = mix(playY, B.y, k);
      B.surge = Math.max(0, B.surge - dt * 0.5);

      // who is closest to the ball on each side, they go and get it
      let pressH: string | null = null, pressA: string | null = null;
      let dH = Infinity, dA = Infinity;
      for (const sl of slotsRef.current) {
        const p = pos.get(sl.id); if (!p || sl.i === 0) continue;
        const d = (p.x - B.x) ** 2 + (p.y - B.y) ** 2;
        if (sl.home) { if (d < dH) { dH = d; pressH = sl.id; } }
        else if (d < dA) { dA = d; pressA = sl.id; }
      }

      const all: { sl: Slot; p: Pt }[] = [];

      for (const sl of slotsRef.current) {
        const node = nodes.current.get(sl.id);
        const att = sl.home ? playX : 1 - playX;
        const slot = SLOTS[sl.i] ?? SLOTS[9];
        const back = 0.06 + att * 0.46;
        const front = 0.45 + att * 0.50;

        // individual runs: break the slot for a few seconds, then recover
        let rn = runs.get(sl.id);
        if (!rn) { rn = { until: 0, next: t + rnd() * 9, d: 0, y: 0 }; runs.set(sl.id, rn); }
        if (!off && sl.i !== 0 && t > rn.next && t > rn.until) {
          const br = BREAK[sl.i];
          const going = att > 0.46;
          rn.d = going && br ? br.d : -0.22;
          rn.y = going && br ? br.y : 0;
          rn.until = t + 2.4 + rnd() * 2.8;
          rn.next = rn.until + 4 + rnd() * 9;
        }
        const live = t < rn.until ? 1 : 0;

        let ownX: number, laneY: number;
        if (off) {
          ownX = 0.42 + (sl.i % 4) * 0.05;
          laneY = 1.12 + (sl.i % 3) * 0.05;
        } else if (sl.i === 0) {
          ownX = 0.03 + att * 0.11;
          laneY = mix(0.5, playY, 0.3);
        } else {
          const surge = B.surge > 0 && B.surgeHome === sl.home ? 0.3 : 0;
          ownX = clamp(back + (slot.d + rn.d * live + surge) * (front - back), 0.05, 0.99);
          const shift = slot.d > 0.7 ? 0.34 : slot.d > 0.3 ? 0.24 : 0.16;
          laneY = mix(slot.y + rn.y * live, playY, shift + surge);
        }

        const jx = Math.sin(t * (0.7 + sl.i * 0.07) + sl.i * 1.7) * 0.015;
        const jy = Math.cos(t * (0.9 + sl.i * 0.05) + sl.i * 2.3) * 0.026;
        let tX = clamp((sl.home ? ownX : 1 - ownX) + jx, 0.03, 0.97);
        let tY = off ? laneY : clamp(laneY + jy, 0.06, 0.94);
        let sp = off ? 0.9 : 2.0 + (sl.i % 5) * 0.24;

        if (!off) {
          if (sl.id === B.holder) { tX = B.x; tY = B.y; sp = 3.4; }                 // he has it
          else if (sl.id === B.rx && B.fly) { tX = B.tx; tY = B.ty; sp = 3.0; }     // running onto it
          else if (sl.id === (sl.home ? pressH : pressA) && (sl.home ? pressA : pressH) === B.holder) {
            tX = mix(tX, B.x, 0.7); tY = mix(tY, B.y, 0.7); sp = 3.0;               // pressing the ball
          }
        }

        let p = pos.get(sl.id);
        if (!p) { p = { x: tX, y: tY }; pos.set(sl.id, p); }
        const kk = 1 - Math.exp(-dt * sp);
        p.x = mix(p.x, tX, kk);
        p.y = mix(p.y, tY, kk);
        all.push({ sl, p });

        if (node) {
          const me = (sl.home ? s.home : s.away).id === myId;
          write(node, p.x, p.y, me ? 13 : 11);
        }
      }

      // ---- the ball itself
      if (off) {
        B.fly = false; B.holder = null;
        B.x = mix(B.x, 0.5, 1 - Math.exp(-dt * 1)); B.y = mix(B.y, 1.2, 1 - Math.exp(-dt * 1));
      } else if (B.fly) {
        const dx = B.tx - B.x, dy = B.ty - B.y;
        const dist = Math.hypot(dx, dy);
        const step = B.sp * dt;
        if (dist <= step || dist < 0.004) { B.x = B.tx; B.y = B.ty; land(t); }
        else { B.x += (dx / dist) * step; B.y += (dy / dist) * step; }
      } else {
        const h = B.holder ? pos.get(B.holder) : null;
        if (h) {
          const g = 1 - Math.exp(-dt * 11);
          B.x = mix(B.x, h.x + Math.cos(t * 3.3) * 0.011, g);
          B.y = mix(B.y, h.y + Math.sin(t * 2.9) * 0.015, g);
        }
        if (t > B.until) act(t, all);
      }
      if (ballEl.current) write(ballEl.current, B.x, B.y, 9);

      raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      for (const sl of slotsRef.current) {
        const node = nodes.current.get(sl.id);
        const slot = SLOTS[sl.i] ?? SLOTS[9];
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
