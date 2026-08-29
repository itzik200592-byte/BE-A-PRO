import * as G from '../../game/state.ts';
import { getManager, TRAINING_KEYS, MENTAL_KEYS, ATTR_HINT, ATTR_LABEL } from '../../data/managers.ts';
import { LICENCES, licence, licenceRank, requiredLicence, coachRating } from '../../game/coach.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { Icon } from '../components/Icon.tsx';
import { Meters, formatMoney } from '../components/bits.tsx';
import { AttrGroup } from './Archetype.tsx';

/**
 * Your own coaching CV. The badges are a ladder you climb across a career, and
 * this is where you see how far up it you are and what the next rung demands.
 */
export function CoachScreen({ gs, onBack }: { gs: G.GameState; onBack: () => void }) {
  const c = gs.coach;
  const m = getManager(c.archetype);
  const held = licenceRank(c.licence);
  const tier = G.club(gs).tier;
  const needed = requiredLicence(tier);

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack pad-b" style={{ gap: 13 }}>
        {/* who you are */}
        <div className="tile-hero" style={{ padding: 16 }}>
          <div className="row" style={{ gap: 13 }}>
            <div className="coach-guide-vid" style={{ width: 74, height: 74 }} aria-hidden="true">
              <video src={`${import.meta.env.BASE_URL}coach/guide.mp4`} autoPlay muted loop playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h2" style={{ fontSize: 22, lineHeight: 1.1 }}>
                {gs.profile.name}{gs.profile.nickname ? ` "${gs.profile.nickname}"` : ''}
              </div>
              <div className="sub" style={{ fontSize: 13.5, marginTop: 3 }}>{m.name} · {licence(c.licence).name}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 'none' }}>
              <div className="score-face" style={{ fontSize: 30, color: 'var(--gold-hi)' }}>{coachRating(c)}</div>
              <div className="sub" style={{ fontSize: 11.5 }}>דירוג</div>
            </div>
          </div>
          <div className="row" style={{ gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            <span className="chip" style={{ background: 'rgba(233,185,73,.14)', color: 'var(--gold)' }}>
              עונות <span className="num">{c.seasons}</span>
            </span>
            <span className="chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ink-dim)' }}>
              {LEAGUE_NAMES[tier]}
            </span>
          </div>
        </div>

        {/* the two groups of ability */}
        <div className="tile" style={{ padding: '13px 14px' }}>
          <AttrGroup title="אימון" keys={TRAINING_KEYS} attrs={c.attrs} color="var(--gold)" />
          <div style={{ height: 12 }} />
          <AttrGroup title="מנטלי" keys={MENTAL_KEYS} attrs={c.attrs} color="var(--sky)" />
        </div>

        {/* what each one actually does, so the numbers are not decoration */}
        <div className="tile" style={{ padding: '12px 14px' }}>
          <div className="label-cap" style={{ marginBottom: 8 }}>מה כל נתון עושה</div>
          <div className="stack" style={{ gap: 7 }}>
            {[...TRAINING_KEYS, ...MENTAL_KEYS].map(k => (
              <div key={k} style={{ fontSize: 13, lineHeight: 1.45 }}>
                <b style={{ color: 'var(--ink)' }}>{ATTR_LABEL[k]}</b>
                <span style={{ color: 'var(--ink-dim)' }}> · {ATTR_HINT[k]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* the ladder */}
        <div className="label-cap">הרישיונות</div>
        <div className="stack" style={{ gap: 9 }}>
          {LICENCES.map((l, i) => {
            const done = i <= held;
            const isNext = i === held + 1;
            const blocking = l.id === needed && i > held;
            return (
              <div key={l.id} className="tile" style={{
                padding: '12px 13px',
                borderColor: blocking ? 'color-mix(in srgb, var(--loss) 45%, transparent)'
                  : done ? 'color-mix(in srgb, var(--win) 34%, transparent)' : undefined,
                opacity: done || isNext || blocking ? 1 : .55,
              }}>
                <div className="row" style={{ gap: 10 }}>
                  <Icon name={done ? 'trophy' : 'clipboard'} size={17}
                    color={done ? 'var(--win)' : blocking ? 'var(--loss)' : 'var(--ink-faint)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15.5 }}>{l.name}</div>
                    <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>{l.blurb}</div>
                  </div>
                  {done
                    ? <span className="chip" style={{ background: 'rgba(51,194,122,.16)', color: 'var(--win)' }}>הושג</span>
                    : <span className="chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ink-dim)' }}>{formatMoney(l.cost)}</span>}
                </div>
                {blocking && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--loss)', marginTop: 7 }}>
                    חובה כדי לפתוח עונה ב{LEAGUE_NAMES[tier]}. הקורס מחכה לך בקיץ.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="hint">קורסים נלמדים בפרה־סיזן בלבד, בין העונות.</p>

        <div className="spacer" />
        <button className="btn dark" onClick={onBack}>חזרה ›</button>
      </div>
    </>
  );
}
