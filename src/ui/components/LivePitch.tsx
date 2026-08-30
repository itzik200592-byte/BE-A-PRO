import { useEffect, useRef } from 'react';
import type { LiveState, Side } from '../../game/liveMatch.ts';
import type { Player } from '../../engine/matchEngine.ts';
import type { Club } from '../../data/clubs.ts';

/**
 * The live 2D pitch.
 *
 * Two things drive it. The ball runs a possession state machine, and every
 * decision on it is measured against where the goal actually is: a man in sight
 * of goal shoots rather than passing back, a keeper distributes short instead of
 * hoofing it at the other keeper, and passes are scored on progress, space and
 * width so the ball reaches the flanks instead of circling the centre. Shots
 * turn into corners and goal kicks, so the rhythm is football rhythm rather
 * than a dot sliding around. And the players are individuals, not a
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

/**
 * Push players out of each other. A pitch is 105m wide and a player is about a
 * metre across, and two of them are never in the same place, so a couple of
 * relaxation passes keep bodies apart without fighting the movement above.
 * The man on the ball holds his ground, everyone else gives way around him,
 * which is what makes a challenge read as a challenge.
 */
const MIN_SEP = 0.036;        // roughly four metres between shoulders
const MIN_SEP_SQ = MIN_SEP * MIN_SEP;

