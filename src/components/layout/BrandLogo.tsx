interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 44, className = "" }: BrandLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#4F46E5] to-[#06B6D4] p-1.5 shadow-md shadow-blue-900/20 ring-1 ring-white/30 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-label="SkillUp Logo"
      role="img"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="su-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E0F2FE" />
          </linearGradient>
          <linearGradient id="su-accent" x1="28" y1="10" x2="40" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Upward Growth Arrow (Leveling Up) */}
        <path
          d="M26 12H38V24"
          stroke="url(#su-accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37 13L24 26"
          stroke="url(#su-accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Dynamic Stylized 'S' Loop for SkillUp */}
        <path
          d="M26 17H18C14.134 17 11 20.134 11 24C11 27.866 14.134 31 18 31H30C33.866 31 37 34.134 37 38C37 41.866 33.866 45 30 45H14"
          stroke="url(#su-grad)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sparkle Star */}
        <circle cx="39" cy="9" r="1.8" fill="#FDE047" />
      </svg>
    </div>
  );
}
