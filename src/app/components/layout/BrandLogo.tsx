interface BrandLogoProps {
  inverse?: boolean;
}

export default function BrandLogo({ inverse = false }: BrandLogoProps) {
  const wordmarkColor = inverse ? "#ffffff" : "var(--brand-primary)";

  return (
    <svg
      role="img"
      aria-label="ClothesTown"
      viewBox="0 0 200 51"
      className="block h-9 w-[141px] shrink-0 sm:h-10 sm:w-[157px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40.1 7.4 37 12.1c-4.3-2.8-9.3-3.4-13.8-1.4-6 2.6-9.2 7.8-9.2 15.1 0 7.1 3.3 12.4 9.3 14.8 4.5 1.8 9.4 1.1 13.7-2l3.2 4.2c-5.3 4.5-12.6 5.6-19.1 3C12.8 42.8 7.8 35.4 7.8 25.8c0-9 4.1-15.9 11.6-19.2 6.9-3.1 15-2.4 20.7.8Z"
        fill={wordmarkColor}
      />
      <path
        d="M20.1 9.1h22.4v1.6H20.1z"
        fill={wordmarkColor}
      />
      <path
        d="M30.2 10.2h2.2v29.2l-1.1 4.3-1.1-4.3z"
        fill="var(--brand-secondary)"
      />
      <text
        x="54"
        y="31.6"
        fill={wordmarkColor}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14.5"
        fontWeight="500"
        letterSpacing="2.2"
      >
        CLOTHE
      </text>
      <text
        x="123"
        y="31.6"
        fill="var(--brand-secondary)"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14.5"
        fontWeight="500"
        letterSpacing="2.2"
      >
        STOWN
      </text>
    </svg>
  );
}
