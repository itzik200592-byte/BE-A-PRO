import { useEffect, useRef, useState } from 'react';
import { asset } from '../asset.ts';

/**
 * The cold open. One manager's climb told as a montage of four eras, cut like
 * film: the camera never stops moving inside a shot (a different Ken Burns move
 * per era), and each era change is a hard cut hidden inside a floodlight flash,
 * the classic time jump device, so it reads as years passing rather than a
 * slideshow. Cinemascope bars, grain and a vignette grade the whole thing into
 * one production. About seven seconds, tap anywhere to skip.
 */

const SCENES = [
  { src: asset('/intro/scene1.webp'), pos: 'center 42%', kb: 'kb1' },
  { src: asset('/intro/scene2.webp'), pos: 'center 40%', kb: 'kb2' },
  { src: asset('/intro/scene3.webp'), pos: 'center 42%', kb: 'kb3' },
  { src: asset('/intro/scene4.webp'), pos: 'center 40%', kb: 'kb4' },
];
const HOLD = [1500, 1450, 1550, 2100];   // ms each era is on screen
const N = SCENES.length;

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function IntroCinematic({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(false);
  const [started, setStarted] = useState(false);   // drives the opening fade up from black + bars in
  const [fadeOut, setFadeOut] = useState(false);
  const done = useRef(false);

  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  // decode the first frame before starting, warm the rest so no cut ever flashes a blank
  useEffect(() => {
    let alive = true;
    const first = new Image();
    const go = () => { if (alive) setReady(true); };
    first.onload = go; first.onerror = go; first.src = SCENES[0].src;
    SCENES.slice(1).forEach(s => { const im = new Image(); im.src = s.src; });
    return () => { alive = false; };
  }, []);

  // the cut sheet: hold each era, then a flash that hides the hard cut to the next
  useEffect(() => {
    if (!ready) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStarted(true), 30));

    let t = 0;
    for (let n = 1; n < N; n++) {
      t += HOLD[n - 1];
      const cut = t;
      timers.push(window.setTimeout(() => setFlash(true), cut - 20));
      timers.push(window.setTimeout(() => setI(n), cut + 120));        // swap under the flash peak
      timers.push(window.setTimeout(() => setFlash(false), cut + 190));
    }
    t += HOLD[N - 1];
    timers.push(window.setTimeout(() => setFadeOut(true), t));
    timers.push(window.setTimeout(finish, t + 720));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const scene = SCENES[i];
  const kbDur = HOLD[i] + 900;

  return (
    <div onClick={finish} aria-label="פתיח, הקש לדילוג" style={{
      position: 'absolute', inset: 0, zIndex: 5, background: '#04060a',
      overflow: 'hidden', cursor: 'pointer',
    }}>
      {/* the living frame: one era at a time, remounted per cut so its move restarts */}
      {ready && (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${scene.src}')`, backgroundSize: 'cover', backgroundPosition: scene.pos,
          transformOrigin: 'center',
          animation: reduceMotion
            ? 'introIn .4s ease both'
            : `introIn .3s ease both, ${scene.kb} ${kbDur}ms linear both`,
          willChange: 'transform, opacity',
        }} />
      )}

      {/* unifying grade: warm the lows, cool the highs, so four different photos read as one film */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'soft-light',
        background: 'linear-gradient(180deg, rgba(255,196,120,.10), rgba(10,26,40,.16))',
      }} />

      {/* grain */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: '-8%', pointerEvents: 'none', opacity: .10, mixBlendMode: 'overlay',
        animation: reduceMotion ? undefined : 'introGrain .5s steps(2) infinite',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      {/* vignette */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(120% 78% at 50% 42%, transparent 46%, rgba(0,0,0,.62) 100%)',
      }} />

      {/* the time-jump: a warm floodlight burst that hides each hard cut */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(120% 90% at 50% 38%, #fff 0%, #fff6e6 45%, rgba(255,244,224,0) 78%)',
        opacity: flash ? (reduceMotion ? .5 : .92) : 0,
        transition: flash ? 'opacity .12s ease-out' : 'opacity .42s ease-in',
        mixBlendMode: 'screen',
      }} />

      {/* cinemascope bars */}
      {[0, 1].map(b => (
        <div key={b} aria-hidden="true" style={{
          position: 'absolute', insetInline: 0, [b === 0 ? 'top' : 'bottom']: 0,
          height: started ? '8.5%' : 0, background: '#000',
          transition: 'height .6s var(--ease-out)', pointerEvents: 'none', zIndex: 6,
        }} />
      ))}

      {/* the wordmark lands on the biggest stage */}
      {i >= N - 1 && (
        <div style={{
          position: 'absolute', insetInline: 0, bottom: '15%', textAlign: 'center',
          zIndex: 7, pointerEvents: 'none',
          animation: 'introTitle .9s var(--ease-out) both',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(40px, 14vw, 64px)',
            color: '#fff', letterSpacing: '-.015em', lineHeight: .92,
            textShadow: '0 6px 34px rgba(0,0,0,.65)',
          }}>BE A PRO</div>
          <div style={{
            marginTop: 9, fontSize: 13, fontWeight: 800, letterSpacing: '.18em',
            color: 'var(--gold)', textTransform: 'uppercase',
          }}>מהספסל עד הפסגה</div>
        </div>
      )}

      {/* quiet skip affordance */}
      <div style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 20px)', insetInlineEnd: 18,
        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: '.02em',
        zIndex: 7, pointerEvents: 'none',
      }}>דלג ‹</div>

      {/* final fade to black before the title screen */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, background: '#04060a', zIndex: 8, pointerEvents: 'none',
        opacity: fadeOut ? 1 : 0, transition: 'opacity .7s ease',
      }} />
    </div>
  );
}
