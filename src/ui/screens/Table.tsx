import * as G from '../../game/state.ts';
import { sortedTable } from '../../game/state.ts';

export function MiniTable({ gs, highlight, rows }: { gs: G.GameState; highlight: string; rows?: number }) {
  const table = sortedTable(gs.league);
  const myPos = table.findIndex(s => s.clubId === highlight);
  let show = table;
  if (rows && table.length > rows) {
    const start = Math.max(0, Math.min(myPos - 1, table.length - rows));
    show = table.slice(start, start + rows);
  }
  const nameOf = (id: string) => gs.league.clubs.find(c => c.id === id)!.short;

  return (
    <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 32px 32px 40px', gap: 0, fontSize: 13 }}>
        <Head>#</Head><Head start>קבוצה</Head><Head>מש</Head><Head>הפ</Head><Head>נק</Head>
        {show.map((s) => {
          const pos = table.indexOf(s) + 1;
          const me = s.clubId === highlight;
          return (
            <Cells key={s.clubId} me={me}>
              <span>{pos}</span>
              <span style={{ textAlign: 'start', fontWeight: me ? 800 : 500 }}>{nameOf(s.clubId)}</span>
              <span>{s.played}</span>
              <span className="num">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</span>
              <b>{s.pts}</b>
            </Cells>
          );
        })}
      </div>
    </div>
  );
}

function Head({ children, start }: { children: any; start?: boolean }) {
  return <div style={{ padding: '9px 8px', color: 'var(--ink-dim)', fontWeight: 700, textAlign: start ? 'start' : 'center', background: '#0a1c12' }}>{children}</div>;
}
function Cells({ children, me }: { children: any; me: boolean }) {
  return (
    <>
      {(children as any[]).map((ch, i) => (
        <div key={i} style={{
          padding: '9px 8px', textAlign: i === 1 ? 'start' : 'center',
          background: me ? 'rgba(232,182,76,.14)' : 'transparent',
          borderTop: '1px solid var(--line)',
        }}>{ch}</div>
      ))}
    </>
  );
}
