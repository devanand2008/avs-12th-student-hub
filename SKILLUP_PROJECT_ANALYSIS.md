# SKILLUP 12TH STUDENT HUB — COMPLETE TECHNICAL ANALYSIS & AUDIT REPORT

**Project:** SkillUp – 12th Standard Learning Hub (AVS Engineering College, Salem)  
**Live Production URL:** https://avs-12th-student-hub.vercel.app/  
**Repository Reference:** https://github.com/devanand2008/avs-12th-student-hub  
**Audit Date:** November 9, 2026  
**Auditor:** Senior Full-Stack Developer & Software Architect  

---

## 1. Executive Summary

SkillUp (12th Standard Learning Hub) is an educational web platform specifically engineered for Tamil Nadu State Board Class 12 students in both Tamil and English mediums. The application provides digital textbooks, handwritten revision notes, lesson video streaming, one-mark MCQ question practice, interactive 3D science simulations, AI study tools, and an authenticated faculty/admin content management portal.

This technical analysis audits the existing codebase, local data masters, storage pipelines, security boundary, build configurations, and Vercel hosting integration.

---

## 2. Technical Stack Discovery

| Dimension | Discovered Implementation | Version / Details |
|---|---|---|
| **Frontend Framework** | Next.js (App Router, Turbopack default / Webpack fallback) | `16.4.3` |
| **UI Library** | React & React DOM | `19.2.8` |
| **Styling** | Tailwind CSS (v4 PostCSS integration) | `@tailwindcss/postcss: ^4.0.0` |
| **Iconography** | Lucide React | `^1.52.0` |
| **3D Rendering** | Three.js | `^0.186.1` (WebGL canvas for cells, capacitors, molecules) |
| **Document Processing** | Mozilla PDF.js & ExcelJS | `pdfjs-dist: ^6.4.299`, `exceljs: ^4.4.0` |
| **Runtime & Backend** | Next.js Serverless Route Handlers on Node.js | Node.js `24.x` |
| **Authentication** | HMAC SHA-256 Signed Sessions (`avs_session`), Bcrypt password hashing | Custom secure cookie-based auth; phone OTP via Supabase Auth |
| **Database & ORM** | Supabase PostgreSQL (`@supabase/supabase-js: ^2.117.2`) | In-memory singleton (`src/lib/db/memory.ts`) fallback for unit tests |
| **Storage Architecture** | Hybrid Cloud Storage (GitHub Release immutable binaries + Supabase Storage) | GitHub Release assets for zero-cost immutable CDN; Supabase bucket `learning-upload-parts` for private multipart admin uploads |
| **Hosting & Deployment** | Vercel (Project: `avs-12th-student-hub`, Team: `team_LGnAbOq993hXXmq626M0R2MV`) | Region: Sydney (`syd1`); production branch: `main` |
| **Package Manager** | npm (authoritative `package-lock.json`) | npm with deterministic lockfile |

---

## 3. Architecture & Data Flow

### 3.1 Routing Architecture

The application uses Next.js App Router with responsive layouts:
- `/`: Public landing page featuring brand identity (`joshuaskillup`), curriculum highlights, PWA installation banner, and public syllabus overview.
- `/login`, `/register`, `/change-password`: Authentication flows for students and administrators.
- `/dashboard`: Authenticated student cockpit featuring glass scoreboard (points, rank, gift progress), quick practice shortcuts, and resume-reading cards.
- `/subjects`: Curriculum navigation by stream (Computer Science vs. Biology) and Common subjects (Maths, Tamil, English).
- `/notes`: Handwritten faculty notes catalog with medium and subject filters.
- `/notes/[noteId]`: In-app handwritten note reader supporting zoom, dark mode, page bookmarks, fullscreen, and PDF/image paging.
- `/videos`: Educational video library with chapter filters, instant search, duration badges, and progress tracking.
- `/videos/watch/[videoId]`: Dedicated video watch page with native HTML5 player, anti-seek fraud reward verification (+10 points per complete watch), and related lessons.
- `/textbooks`: Samacheer Kalvi Class 12 textbook directory (English and Tamil mediums) with in-site PDF reader.
- `/practice`: One-mark MCQ practice with instant evaluation, explanations in Tamil/English, and timed exam modes.
- `/models`: Interactive 3D science simulations (Biology cells, Physics circuits/solenoids, Chemistry bonding).
- `/ai-helper` & `/ai-study-tools`: Bilingual AI tutor with grounded textbook citations.
- `/leaderboard`: Student point rankings and 100,000-point milestone gift redemption queue.
- `/admin/...`: Protected faculty portal for student management, notes upload, video management, gift fulfillment, and question review.

### 3.2 Authentication & Security Boundary

