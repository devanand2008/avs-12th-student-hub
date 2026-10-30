import { Camera } from "lucide-react";

export default function InstagramLink({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href="https://www.instagram.com/joshuamec/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram @joshuamec (opens in a new tab)"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 ${className}`}
    >
      <Camera size={18} aria-hidden="true" />
      <span>
        Instagram <span className="font-bold">@joshuamec</span>
      </span>
    </a>
  );
}
