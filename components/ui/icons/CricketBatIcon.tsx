interface CricketBatIconProps {
  className?: string;
}

/** Minimal cricket bat silhouette — used when Lucide has no bat icon */
export function CricketBatIcon({ className }: CricketBatIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2v3" />
      <path d="M10.5 5h3" />
      <path d="M11 5c-1.2 2.5-1.5 5.5-1.5 9.5 0 2 .5 3.5 1.5 5.5" />
      <path d="M13 5c1.2 2.5 1.5 5.5 1.5 9.5 0 2-.5 3.5-1.5 5.5" />
      <path d="M10 20h4" />
    </svg>
  );
}
