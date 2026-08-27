/**
 * The gem, premium currency. Gunmetal rather than the pastel jewel emoji,
 * to sit with the rest of the game's steel and floodlight palette.
 */
export function Gem({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="יהלום"
      style={{ flex: 'none', display: 'block' }}>
      <defs>
        <linearGradient id="gem-face" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#c3ccd4" />
          <stop offset=".5" stopColor="#7d8891" />
          <stop offset="1" stopColor="#454e56" />
        </linearGradient>
      </defs>
      <path d="M24 18 H76 L94 42 L50 94 L6 42 Z" fill="url(#gem-face)" stroke="#2a3138" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M6 42 H94 M24 18 L38 42 L50 94 M76 18 L62 42 L50 94 M38 42 H62"
        fill="none" stroke="#2a3138" strokeWidth="1.6" opacity=".55" />
      <path d="M24 18 L38 42 H6 Z" fill="#ffffff" opacity=".35" />
      <path d="M62 42 L76 18 H94 Z" fill="#000000" opacity=".18" />
    </svg>
  );
}

/** Gem count as it appears in a bar or on a button. */
export function GemCount({ n, size = 18, style }: { n: number; size?: number; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <Gem size={size} />
      <b className="num" style={{ fontWeight: 900, fontSize: size * 0.95 }}>{n}</b>
    </span>
  );
}
