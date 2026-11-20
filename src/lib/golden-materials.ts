export interface GoldenMaterial {
  id: string;
  subject: string;
  pages: number;
  href: string;
}

export const mathsGoldenMaterial: GoldenMaterial = {
  id: "maths-golden",
  subject: "Mathematics",
  pages: 12,
  href: "/api/pdf/golden-formula-sheet",
};
