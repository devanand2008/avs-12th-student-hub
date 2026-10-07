import { z } from "zod";
import { normalizePhone } from "./db/user-data";
export const studentInput = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Enter the student's full name.")
    .max(120),
  registerNumber: z
    .string()
    .trim()
    .min(1, "Enter a register number.")
    .max(60)
    .regex(
      /^[\p{L}\p{N}_/ .-]+$/u,
      "Use letters, numbers, spaces, /, - or _ in the register number.",
    ),
  schoolName: z.string().trim().min(2, "Enter the school name.").max(200),
  studentEmail: z
    .union([z.literal(""), z.string().trim().email().max(200)])
    .optional(),
  studentPhone: z
    .string()
    .trim()
    .max(30)
    .transform(normalizePhone)
    .refine(
      (value) => value === "" || /^[6-9]\d{9}$/.test(value),
      "Enter a valid 10-digit Indian mobile number.",
    )
    .optional(),
  stream: z.enum(["Computer Science", "Biology"]),
  medium: z.enum(["English", "Tamil"]).default("English"),
  academicYear: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Use an academic year such as 2026-2027.")
    .default("2026-2027"),
});
