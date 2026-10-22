import { createServer, type IncomingMessage } from "node:http";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import type { Unit1Candidate } from "./tamil-physics-unit1";
import {
  loadAdditionalPhysicsBatches,
  type PhysicsReviewBatch,
} from "./physics-review-batches";
import { auditTeacherManifest } from "./teacher-decision-audit";
import { loadComputerReviewBatches } from "./computer-review-batches";
import { loadCommerceReviewBatches } from "./commerce-review-batches";
import { loadSharedSourceReviewBatches } from "./shared-source-review";
import { localTranscriptionProposals } from "./tamil-transcription-proposals";
import {
  LocalReviewError,
  evidenceDigest,
  readOptionalJson,
  reconcileManifest,
  recordDecision,
  writeLocalJson,
  type LocalReviewManifest,
  type LocalReviewer,
  requiredSourcePages,
} from "./local-physics-review";

export interface ReviewerAccount extends LocalReviewer {
  passwordHash: string;
}
export async function provisionReviewer(
  directory: string,
  email: string,
  name: string,
) {
  const identity = z
    .object({
      email: z.email().max(200),
      name: z.string().trim().min(2).max(120),
    })
    .parse({ email: email.trim().toLowerCase(), name });
  const file = path.join(directory, "reviewers.json");
  const accounts = (await readOptionalJson<ReviewerAccount[]>(file)) ?? [];
  if (accounts.some((a) => a.email === identity.email))
    throw new LocalReviewError(
      "Reviewer already exists; existing credentials were not replaced",
    );
  const password = `Review-${randomBytes(20).toString("base64url")}!`;
  const account = {
    id: randomUUID(),
    ...identity,
    passwordHash: await bcrypt.hash(password, 12),
  };
  await writeLocalJson(file, [...accounts, account]);
  const credentialsFile = path.join(
    directory,
    `reviewer-access-${account.id}.txt`,
  );
  await writeFile(
    credentialsFile,
    `Local Physics reviewer: ${identity.name}\nEmail: ${identity.email}\nPassword: ${password}\nThis is a local-only account; not a Supabase or student account.\n`,
    { mode: 0o600 },
  );
  return { reviewer: { id: account.id, ...identity }, credentialsFile };
}

export async function renderLocalReviewPages(
  root: string,
  packet: { localPdf: string; sourceSha256: string },
  directory: string,
) {
  const bytes = await readFile(path.join(root, "public", packet.localPdf));
  if (createHash("sha256").update(bytes).digest("hex") !== packet.sourceSha256)
    throw new LocalReviewError("Original PDF checksum mismatch");
  await mkdir(directory, { recursive: true });
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    verbosity: 0,
  });
  try {
    const doc = await task.promise;
    for (const n of [79, 80, 81]) {
      const page = await doc.getPage(n),
        viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      await page.render({
        canvas: canvas as never,
        canvasContext: canvas.getContext("2d") as never,
        viewport,
      }).promise;
      await writeFile(
        path.join(directory, `${n}.png`),
        canvas.toBuffer("image/png"),
      );
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
}

async function body(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 65536) throw new LocalReviewError("Request too large", 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new LocalReviewError("Send valid JSON");
  }
}

