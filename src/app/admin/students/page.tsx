"use client";

import {
  filterUserDirectory,
  userDirectoryCsv,
  type DirectoryFilters,
} from "@/components/admin/user-directory";
import Sidebar from "@/components/layout/Sidebar";
import type { AdminUserData } from "@/lib/db";
import type { StudentActivationMode } from "@/lib/auth/activation";
import { isPhoneVerified } from "@/lib/auth/phone";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const initialFilters: DirectoryFilters = {
  search: "",
  role: "all",
  status: "all",
  stream: "all",
  medium: "all",
};

function displayDate(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export default function AdminStudentsPage() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<string | null>(null);
  const [activationMode, setActivationMode] =
    useState<StudentActivationMode | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<AdminUserData | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{
    user: AdminUserData;
    action: "toggle-status" | "reset-password" | "approve";
  } | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<{
    studentId: string;
    password: string;
  } | null>(null);

  const refresh = useCallback(() => {
    return fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load users.");
        return data;
      })
      .then((data) => {
        setUsers(data.users || []);
        setStorageMode(data.storageMode);
        setActivationMode(data.studentActivationMode);
      })
      .catch((error) =>
        setMessage({
          text:
            error instanceof Error ? error.message : "Could not load users.",
          error: true,
        }),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!selected && !pending) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setSelected(null);
        setPending(null);
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selected, pending, busy]);

  function setFilter(field: keyof DirectoryFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  }

  async function runAction() {
    if (!pending?.user.student) return;
    const { user, action } = pending;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/students/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.student!.id, action }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not update account.");
      if (action === "reset-password" || action === "approve")
        setTemporaryPassword({
          studentId: user.student!.studentId,
          password: data.temporaryPassword,
        });
      setMessage({
        text:
          action === "approve"
            ? "Student approved. Share the temporary password privately; they must change it at first sign-in."
            : action === "reset-password"
              ? "Password reset. The student must choose a new password at next sign-in."
              : `${user.student!.studentName}'s account is now ${user.student!.activeStatus ? "inactive" : "active"}.`,
      });
      setPending(null);
      setLoading(true);
      await refresh();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Action failed.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  const filtered = filterUserDirectory(users, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([userDirectoryCsv(filtered)], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    link.download = `AVS_Users_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-1">
      <Sidebar isAdmin />
      <main className="workspace min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">ADMINISTRATION</span>
            <h1 className="page-title">All users</h1>
            <p className="page-description">
              Student and administrator accounts, contact details, and learning
              activity in one directory.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              disabled={loading || !filtered.length}
              onClick={exportCsv}
            >
              <Download size={16} /> Export CSV
            </button>
            <Link href="/admin/students/import" className="btn-secondary">
              <Upload size={16} /> Bulk import
            </Link>
            <Link href="/admin/students/create" className="btn-primary">
              <UserPlus size={16} /> Add student
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["All accounts", users.length],
            [
              "Active students",
              users.filter((u) => u.student?.activeStatus).length,
            ],
            ["Administrators", users.filter((u) => u.role === "admin").length],
          ].map(([label, count]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-navy">
                {loading && !users.length ? "—" : count}
              </p>
            </div>
          ))}
        </div>
        {storageMode === "demo" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Demo accounts use temporary memory storage. Connect Supabase to save
            real accounts and learning records.
          </p>
        )}
        {storageMode === "supabase" && (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={16} /> User records are loaded from Supabase.
          </p>
        )}
        {message && (
          <div
            role={message.error ? "alert" : "status"}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${message.error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
          >
            <span>{message.text}</span>
            {message.error && (
              <button
                disabled={loading}
                className="btn-secondary text-xs"
                onClick={() => {
                  setMessage(null);
                  setLoading(true);
                  void refresh();
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}
        {temporaryPassword && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <div className="flex items-center justify-between gap-3">
              <strong>
                New temporary password for {temporaryPassword.studentId}
              </strong>
              <button
                className="model-control"
                aria-label="Dismiss temporary password"
                onClick={() => setTemporaryPassword(null)}
              >
                <X size={16} />
              </button>
            </div>
            <code className="my-3 block select-all break-all rounded-lg bg-white p-3 text-base">
              {temporaryPassword.password}
            </code>
            <p className="text-xs leading-5">
              Share this privately with the student. It is shown only for this
              reset and never included in the directory export.
            </p>
          </div>
        )}
        <div className="content-form grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            Search users
            <div className="relative mt-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                className="!pl-9"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Name, email, phone, school, or ID"
              />
            </div>
          </label>
          <label>
            Role
            <select
              value={filters.role}
              onChange={(e) => setFilter("role", e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="admin">Administrators</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            Stream
            <select
              value={filters.stream}
              onChange={(e) => setFilter("stream", e.target.value)}
            >
              <option value="all">All streams</option>
              <option>Computer Science</option>
              <option>Biology</option>
            </select>
          </label>
          <label>
            Medium
            <select
              value={filters.medium}
              onChange={(e) => setFilter("medium", e.target.value)}
            >
              <option value="all">All mediums</option>
              <option>English</option>
              <option>Tamil</option>
            </select>
          </label>
        </div>
        <section
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          aria-label="User data table"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <p className="text-sm font-semibold text-navy">
              {filtered.length} matching{" "}
              {filtered.length === 1 ? "account" : "accounts"}
            </p>
            <button
              className="btn-secondary text-xs"
              disabled={loading || busy}
              onClick={() => {
                setMessage(null);
                setLoading(true);
                void refresh();
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          </div>
          {loading && !users.length ? (
            <div className="empty-state" role="status">
              Loading user data…
            </div>
          ) : !visible.length ? (
            <div className="empty-state">
              <Users size={32} className="mx-auto text-blue-400" />
              <h2>
                {users.length
                  ? "No users match these filters."
                  : "No accounts to display."}
              </h2>
              <p>
                {users.length
                  ? "Try another search or clear the filters."
                  : "Add a student or check your database connection."}
              </p>
              {users.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setFilters(initialFilters);
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div
              className="overflow-x-auto"
              tabIndex={0}
              aria-label="Scroll to see all user columns"
            >
              <table className="min-w-[1500px] w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <tr>
                    {[
                      "Account / name",
                      "Contact",
                      "Register number",
                      "School",
                      "Stream / medium",
                      "Academic year",
                      "Status",
                      "Password change",
                      "Learning activity",
                      "Created / updated",
                      "Actions",
                    ].map((heading) => (
                      <th
                        scope="col"
                        key={heading}
                        className="whitespace-nowrap px-4 py-3 font-semibold"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((user) => {
                    const student = user.student;
                    const active =
                      user.role === "admin" || student?.activeStatus;
                    const needsApproval = Boolean(
                      student &&
                      activationMode === "admin" &&
                      !(student.adminApprovedAt && student.adminApprovedBy) &&
                      !isPhoneVerified(student),
                    );
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-4">
                          <strong className="block text-sm text-navy">
                            {student?.studentName || "Administrator"}
                          </strong>
                          <span className="mt-1 block font-mono text-blue-600">
                            {student?.studentId || user.email}
                          </span>
                          <span className="mt-1 block capitalize text-slate-500">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <span className="block">
                            {student?.studentEmail || user.email || "—"}
                          </span>
                          <span className="mt-1 block">
                            {student?.studentPhone || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-600">
                          {student?.registerNumber || "—"}
                        </td>
                        <td className="max-w-56 px-4 py-4 text-slate-600">
                          {student?.schoolName || "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          <span className="block">
                            {student?.stream || "—"}
                          </span>
                          <span className="mt-1 block text-slate-500">
                            {student?.medium || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {student?.academicYear || "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`status-pill ${active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                          >
                            {active
                              ? needsApproval
                                ? "Awaiting approval"
                                : "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {user.mustChangePassword ||
                          student?.mustChangePassword
                            ? "Required"
                            : "Complete"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {user.learning ? (
                            <>
                              <span className="block">
                                {user.learning.quizAttempts} quizzes ·{" "}
                                {user.learning.averageScore}% average
                              </span>
                              <span className="mt-1 block">
                                {user.learning.mcqsAttempted} MCQs ·{" "}
                                {user.learning.notesViewed} notes ·{" "}
                                {user.learning.videosWatched} videos
                              </span>
                              <span className="mt-1 block text-slate-400">
                                {user.learning.bookmarksCount} bookmarks · Last:{" "}
                                {displayDate(user.learning.lastActiveAt)}
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          <span className="block">
                            {displayDate(user.createdAt)}
                          </span>
                          <span className="mt-1 block text-slate-400">
                            {displayDate(user.updatedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <button
                              className="model-control"
                              aria-label={`View ${student?.studentName || user.email}`}
                              title="View all details"
                              onClick={() => setSelected(user)}
                            >
                              <Eye size={16} />
                            </button>
                            {student && (
                              <>
                                {needsApproval && (
                                  <button
                                    disabled={busy || loading || !active}
                                    className="model-control text-blue-700"
                                    aria-label={`Approve ${student.studentName}`}
                                    title="Approve student and issue temporary password"
                                    onClick={() =>
                                      setPending({ user, action: "approve" })
                                    }
                                  >
                                    <ShieldCheck size={16} />
                                  </button>
                                )}
                                <button
                                  disabled={busy || loading}
                                  className="model-control"
                                  aria-label={`Reset password for ${student.studentName}`}
                                  title="Reset password"
                                  onClick={() =>
                                    setPending({
                                      user,
                                      action: "reset-password",
                                    })
                                  }
                                >
                                  <RotateCcw size={16} />
                                </button>
                                <button
                                  disabled={busy || loading}
                                  className={`model-control ${active ? "text-rose-600" : "text-emerald-600"}`}
                                  aria-label={`${active ? "Deactivate" : "Reactivate"} ${student.studentName}`}
                                  title={
                                    active
                                      ? "Deactivate student"
                                      : "Reactivate student"
                                  }
                                  onClick={() =>
                                    setPending({
                                      user,
                                      action: "toggle-status",
                                    })
                                  }
                                >
                                  <Power size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs text-slate-500">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                className="rounded-lg border border-slate-200 bg-white p-2"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[25, 50, 100].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="model-control"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="model-control"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
        <p className="text-xs leading-5 text-slate-500">
          Scroll the table horizontally to view every column. CSV exports
          include all matching users, across every page. Dates use India
          Standard Time.
        </p>
      </main>
      {selected && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/40 p-4"
          onClick={() => setSelected(null)}
        >
          <section
            className="my-4 max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2
                id="user-details-title"
                className="text-lg font-bold text-navy"
              >
                {selected.student?.studentName || "Administrator"}
              </h2>
              <button
                className="model-control"
                aria-label="Close user details"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["Account ID", selected.id],
                ["Role", selected.role],
                ["Login email", selected.email],
                ["Student record ID", selected.student?.id],
                ["Student ID", selected.student?.studentId],
                ["Contact email", selected.student?.studentEmail],
                ["Phone", selected.student?.studentPhone],
                [
                  "Administrator approval",
                  selected.student?.adminApprovedAt
                    ? displayDate(selected.student.adminApprovedAt)
                    : "Not approved",
                ],
                ["Approved by", selected.student?.adminApprovedBy],
                [
                  "Phone ownership verified",
                  selected.student && isPhoneVerified(selected.student)
                    ? "Yes"
                    : "No",
                ],
                ["Register number", selected.student?.registerNumber],
                ["School", selected.student?.schoolName],
                ["Stream", selected.student?.stream],
                ["Medium", selected.student?.medium],
                [
                  "Standard",
                  selected.student
                    ? selected.student.standard || "12th Standard"
                    : undefined,
                ],
                ["Academic year", selected.student?.academicYear],
                ["Profile photo URL", selected.student?.profilePhoto],
                [
                  "Status",
                  selected.role === "admin" || selected.student?.activeStatus
                    ? "Active"
                    : "Inactive",
                ],
                [
                  "Password change required",
                  selected.mustChangePassword ||
                  selected.student?.mustChangePassword
                    ? "Yes"
                    : "No",
                ],
                ["Created", displayDate(selected.createdAt)],
                ["Student created", displayDate(selected.student?.createdAt)],
                ["Updated", displayDate(selected.updatedAt)],
                ["Completed quizzes", selected.learning?.quizAttempts],
                ["MCQs attempted", selected.learning?.mcqsAttempted],
                [
                  "Average score",
                  selected.learning
                    ? `${selected.learning.averageScore}%`
                    : undefined,
                ],
                ["Notes viewed", selected.learning?.notesViewed],
                ["Videos watched", selected.learning?.videosWatched],
                ["Bookmarks", selected.learning?.bookmarksCount],
                [
                  "Last learning activity",
                  displayDate(selected.learning?.lastActiveAt),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words font-semibold text-navy">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
      {pending && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-action-title"
          className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4"
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2
              id="account-action-title"
              className="text-lg font-bold text-navy"
            >
              {pending.action === "approve"
                ? "Approve student account?"
                : pending.action === "reset-password"
                  ? "Reset student password?"
                  : pending.user.student?.activeStatus
                    ? "Deactivate student account?"
                    : "Reactivate student account?"}
            </h2>
            <p className="my-4 text-sm leading-6 text-slate-600">
              {pending.user.student?.studentName} (
              {pending.user.student?.studentId}).{" "}
              {pending.action === "approve"
                ? "Confirm you have reviewed this student's identity. A temporary password will be generated for you to share privately. Their first sign-in requires a password change."
                : pending.action === "reset-password"
                  ? "Their current password will stop working. A temporary password will be generated for you to share privately."
                  : pending.user.student?.activeStatus
                    ? "The student will lose access to the learning portal until you reactivate their account."
                    : "The student will be able to sign in again."}
            </p>
            {message?.error && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
              >
                {message.text}
              </p>
            )}
            <div className="flex gap-3">
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() => setPending(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => void runAction()}
              >
                {busy ? "Updating…" : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
