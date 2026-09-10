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

export type InstallKind = 'prompt' | 'ios' | 'installed' | 'manual';

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
  // the drawn Safari steps are only true IN Safari. Chrome and Firefox on an
  // iPhone look the part and are not allowed to install anything, so they get
  // the written route instead, which starts by telling them so
  if (isIos() && browserId() === 'safari') return 'ios';
  return 'manual';
}

/* --------------------------------------------------- every other browser */

/**
 * Which browser this is, only to the level that changes the instruction.
 *
 * Order matters. Every one of these puts Chrome or Safari in its user agent
 * string, so testing for Chrome first would call all of them Chrome and hand a
 * Samsung Internet user a menu that does not exist on his phone.
 */
export type BrowserId = 'samsung' | 'firefox' | 'opera' | 'edge' | 'chrome' | 'safari' | 'other';

export function browserId(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent): BrowserId {
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Firefox\/|FxiOS/i.test(ua)) return 'firefox';
  if (/OPR\/|OPiOS|Opera/i.test(ua)) return 'opera';
  if (/Edg[A-Z]?\//i.test(ua)) return 'edge';
  if (/CriOS|Chrome\//i.test(ua)) return 'chrome';
  if (/Safari\//i.test(ua)) return 'safari';
  return 'other';
}

export interface InstallGuide {
  /** what to call this browser, so the steps are obviously about HIS browser */
  browser: string;
  steps: string[];
  /** set when the browser genuinely cannot do it, and something else must */
  blocked?: string;
}

const ANDROID = (name: string, steps: string[]): InstallGuide => ({ browser: name, steps });

/**
 * How to get the game onto the home screen in whatever he is actually using.
 *
 * The old answer here was a single line telling everyone who was not on Chrome
 * or Safari to go and open the game somewhere else. That covered Firefox,
 * Samsung Internet, Opera and Brave — a real slice of Android — and every one
 * of them has "add to home screen" sitting in its own menu. Sending those people
 * away was not a limitation, it was us not writing four sentences.
 */
export function installGuide(
  ua = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): InstallGuide {
  const id = browserId(ua);
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua);

  if (isIos()) {
    // on an iPhone only Safari can do this. No other browser there is allowed
    // to, however Chrome-shaped it looks, so pretending otherwise wastes a
    // minute of somebody's evening
    if (id !== 'safari') {
      return {
        browser: 'הדפדפן הזה באייפון',
        steps: ['פתח את הכתובת הזו בספארי', 'שם: כפתור השיתוף → הוספה למסך הבית'],
        blocked: 'באייפון רק ספארי יכול להוסיף למסך הבית.',
      };
    }
    return { browser: 'ספארי', steps: ['כפתור השיתוף למטה', 'גלול ובחר "הוספה למסך הבית"', 'הוסף'] };
  }

  if (mobile) {
    switch (id) {
      case 'samsung': return ANDROID('Samsung Internet', ['תפריט ☰ למטה', 'הוסף דף אל', 'מסך הבית']);
      case 'firefox': return ANDROID('פיירפוקס', ['תפריט ⋮ למעלה', 'התקן', 'אישור']);
      case 'opera':   return ANDROID('אופרה', ['תפריט ⋮', 'הוסף אל', 'מסך הבית']);
      case 'edge':    return ANDROID('אדג׳', ['תפריט ⋯ למטה', 'הוסף לטלפון']);
      default:        return ANDROID('הדפדפן שלך', ['תפריט ⋮ למעלה', 'הוסף למסך הבית', 'אישור']);
    }
  }

  // desktop
  switch (id) {
    case 'firefox':
      return {
        browser: 'פיירפוקס במחשב',
        steps: ['פתח את הכתובת הזו בכרום או באדג׳', 'שם: אייקון ההתקנה בשורת הכתובת'],
        blocked: 'פיירפוקס במחשב לא תומך בהתקנת אפליקציות.',
      };
    case 'safari':
      return { browser: 'ספארי במחשב', steps: ['תפריט קובץ', 'הוספה ל-Dock'] };
    default:
      return { browser: 'הדפדפן שלך', steps: ['אייקון ההתקנה בקצה שורת הכתובת', 'או: תפריט ⋮ → התקן'] };
  }
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
