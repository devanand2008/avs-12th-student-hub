import { csvCell } from "@/lib/csv";
import type { AdminUserData } from "@/lib/db";

export interface DirectoryFilters {
  search: string;
  role: string;
  status: string;
  stream: string;
  medium: string;
}

export function filterUserDirectory(
  users: AdminUserData[],
  filters: DirectoryFilters,
): AdminUserData[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return users.filter((user) => {
    const student = user.student;
    const active = user.role === "admin" || student?.activeStatus === true;
    if (filters.role !== "all" && user.role !== filters.role) return false;
    if (filters.status === "active" && !active) return false;
    if (filters.status === "inactive" && active) return false;
    if (filters.stream !== "all" && student?.stream !== filters.stream)
      return false;
    if (filters.medium !== "all" && student?.medium !== filters.medium)
      return false;
    return (
      !search ||
      [
        user.id,
        user.email,
        student?.id,
        student?.studentId,
        student?.studentName,
        student?.registerNumber,
        student?.schoolName,
        student?.studentEmail,
        student?.studentPhone,
        student?.academicYear,
      ].some((value) => value?.toLocaleLowerCase().includes(search))
    );
  });
}

export function userDirectoryCsv(users: AdminUserData[]): string {
  const columns = [
    "Account ID",
    "Role",
    "Student Record ID",
    "Student ID",
    "Name",
    "Login Email",
    "Contact Email",
    "Phone",
    "Register Number",
    "School",
    "Stream",
    "Medium",
    "Standard",
    "Academic Year",
    "Profile Photo",
    "Status",
    "Password Change Required",
    "Created At",
    "Student Created At",
    "Updated At",
    "Quiz Attempts",
    "MCQs Attempted",
    "Average Score (%)",
    "Notes Viewed",
    "Videos Watched",
    "Bookmarks",
    "Last Learning Activity",
  ];
  const rows = users.map((user) => {
    const student = user.student;
    const learning = user.learning;
    return [
      user.id,
      user.role,
      student?.id,
      student?.studentId,
      student?.studentName,
      user.email,
      student?.studentEmail,
      student?.studentPhone,
      student?.registerNumber,
      student?.schoolName,
      student?.stream,
      student?.medium,
      student?.standard || (student ? "12th Standard" : ""),
      student?.academicYear,
      student?.profilePhoto,
      user.role === "admin" || student?.activeStatus ? "Active" : "Inactive",
      user.mustChangePassword || student?.mustChangePassword ? "Yes" : "No",
      user.createdAt,
      student?.createdAt,
      user.updatedAt,
      learning?.quizAttempts,
      learning?.mcqsAttempted,
      learning?.averageScore,
      learning?.notesViewed,
      learning?.videosWatched,
      learning?.bookmarksCount,
      learning?.lastActiveAt,
    ]
      .map((value) => csvCell(String(value ?? "")))
      .join(",");
  });
  return "\uFEFF" + [columns.map(csvCell).join(","), ...rows].join("\r\n");
}
