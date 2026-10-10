import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { startPostgrestFixture } from "../tests/helpers/postgrest";
async function main() {
  const fixture = await startPostgrestFixture(3101, true);
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--port",
      "3100",
      "--hostname",
      "127.0.0.1",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ENABLE_DEMO_DATA: "false",
        DB_DRIVER: "",
        SUPABASE_SECRET_KEY: "",
        SUPABASE_URL: fixture.url,
        NEXT_PUBLIC_SUPABASE_URL: fixture.url,
        SUPABASE_SERVICE_ROLE_KEY: "qa-service-key",
        SESSION_SECRET: randomBytes(48).toString("base64url"),
        APP_ORIGIN: "http://127.0.0.1:3100",
        ADMIN_EMAIL: "qa-admin@example.test",
        ADMIN_INITIAL_PASSWORD: "QA-only-bootstrap-password",
        GEMINI_API_KEY: "",
        AI_PROVIDER:
          process.env.AVS_TEST_LOCAL_AI === "true" ? "local" : "excerpts",
        STUDENT_ACTIVATION_MODE: ["admin", "sms", "direct"].includes(
          process.env.AVS_TEST_ACTIVATION_MODE || "",
        )
          ? process.env.AVS_TEST_ACTIVATION_MODE
          : "sms",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "qa-service-key",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      },
    },
  );
  let stopping = false;
  async function stop(code: number) {
    if (stopping) return;
    stopping = true;
    child.kill();
    await fixture.close();
    process.exit(code);
  }
  process.on("SIGTERM", () => void stop(0));
  process.on("SIGINT", () => void stop(0));
  child.on("exit", (code) => void stop(code ?? 1));
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
