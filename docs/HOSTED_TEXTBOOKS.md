# Hosted textbook PDF delivery

## Verified release (October 13, 2026)

All **82 catalog PDFs**, totalling **2,361,676,885 bytes**, are published in the [verified textbook release](https://github.com/devanand2008/avs-12th-student-hub/releases/tag/textbooks-2026-10-13). Every GitHub asset's SHA-256 digest and byte size match the original catalog. All 82 public download URLs returned HTTP 206, the correct total size, and the `%PDF-` signature for a five-byte range request. [Per-file verification receipt](hosted-textbook-release.json).

The files were uploaded from the existing verified local collection. A GitHub runner source-access probe returned HTTP 403; its unused experimental workflow was removed. Interrupted upload placeholders were replaced only after confirming they had no completed digest. No completed asset was overwritten. The release hosts original PDFs; it does not change question moderation, source evidence, or the student question bank.

The `github-release` delivery mode streams unchanged textbook files from this repository's `textbooks-2026-10-13` release through authenticated `/api/textbooks/<catalog-id>/pdf` routes. Source URLs, original filenames, medium, volume, pages, byte sizes and SHA-256 digests remain in `src/lib/textbooks-catalog.json`. No textbook wording or extracted question is changed by this delivery mode.

The reader and downloads use the same in-site route. The route supports GET, HEAD and one HTTP byte range, follows only approved GitHub asset hosts, checks response sizes/range boundaries against the catalog, and streams the response without buffering the whole book. It rejects unknown books, unsafe redirects, malformed ranges and failed or inconsistent upstream responses. User cookies and Supabase credentials are never sent to the asset server. PDF requests require a current student or administrator session, and API responses are not cached by the service worker.

Only enable `TEXTBOOK_DELIVERY=github-release` after all catalog PDFs are uploaded and each release asset's GitHub SHA-256 digest and byte size match the verified local/catalog values. Keep the release tag and filenames stable; replacing a PDF silently would invalidate its source evidence. New editions need a separate verified inventory and release. The original official-source link remains available.

The existing Supabase organization is on its free plan. The local collection totals 2,361,676,885 bytes and thirteen PDFs exceed 50 MiB, so the whole collection cannot use the free project's file limits. File assets live in GitHub Releases rather than Git history or the Supabase database. [Supabase file limits](https://supabase.com/docs/guides/storage/uploads/file-limits) and [GitHub release asset limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#storage-and-bandwidth-quotas) describe these constraints.

The original `official` delivery mode remains available on hosts that can access SCERT's CloudFront source. The `local` mode continues to use the laptop's downloaded PDFs. Supabase accounts, notes, videos, questions and practice history are shared between these modes. Teacher-held questions remain held; hosting a textbook file does not approve or publish any MCQ.