export async function startLocalPhysicsReview(options: {
  root: string;
  directory: string;
  port: number;
}) {
  const { root, directory } = options;
  const packet = JSON.parse(
    await readFile(
      path.join(root, "docs/tamil-physics-unit1-candidates.json"),
      "utf8",
    ),
  );
  const candidates = JSON.parse(
    await readFile(
      path.join(root, ".local/teacher-review/tamil-physics-unit1.json"),
      "utf8",
    ),
  ) as Unit1Candidate[];
  if (
    candidates.length !== packet.candidates.length ||
    candidates.some((c) => {
      const source = packet.candidates.find(
        (p: Unit1Candidate) => p.id === c.id,
      );
      return !source || evidenceDigest(c) !== evidenceDigest(source);
    })
  )
    throw new LocalReviewError(
      "Actual local candidate queue differs from the extraction packet; reconcile evidence without overwriting local work before starting",
    );
  const manifestFile = path.join(directory, "decisions.json");
  const savedUnit1 = await readOptionalJson<LocalReviewManifest>(manifestFile);
  const manifest = reconcileManifest(candidates, savedUnit1);
  if (!savedUnit1) await writeLocalJson(manifestFile, manifest);
  const batches: PhysicsReviewBatch[] = [
    { id: "unit-1", unit: 1, title: "Unit 1", candidates },
    ...(await loadAdditionalPhysicsBatches(root)),
    ...(await loadComputerReviewBatches(root)),
    ...(await loadCommerceReviewBatches(root)),
    ...(await loadSharedSourceReviewBatches(root)),
  ];
  if (
    new Set(batches.flatMap((b) => b.candidates.map((c) => c.id))).size !==
    batches.reduce((n, batch) => n + batch.candidates.length, 0)
  )
    throw new LocalReviewError("Duplicate IDs across unit batches");
  const stores = new Map<
    string,
    {
      batch: PhysicsReviewBatch;
      manifest: LocalReviewManifest;
      file: string;
      directory: string;
    }
  >();
  for (const batch of batches) {
    const batchDirectory =
      batch.id === "unit-1" ? directory : path.join(directory, batch.id);
    const file = path.join(batchDirectory, "decisions.json");
    const saved =
      batch.id === "unit-1"
        ? savedUnit1
        : await readOptionalJson<LocalReviewManifest>(file);
    const reconciled =
      batch.id === "unit-1"
        ? manifest
        : reconcileManifest(batch.candidates, saved);
    if (!saved && batch.id !== "unit-1") await writeLocalJson(file, reconciled);
    stores.set(batch.id, {
      batch,
      manifest: reconciled,
      file,
      directory: batchDirectory,
    });
  }
  const assetDirectory = path.join(
    root,
    ".local/teacher-review/physics-unit1-workflow/units2-5-source-assets",
  );
  if (batches.some((batch) => batch.id.startsWith("unit-") && batch.unit > 1)) {
    const receipt = await readOptionalJson<{
      assets: { file: string; sha256: string; candidateId: string }[];
    }>(path.join(assetDirectory, "source-assets.json"));
    if (!receipt)
      throw new LocalReviewError(
        "Run npx tsx scripts/prepare-physics-review-assets.ts before starting Units 2–5 review",
      );
    for (const batch of batches.filter((b) => b.id.startsWith("unit-") && b.unit > 1))
      for (const c of batch.candidates)
        for (const asset of [
          ...c.localReviewRequirements!.figures,
          ...[c.localReviewRequirements!.optionRecovery].filter(
            (a) => a !== null,
          ),
        ]) {
          const saved = receipt.assets.find(
            (r) => r.file === asset.file && r.candidateId === c.id,
          );
          if (
            !saved ||
            createHash("sha256")
              .update(await readFile(path.join(assetDirectory, asset.file)))
              .digest("hex") !== saved.sha256
          )
            throw new LocalReviewError(`Source figure mismatch for ${c.id}`);
        }
  }
  const sourceDirectory = path.join(directory, "source-pages");
  await renderLocalReviewPages(root, packet, sourceDirectory);
  const html = await readFile(
    path.join(root, "scripts/local-physics-review.html"),
  );
  const client = await readFile(
    path.join(root, "scripts/local-physics-review-client.js"),
  );
  const sessions = new Map<
    string,
    { reviewer: LocalReviewer; expires: number }
  >();
  const attempts = new Map<string, { count: number; reset: number }>();
  const sessionCookie = "avs_local_physics_review";
  let origin = "",
    queue = Promise.resolve();
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    );
    const send = (status: number, value: unknown) => {
      response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify(value));
    };
    try {
      if (request.headers.host !== new URL(origin).host)
        throw new LocalReviewError("Use the local 127.0.0.1 address", 403);
      if (request.method === "POST" && request.headers.origin !== origin)
        throw new LocalReviewError(
          "Only same-origin local review actions are allowed",
          403,
        );
      const url = new URL(request.url ?? "/", origin);
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(html);
        return;
      }
      if (request.method === "GET" && url.pathname === "/review.js") {
        response.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
        });
        response.end(client);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/login") {
        const input = z
          .object({
            email: z.email().max(200),
            password: z.string().min(1).max(200),
          })
          .strict()
          .parse(await body(request));
        const email = input.email.toLowerCase(),
          now = Date.now();
        const limit = attempts.get(email) ?? { count: 0, reset: now + 900000 };
        if (now > limit.reset) {
          limit.count = 0;
          limit.reset = now + 900000;
        }
        if (limit.count >= 10)
          throw new LocalReviewError(
            "Too many sign-in attempts. Wait 15 minutes.",
            429,
          );
        limit.count++;
        attempts.set(email, limit);
        const accounts =
          (await readOptionalJson<ReviewerAccount[]>(
            path.join(directory, "reviewers.json"),
          )) ?? [];
        const account = accounts.find((a) => a.email === email);
        if (
          !account ||
          !(await bcrypt.compare(input.password, account.passwordHash))
        )
          throw new LocalReviewError("Invalid local reviewer credentials", 401);
        attempts.delete(email);
        const token = randomBytes(32).toString("hex");
        const reviewer = {
          id: account.id,
          name: account.name,
          email: account.email,
        };
        sessions.set(token, { reviewer, expires: now + 8 * 3600000 });
        response.setHeader(
          "Set-Cookie",
          `${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`,
        );
        send(200, { reviewer });
        return;
      }
      const token =
        request.headers.cookie
          ?.split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith(`${sessionCookie}=`))
          ?.slice(sessionCookie.length + 1) ?? "";
      const session = sessions.get(token);
      if (!session || session.expires < Date.now()) {
        sessions.delete(token);
        throw new LocalReviewError("Local reviewer sign-in required", 401);
      }
      const batchId = url.searchParams.get("batch") || "unit-1";
      const store = stores.get(batchId);
      if (!store) throw new LocalReviewError("Unknown local review batch", 404);
      if (request.method === "POST" && url.pathname === "/api/logout") {
        sessions.delete(token);
        response.setHeader(
          "Set-Cookie",
          `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
        );
        send(200, { success: true });
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/queue") {
        send(200, {
          reviewer: session.reviewer,
          candidates: store.batch.candidates,
          transcriptionProposals: localTranscriptionProposals(
            store.batch.candidates,
          ),
          manifest: store.manifest,
          batchId,
          printedOptionLabels: store.batch.printedOptionLabels ?? {},
          batches: batches.map(({ id, unit, title }) => ({ id, unit, title })),
        });
        return;
      }
      if (
        request.method === "GET" &&
        /^\/source\/\d+\.png$/.test(url.pathname)
      ) {
        const page = Number(path.basename(url.pathname, ".png"));
        const allowed = new Set(
          store.batch.candidates.flatMap(requiredSourcePages),
        );
        if (!allowed.has(page))
          throw new LocalReviewError("Unrelated source page", 404);
        const file = store.batch.sourcePages
          ? path.join(
              store.batch.sourcePages.directory,
              `${store.batch.sourcePages.prefix}${page}.png`,
            )
          : store.batch.id === "unit-1"
            ? path.join(sourceDirectory, `${page}.png`)
            : path.join(assetDirectory, `pdf-${page}.png`);
        response.writeHead(200, { "Content-Type": "image/png" });
        response.end(await readFile(file));
        return;
      }
      if (request.method === "GET" && url.pathname.startsWith("/figure/")) {
        const filename = url.pathname.slice("/figure/".length);
        const asset = store.batch.candidates
          .flatMap((c) => [
            ...(c.localReviewRequirements?.figures || []),
            ...[c.localReviewRequirements?.optionRecovery].filter(
              (a) => a != null,
            ),
          ])
          .find((a) => a.file === filename);
        if (!asset) throw new LocalReviewError("Unrelated source figure", 404);
        response.writeHead(200, { "Content-Type": "image/png" });
        response.end(await readFile(path.join(store.batch.figureDirectory ?? assetDirectory, asset.file)));
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/export") {
        const exported = {
          ...store.manifest,
          exportedAt: new Date().toISOString(),
          exportedBy: session.reviewer,
          notice:
            "Reference only. Local decisions do not change candidate status, publish questions or import into Supabase.",
        };
        const accounts =
          (await readOptionalJson<ReviewerAccount[]>(
            path.join(directory, "reviewers.json"),
          )) || [];
        const audit = auditTeacherManifest(exported, {
          candidates: store.batch.candidates,
          persisted: store.manifest,
          reviewers: accounts.map(({ id, name, email }) => ({
            id,
            name,
            email,
          })),
          requireExport: true,
        });
        if (!audit.valid)
          throw new LocalReviewError(
            "Manifest audit failed; reconcile local history before exporting",
            409,
          );
        const filename = batchId.startsWith("unit-")
          ? `tamil-physics-${batchId}-decisions.json`
          : `textbook-${batchId}-decisions.json`;
        const exportFile = path.join(
          store.directory,
          "exports",
          `${batchId.startsWith("unit-") ? `tamil-physics-${batchId.replace("unit-", "unit")}` : `textbook-${batchId}`}-decisions-${exported.exportedAt.replace(/[:.]/g, "-")}-${randomUUID()}.json`,
        );
        await writeLocalJson(exportFile, exported);
        response.setHeader("X-Local-Export-Path", exportFile);
        response.setHeader(
          "Content-Disposition",
          `attachment; filename="${batchId === "unit-1" ? "tamil-physics-unit1-decisions.json" : filename}"`,
        );
        send(200, exported);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/decision") {
        const input = await body(request);
        const operation = queue.then(async () => {
          const next = recordDecision(
            store.manifest,
            store.batch.candidates,
            input,
            session.reviewer,
          );
          await writeLocalJson(store.file, next);
          store.manifest = next;
        });
        queue = operation.catch(() => {});
        await operation;
        send(200, {
          success: true,
          candidateStatus: "Needs Review",
          practicePublished: false,
        });
        return;
      }
      throw new LocalReviewError("Local route not found", 404);
    } catch (error) {
      const status =
        error instanceof LocalReviewError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 500;
      send(status, {
        error:
          error instanceof LocalReviewError
            ? error.message
            : error instanceof z.ZodError
              ? "Invalid local review input"
              : "Local review could not be completed; check the local files",
      });
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", () => {
      origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
  return {
    server,
    origin,
    manifestFile,
    batchIds: batches.map((b) => b.id),
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
