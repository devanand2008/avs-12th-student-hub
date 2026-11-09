import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { engagementRpc } from "@/lib/engagement";
import { giftStatuses } from "@/lib/gifts";
const input = z
  .object({
    id: z.string().min(1).max(100),
    version: z.number().int().positive(),
    status: z.enum(giftStatuses),
    gift: z.string().trim().max(200),
    deliveryNote: z.string().trim().max(1000),
    adminNotes: z.string().trim().max(2000),
  })
  .superRefine((v, c) => {
    if (["approved", "dispatched", "delivered"].includes(v.status) && !v.gift)
      c.addIssue({
        code: "custom",
        path: ["gift"],
        message: "Choose the gift first.",
      });
    if (
      ["dispatched", "delivered", "rejected"].includes(v.status) &&
      !v.deliveryNote
    )
      c.addIssue({
        code: "custom",
        path: ["deliveryNote"],
        message: "Add a delivery update or rejection reason.",
      });
  });
export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  try {
    return NextResponse.json(
      await engagementRpc("avs_admin_gifts", { p_actor_id: user.userId }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load gift requests." },
      { status: 503 },
    );
  }
}
export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  try {
    const p = input.safeParse(await request.json());
    if (!p.success)
      return NextResponse.json(
        { error: p.error.issues[0].message },
        { status: 400 },
      );
    const d = p.data;
    const saved = await engagementRpc<boolean>("avs_update_gift", {
      p_actor_id: user.userId,
      p_id: d.id,
      p_version: d.version,
      p_status: d.status,
      p_gift: d.gift,
      p_delivery_note: d.deliveryNote,
      p_admin_notes: d.adminNotes,
    });
    return NextResponse.json(
      {
        saved,
        ...(saved
          ? {}
          : { error: "This request changed. Refresh before editing again." }),
      },
      {
        status: saved ? 200 : 409,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save this change. Refresh and check the delivery stage before retrying.",
      },
      { status: 503 },
    );
  }
}
