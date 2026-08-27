import type { FanMessage } from '../../data/fans.ts';
import { Icon } from './Icon.tsx';

/**
 * A message from one of the regulars. Deliberately styled like something a
 * neighbour sent you, not like a system notification.
 */
export function FanNote({ msg }: { msg: FanMessage }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 11, animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', flex: 'none',
        background: 'var(--surface-2)', border: '1px solid rgba(226,72,77,.3)',
      }}>
        <Icon name="crowd" size={19} color="var(--blood)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--blood)' }}>{msg.fan.name}</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>· {msg.fan.bio}</span>
        </div>
        <div style={{
          background: 'linear-gradient(180deg,var(--surface-2),var(--surface))',
          border: '1px solid var(--line)', borderRadius: '5px 18px 18px 18px',
          padding: '12px 14px', fontSize: 15, lineHeight: 1.65,
        }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}
