import { asset } from '../asset.ts';

/**
 * The coach who walks you through the opening. Top Eleven leans on a talking
 * head that guides the first minutes and makes them feel personal and premium;
 * this is our version, the game's own coach as a recurring presenter with a
 * line at each onboarding step. Uses the coach logo we already ship.
 */
export function CoachGuide({ text }: { text: string }) {
  return (
    <div className="coach-guide" style={{ animation: 'riseIn .3s var(--ease-out) both' }}>
      {/* the logo is a full square, so we zoom into the coach's face rather than
          shrink the whole shield into the little circle */}
      <div className="coach-guide-pic" role="img" aria-label="המאמן"
        style={{ backgroundImage: `url(${asset('/logo.webp')})` }} />
      <div className="coach-guide-bubble">
        <div className="coach-guide-name">המאמן</div>
        <div className="coach-guide-text">{text}</div>
      </div>
    </div>
  );
}
