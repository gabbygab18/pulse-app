export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Pulse">
      <defs>
        <radialGradient id="pulse-body" cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffd9b8" />
          <stop offset="0.5" stopColor="#f4a564" />
          <stop offset="1" stopColor="#d97b3a" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#111318" />
      <circle cx="32" cy="32" r="18" fill="url(#pulse-body)" />
      <ellipse cx="25" cy="31" rx="3.1" ry="4.4" fill="#17110b" />
      <ellipse cx="39" cy="31" rx="3.1" ry="4.4" fill="#17110b" />
      <ellipse cx="24" cy="29.5" rx="1" ry="1.3" fill="#fff" opacity="0.9" />
      <ellipse cx="38" cy="29.5" rx="1" ry="1.3" fill="#fff" opacity="0.9" />
    </svg>
  );
}
