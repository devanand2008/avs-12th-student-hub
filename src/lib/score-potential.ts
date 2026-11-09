export function giftPotential(points: number) {
  return (
    Math.round(Math.min(100, Math.max(0, (points / 100000) * 100)) * 100) / 100
  );
}
export function rankLabel(rank: number) {
  return rank === 1
    ? "1st"
    : rank === 2
      ? "2nd"
      : rank === 3
        ? "3rd"
        : `#${rank}`;
}
