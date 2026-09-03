import { useMemo, useState } from 'react';
import * as G from '../../game/state.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import type { ManagerId } from '../../data/managers.ts';
import { searchCities, findCity, buildRegionLeague, clubFromCity } from '../../data/cities.ts';
import { KIT_COLORS, kitColor, nearestKitColor, type KitColorId } from '../../data/palette.ts';
import { Kit } from '../components/Kit.tsx';
import { homeOf, awayOf, type KitPattern } from '../../data/kits.ts';
import type { City } from '../../data/cities.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { Stepper } from '../components/Stepper.tsx';
import { CoachGuide } from '../components/CoachGuide.tsx';
import { formatMoney } from '../components/bits.tsx';

/* ------------------------------------------------------------ 1. the manager */

/**
 * Two fields and out. Who you are as a manager is not picked from a menu here,
 * it is earned later from the decisions you make, see styleTitle in state.ts.
 */
export function OnboardManager({ gs, onDone }: { gs: G.GameState; onDone: (p: G.ManagerProfile) => void }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const ready = name.trim().length >= 2;

  function submit() {
    if (!ready) return;
    onDone({ name: name.trim(), nickname: nickname.trim(), age: 40, type: 'mental' });
  }

  return (
    <div className="screen pad stack pad-b" style={{ gap: 16, minHeight: '100%' }}>
      <Stepper current={1} />
      <CoachGuide who="owner" text="ברוך הבא, נעים מאוד. אני מנהל הקבוצה, ולפני שאנחנו מתקדמים בוא נסדר את הניירת. איך קוראים לך?" />
      <div style={{ marginTop: 'clamp(4px,2vh,20px)' }}>
        <span className="eyebrow">BE A PRO</span>
        <h1 className="h1" style={{ marginTop: 12 }}>איך קוראים לך?</h1>
        <p className="sub">שתי שורות וזהו. את מי שאתה באמת, כבר תגלה על הדרך.</p>
      </div>

      <div className="tile-hero stack" style={{ gap: 16, padding: 18 }}>
        <div>
          <label className="lbl" htmlFor="mgr-name">השם שלך</label>
          <input
            id="mgr-name" className="field" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="השם המלא שלך" maxLength={22} autoComplete="off" autoFocus
          />
        </div>

        <div>
          <label className="lbl" htmlFor="mgr-nick">כינוי, לא חובה</label>
          <input
            id="mgr-nick" className="field" value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="איך יקראו לך ביציע" maxLength={14} autoComplete="off"
          />
          <p className="hint">ככה יקראו לך ביציע ובעיתונות.</p>
        </div>
      </div>

      {ready && (
        <div className="row" style={{ gap: 12, animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
          <Icon name="mic" size={20} color="var(--gold)" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {name.trim()}{nickname.trim() ? ` "${nickname.trim()}"` : ''}
            </div>
            <div className="hint" style={{ marginTop: 1 }}>ככה יציגו אותך לפני המשחק</div>
          </div>
        </div>
      )}

      <div className="spacer" />
      <button className="btn" disabled={!ready} onClick={submit}>
        {ready ? 'בוחרים מועדון' : 'תכתוב שם כדי להמשיך'}
        {ready && <Icon name="chevron" size={17} />}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- 2. the club */

/**
 * Pick your city, get its club. Typing your own town and watching it become
 * the team you manage is the belonging hook. The whole bottom division is then
 * built from the real towns around you, so it is your actual corner of the map.
 */
/** the shirt designs a manager can choose, each with what to call it */
const PATTERNS: { id: KitPattern; name: string }[] = [
  { id: 'solid', name: 'חלק' },
  { id: 'stripes', name: 'פסים' },
  { id: 'hoops', name: 'חישוקים' },
  { id: 'sash', name: 'אלכסון' },
  { id: 'half', name: 'חצי' },
];

export function OnboardClub({ gs, onPick }: { gs: G.GameState; onPick: (city: string, kit: KitColorId, pattern: KitPattern) => void }) {
  const [q, setQ] = useState('');
  const [chosen, setChosen] = useState<City | null>(null);
  // null means "whatever the town's club already wears", so a manager who does
  // not care never has to choose
  const [kit, setKit] = useState<KitColorId | null>(null);
  // the shirt design, defaulting to a plain shirt until he says otherwise
  const [pattern, setPattern] = useState<KitPattern>('solid');

  const results = useMemo(() => (chosen ? [] : searchCities(q, 7)), [q, chosen]);

  // the live preview of the club and league the chosen city produces
  const preview = useMemo(() => {
    if (!chosen) return null;
    const region = buildRegionLeague(chosen.name, 1);
    const me = region.clubs.find(c => c.id === region.myId)!;
    const derby = region.clubs.find(c => c.id === region.derbyId)!;
    const rest = region.clubs.filter(c => c.id !== me.id);
    // the club's own budget. What your CV is worth on top is settled on the
    // next screen, once you have said what kind of coach you are
    const budget = Math.round(G.START_MONEY * me.traits.budget);
    return { me, derby, rest, budget };
  }, [chosen]);

  // the town's own colour is what the shirts preview before he decides, but it
  // is marked as a suggestion and nothing is selected until he taps one
  const tradition = preview ? nearestKitColor(preview.me.primary) : null;
  const colour = kit ? kitColor(kit) : tradition;
  const shown = preview && colour ? { ...preview.me, primary: colour.hex, accent: colour.trim } : preview?.me;

  function choose(c: City) { setChosen(c); setQ(c.name); setKit(null); setPattern('solid'); }
  function reset() { setChosen(null); setQ(''); setKit(null); setPattern('solid'); }

  return (
    <div className="screen pad stack pad-b" style={{ gap: 14 }}>
      <Stepper current={2} />
      <CoachGuide who="owner" text={`נעים מאוד ${gs.profile.name}. עכשיו הלב של הכל, מאיזו עיר אתה? הקבוצה של העיר שלך היא הקבוצה שתיקח.`} />
      <div style={{ marginTop: 6 }}>
        <span className="eyebrow">{gs.profile.name}{gs.profile.nickname ? ` "${gs.profile.nickname}"` : ''}</span>
        <h1 className="h1" style={{ marginTop: 12 }}>מאיזו עיר אתה?</h1>
        <p className="sub">רשום את העיר שלך. הקבוצה שלה היא הקבוצה שלך, ואתה לוקח אותה מ{LEAGUE_NAMES[1]} עד לצמרת.</p>
      </div>

      {/* the search box */}
      <div style={{ position: 'relative' }}>
        <div className="row" style={{ gap: 10, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--plate-sm)', padding: '4px 12px' }}>
          <Icon name="flag" size={18} color="var(--gold)" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setChosen(null); }}
            placeholder="הקלד את שם העיר שלך"
            autoComplete="off" autoCorrect="off" spellCheck={false}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--ink)', fontSize: 17, fontWeight: 700, padding: '12px 0' }}
          />
          {q && <button onClick={reset} aria-label="נקה" style={{ color: 'var(--ink-faint)', fontSize: 20, padding: 4 }}>×</button>}
        </div>

        {results.length > 0 && (
          <div className="stack" style={{ position: 'absolute', insetInline: 0, top: '100%', marginTop: 6, zIndex: 5, gap: 0,
            background: 'var(--surface-3)', border: '1px solid var(--line-2)', borderRadius: 'var(--plate-sm)', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}>
            {results.map(c => (
              <button key={c.name} onClick={() => choose(c)}
                style={{ textAlign: 'start', padding: '12px 14px', background: 'transparent', borderBottom: '1px solid var(--line)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {q.trim().length >= 1 && !chosen && results.length === 0 && (
          <p className="hint" style={{ marginTop: 8 }}>לא מצאתי עיר כזאת ברשימה. נסה איות אחר.</p>
        )}
      </div>

      {/* the reveal, the moment the city becomes a club */}
      {preview && (
        <div className="tile-hero" key={preview.me.id} style={{ padding: 16, animation: 'pop .4s var(--ease-out)' }}>
          <div className="row" style={{ gap: 14 }}>
            <div style={{ animation: 'pop .5s var(--ease-out)' }}><Crest club={shown!} size={64} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h2" style={{ fontSize: 24, lineHeight: 1 }}>{preview.me.name}</div>
              <div className="sub" style={{ fontSize: 13.5, marginTop: 4 }}>{chosen!.name} · {LEAGUE_NAMES[1]} · נוסד <span className="num">{preview.me.founded}</span></div>
            </div>
          </div>

          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <Stat label="תקציב" value={formatMoney(preview.budget)} />
            <Stat label="מעמד" value={String(preview.me.traits.prestige)} />
            <Stat label="נוער" value={preview.me.traits.youth >= 0.3 ? 'חזק' : preview.me.traits.youth >= 0.15 ? 'בינוני' : 'חלש'} />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="row" style={{ gap: 7, marginBottom: 8 }}>
              <Icon name="crowd" size={15} color="var(--loss)" />
              <span style={{ fontSize: 13.5 }}>הדרבי שלך: <b style={{ color: 'var(--loss)' }}>{preview.derby.name}</b></span>
            </div>
            <div className="label-cap" style={{ marginBottom: 7 }}>{LEAGUE_NAMES[1]}, האזור שלך</div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {preview.rest.map(c => (
                <span key={c.id} className="chip" style={{
                  background: c.id === preview.derby.id ? 'rgba(255,90,95,.14)' : 'rgba(255,255,255,.06)',
                  color: c.id === preview.derby.id ? 'var(--loss)' : 'var(--ink-dim)',
                }}>{c.short}</span>
              ))}
            </div>
          </div>

          {/* the colours. Drawn, not photographed, so every colour and every
              pattern exists without a single image file. Nothing is selected
              until he taps: the shirts are his decision, not the town's */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <div className="label-cap" style={{ marginBottom: 3, color: kit ? 'var(--ink-dim)' : 'var(--gold-hi)' }}>
              {kit ? `הצבעים של ${preview.me.short}` : 'בחר את הצבעים שלך'}
            </div>
            <p className="hint" style={{ margin: '0 0 11px' }}>
              {kit
                ? 'מדי החוץ מתהפכים לבד, כך שלא תשחק אף פעם צבע נגד אותו צבע.'
                : `${preview.me.short} שיחקה תמיד ב${tradition!.name}. תשמור על המסורת או תבחר צבע חדש.`}
            </p>
            <div className="row" style={{ gap: 16, justifyContent: 'center', marginBottom: 12, opacity: kit ? 1 : 0.55, transition: 'opacity .2s' }}>
              <div className="stack" style={{ gap: 5, alignItems: 'center' }}>
                <Kit kit={homeOf(colour!.hex, colour!.trim, pattern)} size={86} label={`מדי בית ${colour!.name}`} />
                <span className="sub" style={{ fontSize: 11.5 }}>בית</span>
              </div>
              <div className="stack" style={{ gap: 5, alignItems: 'center' }}>
                <Kit kit={awayOf(colour!.hex)} size={86} label={`מדי חוץ ${colour!.name}`} />
                <span className="sub" style={{ fontSize: 11.5 }}>חוץ</span>
              </div>
            </div>
            <div className="row" style={{ gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
              {KIT_COLORS.map(c => {
                const on = kit === c.id;
                const isTradition = !kit && c.id === tradition!.id;
                return (
                  <button key={c.id} onClick={() => setKit(c.id)}
                    aria-label={isTradition ? `${c.name}, הצבע של ${preview.me.short}` : c.name}
                    aria-pressed={on}
                    style={{
                      width: 30, height: 30, borderRadius: 9, background: c.hex, padding: 0,
                      border: on ? '2.5px solid var(--gold)'
                        : isTradition ? '2px dashed rgba(233,185,73,.6)'
                        : '1.5px solid rgba(255,255,255,.16)',
                      boxShadow: on ? '0 0 0 3px rgba(233,185,73,.2)' : 'none',
                      transform: on ? 'scale(1.1)' : 'none', transition: 'transform .16s var(--ease-out)',
                    }} />
                );
              })}
            </div>
            {!kit && (
              <p className="hint" style={{ margin: '10px 0 0', textAlign: 'center', color: 'var(--gold-hi)' }}>
                לחץ על צבע כדי להמשיך. המסגרת המקווקוות היא הצבע של העיר.
              </p>
            )}
            {kit && (
              <p className="hint" style={{ margin: '10px 0 0', textAlign: 'center' }}>
                {colour!.name}{kit === tradition!.id ? ', כמו שהעיר תמיד שיחקה' : ''}.
              </p>
            )}

            {/* the design of the shirt, once a colour is on it. Each option is
                the chosen colour drawn in that pattern, so it is a real preview,
                not a word */}
            {kit && (
              <div style={{ marginTop: 15 }}>
                <div className="label-cap" style={{ marginBottom: 9, textAlign: 'center' }}>הדוגמה של החולצה</div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {PATTERNS.map(pt => {
                    const on = pattern === pt.id;
                    return (
                      <button key={pt.id} onClick={() => setPattern(pt.id)}
                        aria-label={pt.name} aria-pressed={on}
                        className="stack"
                        style={{
                          gap: 3, alignItems: 'center', padding: '6px 4px 4px', background: 'transparent',
                          borderRadius: 11,
                          border: on ? '2px solid var(--gold)' : '1.5px solid rgba(255,255,255,.1)',
                        }}>
                        <Kit kit={homeOf(colour!.hex, colour!.trim, pt.id)} size={40} />
                        <span className="sub" style={{ fontSize: 10.5, color: on ? 'var(--gold-hi)' : 'var(--ink-faint)' }}>{pt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button className="btn" disabled={!kit}
            style={{ marginTop: 16, opacity: kit ? 1 : 0.4 }}
            onClick={() => kit && onPick(chosen!.name, kit, pattern)}>
            {kit ? `קח אותי ל${preview.me.short} ‹` : 'בחר צבע קודם'}
          </button>
        </div>
      )}

      {!chosen && (
        <p className="hint" style={{ marginTop: 4 }}>אתה מתחיל בקבוצה השנייה של העיר, האנדרדוג. המטרה: להחזיר אותה למפה.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
      <div className="num" style={{ fontWeight: 900, fontSize: 14 }}>{value}</div>
      <div className="sub" style={{ fontSize: 11 }}>{label}</div>
    </div>
  );
}
