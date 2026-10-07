import Image from "next/image";

export default function BrandLogo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/avs-logo.jpeg"
      alt="AVS Engineering College logo"
      width={size}
      height={size}
      className="shrink-0 rounded-xl border border-blue-200 bg-white object-contain p-1 shadow-sm"
    />
  );
}
