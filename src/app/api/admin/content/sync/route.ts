import { getSession } from "@/lib/auth";
import { requireSupabase } from "@/lib/supabase/server";
import supplied from "@/lib/additional-materials-resources.json";
import { logAudit } from "@/lib/db";
export async function POST() {
  const user = await getSession();
  if (user?.role !== "admin")
    return Response.json({ error: "Admin access required." }, { status: 403 });
  try {
    const { data, error } = await requireSupabase()
      .from("learning_resources")
      .upsert(
        supplied.map((r) => ({
          id: r.resource.id,
          kind: r.kind,
          resource: r.resource,
        })),
        { onConflict: "id", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw Error();
    const inserted = data?.length ?? 0;
    await logAudit(
      user.userId,
      "SYNC_SUPPLIED_LIBRARY",
      "learning_resources",
      "supplied",
      { inserted },
    );
    return Response.json(
      { inserted, totalSupplied: supplied.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "The database sync could not finish. Retrying preserves existing records.",
      },
      { status: 503 },
    );
  }
}
