import type { Book, Chapter, Subject } from "@/types";

export const LEARNING_UPLOAD_LIMIT = 50 * 1024 * 1024;

export const MATERIAL_SUBJECTS: Subject[] = [
  {
    id: "sub-maths",
    streamId: "Common",
    name: "Mathematics",
    code: "MAT-12",
    icon: "calculator",
    description:
      "Class 12 Mathematics notes and worked exercises for both streams.",
    orderIndex: 4,
    totalChapters: 12,
  },
  {
    id: "sub-tamil",
    streamId: "Common",
    name: "Tamil",
    code: "TAM-12",
    icon: "book",
    description: "Tamil language video lessons for both streams.",
    orderIndex: 5,
    totalChapters: 5,
  },
];
export const MATERIAL_BOOKS: Book[] = [
  {
    id: "book-maths",
    subjectId: "sub-maths",
    name: "Mathematics - Standard 12",
    volume: "Volumes I & II",
    description: "Mathematics chapter notes and worked exercises.",
    orderIndex: 1,
  },
  {
    id: "book-tamil",
    subjectId: "sub-tamil",
    name: "Tamil - Video Lesson Collection",
    volume: "Language lessons",
    description:
      "The supplied Tamil videos, organised by their on-screen lesson titles.",
    orderIndex: 1,
  },
];
const mathsTitles = [
  "Applications of Matrices and Determinants",
  "Complex Numbers",
  "Theory of Equations",
  "Inverse Trigonometric Functions",
  "Two Dimensional Analytical Geometry",
  "Applications of Vector Algebra",
  "Applications of Differential Calculus",
  "Differentials and Partial Derivatives",
  "Applications of Integration",
  "Ordinary Differential Equations",
  "Probability Distributions",
  "Discrete Mathematics",
];
const tamilTitles = [
  ["Ilantamizhe!", "இளந்தமிழே!"],
  ["Thanner Ilatha Tamil", "தன்னேர் இலாத தமிழ்"],
  ["Tamilmozhiyin Nadai Azhagiyal", "தமிழ்மொழியின் நடை அழகியல்"],
  ["Thambi Nellaiyapparukku", "தம்பி நெல்லையப்பருக்கு"],
  ["Tamizhai Ezhuthuvom", "தமிழாய் எழுதுவோம்"],
];
function chapter(
  subject: string,
  number: number,
  title: string,
  titleTamil = "",
): Chapter {
  return {
    id: `${subject}-ch-${number}`,
    subjectId: `sub-${subject}`,
    bookId: `book-${subject}`,
    chapterNumber: number,
    title,
    titleTamil,
    description:
      subject === "tamil"
        ? "Tamil video lesson: " + titleTamil
        : "Class 12 Mathematics: " + title,
    totalNotes: 0,
    totalVideos: 0,
    totalMcqs: 0,
    isActive: true,
    orderIndex: number,
  };
}
export const MATERIAL_CHAPTERS: Chapter[] = [
  ...mathsTitles.map((title, index) => chapter("maths", index + 1, title)),
  ...tamilTitles.map(([title, tamil], index) =>
    chapter("tamil", index + 1, title, tamil),
  ),
];

export interface SourceMaterial {
  file: string;
  kind: "note" | "video";
  chapterId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  titleTamil?: string;
  topic: string;
  language: "English" | "Tamil";
}
function maths(
  file: string,
  number: number,
  detail = "Handwritten Notes",
): SourceMaterial {
  const topic = mathsTitles[number - 1];
  return {
    file: `maths/pdf/${file}`,
    kind: "note",
    chapterId: `maths-ch-${number}`,
    subjectId: "sub-maths",
    subjectName: "Mathematics",
    title: `Mathematics — Chapter ${number}: ${topic} — ${detail}`,
    topic,
    language: "English",
  };
}
function tamil(file: string, number: number): SourceMaterial {
  const [title, titleTamil] = tamilTitles[number - 1];
  return {
    file: `tamil/video/${file}`,
    kind: "video",
    chapterId: `tamil-ch-${number}`,
    subjectId: "sub-tamil",
    subjectName: "Tamil",
    title: `Tamil — ${title}`,
    titleTamil,
    topic: titleTamil,
    language: "Tamil",
  };
}
export const SOURCE_MATERIALS: SourceMaterial[] = [
  maths(
    "handwritten_exercises_1.5_to_1.8_complete (2).pdf",
    1,
    "Exercises 1.5–1.8",
  ),
  maths(
    "Chapter_3_Exercises_3.1_to_3.7_Handwritten_Ordered.pdf",
    3,
    "Exercises 3.1–3.7",
  ),
  maths("Inverse_Trigonometric_Functions_Handwritten_Notes.pdf", 4),
  ...[5, 6, 7, 8, 9, 10, 11, 12].map((number) =>
    maths(`Chapter_${number}_Handwritten_Notes.pdf`, number),
  ),
  {
    file: "bio/bio/pdf/12th_Bio_Botany_Combined_Ordered_Questions.pdf",
    kind: "note",
    chapterId: "bot-ch-4",
    subjectId: "sub-botany",
    subjectName: "Bio-Botany",
    title:
      "Bio-Botany — Principles and Processes of Biotechnology — Questions & Answers",
    topic: "Principles and Processes of Biotechnology",
    language: "English",
  },
  {
    file: "bio/bio/pdf/12th_Bio_Botany_Plant_Tissue_Culture_Combined_Ordered.pdf",
    kind: "note",
    chapterId: "bot-ch-5",
    subjectId: "sub-botany",
    subjectName: "Bio-Botany",
    title: "Bio-Botany — Plant Tissue Culture — Questions & Answers",
    topic: "Plant Tissue Culture",
    language: "English",
  },
  tamil("WhatsApp Video 2026-10-07 at 11.37.04.mp4", 1),
  tamil("WhatsApp Video 2026-10-07 at 11.37.04 (1).mp4", 2),
  tamil("WhatsApp Video 2026-10-07 at 11.37.05.mp4", 3),
  tamil("WhatsApp Video 2026-10-07 at 11.37.05 (1).mp4", 4),
  tamil("WhatsApp Video 2026-10-07 at 11.37.08.mp4", 5),
];
