import { TopBack } from '../components/TopBack.tsx';
import { useEffect, useRef, useState } from 'react';
import { asset } from '../asset.ts';
import * as G from '../../game/state.ts';
import { stadiumImageTier } from '../../game/career.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { Meters, formatMoney, StatBox } from '../components/bits.tsx';
import { Icon } from '../components/Icon.tsx';
import { Portal } from '../components/Portal.tsx';

/** Stadium photo src, with a graceful fall back if a band's art is not in yet. */
const stadiumSrc = (tier: number) => asset(`/stadium/tier${tier}.webp`);
function onStadiumImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (!el.dataset.fb) { el.dataset.fb = '1'; el.src = asset('/stadium/tier1.webp'); }
}

/**
 * The home ground. The one screen where the club's growth is something you can
 * see, not just a number: four photos by size, a gate that pays more the bigger
 * you build, and the hard truth that a division above will not let you in until
 * the ground is ready for it.
 */
export function StadiumScreen({ gs, onBuild, onBack }: {
  gs: G.GameState;
  onBuild: (key: 'expand' | 'stand') => void;
  onBack: () => void;
}) {
  const c = G.club(gs);
  const tier = G.stadiumImg(gs);
  const cap = gs.stadium.capacity;
  const project = gs.stadium.project;
  const gate = G.stadiumGate(gs);
  const fill = Math.round(G.attendanceFill(gs, false) * 100);
  const crowd = G.homeAttendance(gs, false);
  const wanted = G.crowdWanted(gs);
  const gateNeed = gate && !gate.meets ? gate.need : 0;
  // seats past what the town turns out for earn nothing until you climb
  const spare = Math.max(0, cap - wanted);
  const options = G.expansions(gs);

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack pad-b" style={{ gap: 13 }}>
        <TopBack onBack={onBack} />
        <div className="row" style={{ gap: 10, marginTop: 2 }}>
          <Icon name="flag" size={22} color="var(--gold)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h2">האצטדיון</div>
            <div className="sub" style={{ fontSize: 14 }}>{c.name} · {LEAGUE_NAMES[c.tier]}</div>
          </div>
        </div>

        {/* the ground itself */}
        <div className="tile" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <img src={stadiumSrc(tier)} alt="האצטדיון" onError={onStadiumImgError}
            style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', insetInline: 0, bottom: 0, padding: '30px 14px 12px',
            background: 'linear-gradient(180deg, transparent, rgba(5,7,12,.86))',
          }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: '.04em' }}>קיבולת</div>
                <div className="score-face" style={{ fontSize: 30, color: '#fff', lineHeight: 1 }}>
                  {cap.toLocaleString('en-US')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Icon name="crowd" size={18} color="var(--gold)" />
                <div className="num" style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>
                  {crowd.toLocaleString('en-US')}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', fontWeight: 700 }}>נכנסו · {fill}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <StatBox label="הכנסת שער למשחק" value={formatMoney(G.homeGateEstimate(gs))} color="var(--win)" />
          <StatBox label="שילוט למחזור" value={formatMoney(G.signageEstimate(gs))} color="var(--sky)" />
          <StatBox label="בקופה" value={formatMoney(gs.meters.money)} color="var(--gold)" />
        </div>

        {/* The one thing that decides whether building is an investment or a
            decoration: a division only turns out so many people, and seats past
            that earn nothing until you go up. */}
        <div className="tile" style={{ padding: '11px 13px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-dim)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="label-cap">כמה קהל {LEAGUE_NAMES[c.tier]} מביאה</span>
            <span className="num" style={{ fontWeight: 800, color: 'var(--ink)' }}>{wanted.toLocaleString('en-US')}</span>
          </div>
          {spare > 0
            ? gateNeed > cap
              ? <>{spare.toLocaleString('en-US')} מקומות שהליגה הזאת לא ממלאת. הם מרוויחים רק שילוט, אבל בלעדיהם אין עלייה.</>
              : <>{spare.toLocaleString('en-US')} מקומות ריקים. הם עדיין מרוויחים שילוט, אבל לא כרטיסים.</>
            : <>היציע מתמלא. כל מקום שתוסיף מכניס גם כרטיסים וגם שילוט.</>}
        </div>

        {/* the promotion gate, the hard rule */}
        {gate && (
          <div className="tile" style={{
            padding: '12px 13px',
            borderColor: gate.meets ? 'color-mix(in srgb, var(--win) 40%, transparent)' : 'color-mix(in srgb, var(--loss) 45%, transparent)',
            background: gate.meets ? 'rgba(47,169,107,.08)' : 'rgba(226,72,77,.09)',
          }}>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Icon name={gate.meets ? 'trophy' : 'alert'} size={16} color={gate.meets ? 'var(--win)' : 'var(--loss)'} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: gate.meets ? 'var(--win)' : 'var(--loss)' }}>
                דרישת עלייה ל{LEAGUE_NAMES[gate.nextTier]}
              </span>
            </div>
            {gate.meets ? (
              <div className="sub" style={{ fontSize: 14.5 }}>
                האצטדיון עומד בדרישה של <span className="num">{gate.need.toLocaleString('en-US')}</span> מקומות. הדרך למעלה פתוחה.
              </div>
            ) : (
              <div className="sub" style={{ fontSize: 14.5 }}>
                בלי אצטדיון של <span className="num">{gate.need.toLocaleString('en-US')}</span> מקומות אי אפשר לעלות, גם אם מסיימים ראשונים.
                חסרים <b className="num" style={{ color: 'var(--loss)' }}>{(gate.need - cap).toLocaleString('en-US')}</b> מקומות.
              </div>
            )}
          </div>
        )}

        {/* build */}
        <div className="label-cap">בנייה</div>
        {project ? (
          <ProjectCard project={project} />
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {options.map(opt => {
              const blocked = G.expansionBlockedReason(gs, opt);
              const newImg = stadiumImageTier(cap + opt.addSeats);
              const upgrades = newImg !== tier;
              return (
                <div key={opt.key} className="tile" style={{ padding: '12px 13px' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{opt.label}</div>
                      <div className="sub" style={{ fontSize: 13.5, marginTop: 2 }}>
                        <span className="num" style={{ color: 'var(--win)' }}>+{opt.addSeats.toLocaleString('en-US')}</span> מקומות · <span className="num">{opt.rounds}</span> מחזורי בנייה
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 'none' }}>
                      <div className="num" style={{ fontWeight: 900, fontSize: 16, color: 'var(--gold-hi)' }}>{formatMoney(opt.cost)}</div>
                    </div>
                  </div>

                  {/* what it becomes: today's ground next to the ground you would build */}
                  {upgrades && (
                    <div className="row" style={{ gap: 8, marginTop: 11, alignItems: 'center' }}>
                      <BuildThumb tier={tier} label="עכשיו" muted />
                      {/* RTL: "now" sits on the right and "after" on the left, so the
                          default chevron already points from one to the other */}
                      <Icon name="chevron" size={18} color="var(--gold)" style={{ flex: 'none' }} />
                      <BuildThumb tier={newImg} label="אחרי הבנייה" />
                    </div>
                  )}

                  <button className="btn" style={{ marginTop: 11 }} disabled={!!blocked} onClick={() => onBuild(opt.key)}>
                    {blocked ?? <>מתחילים לבנות <Icon name="chevron" size={16} /></>}
                  </button>
                </div>
              );
            })}
            <p className="hint" style={{ textAlign: 'center' }}>
              בנייה עולה עכשיו, אבל אצטדיון גדול יותר מחזיר יותר בשער כל משחק בית.
            </p>
          </div>
        )}

        <div className="spacer" />
        <button className="btn dark" onClick={onBack}>חזרה ›</button>
      </div>
    </>
  );
}