function separate(all: { sl: Slot; p: Pt }[], holder: string | null) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        // keepers stay in their goal, they are not jostled out of it
        if (a.sl.i === 0 || b.sl.i === 0) continue;
        let dx = b.p.x - a.p.x, dy = b.p.y - a.p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= MIN_SEP_SQ) continue;
        let d = Math.sqrt(d2);
        if (d < 1e-5) { dx = (i % 2 ? 1 : -1) * 1e-3; dy = 1e-3; d = Math.hypot(dx, dy); }
        const push = (MIN_SEP - d) / d * 0.5;
        const aHold = a.sl.id === holder, bHold = b.sl.id === holder;
        // whoever has the ball is not shoved off it
        const aw = aHold ? 0 : bHold ? 1 : 0.5;
        const bw = bHold ? 0 : aHold ? 1 : 0.5;
        a.p.x = clamp(a.p.x - dx * push * 2 * aw, 0.02, 0.98);
        a.p.y = clamp(a.p.y - dy * push * 2 * aw, 0.04, 0.96);
        b.p.x = clamp(b.p.x + dx * push * 2 * bw, 0.02, 0.98);
        b.p.y = clamp(b.p.y + dy * push * 2 * bw, 0.04, 0.96);
      }
    }
  }
}
type B_After = '' | 'corner' | 'goalkick' | 'cross' | 'goal';

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
      // a commentary event being played out on the pitch, so a goal is scored
      // where a goal belongs instead of appearing from the halfway line
      script: null as null | { scored: boolean; home: boolean },
      restartFor: null as null | boolean,   // who kicks off after a goal
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

    /**
     * What the man on the ball does. Football decisions, in order: a keeper
     * distributes, a man in sight of goal shoots, otherwise he looks for the
     * best pass and carries when nothing is on. Every option is scored against
     * where the goal actually is, which is what stops strikers passing back and
     * keeps the ball off the centre circle.
     */
    const act = (t: number, all: { sl: Slot; p: Pt }[]) => {
      if (B.set === 'cross') {                       // the corner is whipped in
        B.set = '';
        kick(B.surgeHome ? 0.90 : 0.10, 0.5 + (rnd() - 0.5) * 0.28, 0.9, null);
        return;
      }

      // kick off again from the centre circle, the side that conceded restarts
      if (B.restartFor !== null) {
        const side = B.restartFor; B.restartFor = null;
        let who: string | null = null, bd = Infinity;
        for (const sl of slotsRef.current) {
          if (sl.home !== side || sl.i === 0) continue;
          const q = pos.get(sl.id); if (!q) continue;
          const d = Math.hypot(q.x - 0.5, q.y - 0.5);
          if (d < bd) { bd = d; who = sl.id; }
        }
        kick(0.5, 0.5, 1.5, who);
        return;
      }

      // the commentary said something happened at that goal, so finish it there
      if (B.script) {
        const sc = B.script; B.script = null;
        kick(goalOf(sc.home), clamp(0.5 + (rnd() - 0.5) * 0.30, 0.33, 0.67), 2.1, null,
          sc.scored ? 'goal' : (rnd() < 0.5 ? 'corner' : 'goalkick'));
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

      const home = me.sl.home;
      const goal = goalOf(home);                     // the goal HE attacks
      const fwd = home ? 1 : -1;
      const mates = all.filter(a => a.sl.home === home && a.sl.id !== me.sl.id && a.sl.i !== 0);
      const opps = all.filter(a => a.sl.home !== home && a.sl.i !== 0);
      const distGoal = Math.abs(goal - me.p.x);      // 0 at the goal line
      const nearestOpp = (p: Pt) => {
        let d = Infinity;
        for (const o of opps) d = Math.min(d, Math.hypot(o.p.x - p.x, o.p.y - p.y));
        return d;
      };

      /* ---- the keeper. He distributes, he never shoots, and he never hits
         the length of the pitch into the other keeper. */
      if (me.sl.i === 0) {
        // anyone in front of him but still inside his own half or just past it
        const outs = mates
          .map(a => ({ a, adv: distGoal - Math.abs(goal - a.p.x), d: Math.hypot(a.p.x - me.p.x, a.p.y - me.p.y) }))
          .filter(o => o.adv > 0.04 && o.d < 0.42)
          .sort((x, y) => y.adv - x.adv);
        const to = outs.length
          ? (rnd() < 0.6 ? outs[outs.length - 1].a : outs[Math.floor(rnd() * Math.min(3, outs.length))].a)
          : null;
        if (to) { kick(to.p.x, to.p.y, 0.9, to.sl.id); return; }
        // nothing on, a clearance up his own flank, never past the halfway mark
        kick(me.p.x + fwd * 0.34, me.p.y < 0.5 ? 0.18 : 0.82, 0.85, null);
        return;
      }

      /* ---- shooting. The closer and the more central he is, the more likely
         he lets fly. Inside the box he almost always does. */
      const lane = 1 - Math.min(1, Math.abs(me.p.y - 0.5) / 0.34);   // 1 dead centre
      const shotChance =
        distGoal < 0.12 ? 0.88 :
        distGoal < 0.20 ? 0.62 * (0.55 + 0.45 * lane) :
        distGoal < 0.30 ? 0.30 * (0.35 + 0.65 * lane) :
        distGoal < 0.40 ? 0.10 * lane : 0;
      if (rnd() < shotChance) {
        const spread = 0.06 + distGoal * 0.35;       // long range is wilder
        kick(goal, clamp(0.5 + (rnd() - 0.5) * spread * 2, 0.30, 0.70), 1.55, null,
          rnd() < 0.5 ? 'corner' : 'goalkick');
        return;
      }

      /* ---- the pass. Every mate is scored: getting the ball closer to goal is
         what matters, then having space, then being a sensible distance away.
         Width is rewarded so the ball actually reaches the flanks. */
      const opts = mates.map(a => {
        const adv = distGoal - Math.abs(goal - a.p.x);         // + is progress
        const d = Math.hypot(a.p.x - me.p.x, a.p.y - me.p.y);
        const space = Math.min(0.22, nearestOpp(a.p));
        const width = Math.abs(a.p.y - 0.5);                   // 0 centre .. .5 touchline
        const range = d < 0.07 ? -0.5 : d > 0.46 ? -0.9 : 1 - Math.abs(d - 0.20) * 2.2;
        return { a, score: adv * 3.4 + space * 2.6 + range * 1.1 + width * 0.9 + rnd() * 0.5 };
      }).sort((x, y) => y.score - x.score);

      const best = opts[0];
      const pressed = nearestOpp(me.p) < 0.075;

      // Possession changes hands because someone is closed down, not because
      // the best pass happened to score badly. Tying it to pass quality made
      // players hand the ball over whenever nobody was free, which is not
      // football.
      if (opps.length && rnd() < (pressed ? 0.20 : 0.045)) {
        const near = opps.reduce((x, y) =>
          Math.hypot(y.p.x - me.p.x, y.p.y - me.p.y) < Math.hypot(x.p.x - me.p.x, x.p.y - me.p.y) ? y : x);
        kick(near.p.x, near.p.y, 0.8, near.sl.id);
        return;
      }

      // room ahead and nobody on him, he drives at the defence
      if (!pressed && distGoal > 0.16 && rnd() < 0.32) {
        B.until = t + 0.4 + rnd() * 0.4;
        return;
      }

      if (best) {
        // weighted to the better options, but a sideways or backwards ball is
        // a real choice when nothing is on ahead
        const pick = opts[Math.floor(rnd() * rnd() * Math.min(3, opts.length))] ?? best;
        const lead = Math.min(0.05, Math.max(0, distGoal - 0.1) * 0.2);   // pass into his run
        kick(pick.a.p.x + fwd * lead, pick.a.p.y, 0.95, pick.a.sl.id);
        return;
      }
      B.until = t + 0.5;
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
      if (B.after === 'goal') {                       // it is in the net
        B.after = ''; B.surge = 0;
        B.holder = null; B.rx = null;
        B.until = t + 1.1;                            // let it sit in the goal
        B.restartFor = !B.surgeHome;                  // the side that conceded kicks off
        return;
      }
      if (B.after === 'goalkick') {                   // keeper restarts it
        B.after = '';
        const gk = gkOf(B.x > 0.5 ? false : true);
        if (gk) { B.holder = gk; B.until = t + 1.0; B.surge = 0; return; }
      }
      B.holder = B.rx; B.rx = null;
      // a man about to finish a scripted goal does not stand on the ball first,
      // so the strike follows the commentary line rather than trailing it
      B.until = t + (B.script ? 0.16 : 0.35 + rnd() * 0.7);
      // surge is not cleared here: bodies must still be in the box as a cross lands
    };

    const frame = (now: number) => {
      const s = stRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const off = s.phase === 'halftime' || s.phase === 'done';

      // A goal in the commentary has to be a goal on the pitch. The ball used to
      // be teleported into the net from wherever it was, so a line saying the
      // striker had scored could arrive while the ball sat on the halfway line.
      // Now the event is played out: the ball is slid to the attacker closest to
      // that goal and he finishes it, which is both readable and in step with
      // the caption the manager is reading.
      if (s.events.length !== seen) {
        seen = s.events.length;
        const e = [...s.events].reverse().find(v =>
          v.type === 'goal' || v.type === 'penalty_goal' || v.type === 'chance' || v.type === 'penalty_miss');
        if (e) {
          const forHome = e.teamId === s.home.id;
          const scored = e.type === 'goal' || e.type === 'penalty_goal';
          const goal = goalOf(forHome);
          B.script = { scored, home: forHome };
          B.surge = 1; B.surgeHome = forHome;
          let who: Slot | null = null, wp: Pt | null = null, bd = Infinity;
          for (const sl of slotsRef.current) {
            if (sl.home !== forHome || sl.i === 0) continue;
            const q = pos.get(sl.id); if (!q) continue;
            const d = Math.abs(goal - q.x);
            if (d < bd) { bd = d; who = sl; wp = q; }
          }
          // the ball into the box for him, quick but visible, never instant
          const into = goal + (forHome ? -0.11 : 0.11);
          kick(into, clamp(wp ? wp.y : 0.5, 0.30, 0.70), 2.3, who ? who.id : null);
        }
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

        // a small idle drift so nobody stands frozen, but far gentler than the
        // old wobble, which read as vibration rather than a player adjusting
        const jx = Math.sin(t * (0.5 + sl.i * 0.05) + sl.i * 1.7) * 0.006;
        const jy = Math.cos(t * (0.6 + sl.i * 0.04) + sl.i * 2.3) * 0.010;
        let tX = clamp((sl.home ? ownX : 1 - ownX) + jx, 0.03, 0.97);
        let tY = off ? laneY : clamp(laneY + jy, 0.06, 0.94);
        let sp = off ? 0.9 : 2.0 + (sl.i % 5) * 0.24;
        let top = off ? 0.10 : 0.30;   // top speed, pitch widths per second

        if (!off) {
          if (sl.id === B.holder) { tX = B.x; tY = B.y; sp = 3.4; top = 0.42; }     // he has it
          else if (sl.id === B.rx && B.fly) { tX = B.tx; tY = B.ty; sp = 3.0; top = 0.60; }  // sprinting onto it
          else if (sl.id === (sl.home ? pressH : pressA) && (sl.home ? pressA : pressH) === B.holder) {
            tX = mix(tX, B.x, 0.7); tY = mix(tY, B.y, 0.7); sp = 3.0; top = 0.52;   // pressing the ball
          }
        }

        let p = pos.get(sl.id);
        if (!p) { p = { x: tX, y: tY }; pos.set(sl.id, p); }
        // Ease toward the target, but never faster than a man can run. Pure
        // easing alone sprinted when far and crawled when close, which is what
        // made the old pitch feel like sliding counters instead of players.
        const kk = 1 - Math.exp(-dt * sp);
        let nx = mix(p.x, tX, kk), ny = mix(p.y, tY, kk);
        const sx = nx - p.x, sy = ny - p.y;
        const sd = Math.hypot(sx, sy);
        const capStep = top * dt;
        if (sd > capStep && sd > 1e-6) { nx = p.x + (sx / sd) * capStep; ny = p.y + (sy / sd) * capStep; }
        p.x = nx; p.y = ny;
        all.push({ sl, p });
      }

      // ---- nobody stands inside anybody. Without this players stack on the
      // ball and the shape collapses into a clump, which is the single biggest
      // tell that a 2D pitch is fake.
      if (!off) separate(all, B.holder);

      for (const { sl, p } of all) {
        const node = nodes.current.get(sl.id);
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
