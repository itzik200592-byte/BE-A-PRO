import { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal.tsx';
import { Icon } from './Icon.tsx';

/**
 * The calendar turning over.
 *
 * A button that changes numbers somewhere off screen reads as a button that did
 * nothing, and the summer market is the worst case: the list refreshes but it
 * still looks like a list of players, so the round quietly advanced and nobody
 * noticed. This is the beat that says time moved.
 *
 * It runs at 1.3 seconds rather than the two that were asked for, and a tap
 * ends it early. The house rules put UI transitions under half a second and
 * insist nothing ever blocks the player; a scene change earns more than a
 * micro interaction does, but three of them per summer at two seconds each is
 * how a nice moment turns into a toll gate. Reduced motion collapses it to a
 * short fade.
 */
export function RoundTurn({ from, to, of: total, note, onDone }: {
  /** the round being left */
  from: number;
  /** the round being entered */
  to: number;
  /** rounds in the window, for "2 of 3" */
  of: number;
  /** one line on what actually changed, which is the point of the whole thing */
  note?: string;
  onDone: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const flipAt = reduced ? 40 : 380;
    const endAt = reduced ? 380 : 1300;
    const a = window.setTimeout(() => setFlipped(true), flipAt);
    const b = window.setTimeout(finish, endAt);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, []);

  return (
    <Portal>
      {/* tapping anywhere ends it: an animation the player cannot get past is
          a loading screen wearing a costume */}
      <div className="turn-scrim" onClick={finish} role="status" aria-live="polite">
        <div className="turn-card">
          <div className="turn-head">
            <Icon name="calendar" size={15} />
            <span>שוק הקיץ</span>
          </div>
          <div className="turn-page" data-flipped={flipped ? '1' : '0'}>
            <span className="turn-num num">{flipped ? to : from}</span>
          </div>
          <div className="turn-of">
            מחזור <span className="num">{flipped ? to : from}</span> מתוך <span className="num">{total}</span>
          </div>
          {note && <div className="turn-note" data-in={flipped ? '1' : '0'}>{note}</div>}
        </div>
        <span className="turn-skip">לחץ כדי לדלג</span>
      </div>
    </Portal>
  );
}
