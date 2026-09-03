/**
 * Kits, and the rule that two teams are never the same colour on the pitch.
 *
 * Every club has a home kit (its real colour) and an away kit (a contrasting
 * one). Before a match the two are compared, and if home and away would clash,
 * the away side changes into its second strip, exactly as it works in real
 * football. The manager never has to think about it; it just always reads.
 *
 * Colours are compared in a rough perceptual space, so "green vs green" and
 * "red vs dark red" both count as a clash while green vs red does not.
 */

import type { Club } from './clubs.ts';

export interface Kit {
  /** the shirt body, which is what the pitch dot uses */
  shirt: string;
  /** the trim, for the ring around the dot */
  trim: string;
}

/** A home strip from a pair of colours, club or not yet a club. */
export function homeOf(primary: string, accent: string): Kit {
  return { shirt: primary, trim: accent };
}

/**
 * A change strip from a colour: a light club goes dark and a dark club goes
 * light, keeping its own colour as the trim so it is still recognisable.
 */
export function awayOf(primary: string): Kit {
  return { shirt: isLight(primary) ? '#f2f5f8' : '#1b1f27', trim: primary };
}

/** A club's home strip, straight from its identity. */
export function homeKit(club: Club): Kit {
  return homeOf(club.primary, club.accent);
}

/**
 * A club's away strip. A club may carry an explicit one; otherwise it is
 * derived, a light club going dark and a dark club going light, so the change
 * strip is always a real contrast with the home one.
 */
export function awayKit(club: Club): Kit {
  const explicit = (club as Club & { awayPrimary?: string }).awayPrimary;
  if (explicit) return { shirt: explicit, trim: club.primary };
  return awayOf(club.primary);
}

/**
 * The two kits actually worn in a match. Home always wears home; away wears its
 * away strip only if the home strip would clash with it. Returns the shirt each
 * side puts on, ready for the pitch.
 */
export function matchKits(home: Club, away: Club): { home: Kit; away: Kit } {
  const h = homeKit(home);
  const aHome = homeKit(away);
  if (!clash(h.shirt, aHome.shirt)) return { home: h, away: aHome };
  const aAway = awayKit(away);
  // if even the away strip clashes (both dark, say), force the light default
  if (clash(h.shirt, aAway.shirt)) {
    return { home: h, away: { shirt: isLight(h.shirt) ? '#1b1f27' : '#f2f5f8', trim: away.primary } };
  }
  return { home: h, away: aAway };
}

/* ------------------------------------------------------------------ colour */

function rgb(hex: string): [number, number, number] {
  // tolerate anything that is not a plain 3/6 digit hex, so a stray colour name
  // never throws mid match; it just reads as mid grey for the contrast maths
  const m = typeof hex === 'string' ? /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim()) : null;
  if (!m) return [128, 128, 128];
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceived lightness 0..1, weighted the way the eye sees it. */
export function lightness(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function isLight(hex: string): boolean {
  return lightness(hex) > 0.55;
}

/**
 * Do two shirts clash on a pitch? A clash is colours close enough that a glance
 * cannot tell them apart: similar hue and similar lightness. The threshold is
 * deliberately generous, because on a small phone two dots only have a few
 * pixels to be told apart by.
 */
export function clash(a: string, b: string): boolean {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  // straight distance in RGB, which is crude but enough at dot size
  const dist = Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
  return dist < 112;
}
