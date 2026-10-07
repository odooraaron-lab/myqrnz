/* Flat line illustrations for the three setup steps. Ink lines, one accent each. */

const ink = "var(--color-ink)";
const card = "var(--color-card)";
const paper = "var(--color-paper)";

export function ClaimArt() {
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <rect x="14" y="30" width="212" height="92" rx="4" fill={card} stroke={ink} strokeWidth="1.5" />
      <path d="M14 52h212" stroke={ink} strokeWidth="1.5" />
      <circle cx="28" cy="41" r="3" fill="none" stroke={ink} strokeWidth="1.2" />
      <circle cx="40" cy="41" r="3" fill="none" stroke={ink} strokeWidth="1.2" />
      <rect x="56" y="35.5" width="150" height="11" rx="5.5" fill={paper} stroke={ink} strokeWidth="1" />
      <text x="66" y="44" fontSize="8" fontWeight="700" fill={ink} fontFamily="Archivo Variable, sans-serif">
        totara-honey
        <tspan fontWeight="400">.myqr.co.nz</tspan>
      </text>
      <rect x="34" y="68" width="92" height="10" fill="var(--color-cobalt)" />
      <rect x="34" y="86" width="140" height="5" fill={ink} opacity=".25" />
      <rect x="34" y="96" width="118" height="5" fill={ink} opacity=".25" />
      <rect x="168" y="66" width="38" height="38" fill={paper} stroke={ink} strokeWidth="1.2" />
    </svg>
  );
}

export function ListArt() {
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <rect x="82" y="8" width="76" height="136" rx="10" fill={card} stroke={ink} strokeWidth="1.5" />
      <path d="M108 16h24" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      {[
        [90, 28],
        [122, 28],
        [90, 80],
        [122, 80],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="28" height="30" fill={paper} stroke={ink} strokeWidth="1" />
          <rect x={x} y={y + 34} width="20" height="3.5" fill={ink} opacity=".35" />
          <rect x={x} y={y + 41} width="12" height="3.5" fill={ink} />
        </g>
      ))}
      <g transform="translate(176 54) rotate(12)">
        <path d="M0 0h34l10 12-10 12H0z" fill="var(--color-sticker)" stroke={ink} strokeWidth="1.3" />
        <circle cx="33" cy="12" r="2.4" fill={card} stroke={ink} strokeWidth="1" />
        <text x="5" y="16" fontSize="10" fontWeight="800" fill={ink} fontFamily="Archivo Variable, sans-serif">
          $18
        </text>
      </g>
    </svg>
  );
}

export function PrintArt() {
  const finder = (x: number, y: number) => (
    <g>
      <rect x={x} y={y} width="14" height="14" fill={ink} />
      <rect x={x + 2} y={y + 2} width="10" height="10" fill={card} />
      <rect x={x + 4} y={y + 4} width="6" height="6" fill={ink} />
    </g>
  );
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <path d="M72 140l14-118h68l14 118" fill="none" stroke={ink} strokeWidth="1.5" />
      <rect x="80" y="14" width="80" height="104" fill={card} stroke={ink} strokeWidth="1.5" />
      <rect x="90" y="24" width="44" height="6" fill={ink} />
      <g transform="translate(96 40)">
        {finder(0, 0)}
        {finder(34, 0)}
        {finder(0, 34)}
        {[
          [18, 2], [22, 6], [26, 2], [18, 14], [26, 10], [2, 18], [10, 22], [6, 26], [18, 18], [22, 22],
          [30, 18], [38, 18], [42, 22], [34, 26], [18, 30], [26, 34], [22, 42], [30, 38], [38, 34], [42, 42],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="4" height="4" fill={ink} />
        ))}
      </g>
      <rect x="96" y="100" width="48" height="4" fill="var(--color-cobalt)" />
    </svg>
  );
}

export function DesignArt() {
  const swatches = ["#2546F0", "#2F6B3A", "#7A2E46", "#F2C14E", "#A9502E"];
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <rect x="24" y="22" width="120" height="106" fill={card} stroke={ink} strokeWidth="1.5" />
      <rect x="24" y="22" width="120" height="38" fill="var(--color-cobalt-wash)" stroke={ink} strokeWidth="1.5" />
      <circle cx="46" cy="60" r="13" fill={card} stroke={ink} strokeWidth="1.5" />
      <path d="M40 60h12M46 54v12" stroke="var(--color-cobalt)" strokeWidth="2" />
      <rect x="36" y="82" width="70" height="8" fill={ink} />
      <rect x="36" y="96" width="92" height="4" fill={ink} opacity=".3" />
      <rect x="36" y="104" width="80" height="4" fill={ink} opacity=".3" />
      {swatches.map((c, i) => (
        <circle key={c} cx={176} cy={32 + i * 22} r="8" fill={c} stroke={ink} strokeWidth={i === 0 ? 2 : 1} />
      ))}
      <path d="M190 32h22" stroke={ink} strokeWidth="1.3" />
    </svg>
  );
}

export function LiveArt() {
  return (
    <svg viewBox="0 0 240 150" className="h-auto w-full" aria-hidden="true">
      <rect x="40" y="26" width="160" height="98" fill={card} stroke={ink} strokeWidth="1.5" />
      <path d="M40 46h160" stroke={ink} strokeWidth="1.5" />
      <text x="52" y="40" fontSize="9" fontWeight="700" fill={ink} fontFamily="Archivo Variable, sans-serif">
        This week
      </text>
      {[38, 52, 30, 64, 58, 80, 72].map((h, i) => (
        <rect key={i} x={56 + i * 20} y={112 - h} width="12" height={h} fill={i === 5 ? "var(--color-cobalt)" : ink} opacity={i === 5 ? 1 : 0.22} />
      ))}
      <g transform="translate(150 6)">
        <rect width="78" height="28" rx="3" fill="var(--color-sticker)" stroke={ink} strokeWidth="1.3" />
        <text x="10" y="18" fontSize="10" fontWeight="800" fill={ink} fontFamily="Archivo Variable, sans-serif">
          New order
        </text>
      </g>
    </svg>
  );
}
