# Tamil Physics Unit 1 teacher decision audit

Checked 2026-10-23T17:34:11.391Z. **Exported manifest not located.** The local decision store does not have export metadata and is not treated as an export.

Actual authoritative local store: approved 0; needs correction 0; rejected 0; pending 15; reviewed 0; history events 0. These are local-store counts, not verified export outcomes. Confirmed handoff records: **0**. Missing/duplicate/unknown IDs and per-record schema/history/source issues are listed in the [JSON audit](teacher-decision-manifest-audit.json).

The local store matches all 15 candidates, source metadata/hashes, flags and individual history requirements. Provisioned reviewer identities: 2. No approval is inferred from the printed key. Question 10 remains pending; its graph-only choices are incomplete and approval is forbidden.

All 15 packets preserve original raw/source Tamil and extracted options separately from proposed Tamil/options, source diagrams, PDF/printed-page references and numbered printed-key evidence. Fresh original PDF hash matches. Required local source images exist. Seven questions depend on diagrams; diagram inspection is a mandatory approval check, and graph incompleteness cannot be cleared by changing only manifest flags. Source flags and history were not rewritten.

Local handoff: `.local/teacher-review/decision-audit/review-package.json`. **Blocked; not import-ready.** No confirmed decision has been staged for import. No importer, database mutation or deployment is invoked.

- Exported manifest not located; local decision store is not a substitute for an authenticated export.
- No confirmed individually recorded teacher decisions are available for preparation.

After the actual teacher saves individual decisions, sign in to `http://127.0.0.1:4312` and click **Export decision manifest**. Keep the original download unchanged. Run:

```powershell
npm run mcqs:decision-audit -- --manifest "C:\full\path\tamil-physics-unit1-decisions.json"
```

The audit checks each event's authorised reviewer identity, required notes and source/diagram confirmations, revision/previous-decision chain, event IDs/timestamps, latest decision consistency and exact correspondence with the authoritative local store. Unknown/missing/duplicate IDs, stale/conflicting histories, modified source references or Question 10 approval invalidate the export. Multiple differing exports are not silently combined. No exported history is altered.

[Prior production preservation proof (not refreshed by this local command)](teacher-decision-audit-database-proof.json) · [Verification receipts](teacher-decision-audit-verification.json)
