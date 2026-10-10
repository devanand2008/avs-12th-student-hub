import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { startPostgrestFixture } from "./helpers/postgrest";
import { fixtureBook, seedTextbookBank } from "./helpers/textbook-bank";

test(
  "a real textbook import creates held candidates, preserves review evidence and never automatically publishes new questions",
  {
    skip:
      !existsSync("public" + fixtureBook.localPath) ||
      !existsSync(`.local/textbook-text/${fixtureBook.id}.json`),
  },
  async () => {
    const fixture = await startPostgrestFixture();
    const reportPath = ".local/textbook-mcq-import-report.json";
    const previous = await readFile(reportPath).catch(() => null);
    try {
      await seedTextbookBank(fixture.db);
      const run = () =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              "--import",
              "tsx",
              "scripts/import-textbook-mcqs.ts",
              "--book-id",
              fixtureBook.id,
            ],
            {
              env: {
                ...process.env,
                DB_DRIVER: "",
                ENABLE_DEMO_DATA: "false",
                SUPABASE_URL: fixture.url,
                NEXT_PUBLIC_SUPABASE_URL: fixture.url,
                SUPABASE_SECRET_KEY: "",
                SUPABASE_SERVICE_ROLE_KEY: "qa-service-key",
              },
              stdio: ["ignore", "pipe", "pipe"],
            },
          );
          let output = "";
          child.stdout.on("data", (chunk) => {
            output += chunk.toString();
          });
          child.stderr.on("data", (chunk) => {
            output += chunk.toString();
          });
          child.on("error", reject);
          child.on("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(output.slice(-3000))),
          );
        });
      await run();
      const candidates = (
        await fixture.db.query<{ id: string; data: Record<string, unknown> }>(
          "select id,data from public.textbook_mcq_candidates where id like 'textbook-q-%' order by id",
        )
      ).rows;
      assert.ok(candidates.length > 90);
      assert.ok(
        candidates.every(
          (c) =>
            c.data.status === "Needs Review" &&
            c.data.reviewStatus === "needs_teacher_review",
        ),
      );
      assert.equal(
        (
          await fixture.db.query<{ n: number }>(
            "select count(*)::integer as n from public.avs_questions where id like 'textbook-q-%' and status='Published'",
          )
        ).rows[0].n,
        0,
      );
      const first = candidates.find((c) => c.data.correctAnswer)!;
      const prep = {
        sourceSha256: first.data.sourceSha256,
        batchId: "integration-chapter-batch",
        sourceCheck: "matched",
        keyCheck: "matched",
        duplicateIds: [],
        keyPageText: "Integration evidence preservation marker",
      };
      await fixture.db.query("select public.avs_prepare_textbook_review($1)", [
        JSON.stringify([
          {
            id: first.id,
            originalExtraction: first.data,
            reviewPreparation: prep,
          },
        ]),
      ]);
      await run();
      const saved = (
        await fixture.db.query<{ data: Record<string, unknown> }>(
          "select data from public.textbook_mcq_candidates where id=$1",
          [first.id],
        )
      ).rows[0].data;
      assert.deepEqual(saved.reviewPreparation, prep);
      assert.equal(saved.status, "Needs Review");
      assert.equal(
        (
          await fixture.db.query<{ n: number }>(
            "select count(*)::integer as n from public.avs_questions where id like 'textbook-q-%' and status='Published'",
          )
        ).rows[0].n,
        0,
      );
    } finally {
      if (previous) await writeFile(reportPath, previous);
      await fixture.close();
    }
  },
);
