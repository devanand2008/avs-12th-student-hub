import { z } from "zod";
export const savedAnswers = z.record(
  z.string().min(1),
  z.enum(["A", "B", "C", "D"]).nullable(),
);
