import Image from "next/image";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 44, className = "" }: BrandLogoProps) {
  return (
    <Image
      src="/skillup-logo.png"
      alt="Skill Up Education logo"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
