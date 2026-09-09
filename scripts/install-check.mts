/**
 * The offer to install matches what the device can actually do.
 *   node --experimental-strip-types scripts/install-check.mts
 *
 * The whole point of this feature is not showing a button that does nothing.
 * Android has a real API, an iPhone has none at all, and a game already on the
 * home screen must not be asked again. Each of those is a different answer and
 * getting one wrong is worse than not offering at all.
 */
import { installKind, isIos, isInstalled, wireInstall, promptInstall } from '../src/ui/install.ts';

const fails: string[] = [];
let checked = 0;

/* a tiny stand in for the browser, because none of this exists in node */
type Fake = { ua: string; standalone?: boolean; displayMode?: string; touch?: number };
function pretend(d: Fake): void {
  // node defines navigator as a getter, so it has to be redefined outright
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true, writable: true,
    value: { userAgent: d.ua, maxTouchPoints: d.touch ?? 0, standalone: d.standalone },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true, writable: true,
    value: {
      matchMedia: (q: string) => ({ matches: !!d.displayMode && q.includes(d.displayMode) }),
      addEventListener: () => { /* nothing fires in here */ },
    },
  });
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1';
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

/* 1. an iPhone is recognised, and gets the instructions rather than a dead button */
{
  pretend({ ua: IPHONE });
  checked += 2;
  if (!isIos()) fails.push('an iPhone was not recognised as iOS');
  if (installKind() !== 'ios') fails.push(`an iPhone was offered ${installKind()}, it has no install API`);
}

/* 2. an iPad reporting itself as a Mac is still an iPad. Apple made recent
      iPads send a desktop Safari string, so touch points are the only tell. */
{
  pretend({ ua: IPAD_AS_MAC, touch: 5 });
  checked += 2;
  if (!isIos()) fails.push('an iPad pretending to be a Mac was not recognised');
  if (installKind() !== 'ios') fails.push('an iPad was not offered the iOS instructions');
  // and a real Mac is not an iPad
  pretend({ ua: IPAD_AS_MAC, touch: 0 });
  checked++;
  if (isIos()) fails.push('a desktop Mac was mistaken for an iPad');
}

/* 3. already on the home screen: never asked again, on either platform */
{
  for (const [what, d] of [
    ['iPhone, Safari flag', { ua: IPHONE, standalone: true }],
    ['Android, standalone', { ua: ANDROID, displayMode: 'standalone' }],
    ['fullscreen', { ua: ANDROID, displayMode: 'fullscreen' }],
  ] as [string, Fake][]) {
    pretend(d);
    checked += 2;
    if (!isInstalled()) fails.push(`${what}: not seen as installed`);
    if (installKind() !== 'installed') fails.push(`${what}: offered ${installKind()} while already installed`);
  }
}

/* 4. Android before the browser has spoken, and a desktop, get no offer.
      Chrome fires its event some time after load, so until then there is
      genuinely nothing to offer and a button would be a lie. */
{
  pretend({ ua: ANDROID });
  checked++;
  if (installKind() !== 'none') fails.push(`Android with no event yet offered ${installKind()}`);
  pretend({ ua: DESKTOP });
  checked++;
  if (installKind() !== 'none') fails.push(`a desktop offered ${installKind()}`);
}

/* 5. asking to install with no event to work with says so rather than throwing */
{
  pretend({ ua: IPHONE });
  wireInstall();
  checked++;
  const r = await promptInstall();
  if (r !== 'unsupported') fails.push(`prompting on an iPhone returned ${r}`);
}

/* 6. the worker exists and does not cache, which is what keeps a daily build
      from serving yesterday's code forever */
{
  const fs = await import('node:fs');
  const sw = fs.readFileSync('public/sw.js', 'utf8');
  checked += 3;
  if (!/addEventListener\(\s*['"]fetch['"]/.test(sw)) {
    fails.push('the worker has no fetch handler, so Chrome will not call the app installable');
  }
  if (/cache\.put|cache\.addAll|caches\.open/.test(sw)) {
    fails.push('the worker caches, which will serve stale builds');
  }
  if (!/caches\.delete/.test(sw)) fails.push('the worker never clears an older cache');
}

/* 7. the manifest says what a home screen icon needs */
{
  const fs = await import('node:fs');
  const m = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
  checked += 4;
  if (m.display !== 'standalone') fails.push(`display is ${m.display}, it will open in a tab`);
  if (!m.icons?.some((i: { sizes: string }) => i.sizes === '512x512')) fails.push('no 512 icon');
  if (!m.icons?.some((i: { purpose?: string }) => i.purpose === 'maskable')) {
    fails.push('no maskable icon, so Android will letterbox it');
  }
  if (!m.name || !m.short_name) fails.push('the manifest has no name to put under the icon');
}

/* 8. the offer is reachable BEFORE a career, which is the whole point.
      It first shipped only inside the meters bar, and that bar is drawn only on
      career screens, so a new arrival could not find it at all: he started in a
      browser tab and only met the option three screens in. The title screen is
      the landing page this game already has, so that is where it belongs. */
{
  const fs = await import('node:fs');
  const title = fs.readFileSync('src/ui/screens/Title.tsx', 'utf8');
  const app = fs.readFileSync('src/ui/App.tsx', 'utf8');
  checked += 4;
  if (!title.includes('title-install')) {
    fails.push('the title screen does not offer the install, so a new player cannot find it');
  }
  if (!title.includes('watchInstall')) {
    fails.push('the title screen never hears about the install event, so the offer can go stale');
  }
  if (!title.includes('isInstalled()')) {
    fails.push('the title screen would offer to install a game that already is');
  }
  // and the sheet has to actually render there, which is before the career boots
  const beforeBoot = app.slice(0, app.indexOf("gs.phase === 'invite'"));
  if (!/TitleScreen[\s\S]{0,400}InstallSheet/.test(beforeBoot)) {
    fails.push('the sheet is not rendered alongside the title screen, so the button would do nothing there');
  }
}

console.log(`${checked} checks across iPhone, iPad, Android and desktop`);
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, every device is offered only what it can actually do');
process.exit(fails.length ? 1 : 0);
