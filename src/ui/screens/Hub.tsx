import * as G from '../../game/state.ts';
import { LEAGUE_NAMES, isDerby } from '../../data/clubs.ts';
import { Meters } from '../components/bits.tsx';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import type { IconName } from '../components/Icon.tsx';
import { MiniTable } from './Table.tsx';
import { FanNote } from '../components/FanNote.tsx';
import { Gem, GemCount } from '../components/Gem.tsx';
import { PACKS } from '../../game/packs.ts';
import { licence } from '../../game/coach.ts';

export function Hub({ gs, onStart, onSquad, onTransfers, onChronicle, onCaptain, onAssistant, onInbox, onStadium, onPacks, onCoach, onTable }: {
  gs: G.GameState; onStart: () => void; onSquad: () => void; onTransfers: () => void;
  onChronicle: () => void; onCaptain: () => void; onAssistant: () => void; onInbox: () => void;
  onStadium: () => void; onPacks: () => void; onCoach: () => void; onTable: () => void;
}) {
  const c = G.club(gs);
  const fx = G.playerFixture(gs);
  const rivalId = fx ? (fx.homeId === gs.clubId ? fx.awayId : fx.homeId) : null;
  const rival = gs.league.clubs.find(x => x.id === rivalId);
  const iAmHome = fx?.homeId === gs.clubId;
  const win = G.transferWindow(gs);
  const derby = fx ? isDerby(fx.homeId, fx.awayId) : false;
  const unread = G.unreadChronicle(gs);
  const totalChron = gs.chronicle.length;
  const cap = G.captain(gs);

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack pad-b" style={{ gap: 13 }}>
        {/* identity */}
        <div className="row" style={{ marginTop: 2 }}>
          <Crest club={c} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h2">{c.name}</div>
            <div className="row" style={{ gap: 7, marginTop: 4 }}>
              <span className="chip" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--ink-dim)' }}>{LEAGUE_NAMES[c.tier]}</span>
              <span className="chip" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--ink-dim)' }}>
                מחזור <span className="num">{gs.week}/{gs.league.rounds}</span>
              </span>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', marginTop: 5 }}>
              {gs.profile.name}{gs.profile.nickname ? ` "${gs.profile.nickname}"` : ''} · {G.styleTitle(gs.style).title}
            </div>
          </div>
        </div>

        {/* next match */}
        <div className="tile-hero" style={{ padding: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 13 }}>
            <span className="label-cap">המשחק הבא</span>
            {derby
              ? <span className="chip" style={{ background: 'rgba(226,72,77,.16)', color: 'var(--loss)', border: '1px solid rgba(226,72,77,.3)' }}>דרבי</span>
              : <span className="chip" style={{ background: 'rgba(255,255,255,.05)', color: 'var(--ink-dim)' }}>{iAmHome ? 'בית' : 'חוץ'}</span>}
          </div>
          {rival ? (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <TeamCol club={c} />
              <div className="stack" style={{ alignItems: 'center', gap: 3 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--gold)', letterSpacing: '.04em' }}>VS</span>
              </div>
              <TeamCol club={rival} />
            </div>
          ) : <div className="sub">אין משחק השבוע</div>}
        </div>

        {/* quick actions */}
        <div className="row" style={{ gap: 9 }}>
          <ActionCard icon="shirt" title="הסגל שלי" note={`${G.squadSize(gs)} שחקנים`} onClick={onSquad} />
          <ActionCard
            icon="handshake" title="העברות"
            note={win.open ? `פתוח, עוד ${win.weeksLeft}` : 'החלון סגור'}
            accent={win.open ? 'var(--win)' : undefined}
            onClick={onTransfers}
          />
        </div>

        {/* staff */}
        <div className="row" style={{ gap: 9 }}>
          <StaffCard icon="clipboard" title="המאמן שלי"
            note={`${licence(gs.coach.licence).name}`}
            accent={G.courseRequired(gs) ? 'var(--loss)' : undefined}
            onClick={onCoach} />
          <StaffCard icon="star" title="קפטן" note={cap ? cap.name : 'לא נבחר'} onClick={onCaptain} />
          <StaffCard
            icon="mic" title="עוזר מאמן"
            note={gs.assistant.departed ? `${gs.assistant.name} עזב` : G.assistantActive(gs) ? gs.assistant.name : 'לא מאויש'}
            accent={G.assistantActive(gs) ? 'var(--sky)' : undefined}
            onClick={onAssistant}
          />
        </div>

        {gs.inbox.length > 0 && <InboxTile count={gs.inbox.length} onClick={onInbox} />}

        <PacksTile gs={gs} onClick={onPacks} />

        <StadiumTile gs={gs} onClick={onStadium} />

        <ChronicleTile total={totalChron} unread={unread} onClick={onChronicle} />

        <FanNote msg={G.fanNote(gs, 'pre')} />

        <MiniTable gs={gs} highlight={gs.clubId} rows={5} />

        <button className="tile select" onClick={onTable} style={{
          textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <Icon name="trophy" size={20} color="var(--gold)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>הליגה המלאה</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>
              טבלה, מלך השערים ומלך הבישולים
            </div>
          </div>
          <Icon name="chevron" size={17} color="var(--ink-faint)" />
        </button>

        <button className="btn" onClick={onStart}>
          יוצאים למחזור <Icon name="chevron" size={17} />
        </button>
      </div>
    </>
  );
}

function TeamCol({ club }: { club: any }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 8, flex: 1 }}>
      <Crest club={club} size={46} />
      <b style={{ fontSize: 14.5, textAlign: 'center', lineHeight: 1.2 }}>{club.short}</b>
    </div>
  );
}

