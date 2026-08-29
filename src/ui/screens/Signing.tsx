import { useState } from 'react';
import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { asset } from '../asset.ts';
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
    // bold public claim: raises your standing but piles pressure on the room
    label: 'הביאו אותי בשביל לעלות ליגה, אין שאלה בכלל',
    effect: { prestige: +7, morale: -2 },
    reply: 'איזה ביטחון בקבוצה, אתה לוקח לא מעט על עצמך. מה שבטוח יש לנו כותרת לעיתון של שישי.',
  },
  {
    // humble and calm: the room relaxes, but the press reads it as unsure
    label: 'מוקדם מדי להבטחות, נכיר את הסגל ורק אחר כך נדבר',
    effect: { morale: +6, prestige: -3 },
    reply: 'נשמע שאתה קצת חסר ביטחון, נרשום את זה בעיתון של שישי.',
  },
  {
    // the local, heartfelt line: between the two, no headline but real warmth
    label: 'אני גר בעיר הזאת ואעשה הכל כדי להצליח',
    effect: { prestige: +2, morale: +4 },
    reply: 'תשובה רגילה, לא נתת לנו כותרת. נרשום רק שחתמת במועדון בעיתון שישי, בהצלחה.',
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
      <Stepper current={4} />

      {/* the announcement, over the handshake in the club's old office */}
      <div className="signing-hero" style={{ animation: 'pop .45s var(--ease-out)' }}>
        <img src={asset('/signing.webp')} alt="" className="signing-photo" />
        <div className="signing-shade" aria-hidden="true" />
        <div className="signing-head">
          <Crest club={c} size={38} />
          <div style={{ minWidth: 0 }}>
            <div className="label-cap" style={{ letterSpacing: '.16em' }}>הודעה רשמית</div>
            <div className="signing-club">{c.name}</div>
          </div>
        </div>
        <div className="signing-foot">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1.25 }}>
            מודיעה על מינויו של <span style={{ color: 'var(--gold-hi)' }}>{who}</span>
          </div>
          <div className="sub" style={{ marginTop: 5, fontSize: 13.5 }}>
            כמאמן הקבוצה ל{LEAGUE_NAMES[c.tier]}. חוזה לעונה, עם אופציה להארכה.
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
            ברוך הבא {gs.profile.nickname || gs.profile.name} לקבוצת {c.short}. אנחנו בטוחים שתדע להוביל אותנו להצלחות.
            חשוב שתדע, אחרי ההיכרות איתך הציפייה שלנו היא הצלחה כבר העונה.
            ורק שתהיה מוכן, היציע פה בעייתי בהפסדים.
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
