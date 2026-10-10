import { phoneLoginPath } from "@/lib/auth/phone";
import { studentActivationMode } from "@/lib/auth/activation";
import { registerStudent } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { BackendUnavailableError } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/db/user-data";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";

const registerSchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(100),
  email: z
    .string()
    .trim()
    .email("Please enter a valid Gmail / email address.")
    .max(254),
  password: z
    .string()
    .min(10, "Use at least 10 characters for your password.")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password cannot exceed 72 UTF-8 bytes.",
    )
    .optional(),
  phone: z
    .string()
    .trim()
    .max(20)
    .transform(normalizePhone)
    .refine(
      (phone) => /^[6-9]\d{9}$/.test(phone),
      "Please enter a valid 10-digit Indian mobile number.",
    ),
  schoolName: z
    .string()
    .trim()
    .min(2, "Please enter your school name.")
    .max(200),
  registerNumber: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  standard: z.literal("12th Standard").default("12th Standard"),
  medium: z.enum(["English", "Tamil"]).default("English"),
  stream: z.enum(["Computer Science", "Biology"], {
    message: "Please choose either Computer Science or Biology stream.",
  }),
  studentId: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = await checkRateLimit(`register_${ip}`, 25, 60);
    if (!rl.success) {
      return NextResponse.json(
        {
          error:
            "Too many registration requests. Please wait a moment and try again.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message || "Invalid registration details.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      studentName,
      email,
      password,
      phone,
      schoolName,
      registerNumber,
      standard,
      medium,
      stream,
      studentId,
    } = result.data;

    const mode = studentActivationMode();

    if (mode !== "admin" && !password)
      return NextResponse.json(
        { error: "A password is required for registration." },
        { status: 400 },
      );

    if (mode === "direct" && !registerNumber)
      return NextResponse.json(
        { error: "Please enter your school register number or roll number." },
        { status: 400 },
      );

    const { student, user } = await registerStudent({
      studentName,
      phone,
      schoolName,
      registerNumber: registerNumber || studentId,
      standard,
      medium,
      email: email.toLowerCase(),
      stream,
      studentId,
      password:
        mode === "admin" ? randomBytes(32).toString("base64url") : password!,
    });

    // Students use their own password and sign in on the login page.
    if (mode === "direct") {
      return NextResponse.json({
        success: true,
        message:
          "Account created. Sign in with your email address and the password you chose.",
        requiresPhoneVerification: false,
        requiresAdminApproval: false,
        user: {
          id: user.id,
          role: user.role,
          studentId: student.studentId,
          studentName: student.studentName,
          stream: student.stream,
          schoolName: student.schoolName,
          phone: student.studentPhone,
          email: user.email,
          medium: student.medium,
        },
        redirectTo:
          "/login?registered=1&email=" + encodeURIComponent(user.email),
      });
    }

    return NextResponse.json({
      success: true,
      message:
        mode === "admin"
          ? "Registration received. Ask your administrator to approve your account and provide a temporary password."
          : "Account created. Verify your mobile number to finish your first login.",
      requiresPhoneVerification: mode === "sms",
      requiresAdminApproval: mode === "admin",
      user: {
        id: user.id,
        role: user.role,
        studentId: student.studentId,
        studentName: student.studentName,
        stream: student.stream,
        schoolName: student.schoolName,
        phone: student.studentPhone,
        email: user.email,
        medium: student.medium,
      },
      redirectTo:
        mode === "admin"
          ? "/login?approval=pending&studentId=" +
            encodeURIComponent(student.studentId)
          : phoneLoginPath(student.studentPhone),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create student account. Please try again.",
      },
      { status: error instanceof BackendUnavailableError ? 503 : 400 },
    );
  }
}
