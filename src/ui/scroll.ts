/**
 * Every new page starts at the top.
 *
 * Nothing feels more broken than tapping something at the bottom of a long list
 * and landing halfway down whatever opens next, so this is not a nicety.
 *
 * The reset used to live only in the App, keyed on the game phase, and that
 * turned out to be the wrong unit. A phase is not a page: the press room asks
 * two questions without changing phase, the summer runs three market rounds
 * inside one, and the squad, the market and the table each swap what they are
 * showing behind a tab. Every one of those is a new page to the person holding
 * the phone, and every one of them was leaving him scrolled where he was.
 *
 * So the App resets on a key that includes those sub pages, and anything that
 * changes what a screen is showing calls this directly.
 */
export function scrollToTop(): void {
  // which element actually scrolls depends on the layout, and it has changed
  // more than once, so every plausible one is reset rather than guessed at
  const targets: (Element | null)[] = [
    document.scrollingElement,
    document.documentElement,
    document.body,
    document.getElementById('root'),
    document.querySelector('.frame'),
  ];
  for (const el of targets) if (el) (el as HTMLElement).scrollTop = 0;
  try { window.scrollTo(0, 0); } catch { /* jsdom and friends */ }
}
