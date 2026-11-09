# SKILLUP 12TH STUDENT HUB — IMPLEMENTATION PLAN

**Target System:** SkillUp Class 12 Learning Hub  
**Document Date:** November 9, 2026  
**Status:** Approved for Technical Execution  

---

## 1. Overview & Objectives

This implementation plan details the architectural and functional enhancements required to:
1. Support multi-image batch upload and numeric sequence ordering in the Admin Notes Manager.
2. Catalog, organize, and integrate the 40 new Class 12 Physics educational videos discovered in `book's/phy/video/`.
3. Support the strict Tamil Nadu State Board syllabus hierarchy across all 12th standard streams:
   `Class 12 → Medium → Subject → Unit/Chapter → Topic → Resource (Notes / Video)`.
4. Preserve all existing student accounts, practice session histories, reward points, and live configurations.
5. Validate code quality (typecheck, lint, regression tests) and deploy to the existing Vercel production website.

---

## 2. Work Breakdown Structure & Implementation Order

```
[Phase A] Content Staging & Inventory Analysis
   ├── Scan 311 files in master book's/ repository
   ├── Establish staging structure in content-import/
   └── Generate complete content catalog (SKILLUP_CONTENT_INVENTORY.md)

[Phase B] Admin Notes Management Enhancements
   ├── Multi-image upload support (JPG, JPEG, PNG, WebP)
   ├── Natural numeric ordering algorithm (Page 1, 2, ... 10)
   ├── Visual page reordering and thumbnail previews
   └── Safe Draft vs. Publish lifecycle

[Phase C] Educational Video Integration
   ├── Map 40 new Physics videos to Unit 5, Unit 6 (Ray & Wave Optics), Unit 7
   ├── Establish Tamil and English medium bilingual pairings
   ├── Update video-source-aliases.json for duplicate detection
   └── Append to additional-materials-catalog.json & additional-materials-resources.json

[Phase D] Student Viewing Experience
   ├── Mobile-responsive document reader for multi-page image notes
   ├── Preserve chapter navigation context and page bookmarks
   └── Video watch page improvements (anti-seek reward verification)

[Phase E] Automated Testing & Quality Assurance
   ├── Platform security tests (platform.test.ts)
   ├── TypeScript typecheck (tsc --noEmit)
   ├── ESLint style and static analysis (eslint)
   └── Unit and material integrity verification

[Phase F] Vercel Deployment & Live Verification
   ├── Review uncommitted git modifications
   ├── Ensure .vercelignore excludes local binary masters
   ├── Execute deployment to existing Vercel project (avs-12th-student-hub)
   └── Perform live verification on https://avs-12th-student-hub.vercel.app/
```

---

## 3. Detailed Component & File Modifications

### 3.1 Content Ingestion & Catalog
- **Files Modified:**
  - `src/lib/video-source-aliases.json`: Add alias mapping for duplicate file `book's/phy/video/Maxwell_s_Missing_Piece (1).mp4` pointing to canonical `book's/phy/video/Maxwell_s_Missing_Piece.mp4`.
  - `src/lib/additional-materials-catalog.json`: Append 39 unique verified Physics video records (Unit 5 Electromagnetic Waves, Unit 6 Optics, Unit 7 Dual Nature) with accurate Tamil/English topics, durations, and textbook chapter IDs.
  - `src/lib/additional-materials-resources.json`: Append corresponding runtime resource objects ensuring deterministic fallback when offline or during DB migrations.
  - `docs/materials-folder-nov9-inventory.json`: Machine-readable audit inventory of all 311 files.

### 3.2 Admin Content Manager Component
- **File:** `src/components/admin/ContentManager.tsx`
  - Enhance file input to support `multiple` file selection for image batches.
  - Implement natural numeric sorting on file names:
    ```ts
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    ```
  - Provide multi-page preview cards allowing administrators to view, reorder, or delete specific pages before saving.
  - Maintain single PDF upload alongside multi-image batch uploads.

### 3.3 Database Synchronization API
- **File:** `src/app/api/admin/content/sync/route.ts`
  - Retain strictly additive behavior (`{ onConflict: "id", ignoreDuplicates: true }`).
  - Verify that newly appended video resources are inserted into `learning_resources` table without deleting or updating any student record or previously stored faculty note.

### 3.4 Notes & Video Viewers
- **Files:** `src/app/notes/[noteId]/page.tsx`, `src/components/learning/VideoLibrary.tsx`
  - Ensure image-based handwritten notes render crisp, high-resolution pages with smooth prev/next pagination, pinch-to-zoom, and persistent page state in `localStorage`.
  - Ensure video lessons on `/videos/watch/[videoId]` display verified lesson topics, language badges, and chapter return links.

---

## 4. Safety & Data Preservation Rules

1. **Zero Data Destruction:** No database table shall be dropped, truncated, or overwritten.
2. **Student Progress Integrity:** Points, badges, gift queue entries, and practice session histories are immutable.
3. **Additive-Only Migrations:** Content synchronization uses `INSERT ... ON CONFLICT DO NOTHING`.
4. **Credential Protection:** Secrets (`SUPABASE_SECRET_KEY`, `SESSION_SECRET`, `ADMIN_INITIAL_PASSWORD`, tokens) must never be committed to Git or printed in reports.
5. **Bandwidth Optimization:** Large MP4 video masters (over 1.5 GB in total) remain excluded from Git and Vercel bundles via `.gitignore` and `.vercelignore`.

