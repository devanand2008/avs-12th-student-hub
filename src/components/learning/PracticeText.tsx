interface PracticeTextProps {
  text: string;
  className?: string;
  testId?: string;
}

// Preserve source line breaks and indentation, including short program examples.
// Render plain React text so textbook code is never interpreted as markup.
export default function PracticeText({
  text,
  className = "",
  testId,
}: PracticeTextProps) {
  const programming =
    /(?:^|\n)\s*(?:#include\b|(?:def|class|import|from|print|printf|scanf|cout|cin)\b|(?:int|float|double|char|void|bool)\s+\w+|(?:for|while|if)\s*\(|(?:SELECT|INSERT|UPDATE|DELETE|CREATE)\s)/m.test(
      text,
    );

  return (
    <span
      data-testid={testId}
      className={`block min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`}
    >
      {programming ? (
        <code className="font-mono text-[0.95em] leading-relaxed">{text}</code>
      ) : (
        text
      )}
    </span>
  );
}
