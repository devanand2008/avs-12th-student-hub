import path from "node:path";
import {
  provisionReviewer,
  startLocalPhysicsReview,
} from "./lib/local-physics-review-server";

async function main() {
  const args = process.argv.slice(2),
    directory = path.resolve(".local/teacher-review/physics-unit1-workflow");
  if (args[0] === "--add-reviewer") {
    if (args.length !== 4 || args[2] !== "--name")
      throw new Error(
        'Usage: --add-reviewer teacher@example.com --name "Actual teacher name"',
      );
    const result = await provisionReviewer(directory, args[1], args[3]);
    console.log(
      `Authorised local reviewer ${result.reviewer.name} (${result.reviewer.email}). Private credentials: ${result.credentialsFile}`,
    );
    return;
  }
  if (args.length && (args.length !== 2 || args[0] !== "--port"))
    throw new Error(
      "Only --port or --add-reviewer is supported; no production import is available",
    );
  const port = args.length ? Number(args[1]) : 4312;
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Choose a local port between 1024 and 65535");
  const app = await startLocalPhysicsReview({
    root: process.cwd(),
    directory,
    port,
  });
  console.log(
    `Local teacher review: ${app.origin}\nDecision manifest: ${app.manifestFile}\nNo Supabase connection; no publication. Provision each actual teacher separately using --add-reviewer.`,
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => {
      void app.close().then(() => process.exit(0));
    });
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Local review failed");
  process.exitCode = 1;
});
