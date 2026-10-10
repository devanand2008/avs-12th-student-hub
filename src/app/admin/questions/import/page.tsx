"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { parseQuestionCsv } from "@/lib/question-import";
import { csvCell } from "@/lib/csv";
import type { Subject, Chapter } from "@/types";
const header =
  "chapter_id,question,option_a,option_b,option_c,option_d,correct_answer,explanation,source_type,difficulty";

export default function ImportQuestionsPage() {
  const [content, setContent] = useState(header + "\n");
  const [subjects, setSubjects] = useState<
    (Subject & { chapters: Chapter[] })[]
  >([]);
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/subjects?library=all")
      .then((r) => r.json())
      .then((data) => {
        setSubjects(data.subjects || []);
        setSubjectId(data.subjects?.[0]?.id || "");
      })
      .catch(() => setError("Could not load chapters."));
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Use a spreadsheet smaller than 2 MB.");
      if (/\.csv$/i.test(file.name)) setContent(await file.text());
      else if (/\.xlsx$/i.test(file.name)) {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet =
          workbook.getWorksheet("Questions") || workbook.worksheets[0];
        if (!sheet || sheet.rowCount > 101 || sheet.columnCount > 12)
          throw new Error(
            "Use the template columns and at most 100 questions.",
          );
        const lines: string[] = [];
        sheet.eachRow((row) => {
          const fields: string[] = [];
          for (let i = 1; i <= sheet.columnCount; i++) {
            if (row.getCell(i).formula)
              throw new Error("Use plain values in the spreadsheet.");
            fields.push(csvCell(row.getCell(i).text));
          }
          lines.push(fields.join(","));
        });
        setContent(lines.join("\n"));
      } else throw new Error("Choose a CSV or XLSX spreadsheet.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not read the spreadsheet.",
      );
    }
  }
  function template() {
    const id =
      subjects.find((s) => s.id === subjectId)?.chapters[0]?.id || "cs-ch-1";
    const sample = [
      id,
      "Replace this sample with your reviewed question",
      "First option",
      "Second option",
      "Third option",
      "Fourth option",
      "B",
      "Explain why this answer is correct",
      "Book-In",
      "Medium",
    ]
      .map(csvCell)
      .join(",");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + header + "\n" + sample], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "SkillUp_Questions_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const rows = parseQuestionCsv(content);
      const response = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        `${data.imported} questions published; ${data.skipped} existing questions skipped.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import questions.");
    } finally {
      setBusy(false);
    }
  }
  const subject = subjects.find((s) => s.id === subjectId);
  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1 space-y-5">
        <Link href="/admin/questions" className="text-blue-700 underline">
          Back to question bank
        </Link>
        <h1 className="page-title">Import reviewed MCQs</h1>
        <p className="text-sm text-slate-600">
          Upload CSV or Excel (.xlsx), or paste the template below. Check each
          answer before importing. Up to 100 questions are saved together;
          importing the same question again skips the duplicate.
        </p>
        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <label className="block">
            Subject
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-secondary" onClick={template}>
            Download CSV template
          </button>
          <details>
            <summary className="cursor-pointer font-semibold">
              Copy chapter IDs for this subject
            </summary>
            <ul className="mt-2 space-y-2 text-sm">
              {subject?.chapters.map((ch) => (
                <li key={ch.id}>
                  {ch.chapterNumber}. {ch.title} —{" "}
                  <code className="break-all">{ch.id}</code>
                </li>
              ))}
            </ul>
          </details>
          <label className="block">
            Question spreadsheet
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </label>
          <label className="block">
            Question CSV
            <textarea
              className="font-mono text-xs"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-rose-700">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-emerald-700">
              {message}
            </p>
          )}
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Importing…" : "Import and publish reviewed questions"}
          </button>
        </section>
      </main>
    </div>
  );
}
