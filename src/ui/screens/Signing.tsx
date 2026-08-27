import { useState } from 'react';
import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { OUTLETS } from '../../data/press.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { Stepper } from '../components/Stepper.tsx';

/**
 * The day you sign. Chairman welcome, the badge in your hand, and the first
 * question from the press before you have coached a single minute.
 */

interface Answer {
  label: string;
  effect: { morale?: number; prestige?: number };
  reply: string;
}

const ANSWERS: Answer[] = [
  {
    label: 'באתי לעלות ליגה, בלי לגמגם',
    effect: { prestige: +6, morale: +2 },
    reply: 'הכותרת מחר כבר כתובה. עכשיו כולם מחכים לראות אותך עומד בזה.',
  },
  {
    label: 'קודם נכיר את השחקנים, ואז נדבר',
    effect: { morale: +6, prestige: -1 },
    reply: 'בחדר ההלבשה שמעו את זה ואהבו. אין הבטחות שאי אפשר לעמוד בהן.',
  },
  {
    label: 'המועדון הזה גדול מכולנו',
    effect: { prestige: +3, morale: +3 },
    reply: 'תשובה שמצאה חן בעיני היציע. בעלי המנויים כבר מדברים עליך יפה.',
  },
];

export function SigningScreen({ gs, onDone }: {
  gs: G.GameState; onDone: (effect: { morale?: number; prestige?: number }) => void;
}) {
  const c = G.club(gs);
  const [picked, setPicked] = useState<number | null>(null);
  const outlet = OUTLETS[Math.abs(gs.seasonSeed) % OUTLETS.length];
  const who = `${gs.profile.name}${gs.profile.nickname ? ` "${gs.profile.nickname}"` : ''}`;

  return (
    <div className="screen pad stack pad-b" style={{ gap: 14, minHeight: '100%' }}>
      <Stepper current={3} />

      {/* the announcement */}
      <div className="tile-hero" style={{ padding: 20, textAlign: 'center', animation: 'pop .45s var(--ease-out)' }}>
        <div className="stack" style={{ alignItems: 'center', gap: 12 }}>
          <Crest club={c} size={68} />
          <div>
            <div className="label-cap" style={{ letterSpacing: '.18em' }}>הודעה רשמית</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, marginTop: 7, lineHeight: 1.25 }}>
              {c.name} מודיעה על מינויו של
              <br /><span style={{ color: 'var(--gold)' }}>{who}</span>
            </div>
            <div className="sub" style={{ marginTop: 8 }}>
              כמאמן הקבוצה ל{LEAGUE_NAMES[c.tier]}. חוזה לעונה, עם אופציה להארכה.
            </div>
          </div>
        </div>
      </div>

      {/* chairman */}
      <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', flex: 'none',
          background: 'var(--surface-2)', border: '1px solid rgba(233,185,73,.35)',
        }}>
          <Icon name="coins" size={20} color="var(--gold)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold)', marginBottom: 5 }}>הבעלים</div>
          <div style={{
            background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
            border: '1px solid var(--line)', borderRadius: '5px 18px 18px 18px',
            padding: '13px 15px', fontSize: 14.5, lineHeight: 1.6,
          }}>
            ברוך הבא {gs.profile.nickname || gs.profile.name}. אני לא אלחץ עליך יותר מדי, רק תדע שהיציע פה לא סלחן.
            תביא לנו עונה שנזכור לטובה ואני מאחוריך בכל דבר.
          </div>
        </div>
      </div>

      {/* first press question */}
      <div className="row" style={{ alignItems: 'flex-start', gap: 11 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', flex: 'none',
          background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,.14)',
        }}>
          <Icon name="mic" size={20} color="var(--ink-dim)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--ink-dim)', marginBottom: 5 }}>{outlet}</div>
          <div style={{
            background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
            border: '1px solid var(--line)', borderRadius: '5px 18px 18px 18px',
            padding: '13px 15px', fontSize: 14.5, lineHeight: 1.6,
          }}>
            מאמן, זו ההצגה הראשונה שלך. מה אתה מבטיח לאוהדים של {c.short} לעונה הזאת?
          </div>
        </div>
      </div>

      {picked === null ? (
        <div className="stack stagger" style={{ gap: 9 }}>
          {ANSWERS.map((a, i) => (
            <button key={i} className="btn dark" style={{ ...({ '--i': i } as React.CSSProperties), justifyContent: 'flex-start', textAlign: 'start' }}
              onClick={() => setPicked(i)}>
              <span style={{ fontWeight: 700 }}>"{a.label}"</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              background: 'linear-gradient(180deg,var(--gold-hi),var(--gold))', color: '#1B1305',
              borderRadius: '18px 18px 5px 18px', padding: '12px 15px', fontSize: 14.5,
              maxWidth: '84%', fontWeight: 700,
            }}>
              "{ANSWERS[picked].label}"
            </div>
          </div>
          <div className="tile" style={{ fontSize: 13.5, lineHeight: 1.6, animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
            {ANSWERS[picked].reply}
          </div>
          <div className="spacer" />
          <button className="btn" onClick={() => onDone(ANSWERS[picked].effect)}>
            עכשיו לפגוש את הסגל <Icon name="chevron" size={17} />
          </button>
        </>
      )}
    </div>
  );
}
