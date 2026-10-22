export interface PositionedPdfText {
  str: string;
  transform: number[];
  width: number;
}
/** Proposed reading order only. This cannot reconstruct maths, glyphs or diagrams. */
export function twoColumnPdfText(items: PositionedPdfText[], width: number) {
  const columns = [
    items.filter((i) => i.transform[4] < width / 2),
    items.filter((i) => i.transform[4] >= width / 2),
  ];
  return columns
    .map((column) => {
      const lines: { y: number; items: PositionedPdfText[] }[] = [];
      for (const item of [...column].sort(
        (a, b) =>
          b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
      )) {
        const line = lines.find((l) => Math.abs(l.y - item.transform[5]) <= 2);
        if (line) line.items.push(item);
        else lines.push({ y: item.transform[5], items: [item] });
      }
      return lines
        .map((l) =>
          l.items
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((i) => i.str)
            .join(" ")
            .trim(),
        )
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
}