/** A small stadium photo used in the before and after preview. */
function BuildThumb({ tier, label, muted }: { tier: number; label: string; muted?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', opacity: muted ? 0.65 : 1 }}>
        <img src={stadiumSrc(tier)} alt={label} onError={onStadiumImgError}
          style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', marginTop: 4, color: muted ? 'var(--ink-faint)' : 'var(--gold)' }}>{label}</div>
    </div>
  );
}

/**
 * The unveil. When a build opens, the new ground pushes in full screen under a
 * short line and a tap moves on. Same cinematic grammar as the title and the
 * trophy lift, so the club's growth lands as a moment, not a number ticking up.
 */
export function StadiumRevealOverlay({ reveal, onDone }: { reveal: G.StadiumReveal; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  useEffect(() => {
    const im = new Image();
    im.onload = () => setShown(true);
    im.onerror = () => setShown(true);
    im.src = stadiumSrc(reveal.image);
  }, [reveal.image]);

  const title = reveal.upgraded ? 'האצטדיון החדש' : 'האצטדיון גדל';

  return (
    <Portal>
      <div onClick={finish} role="button" aria-label="חשיפת האצטדיון, הקש להמשך" style={{
        position: 'fixed', inset: 0, zIndex: 80, overflow: 'hidden', cursor: 'pointer', background: '#05070c',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('${stadiumSrc(reveal.image)}')`, backgroundSize: 'cover', backgroundPosition: 'center 40%',
          opacity: shown ? 1 : 0, transform: shown ? 'scale(1.1)' : 'scale(1.02)',
          transition: 'opacity .7s ease, transform 6s linear',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(120% 80% at 50% 14%, color-mix(in srgb, var(--gold) 20%, transparent), transparent 55%), linear-gradient(180deg, rgba(5,7,12,.3) 0%, transparent 34%, transparent 48%, rgba(5,7,12,.92) 100%)',
        }} />
        {[0, 1].map(b => (
          <div key={b} aria-hidden="true" style={{
            position: 'absolute', insetInline: 0, [b === 0 ? 'top' : 'bottom']: 0,
            height: shown ? '7%' : 0, background: '#000', transition: 'height .6s var(--ease-out)', pointerEvents: 'none',
          }} />
        ))}
        <div style={{
          position: 'absolute', insetInline: 0, bottom: '15%', textAlign: 'center', pointerEvents: 'none',
          opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(16px) scale(1.06)',
          transition: 'opacity .8s ease .3s, transform .8s var(--ease-out) .3s',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(38px, 12vw, 60px)',
            color: '#fff', lineHeight: .95, textShadow: '0 4px 30px rgba(0,0,0,.7), 0 0 34px color-mix(in srgb, var(--gold) 40%, transparent)',
          }}>{title}</div>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 800, color: 'var(--gold)', textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>
            <span className="num">{reveal.capacity.toLocaleString('en-US')}</span> מקומות · <span className="num" style={{ color: 'var(--win)' }}>+{reveal.addSeats.toLocaleString('en-US')}</span>
          </div>
        </div>
        <div style={{
          position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', insetInline: 0,
          textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,.62)',
          opacity: shown ? 1 : 0, transition: 'opacity 1s ease 1s', pointerEvents: 'none',
        }}>הקש להמשך ‹</div>
      </div>
    </Portal>
  );
}

function ProjectCard({ project }: { project: G.StadiumProject }) {
  const pct = Math.round(((project.total - project.roundsLeft) / project.total) * 100);
  return (
    <div className="tile" style={{ padding: '13px', borderColor: 'color-mix(in srgb, var(--gold) 34%, transparent)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 9 }}>
        <div className="row" style={{ gap: 8 }}>
          <Icon name="flag" size={16} color="var(--gold)" />
          <span style={{ fontWeight: 800, fontSize: 16 }}>{project.label} בבנייה</span>
        </div>
        <span className="chip" style={{ background: 'rgba(233,185,73,.16)', color: 'var(--gold)' }}>
          עוד <span className="num">{project.roundsLeft}</span> {project.roundsLeft === 1 ? 'מחזור' : 'מחזורים'}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(6, pct)}%`,
          height: '100%', background: 'linear-gradient(90deg, var(--gold-lo), var(--gold-hi))',
        }} />
      </div>
      <div className="sub" style={{ fontSize: 14, marginTop: 9 }}>
        עם סיום הבנייה הקיבולת תגדל ב<span className="num" style={{ color: 'var(--win)' }}>{project.addSeats.toLocaleString('en-US')}</span> מקומות.
      </div>
    </div>
  );
}
