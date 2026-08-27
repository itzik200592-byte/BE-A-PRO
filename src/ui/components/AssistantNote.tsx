import * as G from '../../game/state.ts';
import { Icon } from './Icon.tsx';

/**
 * The assistant coach leaning in with his two cents, which is really just your
 * own two cents handed back to you. Renders nothing when there is no assistant,
 * so screens can drop it in unconditionally.
 */
export function AssistantNote({ gs, options, salt = 0 }: {
  gs: G.GameState; options: string[]; salt?: number;
}) {
  const line = G.assistantEcho(gs, options, salt);
  if (!line) return null;
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: 9, marginTop: 2, animation: 'riseIn var(--t-mid) var(--ease-out)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flex: 'none', display: 'grid', placeItems: 'center',
        background: 'var(--surface-2)', border: '1px solid rgba(76,155,232,.4)',
      }}>
        <Icon name="mic" size={16} color="var(--sky)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--sky)', marginBottom: 3 }}>
          {gs.assistant.name}, העוזר
        </div>
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '5px 14px 14px 14px',
          padding: '9px 12px', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-dim)', fontStyle: 'italic',
        }}>
          {line}
        </div>
      </div>
    </div>
  );
}
