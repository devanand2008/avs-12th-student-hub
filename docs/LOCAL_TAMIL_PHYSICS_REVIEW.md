# Local Tamil Physics Unit 1 teacher review

This dedicated workflow runs separately from Next.js and the website admin panel. It does not load `.env.local`, import the Supabase client, connect to the live database or publish questions. It listens only on `127.0.0.1`. Local reviewers use separately provisioned credentials; website admin passwords do not grant access here.

## Open the workflow

1. In `D:\avs-12-hub`, the project owner authorises each actual reviewing teacher by running:

   ```powershell
   npm run mcqs:physics-review -- --add-reviewer teacher@example.com --name "Actual teacher name"
   ```

   Replace the example email/name with that teacher's identity. The command adds an allowlisted local reviewer, hashes a generated password, and prints the path to their private credentials file under `.local/teacher-review/physics-unit1-workflow/`. Give that file only to the named authorised reviewer. Repeating the command for the same email fails rather than replacing their credentials. No teacher account was invented or provisioned during implementation.

2. Start the review server:

   ```powershell
   npm run mcqs:physics-review
   ```

3. Open **http://127.0.0.1:4312** and sign in with that teacher's local email/password. An optional `-- --port 4313` selects another loopback port. The startup command validates the actual `.local/teacher-review/tamil-physics-unit1.json` queue against the versioned source packet, checks the original PDF hash and renders PDF pages 79–81 locally. Missing or changed source evidence causes an error; existing evidence and decisions are not silently replaced.

The original local PDF must exist at `public/textbooks/12-physics-tamil-v1-c1623725.pdf`. If the packet is missing, run `npm run mcqs:physics-unit1` first. The review server does not download missing books or replace candidate data.

## Record one teacher decision

Select Question 1–15, or use Previous/Next. Each screen shows the stable candidate ID, Physics/Tamil/volume/chapter, source filename/hash, PDF and printed page numbers, original raw Tamil and every extracted option separately from proposed Tamil and options, printed answer-key text and proposed answer, warnings, source diagrams and full locally rendered page images. Question 6 shows both question pages plus the key page. Click an image to inspect its full-size rendering.

Choose **Still pending review**, **Needs correction**, **Rejected, with a reason**, or **Approved after verification (local only)**. Enter notes describing source verification, exact required corrections, unresolved conditions or rejection reasons. Correction notes do not automatically rewrite source/proposed Tamil or invent options; they are saved separately. Keep remaining issues in the unresolved-issues field. The immutable source warnings stay visible and are included in the export even after a teacher records resolution notes.

Approval requires a nonempty verification note, confirmation of every relevant original question/key page, explicit wording/options/answer checks, and no remaining unresolved issues. All seven diagram-dependent questions (1, 3, 5, 6, 8, 10, 14) additionally require confirmation of inspection and interpretation of the actual diagram. These are deliberately human confirmations: displaying an image or matching the key does not approve anything. Confirmations must be made afresh for each saved action.

**Question 10 cannot be approved while graph options are incomplete.** Its Approved option is disabled, and the server rejects approval even if someone bypasses the UI. It can be marked Needs correction, Rejected with a reason, or Still pending. This task supplies no reconstructed graphs or invented options.

Click **Save this individual local decision**. The server attributes the action to the authenticated local reviewer, appends its time, unique event ID, prior/current decisions, revision, notes, unresolved issues and source/diagram confirmations to that candidate's local history. Refresh or restart to confirm persistence. Concurrent stale saves receive a reload error rather than overwriting the newer action. No bulk review action exists.

All extraction candidates remain `Needs Review` / `needs_teacher_review`, with `practicePublished: false`, including candidates with an approved local decision. That approval is a reference decision only, not publication. Rejection also stays in this separate manifest; source candidates are never deleted or rewritten.

## Export and preserve decisions

Click **Export decision manifest** while signed in. The server now saves an immutable export copy under `.local/teacher-review/physics-unit1-workflow/exports/` and the screen shows its exact absolute path. It also downloads `tamil-physics-unit1-decisions.json` through the browser; that download's location depends on browser settings. The same export includes all 15 IDs (including untouched pending questions), immutable source references and evidence hashes, source warnings, current decisions, correction notes, unresolved issues, reviewer identities and complete history. It contains no passwords/session tokens. Export requires authentication and never changes a decision. No export is generated until an authorised reviewer clicks the button.

Persistent local files:

- `.local/teacher-review/physics-unit1-workflow/decisions.json` — authoritative local decision manifest.
- `.local/teacher-review/physics-unit1-workflow/reviewers.json` — allowlisted reviewer identities and password hashes; keep private.
- `.local/teacher-review/physics-unit1-workflow/source-pages/79.png`, `80.png`, `81.png` — freshly rendered original textbook evidence.
- `.local/teacher-review/physics-unit1-workflow/exports/` — immutable copies created by actual authenticated export actions; the screen identifies each saved file path.
- `.local/teacher-review/tamil-physics-unit1.json` — original held candidate queue; never changed by the review server.

Back up the decision manifest separately. Running `npm run mcqs:physics-unit1` does not touch the decision manifest; it preserves IDs and existing candidate queue records. The review server checks its evidence hashes on restart so a changed source packet requires explicit reconciliation instead of silently losing decisions.

There is **no decision import, Supabase write, production deployment or publication action** in this workflow. The existing production admin panel continues to use Supabase; do not use that panel for this local task. A future production reconciliation/import would be a separate explicitly authorised task, with Question 10 and unresolved diagram/OCR issues still held.
