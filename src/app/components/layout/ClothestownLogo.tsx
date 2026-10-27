import Link from "next/link";
import type { MouseEventHandler } from "react";

interface ClothestownLogoProps {
  width?: number | string;
  tagline?: boolean;
  showTagline?: boolean;
  showDivider?: boolean;
  variant?: "horizontal";
  inverse?: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
}

export function ClothestownLogo({
  width = 170,
  tagline,
  showTagline,
  showDivider = false,
  inverse = false,
  href,
  onClick,
  className,
}: ClothestownLogoProps) {
  const displayTagline = showTagline ?? tagline ?? false;
  const primaryColor = inverse ? "#F8F5EF" : "#0F2D39";
  const secondaryColor = "#C18B65";
  const wordmarkStart = showDivider ? 52 : 46;
  const secondWordStart = showDivider ? 108 : 101;
  const logo = (
    <svg
      role="img"
      aria-label="CLOTHESTOWN"
      viewBox="0 0 170 42"
      className="block h-auto shrink-0"
      style={{ width }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="8"
        y="34"
        fill={primaryColor}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="400"
        textLength="26"
        lengthAdjust="spacingAndGlyphs"
      >
        C
      </text>
      <text
        x="18"
        y="38"
        fill={secondaryColor}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fontWeight="400"
        textLength="16"
        lengthAdjust="spacingAndGlyphs"
      >
        T
      </text>
      {showDivider && (
        <path
          d="M43 12v18"
          stroke={secondaryColor}
          strokeOpacity=".62"
          strokeWidth=".55"
        />
      )}
      <text
        x={wordmarkStart}
        y="28.5"
        fill={primaryColor}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="700"
        letterSpacing=".65"
        textLength={showDivider ? "54" : "55"}
        lengthAdjust="spacing"
      >
        CLOTHE
      </text>
      <text
        x={secondWordStart}
        y="28.5"
        fill={secondaryColor}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="700"
        letterSpacing=".65"
        textLength="53"
        lengthAdjust="spacing"
      >
        STOWN
      </text>
      {displayTagline && (
        <text
          x="101"
          y="36"
          fill={primaryColor}
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="4"
          fontWeight="500"
          letterSpacing=".55"
          textAnchor="middle"
        >
          STYLE LIVES HERE
        </text>
      )}
    </svg>
  );

  if (href !== undefined) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {logo}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {logo}
      </button>
    );
  }

  return logo;
}

export default ClothestownLogo;