1. **Role-Based Access Control:** All routes under `/admin` and `/api/admin/*` strictly enforce `session.role === "admin"`. Students attempting admin access are rejected with `403 Forbidden`.
2. **Encrypted Tokens:** Sessions are sealed with server-side `SESSION_SECRET` using HMAC SHA-256. Passwords use salted bcrypt hashes (`cost: 10`). Secrets are never returned to client payloads or logs.
3. **Database RLS:** Sensitive tables in Supabase PostgreSQL use Row Level Security (RLS) with service-role server operations, preventing direct unauthorized browser manipulation.
4. **Media Policy:** Admin uploads use pre-signed multipart chunks (4 MiB parts up to 512 MiB total). Student access streams verified chunks through authenticated Next.js proxy endpoints (`/api/notes/[noteId]/pdf`, `/api/videos`), supporting HTTP 206 byte-range seeking without exposing private storage credentials.

---

## 4. Current Feature Audit Status

| Feature | Status | Analysis Findings & Evidence |
|---|---|---|
| **Homepage & Navigation** | Functional | Mobile bottom nav, top navbar, brand logo, dynamic syllabus counts, responsive layout. |
| **Student Registration & Login** | Functional | Phone and register-number login, password change enforcement on first login, admin activation mode. |
| **Handwritten Notes Reader** | Functional | Supports PDF rendering via PDF.js 6.4.299 and multi-page images (`NotePage[]`), zoom, dark mode, and bookmarks. |
| **Admin Notes Upload** | Partially Implemented | Single PDF and image upload works; bulk multi-image upload with numeric sequence ordering needs admin UI enhancement. |
| **Educational Video Library** | Functional | 205 unique videos currently published across Physics, Biology, Tamil, and English with dedicated watch pages. |
| **New Video Ingestion** | Ready for Cataloging | 40 newly supplied Physics MP4 video files discovered in `book's/phy/video/` (Electromagnetic Waves, Optics, Dual Nature). |
| **One-Mark MCQ Practice** | Functional | 995 active published questions with English/Tamil options, immediate feedback, and score persistence. |
| **Textbooks Reader** | Functional | In-site reader with official SCERT delivery and verified chapter rewrites. |
| **AI Study Tools** | Functional | 11 tools covering bilingual prompts, Python tutor, and textbook excerpt grounding. |
| **3D Science Models** | Functional | Three.js WebGL canvas with interactive rotation, zoom, and component breakdown. |
| **Faculty/Admin Portal** | Functional | Student directory, gift claims approval, question review, and content manager active at `/admin`. |
| **PWA & Offline Behavior** | Functional | Service worker registered, web manifest configured, install prompt and offline notice active. |

---

## 5. Content & Media Storage Analysis

### 5.1 Handwritten Notes
- **Storage Location:** Checked-in catalog references in `src/lib/additional-materials-catalog.json` and `src/lib/additional-materials-resources.json`, backed by immutable GitHub release assets and Supabase Storage bucket `learning-upload-parts`.
- **Existing Notes Count:** 59 verified PDF notes covering Mathematics, Bio-Botany, Bio-Zoology, and Chemistry.
- **Rendering Mechanism:** Dual-mode viewer in `src/app/notes/[noteId]/page.tsx` rendering native embedded PDF frames with byte-range streaming or responsive `<img>` elements for image-based handwritten pages.
- **Identified Improvement:** Admin uploader currently handles one file per submission; multi-image batch upload (10+ images) with drag-and-drop / numeric sorting is required.

### 5.2 Educational Videos
- **Storage Location:** Master video files located locally in `book's/` and streamed online via immutable release assets / signed storage parts.
- **Existing Video Count:** 205 unique videos (212 physical files including 7 aliases).
- **New Video Batch Discovered (Nov 9, 2026):** 40 new MP4 files in `book's/phy/video/` covering Physics Volume 1 Unit 5 (Electromagnetic Waves), Volume 2 Unit 6 (Ray & Wave Optics), and Volume 2 Unit 7 (Dual Nature of Radiation & Matter) in English and Tamil.
- **Player Features:** Native HTML5 video player with mobile touch controls, custom poster images, seeking, playback rate, bookmarking, and progress-verified point rewards.

---

## 6. Technical Risks & Recommendations

1. **Next.js Turbopack Concurrency on Windows Sandbox:** Turbopack build occasionally triggers an IPC socket disconnect on Windows when running concurrently with multi-worker PostCSS transforms. Webpack fallback (`next build --webpack`) runs stably with zero errors. Production build on Vercel runs on Linux container where both builders execute cleanly.
2. **Preservation of Student History:** Student scores, points, and practice history must never be touched during content imports. All migrations and database synchronization scripts must remain strictly additive (`insert-only` / `onConflict: "id", ignoreDuplicates: true`).
3. **Multi-Page Image Ordering:** For handwritten notes uploaded as batches of images, numeric natural sorting (`page1.jpg`, `page2.jpg` ... `page10.jpg`) must be enforced over naive alphabetical sorting (`page1.jpg`, `page10.jpg`, `page2.jpg`).
4. **Vercel Deployment Hygiene:** Production deployment must strictly exclude heavy binary video files from the Vercel serverless bundle via `.vercelignore`, preserving fast cloud builds and sub-second cold starts.
