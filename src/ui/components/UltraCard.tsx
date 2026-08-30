/**
 * The player card, "broadcast plate" look. A dark night-stadium body is
 * constant across every rarity; the rarity paints only accents, the edge
 * spine, the OVR, the skewed nameplate and the stat bars. That keeps it far
 * from the FUT full-metal card while still reading its tier at a glance.
 *
 * One component, four sizes off a single --w. xl and l carry the stat bars,
 * m and s drop them so lists stay at 60fps. Only elite animates, only at xl.
 *
 * Pure display: rarity is derived from OVR, nothing here touches the engine.
 */
import type { Player } from '../../engine/matchEngine.ts';
import { overall } from '../../engine/matchEngine.ts';
import type { Club } from '../../data/clubs.ts';
import { rarityOf, cardStats, type Rarity } from '../../game/cards.ts';
import { Crest } from './Crest.tsx';

export type CardSize = 'xl' | 'l' | 'm' | 's';

export function UltraCard({ player, club, size = 'm', onPress }: {
  player: Player;
  /** the club whose crest sits on the card, omitted for free agents */
  club?: Club;
  size?: CardSize;
  onPress?: () => void;
}) {
  useCardStyles();
  const o = overall(player);
  const rarity = rarityOf(player);
  const showBars = size === 'xl' || size === 'l';
  const showName = size !== 's';
  const stats = showBars ? cardStats(player) : [];

  return (
    <div
      className={`uk uk-${size}`}
      data-t={rarity}
      data-bars={showBars ? '1' : '0'}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress}
      onKeyDown={e => { if (onPress && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPress(); } }}
      aria-label={`${player.name}, ${player.position}, דירוג ${o}`}
    >
      <div className="uk-spine" />
      <div className="uk-grain" />
      <div className="uk-crest">
        {club ? <Crest club={club} size={crestPx(size)} /> : <NeutralCrest />}
      </div>
      <div className="uk-top">
        <div className="uk-ovr">{o}</div>
        <div className="uk-pos">{player.position}</div>
      </div>
      <div className="uk-sil"><Silhouette /></div>
      {showName && (
        <div className="uk-plate"><b>{player.name}</b></div>
      )}
      {showBars && (
        <div className="uk-bars">
          {stats.map(([label, v]) => (
            <div className="uk-bar" key={label}>
              <span>{label}</span>
              <span className="uk-track"><span className="uk-fill" style={{ width: `${Math.min(100, v)}%` }} /></span>
              <span className="uk-v">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function crestPx(size: CardSize): number {
  return size === 'xl' ? 26 : size === 'l' ? 20 : size === 'm' ? 17 : 13;
}

function Silhouette() {
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="100" cy="58" r="38" />
        <path d="M100 104c-46 0-84 30-92 74-2 12 6 22 18 22h148c12 0 20-10 18-22-8-44-46-74-92-74z" />
      </g>
    </svg>
  );
}

/** stand-in badge for a player with no club (free agents in the market) */
function NeutralCrest() {
  return (
    <svg viewBox="0 0 48 56" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block', color: 'var(--uk-acc)' }}>
      <path d="M24 2 45 8v22c0 15-11 22-21 24C14 52 3 45 3 30V8z" fill="currentColor" />
      <path d="M24 12v30" stroke="rgba(0,0,0,.35)" strokeWidth="2.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ styles */

let injected = false;
function useCardStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.dataset.ukCard = '';
  el.textContent = CSS;
  document.head.appendChild(el);
}

const CSS = `
/* distinct rarity ramp: dark graphite · brown · copper · cool silver · gold · radiant.
   --uk-acc paints spine/plate/bars, --uk-ovr the rating, --uk-ink the plate text. */
.uk[data-t="plain"]  {--uk-acc:#454b53;--uk-ovr:#828a93;--uk-ink:#cbd2d9;--uk-glow:rgba(0,0,0,0)}
.uk[data-t="brown"]  {--uk-acc:#9a5f2e;--uk-ovr:#d79a5f;--uk-ink:#0a1710;--uk-glow:rgba(150,90,45,.30)}
.uk[data-t="copper"] {--uk-acc:#ef7d33;--uk-ovr:#ff9a52;--uk-ink:#0a1710;--uk-glow:rgba(240,120,50,.34)}
.uk[data-t="silver"] {--uk-acc:#bcd0e6;--uk-ovr:#e6eef7;--uk-ink:#0a1710;--uk-glow:rgba(180,205,235,.34)}
.uk[data-t="gold"]   {--uk-acc:#e3b431;--uk-ovr:#f5cf5a;--uk-ink:#0a1710;--uk-glow:rgba(225,180,60,.34)}
.uk[data-t="elite"]  {--uk-acc:#ffd662;--uk-ovr:#ffe38c;--uk-ink:#0a1710;--uk-glow:rgba(255,215,110,.6)}

.uk{
  --w:118px;
  position:relative; width:var(--w); height:calc(var(--w)*1.34);
  color:#f2f6f3; background:linear-gradient(158deg,#12241a,#0a1710 55%,#081109);
  border:1px solid rgba(255,255,255,.1);
  clip-path:polygon(0 0,100% 0,100% 100%,calc(var(--w)*.15) 100%,0 calc(100% - var(--w)*.15));
  box-shadow:0 14px 30px rgba(0,0,0,.5), inset 0 0 calc(var(--w)*.2) var(--uk-glow);
  overflow:hidden; isolation:isolate; user-select:none;
  font-family:"Heebo","Rubik",system-ui,sans-serif;
  transition:transform .18s cubic-bezier(.2,.7,.2,1);
}
.uk[role="button"]{cursor:pointer}
.uk[role="button"]:active{transform:scale(.97)}
.uk-xl{--w:230px} .uk-l{--w:168px} .uk-m{--w:118px} .uk-s{--w:74px}

.uk-spine{position:absolute;inset-inline-end:0;top:0;bottom:0;width:calc(var(--w)*.03);
  background:linear-gradient(180deg,var(--uk-acc),color-mix(in srgb,var(--uk-acc) 35%,#000))}
.uk-grain{position:absolute;inset:0;opacity:.5;pointer-events:none;
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 calc(var(--w)*.095),transparent calc(var(--w)*.095) calc(var(--w)*.19))}

.uk-top{position:absolute;top:calc(var(--w)*.06);inset-inline-start:calc(var(--w)*.072);z-index:2}
.uk-ovr{font-size:calc(var(--w)*.26);font-weight:900;line-height:.8;letter-spacing:-.04em;color:var(--uk-ovr);
  font-variant-numeric:tabular-nums;text-shadow:0 2px 12px var(--uk-glow)}
.uk-pos{font-size:calc(var(--w)*.057);font-weight:800;letter-spacing:.08em;color:#9fb0a6;margin-top:calc(var(--w)*.014)}

.uk-crest{position:absolute;top:calc(var(--w)*.066);inset-inline-end:calc(var(--w)*.078);z-index:3;
  width:calc(var(--w)*.115);height:calc(var(--w)*.135);opacity:.94;display:grid;place-items:center}

.uk-sil{position:absolute;bottom:calc(var(--w)*.315);inset-inline-end:calc(var(--w)*.026);width:calc(var(--w)*.57);z-index:1;
  color:color-mix(in srgb,var(--uk-acc) 32%,#2a3a30);filter:drop-shadow(0 8px 14px rgba(0,0,0,.5))}
.uk-sil svg{width:100%;height:auto;display:block}

.uk-plate{position:absolute;inset-inline:0;bottom:calc(var(--w)*.246);z-index:2;height:calc(var(--w)*.117);
  display:flex;align-items:center;
  background:linear-gradient(90deg,var(--uk-acc),color-mix(in srgb,var(--uk-acc) 26%,transparent));
  transform:skewX(-8deg) scaleX(1.06)}
.uk-plate b{transform:skewX(8deg);color:var(--uk-ink);font-size:calc(var(--w)*.072);font-weight:900;
  padding-inline-start:calc(var(--w)*.074);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}

.uk-bars{position:absolute;inset-inline:calc(var(--w)*.065);bottom:calc(var(--w)*.04);z-index:2;display:grid;gap:calc(var(--w)*.022)}

/* With the six bars on, they own the bottom 45% of the card, so the nameplate
   and the figure have to sit above them. Without bars the lower half is free
   and everything drops back down. Getting this wrong put the name straight
   through the stats. */
.uk[data-bars="1"] .uk-plate{bottom:calc(var(--w)*.59)}
.uk[data-bars="1"] .uk-sil{bottom:calc(var(--w)*.665);width:calc(var(--w)*.48)}
.uk-bar{display:grid;grid-template-columns:calc(var(--w)*.115) 1fr calc(var(--w)*.095);align-items:center;
  gap:calc(var(--w)*.026);font-size:calc(var(--w)*.041);color:#9fb0a6}
.uk-track{height:calc(var(--w)*.022);background:rgba(255,255,255,.09);overflow:hidden}
.uk-fill{display:block;height:100%;background:var(--uk-acc)}
.uk-v{color:#f2f6f3;font-weight:800;font-variant-numeric:tabular-nums;text-align:end}

/* s: only spine + rating, no plate/bars/silhouette clutter */
.uk-s .uk-sil,.uk-s .uk-plate{display:none}

/* elite: radiant frame + one moving shine, xl only */
.uk-xl[data-t="elite"]{border-color:rgba(255,225,140,.45)}
.uk-xl[data-t="elite"]::after{content:"";position:absolute;inset:-30%;z-index:4;pointer-events:none;
  background:linear-gradient(70deg,transparent 43%,rgba(255,255,255,.5) 50%,transparent 57%);
  transform:translateX(-60%);animation:uk-shine 4.2s ease-in-out infinite}
@keyframes uk-shine{0%,68%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
@media (prefers-reduced-motion:reduce){.uk::after{animation:none}}
`;
