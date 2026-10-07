import { loadEnvConfig } from "@next/env";
import {
  initDatabase,
  getAllStudents,
  getAllUserData,
  getUserByLoginId,
} from "../src/lib/db";
import { backendMode, requireSupabase } from "../src/lib/supabase/server";
import { LEARNING_UPLOAD_LIMIT } from "../src/lib/learning-materials";
loadEnvConfig(process.cwd());
async function main() {
  if (backendMode() !== "supabase")
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local first.",
    );
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
    throw new Error(
      "Set SESSION_SECRET to a random value of at least 32 characters.",
    );
  await initDatabase();
  const { error } = await requireSupabase()
    .from("learning_resources")
    .select("id")
    .limit(1);
  if (error)
    throw new Error(
      "Apply 20261006_learning_resources.sql before running setup.",
    );
  const admin = process.env.ADMIN_EMAIL
    ? await getUserByLoginId(process.env.ADMIN_EMAIL)
    : null;
  if (admin?.user.role === "admin") {
    // Exercise the same safe, administrator-only report used by the panel.
    const users = await getAllUserData(admin.user.id);
    console.log("Account directory verified: " + users.length + " users.");
  }
  console.log(
    "Supabase connected; database schema verified and curriculum seeded.",
  );
  console.log("Student accounts: " + (await getAllStudents()).length);
  const bucket =
    await requireSupabase().storage.getBucket("learning-materials");
  if (bucket.error)
    throw new Error(
      "The learning-materials bucket is unavailable. Apply the learning-resources migration.",
    );
  if (!bucket.data?.allowed_mime_types?.includes("video/mp4"))
    throw new Error(
      "Apply 20261008_learning_video_uploads.sql to enable MP4 lesson uploads.",
    );
  console.log("Learning-materials storage verified for notes and MP4 videos.");
  if ((bucket.data?.file_size_limit || 0) < LEARNING_UPLOAD_LIMIT)
    throw new Error(
      "Run npm run materials:import or apply 20261007_material_library_uploads.sql to support the supplied notes and videos up to 50 MiB.",
    );
  const catalogue = await requireSupabase()
    .from("textbooks")
    .select("id")
    .limit(1);
  console.log(
    catalogue.error
      ? "Textbook metadata is not configured yet. Apply 20261007_textbook_library.sql and import the downloaded catalogue."
      : "Textbook metadata table is available.",
  );
  console.log(
    admin?.user.role === "admin"
      ? "Administrator is ready. Use its current password; a newly created administrator must change the initial password."
      : "Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD, then run this command again to bootstrap your administrator.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Database setup failed.",
  );
  process.exitCode = 1;
});
