/**
 * Every new page opens at the top.
 *   node --experimental-strip-types scripts/scroll-check.mts
 *
 * Landing halfway down whatever you just opened is one of those faults that
 * makes a whole game feel broken, and it kept coming back because the reset was
 * keyed on the game phase. A phase is not a page: the press room asks two
 * questions inside one, the summer runs three market rounds inside one, and the
 * squad, the market and the table each swap what they show behind a tab.
 *
 * These are source guards rather than behaviour: the behaviour lives in a
 * browser and was measured there, but a guard that fails the moment somebody
 * adds a fourth tab without a reset is worth more than a passing note.
 */
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

const read = (f: string) => readFileSync(f, 'utf8');

/* 1. one helper, used everywhere, rather than the reset copied around */
{
  const scroll = read('src/ui/scroll.ts');
  checked += 2;
  if (!scroll.includes('export function scrollToTop')) fails.push('there is no shared scrollToTop');
  // it has to cover whichever element is the scroller, which has changed before
  for (const target of ['scrollingElement', 'documentElement', 'body', 'window.scrollTo']) {
    checked++;
    if (!scroll.includes(target)) fails.push(`scrollToTop does not reset ${target}`);
  }
}

/* 2. the App resets on more than the phase. This is the one that broke: the
      second press question and each summer round leave the phase alone. */
{
  const app = read('src/ui/App.tsx');
  const key = app.slice(app.indexOf('const screenKey'), app.indexOf('useLayoutEffect(scrollToTop'));
  checked += 4;
  if (!app.includes('useLayoutEffect(scrollToTop, [screenKey])')) {
    fails.push('the App no longer resets the scroll on a screen change');
  }
  if (!key.includes('gs.phase')) fails.push('the reset key does not include the phase');
  if (!key.includes('press')) {
    fails.push('the reset key ignores the press question, so the second one opens scrolled');
  }
  if (!key.includes('preWeek')) {
    fails.push('the reset key ignores the summer round, so each market round opens scrolled');
  }
}

/* 3. anything that swaps what a screen shows resets it itself, because the App
      cannot see a tab living inside a component */
{
  const inScreen: [string, string, string][] = [
    ['src/ui/screens/Transfers.tsx', "setTab('market')", 'the market tab'],
    ['src/ui/screens/Transfers.tsx', "setTab('mine')", 'the selling tab'],
    ['src/ui/screens/Standings.tsx', 'setTab(t.id)', 'the table tabs'],
    ['src/ui/screens/Squad.tsx', "setView('pitch')", 'the lineup pitch'],
    ['src/ui/screens/Squad.tsx', "setView('list')", 'the lineup list'],
  ];
  for (const [file, call, what] of inScreen) {
    const src = read(file);
    checked++;
    const at = src.indexOf(call);
    if (at < 0) { fails.push(`${what}: ${call} is gone, this guard needs updating`); continue; }
    // the reset has to be in the same handler, so look at the rest of that line
    const line = src.slice(at, src.indexOf('\n', at));
    if (!line.includes('scrollToTop()')) {
      fails.push(`${what} switches without resetting the scroll`);
    }
  }
}

/* 4. nobody has quietly gone back to rolling their own */
{
  for (const f of ['src/ui/App.tsx', 'src/ui/screens/Transfers.tsx', 'src/ui/screens/Squad.tsx', 'src/ui/screens/Standings.tsx']) {
    const src = read(f);
    checked++;
    if (/scrollTop\s*=\s*0/.test(src) && !src.includes('scroll.ts')) {
      fails.push(`${f} resets the scroll by hand instead of using the helper`);
    }
  }
}

console.log(`${checked} checks`);
console.log('screens reset by the App, tabs and toggles reset themselves');
if (fails.length) console.log('\n  ' + fails.slice(0, 8).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, every new page opens at the top');
process.exit(fails.length ? 1 : 0);
