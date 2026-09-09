/**
 * Getting the game onto the home screen.
 *
 * The honest state of this on the two platforms is not the same, and pretending
 * otherwise would just produce a button that does nothing:
 *
 *   Android and Chrome give a real API. The browser fires beforeinstallprompt,
 *   we keep the event, and our own button calls prompt() on it. That is a true
 *   one tap install, no browser menu involved.
 *
 *   iPhone and Safari give nothing. Apple has no equivalent event and no way to
 *   trigger the sheet, so the only route is the user tapping Share and then Add
 *   to Home Screen. All we can do there is show him exactly where, drawn, so it
 *   never feels like hunting through settings.
 *
 * Either way the offer disappears once the game is already installed.
 */

export type InstallKind = 'prompt' | 'ios' | 'installed' | 'none';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let pending: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

/** Already running from the home screen rather than in a browser tab. */
export function isInstalled(): boolean {
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: fullscreen)').matches) return true;
    // Safari's own flag, which predates the standard and is still the only
    // signal on an iPhone
    return (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function isIos(): boolean {
  try {
    const ua = navigator.userAgent;
    // an iPad on recent iOS reports itself as a Mac, so touch points settle it
    const iPadOnMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    return /iPhone|iPad|iPod/.test(ua) || iPadOnMac;
  } catch {
    return false;
  }
}

/** What we can offer this visitor right now. */
export function installKind(): InstallKind {
  if (isInstalled()) return 'installed';
  if (pending) return 'prompt';
  if (isIos()) return 'ios';
  return 'none';
}

/**
 * Start listening. Chrome fires the event some time after load, so anything
 * showing an install button has to re-read installKind when this calls back.
 */
export function watchInstall(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function announce(): void {
  for (const fn of listeners) fn();
}

let wired = false;
export function wireInstall(): void {
  if (wired) return;
  wired = true;
  try {
    window.addEventListener('beforeinstallprompt', e => {
      // keeping the event is the whole trick: without preventDefault Chrome
      // shows its own mini bar and the event is spent
      e.preventDefault();
      pending = e as BeforeInstallPromptEvent;
      announce();
    });
    window.addEventListener('appinstalled', () => { pending = null; announce(); });
  } catch { /* no window, nothing to wire */ }
}

/**
 * Ask the browser to install. Resolves to what the visitor chose, or 'unsupported'
 * when there was never an event to work with, which is every iPhone.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
  if (!pending) return 'unsupported';
  const e = pending;
  pending = null;          // an event can only be used once
  announce();
  try {
    await e.prompt();
    const { outcome } = await e.userChoice;
    return outcome;
  } catch {
    return 'dismissed';
  }
}

/**
 * Register the worker that makes the app installable at all. Chrome refuses to
 * fire beforeinstallprompt without one.
 */
export function registerWorker(base: string): void {
  try {
    if (!('serviceWorker' in navigator)) return;
    // the worker has to sit at the scope root, which under GitHub Pages is the
    // project sub path and not the domain
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => { /* not fatal */ });
  } catch { /* nothing to do */ }
}
