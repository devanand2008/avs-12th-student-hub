import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import catalogJson from "../src/lib/textbooks-catalog.json";
import { filterTextbooks, type TextbookCatalog } from "../src/lib/textbooks";

const catalog = catalogJson as TextbookCatalog;

test("official textbook catalog covers subjects, volumes and both mediums with verifiable saved metadata", () => {
  assert.equal(
    new Set(catalog.books.map((book) => book.id)).size,
    catalog.books.length,
  );
  for (const subject of [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Accountancy",
    "History",
    "Basic Civil Engineering",
    "Computer Science",
    "Bio-Botany",
  ]) {
    for (const medium of ["Tamil", "English"]) {
      assert.ok(
        catalog.books.some(
          (book) => book.subject === subject && book.medium === medium,
        ),
        `${subject} ${medium} is missing`,
      );
    }
  }
  for (const subject of ["Physics", "Chemistry", "Mathematics"]) {
    for (const medium of ["Tamil", "English"]) {
      assert.deepEqual(
        catalog.books
          .filter((book) => book.subject === subject && book.medium === medium)
          .map((book) => book.volume)
          .sort(),
        ["1", "2"],
      );
    }
  }
  for (const book of catalog.books) {
    assert.equal(new URL(book.sourcePage).hostname, "scert.tnschools.gov.in");
    assert.equal(
      new URL(book.sourceUrl).hostname,
      "d1e5r329t7a85t.cloudfront.net",
    );
    assert.equal(book.edition, null, "The source has no verified edition year");
    if (book.status === "downloaded") {
      assert.match(book.localPath!, /^\/textbooks\/[a-z0-9-]+\.pdf$/);
      assert.match(book.sha256!, /^[a-f0-9]{64}$/);
      assert.ok(book.sizeBytes! > 10000);
      assert.ok(book.downloadedAt);
    } else {
      assert.equal(book.localPath, null);
    }
  }
});

test("medium and group filters preserve common language books while excluding opposite-medium science", () => {
  for (const medium of ["Tamil", "English"]) {
    const languageBooks = filterTextbooks(catalog.books, {
      medium,
      category: "Languages",
    });
    assert.deepEqual(languageBooks.map((book) => book.subject).sort(), [
      "Advanced Tamil",
      "Communicative English",
      "English",
      "Tamil",
    ]);
    const physics = filterTextbooks(catalog.books, {
      medium,
      search: "  PHYSICS  ",
    });
    assert.equal(physics.length, 2);
    assert.ok(
      physics.every(
        (book) => book.medium === medium && book.subject === "Physics",
      ),
    );
  }
  assert.equal(
    filterTextbooks(catalog.books, { category: "Commerce", search: "Physics" })
      .length,
    0,
  );
  assert.equal(
    filterTextbooks(catalog.books, { search: "unknown book name" }).length,
    0,
  );
});

test("textbook database migration restricts browser access and rejects unsafe paths or false download metadata", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role; create table avs_schema_versions(version text primary key);",
    );
    await db.exec(
      await readFile(
        "supabase/migrations/20261007_textbook_library.sql",
        "utf8",
      ),
    );
    const columns =
      "id,title,subject,medium,source_medium,category,source_title,source_file,source_url,source_page";
    const values =
      "'sample','Physics','Physics','Tamil','Tamil','Science','Physics.pdf','Physics.pdf','https://official.example/Physics.pdf','https://scert.tnschools.gov.in/textbook'";
    await db.exec(`insert into textbooks (${columns}) values (${values})`);
    await assert.rejects(
      db.exec(
        "update textbooks set local_path='/textbooks/../../private.pdf' where id='sample'",
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.exec("update textbooks set status='downloaded' where id='sample'"),
      /check constraint/,
    );
    const permissions = await db.query<{
      browser_read: boolean;
      browser_write: boolean;
      server_write: boolean;
    }>(
      "select has_table_privilege('authenticated','public.textbooks','select') browser_read, has_table_privilege('anon','public.textbooks','insert') browser_write, has_table_privilege('service_role','public.textbooks','insert') server_write",
    );
    assert.deepEqual(permissions.rows[0], {
      browser_read: false,
      browser_write: false,
      server_write: true,
    });
  } finally {
    await db.close();
  }
});
