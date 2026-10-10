import { loadEnvConfig } from "@next/env";
import { requireSupabase } from "../src/lib/supabase/server";
import { ALL_PRACTICE_QUESTIONS } from "../src/lib/data/questions";

async function main() {
  loadEnvConfig(process.cwd());
  const drafts = ALL_PRACTICE_QUESTIONS.filter((q) =>
    q.id.startsWith("review-generated-"),
  );
  if (
    drafts.some(
      (q) =>
        q.status !== "Teacher Review" ||
        q.answerVerification ||
        q.sourceTextbookId,
    )
  )
    throw new Error(
      "Generated questions must remain unverified review drafts.",
    );
  if (!process.argv.includes("--apply")) {
    console.log(
      drafts.length +
        " unverified drafts prepared. Pass --apply to insert missing review records. Existing records and chapter counts will be preserved.",
    );
    return;
  }
  const client = requireSupabase();
  let inserted = 0;
  for (const draft of drafts) {
    const legacyId = draft.id.replace("review-generated-", "");
    const { data: existing, error: readError } = await client
      .from("avs_questions")
      .select("id")
      .in("id", [legacyId, draft.id]);
    if (readError) throw new Error("Could not check existing review records.");
    if (existing?.length) continue;
    const { error } = await client
      .from("avs_questions")
      .upsert(
        { id: draft.id, data: draft },
        { onConflict: "id", ignoreDuplicates: true },
      );
    if (error) throw new Error("Review draft insert failed: " + error.code);
    inserted++;
  }
  console.log(
    inserted + " missing review drafts inserted; no questions published.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
