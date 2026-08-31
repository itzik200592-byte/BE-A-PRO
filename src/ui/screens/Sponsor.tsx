import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { formatMoney } from '../components/bits.tsx';

/**
 * Selling the shirt, every summer.
 *
 * Three deals, the same three temperaments the rest of the game asks about:
 * take the safe money, bet on going up, or bet on filling the ground. The last
 * one is what finally gives the stadium a second reason to exist, since until
 * now a stand only ever paid back through the gate and, in the lower divisions,
 * barely did that.
 */
export function SponsorScreen({ gs, onPick }: {
  gs: G.GameState; onPick: (id: G.SponsorId) => void;
}) {
  const c = G.club(gs);
  const offers = G.sponsorChoices(gs);
  const rounds = gs.league.rounds;

  return (
    <div className="screen pad stack pad-b" style={{ gap: 15, minHeight: '100%' }}>
      <div className="row" style={{ marginTop: 4, gap: 11 }}>
        <Crest club={c} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h2">מי על החולצה</div>
          <div className="sub" style={{ fontSize: 13.5 }}>
            {LEAGUE_NAMES[c.tier]} · עונה <span className="num">{gs.season}</span>
          </div>
        </div>
      </div>

      <div className="tile" style={{ padding: 14, fontSize: 14.5, lineHeight: 1.6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold)', marginBottom: 6 }}>
          {G.SPONSOR_BRAND}
        </div>
        רוצים את הלוגו שלנו על החולצה של {c.short} העונה. שלוש הצעות על השולחן,
        ואתה בוחר אחת. אפשר לשנות רק בקיץ הבא.
      </div>

      <div className="stack stagger" style={{ gap: 10 }}>
        {offers.map((o, i) => (
          <button key={o.id} className="sponsor-card" style={{ ...({ '--i': i } as React.CSSProperties) }}
            onClick={() => onPick(o.id)}>
            <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{o.name}</span>
              <span className="sponsor-per">
                {formatMoney(o.perRound)}<span className="sponsor-unit"> / מחזור</span>
              </span>
            </div>
            <div className="sponsor-blurb">{o.blurb}</div>
            <div className="row" style={{ gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
              <Tag>{formatMoney(o.perRound * rounds)} לעונה</Tag>
              {o.promotionBonus > 0 && <Tag hot>+{formatMoney(o.promotionBonus)} על עלייה</Tag>}
              {o.followsCrowd && <Tag hot>עד ×2 לפי היציע</Tag>}
            </div>
          </button>
        ))}
      </div>

      <p className="hint">
        חוזה היציע נמדד מול הקהל שהליגה מצפה לו, אז הרחבת אצטדיון מגדילה גם אותו,
        לא רק את הכנסות הכרטיסים.
      </p>
    </div>
  );
}

function Tag({ children, hot }: { children: React.ReactNode; hot?: boolean }) {
  return (
    <span className="chip" style={{
      background: hot ? 'rgba(233,185,73,.14)' : 'rgba(255,255,255,.05)',
      color: hot ? 'var(--gold-hi)' : 'var(--ink-dim)',
      border: hot ? '1px solid rgba(233,185,73,.3)' : '1px solid transparent',
    }}>
      <Icon name={hot ? 'star' : 'coins'} size={13} /> {children}
    </span>
  );
}
