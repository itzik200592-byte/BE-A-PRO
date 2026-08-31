/**
 * The football behind the 2D pitch: shape, movement, and the ball's possession
 * state machine. No DOM, no React, no timers, so it runs identically in a
 * browser frame loop and in a Node harness, which is the point. The pitch view
 * was rewritten three times on guesswork because none of this could be
 * measured; now `scripts/pitch-check.mts` drives ninety simulated minutes and
 * reports where the ball actually spends its life.
 *
 * Coordinates are 0..1 across the pitch. x 0 is the home side's own goal line,
 * x 1 the away side's. Home attacks x 1.
 */

import type { Formation } from '../data/formations.ts';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

export interface PitchSlot { id: string; home: boolean; i: number; fm: Formation }
export interface Pt { x: number; y: number }

export type BallAfter = '' | 'corner' | 'goalkick' | 'cross' | 'goal' | 'clear';

/**
 * Push players out of each other. A pitch is 68m across and a player is about
 * a metre wide, and two of them are never in the same place, so a few
 * relaxation passes keep bodies apart without fighting the movement above.
 * The man on the ball holds his ground and everyone else gives way around him,
 * which is what makes a challenge read as a challenge.
 */
const MIN_SEP = 0.046;        // a shade over five metres between shoulders
const MIN_SEP_SQ = MIN_SEP * MIN_SEP;

