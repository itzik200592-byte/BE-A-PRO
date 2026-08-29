import { asset } from '../asset.ts';

/**
 * The coach who walks you through the opening, now a living presenter. Top
 * Eleven leans on a talking head to make the first minutes feel personal and
 * premium; this is ours, the game's own coach brought to life (a short looping
 * clip animated from the logo) with a line at each step. Prominent by request.
 */
export function CoachGuide({ text }: { text: string }) {
  return (
    <div className="coach-guide" style={{ animation: 'riseIn .3s var(--ease-out) both' }}>
      <video
        className="coach-guide-vid"
        src={asset('/coach/guide.mp4')}
        poster={asset('/coach/guide.webp')}
        autoPlay muted loop playsInline preload="auto"
        aria-label="המאמן"
      />
      <div className="coach-guide-bubble">
        <div className="coach-guide-name">המאמן</div>
        <div className="coach-guide-text">{text}</div>
      </div>
    </div>
  );
}
