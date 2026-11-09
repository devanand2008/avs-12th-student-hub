import type { Metadata } from "next";
import { resourceCategories, visibleResources } from "./study-resources";

export const SITE_URL = "https://avs-12th-student-hub.vercel.app";
export const SEO_BRAND = "joshuaskillup";
// Supporting terms describe available content. Google does not rank meta keywords.
export const SEO_KEYWORDS = [
  SEO_BRAND,
  "Joshua Skill Up",
  "SkillUp Education",
  "Tamil Nadu Class 12 study materials",
  "Samacheer Kalvi 12th standard",
  "Class 12 book-back one-mark questions",
  "12th MCQ practice",
  "12th handwritten notes",
  "Tamil medium Class 12 textbooks",
  "English medium Class 12 textbooks",
  "NotebookLM video lessons",
  "Class 12 Biology 3D models",
  "Class 12 Physics 3D models",
  "Class 12 Chemistry 3D models",
  "Class 12 Mathematics references",
  "Class 12 Computer Science",
  "AI study tools Tamil and English",
  "12ஆம் வகுப்பு பாடநூல்கள்",
  "12ஆம் வகுப்பு பாடக்குறிப்புகள்",
  "பன்னிரண்டாம் வகுப்பு தேர்வு பயிற்சி",
];
export const seoPages = {
  "/": {
    title: "joshuaskillup | Tamil Nadu 12th Notes & MCQ Practice",
    description:
      "joshuaskillup: Tamil Nadu Class 12 notes, book-back MCQ practice, Tamil and English textbooks, video lessons and interactive 3D learning models.",
  },
  "/resources": {
    title: "Class 12 Study Resources & Question Papers",
    description:
      "Explore Tamil Nadu Class 12 study materials, question-paper collections, textbooks and subject video lessons with original source links on joshuaskillup.",
  },
  "/models": {
    title: "Class 12 3D Models & Learning Lab",
    description:
      "Learn Biology, Physics and Chemistry with interactive 3D models on joshuaskillup. Explore guided Mathematics and computing visuals with clear explanations.",
  },
  "/ai-study-tools": {
    title: "AI Study Tools for Tamil Nadu Class 12",
    description:
      "Find free and limited-access AI study tools, maths tools and science simulations on joshuaskillup. Build English or Tamil subject and chapter study prompts.",
  },
  "/textbooks": {
    title: "Tamil Nadu Class 12 Textbooks in Tamil & English",
    description:
      "Browse available Samacheer Kalvi Class 12 textbooks by subject, volume and medium on joshuaskillup. Find Tamil and English editions with an in-site reader.",
  },
  "/resources/guides": {
    title: "Open PDF References for Class 12",
    description:
      "Read authorised open educational PDF references for Mathematics, Statistics and Biology on joshuaskillup. See original sources, licences and subject availability.",
  },
} as const;

export function publicMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  const url = new URL(path, SITE_URL).href;
  const brandedTitle = title.toLowerCase().includes(SEO_BRAND)
    ? title
    : `${title} | ${SEO_BRAND}`;
  return {
    title: { absolute: brandedTitle },
    description,
    keywords: SEO_KEYWORDS,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url,
      siteName: SEO_BRAND,
      title: brandedTitle,
      description,
      locale: "en_IN",
      alternateLocale: ["ta_IN"],
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "joshuaskillup — Skill Up Tamil Nadu Class 12 learning resources",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}
export function pageMetadata(path: keyof typeof seoPages): Metadata {
  const page = seoPages[path];
  return publicMetadata(path, page.title, page.description);
}
export const privateMetadata: Metadata = {
  robots: { index: false, follow: false },
};
export const searchableResources = visibleResources.filter(
  (r) => r.status === "listed",
);
export function publicSearchPaths() {
  return [
    ...Object.keys(seoPages),
    "/resources/all",
    ...resourceCategories.map((c) => `/resources/${c.id}`),
    ...searchableResources.map((r) => `/resources/item/${r.id}`),
  ];
}
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SEO_BRAND,
  alternateName: ["Skill Up", "Joshua Skill Up", "SkillUp Learning Hub"],
  description: seoPages["/"].description,
  inLanguage: ["en", "ta"],
};
