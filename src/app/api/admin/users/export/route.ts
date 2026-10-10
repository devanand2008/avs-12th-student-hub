import { getSession } from "@/lib/auth";
import { getAllUserData } from "@/lib/db";
import { filterUserDirectory } from "@/components/admin/user-directory";
import { createUserWorkbook } from "@/lib/user-workbook";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "admin")
    return NextResponse.json(
      { error: "Admin authorization required" },
      { status: 403 },
    );
  try {
    const parameters = new URL(request.url).searchParams;
    const filters = {
      search: (parameters.get("search") || "").slice(0, 254),
      role: parameters.get("role") || "all",
      status: parameters.get("status") || "all",
      stream: parameters.get("stream") || "all",
      medium: parameters.get("medium") || "all",
    };
    const users = filterUserDirectory(
      await getAllUserData(session.userId),
      filters,
    );
    const bytes = await createUserWorkbook(users);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="SkillUp_Users.xlsx"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not export users. Please try again." },
      { status: 503 },
    );
  }
}
