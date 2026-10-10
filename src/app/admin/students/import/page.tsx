"use client";

import Sidebar from "@/components/layout/Sidebar";
import { csvCell, parseRosterCsv } from "@/lib/csv";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { useState } from "react";

export default function BulkStudentImportPage() {
  const [csvContent, setCsvContent] = useState<string>(
    "student_name,register_number,school_name,stream,student_email,student_phone\n",
  );

  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    importedCount: number;
    skippedCount: number;
    importedStudents: Array<{
      studentId: string;
      studentName: string;
      registerNumber: string;
      stream: string;
      temporaryPassword: string;
      schoolName: string;
    }>;
    skippedDetails: Array<{
      registerNumber: string;
      studentName: string;
      reason: string;
    }>;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const parseAndSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const rows = parseRosterCsv(csvContent);

      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        setLoading(false);
        return;
      }

      setImportResult(data);
    } catch {
      setError("Check the CSV column names and quoted fields, then try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadGeneratedRoster = () => {
    if (!importResult || importResult.importedStudents.length === 0) return;
    const header =
      "Student ID,Student Name,Register Number,Stream,Temporary Password,School\n";
    const body = importResult.importedStudents
      .map((s) =>
        [
          s.studentId,
          s.studentName,
          s.registerNumber,
          s.stream,
          s.temporaryPassword,
          s.schoolName,
        ]
          .map(csvCell)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `AVS_Generated_Credentials_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex bg-[#F8FAFC]">
      <Sidebar isAdmin={true} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-[#2563EB] mb-2 border border-blue-200">
            <Upload className="w-3.5 h-3.5" />
            <span>Automated Bulk Account Generation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#071A3D]">
            Bulk Student CSV / XLSX Import
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Upload or paste student roster. The system automatically performs
            duplicate checks, assigns sequential IDs (
            <code className="text-[#2563EB] font-bold">AVSCS26-XXXX</code> /{" "}
            <code className="text-emerald-600 font-bold">AVSBIO26-XXXX</code>),
            hashes temporary passwords, and produces an exportable credential
            sheet for distribution.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <label className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-navy">
          Upload a CSV or XLSX roster
          <input
            type="file"
            accept=".csv,.xlsx"
            className="mt-3 block min-h-11 w-full text-xs"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setError(null);
              try {
                if (file.size > 2 * 1024 * 1024)
                  throw new Error("Use a roster under 2 MB.");
                if (file.name.toLowerCase().endsWith(".xlsx")) {
                  const { default: ExcelJS } = await import("exceljs");
                  const workbook = new ExcelJS.Workbook();
                  await workbook.xlsx.load(await file.arrayBuffer());
                  const sheet = workbook.getWorksheet("Students") || workbook.worksheets[0];
                  if (!sheet || sheet.rowCount > 501)
                    throw new Error("Use a sheet with 1–500 student records.");
                  const lines: string[] = [];
                  sheet.eachRow((row) => {
                    const cells: string[] = [];
                    for (let i = 1; i <= sheet.columnCount; i++)
                      cells.push(
                        '"' + row.getCell(i).text.replaceAll('"', '""') + '"',
                      );
                    lines.push(cells.join(","));
                  });
                  setCsvContent(lines.join("\n"));
                } else setCsvContent(await file.text());
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Could not read the roster.",
                );
              }
            }}
          />
          <span className="mt-2 block text-xs font-normal text-slate-500">
            Review the loaded records below before importing. Only use
            school-approved student data.
          </span>
        </label>
        {/* Input Textarea Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold text-slate-700">
                Paste or Edit CSV Records:
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Comma Separated format
            </span>
          </div>

          <textarea
            rows={8}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="w-full font-mono text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:outline-none leading-relaxed text-slate-800"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-500">
              Expected fields:{" "}
              <code className="font-bold">
                student_name, register_number, school_name, stream
              </code>
            </span>
            <button
              onClick={parseAndSubmit}
              disabled={loading}
              className="w-full sm:w-auto touch-target px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span>Generating Credentials & Hashes...</span>
              ) : (
                <>
                  <span>Process Bulk Import</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Results Table */}
        {importResult && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-[#071A3D]">
                    Successfully Imported {importResult.importedCount} Student
                    Accounts
                  </h3>
                  <p className="text-xs text-slate-500">
                    {importResult.skippedCount} skipped due to duplicates or
                    missing fields.
                  </p>
                </div>
              </div>

              <button
                onClick={downloadGeneratedRoster}
                className="touch-target px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Generated Credentials CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Generated Login ID</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Register No.</th>
                    <th className="py-2.5 px-3">Stream</th>
                    <th className="py-2.5 px-3">One-Time Temp Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResult.importedStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                        {s.studentId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {s.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {s.registerNumber}
                      </td>
                      <td className="py-2.5 px-3">{s.stream}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-600 bg-amber-50/50">
                        {s.temporaryPassword}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Institutional Security Notice:</strong> Passwords have
                been securely hashed. Students will be forced to change this
                temporary password upon first login. Please export and share
                credentials securely.
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