/** Waiting messages. Red, because it should nag, but it never blocks the week. */
function InboxTile({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button className="tile select" onClick={onClick} style={{
      textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center', position: 'relative',
      borderColor: 'color-mix(in srgb, var(--loss) 40%, transparent)',
      background: 'linear-gradient(180deg, color-mix(in srgb, var(--loss) 9%, var(--surface-2)), var(--surface))',
    }}>
      <Icon name="mic" size={22} color="var(--loss)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>מחכים לתשובה שלך</div>
        <div style={{ fontSize: 13.5, color: 'var(--loss)', fontWeight: 700, marginTop: 2 }}>
          {count === 1 ? 'הודעה אחת ממתינה' : `${count} הודעות ממתינות`}
        </div>
      </div>
      <span style={{
        minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11,
        background: 'var(--loss)', color: '#fff', fontWeight: 800, fontSize: 13,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{count}</span>
      <Icon name="chevron" size={17} color="var(--ink-faint)" />
    </button>
  );
}

/** The ground at a glance, with a red nudge when it blocks the next promotion. */
function StadiumTile({ gs, onClick }: { gs: G.GameState; onClick: () => void }) {
  const cap = gs.stadium.capacity;
  const project = gs.stadium.project;
  const gate = G.stadiumGate(gs);
  const warn = !!gate && !gate.meets && !project;
  const accent = warn ? 'var(--loss)' : project ? 'var(--gold)' : undefined;
  const note = project
    ? `${project.label} בבנייה, עוד ${project.roundsLeft} ${project.roundsLeft === 1 ? 'מחזור' : 'מחזורים'}`
    : warn && gate
      ? `חסרים ${(gate.need - cap).toLocaleString('en-US')} מקומות לעלייה`
      : `${cap.toLocaleString('en-US')} מקומות`;
  return (
    <button className="tile select" onClick={onClick} style={{
      textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center',
      borderColor: accent ? `color-mix(in srgb, ${accent} 38%, transparent)` : undefined,
    }}>
      <Icon name="flag" size={22} color={accent ?? 'var(--gold)'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>האצטדיון</div>
        <div style={{ fontSize: 13.5, color: accent ?? 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>{note}</div>
      </div>
      {warn && (
        <span style={{
          minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11,
          background: 'var(--loss)', color: '#fff', fontWeight: 800, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>!</span>
      )}
      <Icon name="chevron" size={17} color="var(--ink-faint)" />
    </button>
  );
}

/**
 * Packs. Nudges when there is something to actually do, either enough gems for
 * the cheapest pack or an unused ad, and stays quiet otherwise.
 */
function PacksTile({ gs, onClick }: { gs: G.GameState; onClick: () => void }) {
  const left = G.adsLeft(gs);
  const cheapest = Math.min(...PACKS.map(p => p.cost));
  const canOpen = gs.gems >= cheapest;
  const accent = canOpen ? 'var(--gold)' : undefined;
  const note = canOpen
    ? `יש לך מספיק ל${PACKS.filter(p => gs.gems >= p.cost).length === PACKS.length ? 'כל החבילות' : 'חבילה'}`
    : left > 0
      ? `${left} צפיות בפרסומת נשארו העונה`
      : `צריך ${cheapest} יהלומים לחבילה`;
  return (
    <button className="tile select" onClick={onClick} style={{
      textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center',
      borderColor: accent ? 'color-mix(in srgb, var(--gold) 38%, transparent)' : undefined,
    }}>
      <Gem size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>חבילות שחקנים</div>
        <div style={{ fontSize: 13.5, color: accent ?? 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>{note}</div>
      </div>
      <GemCount n={gs.gems} size={16} style={{ color: 'var(--ink-dim)' }} />
      <Icon name="chevron" size={17} color="var(--ink-faint)" />
    </button>
  );
}

function ChronicleTile({ total, unread, onClick }: { total: number; unread: number; onClick: () => void }) {
  const empty = total === 0;
  const note = empty
    ? 'עוד לא נכתב פרק'
    : unread > 0
      ? `${unread} חדש${unread === 1 ? '' : 'ים'} מהמחזור האחרון`
      : `${total} פרקים בקריירה`;
  const accent = unread > 0 ? 'var(--gold)' : undefined;
  return (
    <button className="tile select" onClick={onClick} style={{
      textAlign: 'start', display: 'flex', gap: 12, alignItems: 'center',
      borderColor: accent ? 'color-mix(in srgb, var(--gold) 34%, transparent)' : undefined,
      position: 'relative',
    }}>
      <Icon name="clipboard" size={22} color={accent ?? 'var(--gold)'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>הכרוניקה שלך</div>
        <div style={{ fontSize: 13.5, color: accent ?? 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>{note}</div>
      </div>
      {unread > 0 && (
        <span style={{
          minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11,
          background: 'var(--gold)', color: '#111', fontWeight: 800, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{unread}</span>
      )}
      <Icon name="chevron" size={17} color="var(--ink-faint)" />
    </button>
  );
}

function StaffCard({ icon, title, note, accent, onClick }: {
  icon: IconName; title: string; note: string; accent?: string; onClick: () => void;
}) {
  return (
    <button className="tile select" onClick={onClick} style={{
      flex: 1, textAlign: 'start', display: 'flex', gap: 10, alignItems: 'center',
      borderColor: accent ? `${accent}44` : undefined, minHeight: 60,
    }}>
      <Icon name={icon} size={19} color={accent ?? 'var(--gold)'} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15.5 }}>{title}</div>
        <div style={{ fontSize: 13, color: accent ?? 'var(--ink-faint)', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</div>
      </div>
    </button>
  );
}

function ActionCard({ icon, title, note, accent, onClick }: {
  icon: IconName; title: string; note: string; accent?: string; onClick: () => void;
}) {
  return (
    <button className="tile select" onClick={onClick} style={{
      flex: 1, textAlign: 'start', display: 'flex', flexDirection: 'column', gap: 7,
      borderColor: accent ? `${accent}44` : undefined, minHeight: 84, justifyContent: 'center',
    }}>
      <Icon name={icon} size={21} color={accent ?? 'var(--gold)'} />
      <div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: accent ?? 'var(--ink-faint)', fontWeight: 600, marginTop: 2 }}>{note}</div>
      </div>
    </button>
  );
}
