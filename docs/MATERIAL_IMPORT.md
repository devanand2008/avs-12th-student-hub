# Supplied student materials

The source folder `book's` contains 18 files, about 364 MiB in total:

| Subject | Materials | Details |
| --- | --- | --- |
| Mathematics | 11 PDFs | Chapters 1, 3–12; 396 PDF pages |
| Bio-Botany | 2 PDFs | Biotechnology and Plant Tissue Culture questions and answers; 18 PDF pages |
| Tamil | 5 MP4s | Titles verified from the videos; about 29 minutes in total |

The Mathematics and Tamil subjects are available to both student streams. Scanned pages were visually inspected to identify the Botany chapters. Tamil videos retain the actual lesson titles in Tamil and searchable English transliterations. The import does not generate questions from the notes.

```sh
npm run materials:scan
npm run materials:import
npm run materials:verify
```

The scan validates the complete source catalogue, file sizes, PDF page counts and MP4 movie durations before any upload. Import requires the configured Supabase server credentials and existing AVS schema. It adds missing curriculum records, raises the learning-materials bucket limit to at least 50 MiB, and uploads original files using SHA-256 storage paths. Source files remain untouched.

Stable IDs prevent duplicate resources when the command runs again. Existing metadata, archived status, administrator edits and student progress are preserved. A changed source file stops import for review instead of replacing an existing lesson. Successful uploads can be reused after an interrupted run. New metadata is published only after each upload succeeds. The import report is saved privately to `.local/material-import-report.json`.

The storage files use public URLs, matching the existing content system. Database metadata is restricted to server access by row level security. All student library routes require sign-in. Student views only list published resources; administrators can archive them from `/admin/notes` or `/admin/videos`.

Students can open `/notes`, filter by subject or language, and search by chapter or topic. `/videos` supports English/Tamil search and language filtering. Chapter buttons on `/subjects` open the relevant library. Video bookmarks and playback progress are stored in the existing Supabase tables.

The catalogue in `src/lib/learning-materials.ts` maps the supplied files to titles and chapters. Add a mapping for any newly placed source file before rerunning import. Apply `supabase/migrations/20261007_material_library_uploads.sql` after the earlier migrations on a fresh project to reproduce the 50 MiB bucket setting.
