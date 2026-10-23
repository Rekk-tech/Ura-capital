import React from "react";

export interface AuraLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Aura Capital Official AC Monogram Logo
 * Stylized interlocking "A" (Aura Blue) & "C" (Capital Growth Green)
 */
export const AuraLogo: React.FC<AuraLogoProps> = ({
  size = 36,
  className = "",
  showText = false,
}) => {
  return (
    <div
      className={`aura-logo-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.6rem",
        textDecoration: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="Aura Capital Logo"
      >
        <defs>
          {/* Aura Blue Gradient */}
          <linearGradient id="auraBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D6FF2" />
          </linearGradient>

          {/* Aura Green Gradient */}
          <linearGradient id="auraGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>

          <filter id="auraLogoGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0B1B3A" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#auraLogoGlow)">
          {/* GREEN C COMPONENT: The vibrant growth crescent looping through the lower center */}
          <path
            d="M 43 42 C 37 47 36 57 39 65 C 44 76 56 86 73 86 C 85 86 93 78 96 71 L 86 62 C 83 67 78 74 71 74 C 59 74 51 65 49 58 C 47 52 49 46 52 43 Z"
            fill="url(#auraGreenGrad)"
          />

          {/* BLUE A COMPONENT: Primary Apex & Left Diagonal Stem */}
          <path
            d="M 46 7 L 35 7 L 4 88 L 20 88 L 40 37 L 46 7 Z"
            fill="url(#auraBlueGrad)"
          />

          {/* BLUE A COMPONENT: Right Diagonal Leg slicing through */}
          <path
            d="M 46 7 L 57 7 L 83 75 L 68 75 L 56 42 L 46 7 Z"
            fill="url(#auraBlueGrad)"
          />

          {/* BLUE C UPPER ARC: Matching the geometric circularity at top right */}
          <path
            d="M 57 23 C 74 23 88 31 93 42 L 81 48 C 78 41 70 35 58 35 C 54 35 49 36 45 38 L 42 26 C 47 24 52 23 57 23 Z"
            fill="url(#auraBlueGrad)"
          />
        </g>
      </svg>

      {showText && (
        <span
          style={{
            fontSize: `${size * 0.45}px`,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #1D6FF2 0%, #06B6D4 55%, #22C55E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
          }}
        >
          Aura Capital
        </span>
      )}
    </div>
  );
};
