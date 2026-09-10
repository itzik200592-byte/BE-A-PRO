/**
 * The phone's own back button, made to mean "back" inside the game.
 *
 * On Android that button is how people navigate everything, and pressing it in
 * here threw them out of the game entirely — mid career, mid match. Every
 * tester read that as a crash, because that is exactly what it looks like.
 *
 * The trick is the only one the platform gives you: keep one spare history entry
 * in front of us at all times. A back press consumes that entry instead of
 * leaving the page, we hear about it through popstate, we run whatever "back"
 * means on the screen he is actually looking at, and then we push a fresh spare
 * so the next press has something to eat too.
 *
 * The handler returns whether it did anything. When there is nowhere left to go
 * — he is at the hub with the whole game in front of him — it returns false and
 * the app asks before letting him out, rather than vanishing.
 *
 * Nothing here can force a tab or an installed app to close: no web API can. So
 * "leave" walks the history back past our spare entry, which is as far as the
 * platform allows anyone to go.
 */

type BackHandler = () => boolean;

let handler: BackHandler | null = null;
let armed = false;

const SPARE = { beapro: 'back' };

/** Put a spare entry in front of us for the next back press to consume. */
function pushSpare() {
  try { history.pushState(SPARE, ''); } catch { /* about:blank and friends */ }
}

function onPop() {
  // the press ate our spare, so replace it before anything else can go wrong
  pushSpare();
  handler?.();
}

/**
 * Start intercepting. Safe to call more than once; only the first arms it.
 * Called once the game itself is on screen, never around the gate or the intro,
 * because a back press there should still leave the site the way a visitor
 * expects a website to behave.
 */
export function armBack(): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  pushSpare();
  window.addEventListener('popstate', onPop);
}

/**
 * What back means right now. The App recomputes this on every render, because
 * "back" is a different thing on every screen, and a stale handler would send
 * somebody to the hub from the middle of a cup final.
 */
export function setBackHandler(fn: BackHandler | null): void {
  handler = fn;
}

/**
 * Leave, once he has said he means it. Walks past our spare and the entry the
 * game was opened on. In a browser tab that returns him wherever he came from;
 * an installed app opened cold may have nothing behind it, and no web API can
 * close that, so he simply stays in the game.
 */
export function leaveGame(): void {
  if (typeof window === 'undefined') return;
  window.removeEventListener('popstate', onPop);
  armed = false;
  handler = null;
  try { history.go(-2); } catch { /* nothing behind us */ }
}
