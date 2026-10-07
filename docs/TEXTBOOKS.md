# Class 12 textbook library

The library at `/textbooks` uses the public [SCERT Tamil Nadu textbook catalog](https://scert.tnschools.gov.in/textbook), with direct PDFs from the official content CDN. It includes every Class 12 PDF record currently returned for Tamil and English medium, across languages, science, commerce, arts, and vocational subjects. The source supplies some older and optimized versions of the same subject; those records remain separate.

The completed local import contains 82 source records covering 40 subjects, totaling 2,361,676,885 bytes (about 2.20 GiB / 2.36 GB). Homepage subject links can prefilter the library, for example `/textbooks?search=Physics`.

Every locally saved textbook has a **Read full book** link to `/textbooks/[bookId]`. The reader renders the original full PDF inside the site with previous/next page, page jump, zoom, fit width, selectable text where the PDF contains text, and links to open or download the original. This works on desktop and mobile. The page count is read from the actual PDF; PDF page numbers include the cover and can differ from printed page numbers.

The reader uses PDF.js with its worker, character maps, fonts, image decoders and ICC profiles served locally from `public/pdfjs/[version]/`. No remote viewer or CDN is needed. `npm install` and `npm run build` copy assets from the installed `pdfjs-dist` package automatically. Run `npm run pdf:setup` to restore missing reader assets. The reader loads only the selected book and uses range requests to fetch pages as needed.

PDF files are saved in `public/textbooks/` and served by the local website. The importer records each PDF's actual byte size, SHA-256 checksum, and page count when provided by its PDF linearization metadata. It checks the PDF signature and end marker before saving. The catalog does not supply an edition year, so the website does not invent an edition, chapter count, or syllabus certification.

## Download or repair the library

```powershell
node scripts/import-textbooks.mjs
```

The command is idempotent: completed PDFs with matching checksums are reused. Interrupted `.part` files are replaced safely. Downloads use four workers and retry failed requests three times. Failed sources remain marked unavailable; the command exits with status 1 when any catalog PDF is missing. Rerunning retries those entries without downloading successful files again.

```powershell
# Verify all saved PDFs without contacting the source.
node scripts/import-textbooks.mjs --verify

# Redownload files and refresh source metadata.
node scripts/import-textbooks.mjs --refresh
```

The generated metadata is in `src/lib/textbooks-catalog.json` and `public/textbooks/manifest.json`. Downloaded PDFs are ignored by Git; copy the library directory when moving the local installation, or rerun the importer. On a server without those files, the UI checks availability and shows the official online link instead of claiming a local download.

The public SCERT catalog has a misspelling in the English Basic Electronics Engineering object's filename (`Enginering`). The importer uses the independently verified `Engineering` object on the same official CDN while retaining the original source catalog filename for attribution.

## Save metadata to Supabase

Apply `supabase/migrations/20261007_textbook_library.sql`, then configure a project URL and server secret key in `.env.local` as described in the database setup documentation. Run:

```powershell
node scripts/import-textbooks.mjs --verify --sync-db
```

This upserts textbook records into the `textbooks` table using the server credential. Browser roles cannot write or directly query the table. The command uploads metadata only; PDF files remain local. No public Supabase ebook bucket is created, and no claim is made that a free download grants cloud redistribution rights.

## Availability and rights

The official source currently lists 42 Tamil medium and 40 English medium PDF records. Tamil, Advanced Tamil, English, and Communicative English are common language books shown in both UI medium filters. Minority language books and a Tamil Nutrition and Dietetics PDF are not present in this source catalog, so the library does not claim to have downloaded them. Confirm the textbook edition with the student's school before exam preparation. Copyright remains with the original publisher.
