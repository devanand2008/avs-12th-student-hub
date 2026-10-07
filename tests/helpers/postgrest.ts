// Local integration fixture: Supabase's real SDK speaks HTTP to PostgreSQL.
// This implements only the PostgREST operations exercised by this application.
// It is never used by the running product or a deployed Supabase project.
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { randomUUID, randomInt } from "node:crypto";
import {
  INITIAL_QUESTIONS,
  INITIAL_KNOWLEDGE_CHUNKS,
} from "../../src/lib/db/initial-seed";
import bcrypt from "bcryptjs";
const tables = new Set([
  "avs_schema_versions",
  "avs_users",
  "avs_students",
  "avs_curriculum",
  "avs_questions",
  "avs_quiz_sessions",
  "avs_progress",
  "avs_activity",
  "avs_bookmarks",
  "avs_announcements",
  "avs_audit_logs",
  "avs_revoked_sessions",
  "avs_rate_limits",
  "learning_resources",
  "textbooks",
]);
function identifier(value: string) {
  if (!/^[a-z_]+$/.test(value)) throw new Error("Invalid SQL identifier");
  return '"' + value + '"';
}
export async function startPostgrestFixture(
  port = 0,
  seedDemo = false,
  options: { requirePhoneNameMetadata?: boolean } = {},
) {
  const db = new PGlite();
  await db.exec(
    "create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261006_learning_resources.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile("supabase/migrations/20261006_student_backend.sql", "utf8"),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261007_account_directory.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile("supabase/migrations/20261007_textbook_library.sql", "utf8"),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261008_learning_video_uploads.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile("supabase/migrations/20261007_first_login_otp.sql", "utf8"),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261007_material_library_uploads.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261007144717_admin_student_approval.sql",
      "utf8",
    ),
  );
  if (seedDemo) {
    await db.query("select public.avs_bootstrap_admin($1)", [
      JSON.stringify({
        id: "qa-admin",
        email: "qa-admin@example.test",
        role: "admin",
        passwordHash: await bcrypt.hash("QA-only-bootstrap-password", 10),
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ]);
    const hash = await bcrypt.hash("Student@2026", 10);
    for (const [stream, registerNumber] of [
      ["Computer Science", "QA-CS"],
      ["Biology", "QA-BIO"],
    ]) {
      const { rows } = await db.query<{ s: { id: string; userId: string } }>(
        "select public.avs_create_student($1,$2,$3) as s",
        [
          JSON.stringify({
            studentName: "Demo " + stream + " Student",
            registerNumber,
            studentPhone:
              stream === "Computer Science" ? "9000000001" : "9000000002",
            schoolName: "QA Test School",
            stream,
            academicYear: "2026-2027",
          }),
          hash,
          "qa-admin",
        ],
      );
      await db.query("select public.avs_verify_student_phone($1,$2,$3,$4)", [
        rows[0].s.userId,
        stream === "Computer Science" ? "9000000001" : "9000000002",
        randomUUID(),
        hash,
      ]);
      await db.query("select public.avs_change_password($1,$2,$2,false)", [
        rows[0].s.userId,
        hash,
      ]);
    }
    for (const data of INITIAL_QUESTIONS)
      await db.query(
        "insert into public.avs_questions(id,data) values($1,$2)",
        [data.id, JSON.stringify(data)],
      );
    for (const data of INITIAL_KNOWLEDGE_CHUNKS)
      await db.query(
        "insert into public.avs_curriculum(kind,id,data) values('knowledge',$1,$2)",
        [data.id, JSON.stringify(data)],
      );
  }
  const files = new Map<string, { bytes: Buffer; contentType: string }>();
  const otps = new Map<
    string,
    { code: string; expiresAt: number; authId: string }
  >();
  let otpFailure: { code: string; status: number } | undefined;
  const server = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    const send = (status: number, body: unknown) => {
      response.statusCode = status;
      response.end(body === undefined ? undefined : JSON.stringify(body));
    };
    try {
      const url = new URL(request.url!, "http://localhost");
      const parts = url.pathname.split("/");
      if (
        request.method === "GET" &&
        url.pathname.startsWith("/storage/v1/object/public/")
      ) {
        const stored = files.get(parts.slice(5).join("/"));
        if (!stored) return send(404, { message: "Object not found" });
        response.statusCode = 200;
        response.setHeader("Content-Type", stored.contentType);
        response.end(stored.bytes);
        return;
      }
      if (request.headers.apikey !== "qa-service-key")
        return send(401, { message: "Test service key required" });
      // This inspection route exists only in the local fixture, never the app.
      if (url.pathname === "/auth/v1/settings" && request.method === "GET")
        return send(200, { external: { phone: true }, sms_provider: "twilio" });
      if (url.pathname === "/_qa/otp") {
        const otp = otps.get(url.searchParams.get("phone") || "");
        if (request.method === "DELETE" && otp) otp.expiresAt = 0;
        return otp
          ? send(200, { code: otp.code })
          : send(404, { message: "No test SMS" });
      }
      if (
        url.pathname === "/auth/v1/otp" ||
        url.pathname === "/auth/v1/verify"
      ) {
        response.setHeader("X-Supabase-Api-Version", "2024-01-01");
        let raw = "";
        for await (const chunk of request) raw += chunk.toString();
        const body = JSON.parse(raw);
        if (url.pathname.endsWith("/otp")) {
          if (otpFailure)
            return send(otpFailure.status, {
              code: otpFailure.code,
              msg: "Fixture SMS provider failure",
            });
          if (options.requirePhoneNameMetadata && !body.data?.name)
            return send(500, {
              code: "unexpected_failure",
              msg: "Database error creating new user",
            });
          otps.set(body.phone, {
            code: String(randomInt(100000, 1000000)),
            expiresAt: Date.now() + 300000,
            authId: randomUUID(),
          });
          return send(200, {});
        }
        const otp = otps.get(body.phone);
        if (
          !otp ||
          otp.expiresAt <= Date.now() ||
          otp.code !== body.token ||
          body.type !== "sms"
        )
          return send(403, {
            code: "otp_expired",
            msg: "Incorrect or expired OTP",
          });
        otps.delete(body.phone);
        const user = {
          id: otp.authId,
          aud: "authenticated",
          role: "authenticated",
          phone: body.phone,
          phone_confirmed_at: new Date().toISOString(),
          user_metadata: {},
          app_metadata: {},
          created_at: new Date().toISOString(),
        };
        const jwt =
          Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
            "base64url",
          ) +
          "." +
          Buffer.from(
            JSON.stringify({
              sub: user.id,
              exp: Math.floor(Date.now() / 1000) + 3600,
            }),
          ).toString("base64url") +
          ".fixture-signature";
        return send(200, {
          user,
          access_token: jwt,
          refresh_token: "fixture-refresh",
          token_type: "bearer",
          expires_in: 3600,
        });
      }
      if (
        request.method === "GET" &&
        url.pathname.startsWith("/storage/v1/bucket/")
      ) {
        const bucket = (
          await db.query("select * from storage.buckets where id=$1", [
            parts[4],
          ])
        ).rows[0];
        return bucket
          ? send(200, bucket)
          : send(404, { message: "Bucket not found" });
      }
      if (
        request.method === "POST" &&
        url.pathname.startsWith("/storage/v1/object/")
      ) {
        const bucket = (
          await db.query<{
            file_size_limit: number;
            allowed_mime_types: string[];
          }>(
            "select file_size_limit,allowed_mime_types from storage.buckets where id=$1",
            [parts[4]],
          )
        ).rows[0];
        if (!bucket) return send(404, { message: "Bucket not found" });
        const contentType = String(request.headers["content-type"] || "").split(
          ";",
        )[0];
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const bytes = Buffer.concat(chunks);
        if (
          !bucket.allowed_mime_types.includes(contentType) ||
          bytes.length > Number(bucket.file_size_limit)
        )
          return send(400, {
            message: "Bucket rejects this file type or size",
          });
        const key = parts.slice(4).join("/");
        if (files.has(key))
          return send(409, { message: "Object already exists" });
        files.set(key, { bytes, contentType });
        return send(200, { Key: key, Id: randomUUID() });
      }
      const name = parts[3] === "rpc" ? parts[4] : parts[3];
      let raw = "";
      for await (const chunk of request) raw += chunk.toString();
      const body = raw ? JSON.parse(raw) : undefined;
      if (parts[3] === "rpc") {
        if (!/^avs_[a-z_]+$/.test(name)) throw new Error("Unknown RPC");
        const keys = Object.keys(body || {});
        const result = await db.query<{ result: unknown }>(
          `select public.${identifier(name)}(${keys.map((key, index) => identifier(key) + " => $" + (index + 1)).join(",")}) as result`,
          keys.map((key) =>
            typeof body[key] === "object" && body[key] !== null
              ? JSON.stringify(body[key])
              : body[key],
          ),
        );
        return send(200, result.rows[0].result);
      }
      if (!tables.has(name)) throw new Error("Unknown table");
      const params: unknown[] = [];
      const clauses: string[] = [];
      for (const [key, value] of url.searchParams) {
        if (
          [
            "select",
            "order",
            "offset",
            "limit",
            "on_conflict",
            "columns",
          ].includes(key)
        )
          continue;
        const dot = value.indexOf(".");
        const operator = value.slice(0, dot);
        const operand = value.slice(dot + 1);
        if (!["eq", "gt", "gte"].includes(operator))
          throw new Error("Unsupported filter");
        params.push(operand);
        clauses.push(
          identifier(key) +
            { eq: "=", gt: ">", gte: ">=" }[operator] +
            "$" +
            params.length,
        );
      }
      const where = clauses.length ? " where " + clauses.join(" and ") : "";
      if (request.method === "GET" || request.method === "HEAD") {
        const selected = (url.searchParams.get("select") || "*")
          .split(",")
          .map((value) => (value === "*" ? "*" : identifier(value)))
          .join(",");
        const order = (url.searchParams.get("order") || "")
          .split(",")
          .filter(Boolean)
          .map((value) => {
            const [column, direction] = value.split(".");
            return (
              identifier(column) + (direction === "desc" ? " desc" : " asc")
            );
          })
          .join(",");
        const result = await db.query(
          `select ${selected} from public.${identifier(name)}${where}${order ? " order by " + order : ""} limit ${Math.min(1000, Number(url.searchParams.get("limit") || 1000))} offset ${Math.max(0, Number(url.searchParams.get("offset") || 0))}`,
          params,
        );
        if (String(request.headers.accept).includes("vnd.pgrst.object")) {
          if (result.rows.length !== 1)
            return send(406, {
              code: "PGRST116",
              message: "Expected one row",
              details: `The result contains ${result.rows.length} rows`,
            });
          return send(200, result.rows[0]);
        }
        return send(200, result.rows);
      }
      if (request.method === "POST") {
        const rows = Array.isArray(body) ? body : [body];
        const result: unknown[] = [];
        const pk: { [key: string]: string[] } = {
          avs_curriculum: ["kind", "id"],
          avs_progress: ["student_id", "chapter_id"],
          avs_activity: ["student_id", "kind", "resource_id"],
          avs_bookmarks: ["owner_id", "content_type", "content_id"],
          avs_rate_limits: ["key"],
          avs_schema_versions: ["version"],
        };
        for (const row of rows) {
          const keys = Object.keys(row);
          const conflict = (
            url.searchParams.get("on_conflict")?.split(",") ||
            pk[name] || ["id"]
          )
            .map(identifier)
            .join(",");
          const updates = keys
            .map((key) => identifier(key) + "=excluded." + identifier(key))
            .join(",");
          const ignore = String(request.headers.prefer).includes(
            "resolution=ignore-duplicates",
          );
          const saved = await db.query(
            `insert into public.${identifier(name)}(${keys.map(identifier).join(",")}) values(${keys.map((_, index) => "$" + (index + 1)).join(",")}) on conflict(${conflict}) do ${ignore ? "nothing" : "update set " + updates} returning *`,
            keys.map((key) =>
              typeof row[key] === "object" && row[key] !== null
                ? JSON.stringify(row[key])
                : row[key],
            ),
          );
          result.push(...saved.rows);
        }
        return send(
          201,
          String(request.headers.prefer).includes("return=representation")
            ? result
            : undefined,
        );
      }
      if (request.method === "DELETE") {
        await db.query(
          `delete from public.${identifier(name)}${where}`,
          params,
        );
        return send(200, undefined);
      }
      return send(405, { message: "Unsupported method" });
    } catch (error) {
      const e = error as { message?: string; code?: string };
      send(400, {
        message: e.message || "Fixture failure",
        code: e.code || "QA_ERROR",
      });
    }
  });
  await new Promise<void>((resolve) =>
    server.listen(port, "127.0.0.1", resolve),
  );
  const address = server.address() as AddressInfo;
  return {
    db,
    url: `http://127.0.0.1:${address.port}`,
    setOtpFailure: (failure?: { code: string; status: number }) => {
      otpFailure = failure;
    },
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await db.close();
    },
  };
}
