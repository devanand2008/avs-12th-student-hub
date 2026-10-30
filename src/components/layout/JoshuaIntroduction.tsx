import Image from "next/image";

export default function JoshuaIntroduction({
  compact = false,
}: {
  compact?: boolean;
}) {
  const size = compact ? 72 : 112;

  return (
    <section
      aria-label="Joshua introduction"
      className={`flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3 ${compact ? "mt-5" : "max-w-md"}`}
    >
      <a
        href="/images/joshua-introduction.png"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Joshua introduction badge (opens in a new tab)"
        className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Image
          src="/images/joshua-introduction.png"
          alt="Joshua introduction badge, AVS Engineering College Vice Principal"
          width={553}
          height={554}
          sizes={`${size}px`}
          className="rounded-xl object-contain"
          style={{ width: size, height: "auto" }}
        />
      </a>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
          Introduction
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">Joshua</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Vice Principal
          <br />
          AVS Engineering College
        </p>
      </div>
    </section>
  );
}
