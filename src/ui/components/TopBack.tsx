import { Icon } from './Icon.tsx';

/**
 * Back, at the top of the screen where a thumb reaching down the phone does not
 * have to travel. The bottom button stays, this is the same way out offered at
 * the point people actually look for it.
 */
export function TopBack({ label = 'חזרה', title, onBack }: {
  label?: string;
  /** what this screen is, shown beside the arrow */
  title?: string;
  onBack: () => void;
}) {
  return (
    <div className="row" style={{ gap: 10, marginTop: 2 }}>
      <button onClick={onBack} aria-label={label} className="top-back">
        <Icon name="chevron" size={17} />
        <span>{label}</span>
      </button>
      {title && <span className="label-cap" style={{ flex: 1, textAlign: 'end' }}>{title}</span>}
    </div>
  );
}
