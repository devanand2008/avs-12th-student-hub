# Free Google search discovery setup

Updated 31 October 2026. Canonical site: https://avs-12th-student-hub.vercel.app.

## Implemented

- Shared server-side SEO metadata for Home, Resources, Learning Lab, AI Study Tools and Textbooks, including distinct titles/descriptions, canonical URLs and social previews.
- Public resource categories and listed detail pages use their real catalogue content. Search/filter parameters do not create competing canonical URLs. The existing `/interactive-3d` alias points canonically to `/models`.
- `/sitemap.xml` contains 26 unique public URLs generated from current listed resources. Temporary/unavailable resources and private routes are excluded. No invented modification dates.
- `/robots.txt` advertises the sitemap and excludes API crawling. Root metadata defaults to `noindex, nofollow`; public pages explicitly opt in. Authentication remains the actual access control.
- Homepage has a descriptive Tamil Nadu Class 12 heading and WebSite structured data. No fabricated reviews, ratings, affiliation or search results.
- Optional `GOOGLE_SITE_VERIFICATION` supports Google's real HTML-tag verification token. No token has been supplied or invented.

## Verification and release

Focused SEO/resource tests: 8/8 passed. Typecheck, lint, local production build and `git diff --check` passed. Four distinct desktop/mobile browser cases passed across final runs: the first run needed a root canonical assertion corrected for Next.js trailing-slash normalization; one subsequent mobile case exceeded its overall 120-second cold-route budget and passed in 56.8 seconds on rerun with a 240-second budget. No assertion was removed. The full application test suite was not rerun for this SEO-only change.

Vercel initially rejected the saved CLI login with `Not authorized`; the user renewed authentication. Deployment `dpl_FFtTFDj3hBimmd8MBLfG97hRu34a` passed its production build, was verified against the local SEO source fingerprint, and was promoted to the existing production alias. Source fingerprint: `0f676372954375a854c26b351afea3455582e3800d0bf0d76f0126e1fafe3be5`. See PROJECT_STATUS.md for final live browser results.

Live desktop/mobile SEO browser checks passed 4/4 in 51 seconds against the production alias, including all five landing pages, canonical aliases/categories/details, private-page noindex, auth redirect, Googlebot HTML, robots, sitemap, structured data and homepage overflow. All 728 protected local baseline files match, including question/review/history and resource data. No database writes, Git push, paid service, dependency or question-bank change.

## Google ownership and indexing

Search Console ownership is **not verified** and the sitemap has **not been submitted through Search Console**. Chrome/native browser control returned `browser access host unavailable`; no signed-in Google account is accessible to the agent. Once a connection is available, add the URL-prefix property above, obtain its HTML tag, set only its verification content in `GOOGLE_SITE_VERIFICATION`, deploy, click Verify, and submit `sitemap.xml` in Search Console.

Google can discover public pages without Search Console. Discovery and a sitemap do not guarantee indexing or ranking: [Google crawling and indexing FAQ](https://developers.google.com/search/help/crawling-index-faq). Chrome is a browser; search visibility is managed by Google Search. No advertising spend is required for this implementation.


## joshuaskillup update — 5 November 2026

See [the current SEO report](JOSHUASKILLUP_SEO.md) for consistent branding, bilingual visible content, 20 supported terms, 27 public sitemap URLs and the new 1200 × 630 sharing image. Historical October test counts above are unchanged and are not re-counted as new tests.