function separate(all: { sl: PitchSlot; p: Pt }[], holder: string | null) {
  for (let pass = 0; pass < 3; pass++) {
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

/** the shape the pitch needs out of a match event, and nothing more */
export interface PitchEvent { type: string; teamId: string }

/**
 * Which commentary line, if any, the pitch should act out, given everything
 * that has landed since `from`.
 *
 * Only events past the cursor count. The view used to compare list LENGTHS and
 * then search the whole history backwards, so an ambient line or a booking, any
 * event at all, re-fired the last goal: score once and the pitch replayed that
 * goal every time the ticker moved, with nothing on screen to explain it.
 *
 * When several land in one frame the last one wins, because that is the one the
 * manager is reading.
 */
export function eventToPlay(
  events: readonly PitchEvent[], from: number, homeId: string,
): { home: boolean; scored: boolean } | null {
  let fire: { home: boolean; scored: boolean } | null = null;
  for (let i = Math.max(0, from); i < events.length; i++) {
    const v = events[i];
    if (v.type === 'goal' || v.type === 'penalty_goal') fire = { home: v.teamId === homeId, scored: true };
    else if (v.type === 'chance' || v.type === 'penalty_miss') fire = { home: v.teamId === homeId, scored: false };
  }
  return fire;
}

/** Anything the harness wants to count, written as it happens. */
export interface PitchTrace {
  onKick?(from: string | null, toId: string | null, tx: number, after: BallAfter): void;
  onShot?(fromX: number, after: BallAfter, tx: number, ty: number, home: boolean): void;
  onGoal?(x: number): void;
}

export class PitchSim {
  readonly pos = new Map<string, Pt>();
  slots: PitchSlot[] = [];
  trace: PitchTrace | null = null;
  /**
   * Fired the instant a scripted move finishes, the ball in the net or the
   * chance gone. The scoreboard and the commentary wait for this, so what the
   * manager reads always matches what he is watching. Without it the engine
   * flipped the score the moment it decided a goal, and the pitch was still
   * building the move: "goal" on the banner, ball on the halfway line.
   */
  onPlayed: ((scored: boolean) => void) | null = null;
  rnd: () => number = Math.random;

  playX = 0.5;
  playY = 0.5;

  readonly B = {
    x: 0.5, y: 0.5, tx: 0.5, ty: 0.5,
    fly: false, sp: 0.8, until: 0,
    holder: null as string | null,
    rx: null as string | null,      // who the ball is played to
    after: '' as BallAfter,
    set: '' as '' | 'cross',        // a set piece waiting on the taker
    // a commentary event being played out on the pitch, so a goal is scored
    // where a goal belongs instead of appearing from the halfway line
    script: null as null | { scored: boolean; home: boolean },
    restartFor: null as null | boolean,   // who kicks off after a goal
    build: 0,                       // passes left to walk a scripted move up the pitch
    // a scripted shot is in the air; when it lands the scoreboard is allowed to move
    settle: null as null | { scored: boolean },
    corners: 0,                     // consecutive corners, so one end cannot hog the game
    surge: 0, surgeHome: true,      // bodies into the box for a corner
  };

  setSlots(slots: PitchSlot[]) {
    this.slots = slots;
    const live = new Set(slots.map(s => s.id));
    for (const id of [...this.pos.keys()]) if (!live.has(id)) this.pos.delete(id);
  }

  /** the goal that side attacks */
  static goalOf(isHome: boolean) { return isHome ? 0.965 : 0.035; }

  private gkOf(isHome: boolean) {
    return this.slots.find(s => s.home === isHome && s.i === 0)?.id ?? null;
  }

  private kick(tx: number, ty: number, sp: number, rx: string | null, after: BallAfter = '') {
    const B = this.B;
    this.trace?.onKick?.(B.holder, rx, tx, after);
    B.tx = clamp(tx, 0.02, 0.98); B.ty = clamp(ty, 0.03, 0.97);
    B.sp = sp; B.fly = true; B.rx = rx; B.after = after; B.holder = null;
  }

  /**
   * A shot, aimed honestly.
   *
   * The ball crosses the goal line between the posts ONLY when it is actually a
   * goal. Every shot used to fly at the goal line and then turn into a goal kick
   * or a corner, so the pitch showed the ball beating the keeper and going in,
   * and no goal being given. A save now stops on the keeper, a miss passes the
   * line plainly outside the post, a block dies at the defender's feet, and a
   * deflection leaves at the byline out by the flag.
   *
   * The mouth is 0.435..0.565, which is where the posts are actually drawn.
   */
  private aimShot(home: boolean, from: Pt, scored: boolean): { tx: number; ty: number; sp: number; after: BallAfter } {
    const rnd = this.rnd;
    const goal = PitchSim.goalOf(home);
    const fwd = home ? 1 : -1;
    const mouth = () => 0.5 + (rnd() - 0.5) * 0.10;      // 0.45..0.55, safely inside the posts

    if (scored) return { tx: goal, ty: mouth(), sp: 1.9, after: 'goal' };

    const r = rnd();
    if (r < 0.36) {
      // the keeper gets there. The ball stops on his line, short of the goal.
      return { tx: goal - fwd * 0.05, ty: mouth(), sp: 1.7, after: 'goalkick' };
    }
    if (r < 0.60) {
      // wide or over: past the line, but nowhere near between the posts
      const side = rnd() < 0.5 ? -1 : 1;
      return {
        tx: goal + fwd * 0.02,
        ty: clamp(0.5 + side * (0.17 + rnd() * 0.13), 0.09, 0.91),
        sp: 1.8, after: 'goalkick',
      };
    }
    if (r < 0.76 && this.B.corners < 2) {
      // deflected out at the byline, out by the corner flag
      return { tx: goal, ty: rnd() < 0.5 ? 0.07 : 0.93, sp: 1.7, after: 'corner' };
    }
    // blocked in front of goal, and headed away
    const d = Math.abs(goal - from.x);
    return {
      tx: from.x + fwd * Math.min(0.09, d * 0.5),
      ty: clamp(from.y + (rnd() - 0.5) * 0.08, 0.08, 0.92),
      sp: 1.4, after: 'clear',
    };
  }

  /**
   * The commentary said something happened at one goal, so the pitch plays it
   * out there.
   *
   * This arms a move, it does not move the ball. It used to slide the ball
   * straight to the attacker nearest that goal, which from the keeper's feet
   * was a single pass across four fifths of the pitch: on screen the keeper
   * appeared to hit the striker, and the goal appeared out of nothing. Now
   * act() walks the ball up in ordinary passes and only shoots once it is
   * actually near the goal, so the caption and the pitch tell the same story.
   */
  event(forHome: boolean, scored: boolean): boolean {
    const B = this.B;
    if (B.script || B.settle) return false;     // one move at a time, the caller retries
    B.script = { scored, home: forHome };
    B.build = 3;                  // passes allowed to get there, then he shoots
    B.surge = 1; B.surgeHome = forHome;
    // a beat, so the move starts from the next decision rather than mid flight
    if (!B.fly) B.until = Math.min(B.until, 0);
    return true;
  }

  /**
   * What the man on the ball does. Football decisions, in order: a keeper
   * distributes, a man in sight of goal shoots, otherwise he looks for the best
   * pass and carries when nothing is on. Every option is scored against where
   * the goal actually is, which is what stops strikers passing back and keeps
   * the ball off the centre circle.
   */
  private act(t: number, all: { sl: PitchSlot; p: Pt }[]) {
    const B = this.B, rnd = this.rnd;

    if (B.set === 'cross') {                       // the corner is whipped in
      B.set = '';
      this.kick(B.surgeHome ? 0.90 : 0.10, 0.5 + (rnd() - 0.5) * 0.28, 0.9, null);
      return;
    }

    // kick off again from the centre circle, the side that conceded restarts
    if (B.restartFor !== null) {
      const side = B.restartFor; B.restartFor = null;
      let who: string | null = null, bd = Infinity;
      for (const sl of this.slots) {
        if (sl.home !== side || sl.i === 0) continue;
        const q = this.pos.get(sl.id); if (!q) continue;
        const d = Math.hypot(q.x - 0.5, q.y - 0.5);
        if (d < bd) { bd = d; who = sl.id; }
      }
      this.kick(0.5, 0.5, 1.5, who);
      return;
    }

    // the commentary said something happened at that goal, so finish it there
    if (B.script) {
      const sc = B.script;
      const goal = PitchSim.goalOf(sc.home);
      const fwd = sc.home ? 1 : -1;
      const dist = Math.abs(goal - B.x);

      // Still too far out to shoot. Play it forward to the man of that side who
      // is furthest on but still a pass away, so the move reads as a move.
      if (dist > 0.26 && B.build > 0) {
        B.build--;
        let best: { sl: PitchSlot; p: Pt } | null = null, bs = -Infinity;
        for (const a of all) {
          if (a.sl.home !== sc.home || a.sl.i === 0) continue;
          const gain = dist - Math.abs(goal - a.p.x);          // + is progress
          const d = Math.hypot(a.p.x - B.x, a.p.y - B.y);
          if (gain < 0.02 || d > 0.44) continue;
          const score = gain * 3 - Math.abs(d - 0.26);
          if (score > bs) { bs = score; best = a; }
        }
        if (best) { this.kick(best.p.x + fwd * 0.02, best.p.y, 1.5, best.sl.id); return; }
        // nobody showed: drive it forward into space and try again
        this.kick(B.x + fwd * 0.24, clamp(B.y + (rnd() - 0.5) * 0.16, 0.10, 0.90), 1.5, null);
        return;
      }

      B.script = null; B.build = 0;
      const plan = this.aimShot(sc.home, { x: B.x, y: B.y }, sc.scored);
      this.trace?.onShot?.(B.x, plan.after, plan.tx, plan.ty, sc.home);
      B.settle = { scored: sc.scored };
      this.kick(plan.tx, plan.ty, plan.sp + 0.3, null, plan.after);
      return;
    }

    const me = all.find(a => a.sl.id === B.holder);
    if (!me) {                                     // nobody has it, nearest player picks it up
      let best: { sl: PitchSlot; p: Pt } | null = null, bd = Infinity;
      for (const a of all) {
        // a keeper only comes for a loose ball that is genuinely his, so a
        // clearance never drops straight back to the man who cleared it
        const d = Math.hypot(a.p.x - B.x, a.p.y - B.y) + (a.sl.i === 0 ? 0.24 : 0);
        if (d < bd) { bd = d; best = a; }
      }
      B.holder = best ? best.sl.id : null;
      B.until = t + 0.3;                           // always advances, never busy loops
      return;
    }

    const home = me.sl.home;
    const goal = PitchSim.goalOf(home);            // the goal HE attacks
    const fwd = home ? 1 : -1;
    const mates = all.filter(a => a.sl.home === home && a.sl.id !== me.sl.id && a.sl.i !== 0);
    const opps = all.filter(a => a.sl.home !== home && a.sl.i !== 0);
    const distGoal = Math.abs(goal - me.p.x);      // 0 at the goal line
    const nearestOpp = (p: Pt) => {
      let d = Infinity;
      for (const o of opps) d = Math.min(d, Math.hypot(o.p.x - p.x, o.p.y - p.y));
      return d;
    };

    /* ---- the keeper. He distributes to a man, always to a man: either rolled
       out short to the nearest defender who has shown for it, or a long ball to
       the furthest one he can pick out. He never lets go of it with nobody on
       the end, which is what used to bounce it straight back to his own feet,
       and he never aims at the other keeper. */
    if (me.sl.i === 0) {
      const outs = mates
        .map(a => ({ a, adv: distGoal - Math.abs(goal - a.p.x), d: Math.hypot(a.p.x - me.p.x, a.p.y - me.p.y) }))
        .filter(o => o.adv > 0.03)
        .sort((x, y) => x.d - y.d);
      const short = outs.filter(o => o.d < 0.36);
      if (short.length && rnd() < 0.66) {
        const to = short[Math.floor(rnd() * Math.min(3, short.length))].a;
        this.kick(to.p.x, to.p.y, 1.0, to.sl.id);
        return;
      }
      // The long ball goes as far as a keeper can actually kick it, which is
      // about the halfway line, not to the striker on the edge of the far box.
      // Picking the most advanced man full stop had him launching it the length
      // of the pitch to the number nine, over and over.
      const reach = outs.filter(o => o.d <= 0.52);
      const long = reach[reach.length - 1] ?? outs[0];
      if (long) { this.kick(long.a.p.x + fwd * 0.02, long.a.p.y, 1.9, long.a.sl.id); return; }
      // truly nobody: up his own flank, and still nowhere near the far goal
      this.kick(me.p.x + fwd * 0.30, me.p.y < 0.5 ? 0.18 : 0.82, 1.4, null);
      return;
    }

    /* ---- shooting. The closer and the more central he is, the more likely he
       lets fly. Inside the box he almost always does. */
    const lane = 1 - Math.min(1, Math.abs(me.p.y - 0.5) / 0.34);   // 1 dead centre
    const shotChance =
      distGoal < 0.12 ? 0.74 :
      distGoal < 0.20 ? 0.40 * (0.55 + 0.45 * lane) :
      distGoal < 0.30 ? 0.13 * (0.35 + 0.65 * lane) :
      distGoal < 0.40 ? 0.035 * lane : 0;
    if (rnd() < shotChance) {
      // open play never scores on its own: goals come from the commentary, so
      // what the pitch shows here is the shot and what became of it
      const plan = this.aimShot(home, me.p, false);
      this.trace?.onShot?.(me.p.x, plan.after, plan.tx, plan.ty, home);
      this.kick(plan.tx, plan.ty, plan.sp, null, plan.after);
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

    // Possession changes hands because someone is closed down, not because the
    // best pass happened to score badly. Tying it to pass quality made players
    // hand the ball over whenever nobody was free, which is not football.
    if (opps.length && rnd() < (pressed ? 0.20 : 0.045)) {
      const near = opps.reduce((x, y) =>
        Math.hypot(y.p.x - me.p.x, y.p.y - me.p.y) < Math.hypot(x.p.x - me.p.x, x.p.y - me.p.y) ? y : x);
      this.kick(near.p.x, near.p.y, 0.8, near.sl.id);
      return;
    }

    // room ahead and nobody on him, he drives at the defence
    if (!pressed && distGoal > 0.16 && rnd() < 0.32) {
      B.until = t + 0.4 + rnd() * 0.4;
      return;
    }

    if (best) {
      // weighted to the better options, but a sideways or backwards ball is a
      // real choice when nothing is on ahead
      const pick = opts[Math.floor(rnd() * rnd() * Math.min(3, opts.length))] ?? best;
      const lead = Math.min(0.05, Math.max(0, distGoal - 0.1) * 0.2);   // pass into his run
      this.kick(pick.a.p.x + fwd * lead, pick.a.p.y, 0.95, pick.a.sl.id);
      return;
    }
    B.until = t + 0.5;
  }

  /** The ball arrived somewhere. Set pieces branch from here. */
  private land(t: number) {
    const B = this.B, rnd = this.rnd;
    B.fly = false;
    // the ball has arrived. If this was the shot the commentary was waiting on,
    // that is the frame the score is allowed to change on, not a beat earlier
    if (B.settle) { const st = B.settle; B.settle = null; this.onPlayed?.(st.scored); }
    if (B.after === 'corner') {                     // shot went out, corner kick
      B.after = ''; B.surgeHome = B.x > 0.5; B.surge = 1; B.corners++;
      this.kick(B.x > 0.5 ? 0.975 : 0.025, rnd() < 0.5 ? 0.045 : 0.955, 1.2, null, 'cross');
      return;
    }
    if (B.after === 'cross') {                      // ball is on the flag, a taker walks over
      B.after = ''; B.set = 'cross'; B.rx = null;
      let taker: string | null = null, bd = Infinity;
      for (const sl of this.slots) {
        if (sl.home !== B.surgeHome || sl.i === 0) continue;
        const p = this.pos.get(sl.id); if (!p) continue;
        const d = (p.x - B.x) ** 2 + (p.y - B.y) ** 2;
        if (d < bd) { bd = d; taker = sl.id; }
      }
      B.holder = taker;
      B.until = t + 1.2;                            // the beat before the delivery
      return;
    }
    if (B.after === 'goal') {                       // it is in the net
      this.trace?.onGoal?.(B.x);
      B.after = ''; B.surge = 0; B.corners = 0;
      B.holder = null; B.rx = null;
      B.until = t + 1.1;                            // let it sit in the goal
      B.restartFor = !B.surgeHome;                  // the side that conceded kicks off
      return;
    }
    if (B.after === 'clear') {
      // A defender gets his head on it. This is the single thing that stops the
      // game living in one penalty area: the ball leaves the box, lands out near
      // the halfway line on a flank, and whoever is closest picks up a genuine
      // second phase.
      B.after = ''; B.surge = 0; B.corners = 0;
      const out = B.x > 0.5 ? -1 : 1;
      this.kick(clamp(B.x + out * (0.30 + rnd() * 0.24), 0.16, 0.84),
        rnd() < 0.5 ? 0.16 + rnd() * 0.16 : 0.68 + rnd() * 0.16, 1.6, null);
      return;
    }
    if (B.after === 'goalkick') {                   // keeper restarts it
      B.after = ''; B.corners = 0;
      const gk = this.gkOf(B.x > 0.5 ? false : true);
      if (gk) { B.holder = gk; B.until = t + 1.0; B.surge = 0; return; }
    }
    B.holder = B.rx; B.rx = null;
    // a man about to finish a scripted goal does not stand on the ball first,
    // so the strike follows the commentary line rather than trailing it
    B.until = t + (B.script ? 0.22 : 0.35 + rnd() * 0.7);
    // surge is not cleared here: bodies must still be in the box as a cross lands
  }

  /**
   * One frame. `possession` is the home share 0..1, `off` is true at half time
   * and full time, when they walk off. Returns the laid out players so the view
   * can write them straight to the DOM.
   */
  step(dt: number, t: number, possession: number, off: boolean): { sl: PitchSlot; p: Pt }[] {
    const B = this.B, rnd = this.rnd;

    // Where play is, as the shape sees it. Two deliberate brakes here: the
    // target is pulled toward the middle so a ball in the six yard box does not
    // drag both teams' whole shape in with it, and the easing is slow so the
    // block lags the ball the way a real one does. Tracking the ball one for
    // one is what packed twenty men into one penalty area.
    const k = 1 - Math.exp(-dt * 0.95);
    const aim = clamp(0.5 + (B.x - 0.5) * 0.78 + (possession - 0.5) * 0.10, 0.13, 0.87);
    this.playX = mix(this.playX, aim, k);
    this.playY = mix(this.playY, B.y, 1 - Math.exp(-dt * 1.4));
    B.surge = Math.max(0, B.surge - dt * 0.5);

    // who is closest to the ball on each side, they go and get it
    let pressH: string | null = null, pressA: string | null = null;
    let dH = Infinity, dA = Infinity;
    for (const sl of this.slots) {
      const p = this.pos.get(sl.id); if (!p || sl.i === 0) continue;
      const d = (p.x - B.x) ** 2 + (p.y - B.y) ** 2;
      if (sl.home) { if (d < dH) { dH = d; pressH = sl.id; } }
      else if (d < dA) { dA = d; pressA = sl.id; }
    }

    const all: { sl: PitchSlot; p: Pt }[] = [];

    for (const sl of this.slots) {
      const slot = sl.fm.slots[sl.i] ?? sl.fm.slots[sl.fm.slots.length - 1];
      // 0 = play is on our own goal line, 1 = on theirs, plus the shape's own
      // resting height (a back five sits deeper than a front three)
      const att = clamp((sl.home ? this.playX : 1 - this.playX) + sl.fm.line, 0.02, 0.98);
      // Defending, the block is short and sits in front of its own box while
      // still leaving a man up the pitch. Attacking, it stretches, the back line
      // pushing only as far as the halfway line. The two ends move at different
      // rates on purpose: that difference is the shape.
      const back = 0.07 + att * 0.42;    // 0.07 own box .. 0.49 halfway
      const front = 0.42 + att * 0.53;   // 0.42 our own half .. 0.95 their goal

      // individual runs: break the slot for a few seconds, then recover
      let rn = this.runs.get(sl.id);
      if (!rn) { rn = { until: 0, next: t + rnd() * 9, d: 0, y: 0 }; this.runs.set(sl.id, rn); }
      if (!off && sl.i !== 0 && t > rn.next && t > rn.until) {
        const br = slot.brk;
        const going = att > 0.46;
        rn.d = going && br ? br.d : -0.20;
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
        ownX = 0.03 + att * 0.10;
        laneY = mix(0.5, this.playY, 0.3);
      } else {
        const surge = B.surge > 0 && B.surgeHome === sl.home ? 0.26 : 0;
        ownX = clamp(back + (slot.d + rn.d * live + surge) * (front - back), 0.05, 0.96);
        // Lanes hold their width. Sucking everyone toward the ball is what
        // emptied the flanks and left every pass going through the middle, so
        // the pull is small and the front line feels it most.
        const shift = slot.d > 0.7 ? 0.26 : slot.d > 0.3 ? 0.17 : 0.11;
        laneY = mix(slot.y + rn.y * live, this.playY, shift + surge);
      }

      // a small idle drift so nobody stands frozen, but far gentler than the old
      // wobble, which read as vibration rather than a player adjusting
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

      let p = this.pos.get(sl.id);
      if (!p) { p = { x: tX, y: tY }; this.pos.set(sl.id, p); }
      // Ease toward the target, but never faster than a man can run. Pure easing
      // alone sprinted when far and crawled when close, which is what made the
      // old pitch feel like sliding counters instead of players.
      const kk = 1 - Math.exp(-dt * sp);
      let nx = mix(p.x, tX, kk), ny = mix(p.y, tY, kk);
      const sx = nx - p.x, sy = ny - p.y;
      const sd = Math.hypot(sx, sy);
      const capStep = top * dt;
      if (sd > capStep && sd > 1e-6) { nx = p.x + (sx / sd) * capStep; ny = p.y + (sy / sd) * capStep; }
      p.x = nx; p.y = ny;
      all.push({ sl, p });
    }

    // ---- nobody stands inside anybody. Without this players stack on the ball
    // and the shape collapses into a clump, which is the single biggest tell
    // that a 2D pitch is fake.
    if (!off) separate(all, B.holder);

    // ---- the ball itself
    if (off) {
      B.fly = false; B.holder = null;
      B.x = mix(B.x, 0.5, 1 - Math.exp(-dt * 1)); B.y = mix(B.y, 1.2, 1 - Math.exp(-dt * 1));
    } else if (B.fly) {
      const dx = B.tx - B.x, dy = B.ty - B.y;
      const dist = Math.hypot(dx, dy);
      const stepLen = B.sp * dt;
      if (dist <= stepLen || dist < 0.004) { B.x = B.tx; B.y = B.ty; this.land(t); }
      else { B.x += (dx / dist) * stepLen; B.y += (dy / dist) * stepLen; }
    } else {
      const h = B.holder ? this.pos.get(B.holder) : null;
      if (h) {
        const g = 1 - Math.exp(-dt * 11);
        B.x = mix(B.x, h.x + Math.cos(t * 3.3) * 0.011, g);
        B.y = mix(B.y, h.y + Math.sin(t * 2.9) * 0.015, g);
      }
      if (t > B.until) this.act(t, all);
    }

    return all;
  }

  private readonly runs = new Map<string, { until: number; next: number; d: number; y: number }>();
}
