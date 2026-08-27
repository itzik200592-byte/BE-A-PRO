import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body instead of the current tree.
 *
 * Every full screen overlay in the game uses position:fixed to pin itself to
 * the viewport. That only works if no ancestor has a transform, and our .screen
 * wrapper animates in with one, which quietly turns fixed into "relative to the
 * screen top". On a scrolled page the popup then opens off screen and you have
 * to scroll to find it. Portaling to body escapes that ancestor for good, so a
 * card opens centred on what you are looking at, wherever you scrolled to.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [el] = useState(() => document.createElement('div'));
  useEffect(() => {
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, [el]);
  return createPortal(children, el);
}
