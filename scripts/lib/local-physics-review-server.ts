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
  LocalReviewError,
  evidenceDigest,
  readOptionalJson,
  reconcileManifest,
  recordDecision,
  writeLocalJson,
  type LocalReviewManifest,
  type LocalReviewer,
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
  let manifest = reconcileManifest(
    candidates,
    await readOptionalJson<LocalReviewManifest>(manifestFile),
  );
  await writeLocalJson(manifestFile, manifest);
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
        send(200, { reviewer: session.reviewer, candidates, manifest });
        return;
      }
      if (
        request.method === "GET" &&
        /^\/source\/(79|80|81)\.png$/.test(url.pathname)
      ) {
        const file = path.join(sourceDirectory, path.basename(url.pathname));
        response.writeHead(200, { "Content-Type": "image/png" });
        response.end(await readFile(file));
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/export") {
        const exported = {
          ...manifest,
          exportedAt: new Date().toISOString(),
          exportedBy: session.reviewer,
          notice:
            "Reference only. Local decisions do not change candidate status, publish questions or import into Supabase.",
        };
        const exportFile = path.join(
          directory,
          "exports",
          `tamil-physics-unit1-decisions-${exported.exportedAt.replace(/[:.]/g, "-")}-${randomUUID()}.json`,
        );
        await writeLocalJson(exportFile, exported);
        response.setHeader("X-Local-Export-Path", exportFile);
        response.setHeader(
          "Content-Disposition",
          'attachment; filename="tamil-physics-unit1-decisions.json"',
        );
        send(200, exported);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/decision") {
        const input = await body(request);
        const operation = queue.then(async () => {
          const next = recordDecision(
            manifest,
            candidates,
            input,
            session.reviewer,
          );
          await writeLocalJson(manifestFile, next);
          manifest = next;
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
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
