# Administrator password replacement

3 November 2026.

Open `/admin/students`, find the student and select **Reset password**. Leave the optional replacement field blank for a generated password, or enter a chosen temporary password. **Show replacement password** lets the administrator check the entry before confirmation. Confirm the individual reset, then use **Copy login details** in the one-time result banner. Dismiss the banner when finished.

Existing student passwords cannot be displayed: only bcrypt hashes are stored. No plaintext recovery field or password export was added. The newly issued temporary password is returned only to the authenticated administrator with `Cache-Control: private, no-store`. It is not stored in audit data, the directory or CSV/Excel exports. The dialog draft clears on success, cancellation or Escape; the credential banner exists only in page memory.

The replacement requires at least ten characters and at most 72 UTF-8 bytes, matching registration constraints. Supabase uses the existing compare-and-swap `avs_change_password` function, so a concurrent change cannot be overwritten silently. Both memory and Supabase adapters enforce the administrator requirement for chosen replacements. Existing password-version checks invalidate old sessions; the replacement login requires the student to change the temporary password.

The existing `RESET_STUDENT_PASSWORD` audit event identifies the administrator and student without recording the secret. No schema migration or password retrieval endpoint is needed. Existing administrator accounts continue using their authenticated password-change flow; this directory action manages student accounts.

Verification: 31 relevant regression tests passed, including both adapters, chosen-secret hashing, byte limits, non-admin rejection and absence of passwords from audit/directory output. Two desktop/mobile browser cases passed for the complete replacement, invalidation and forced-change flow. Initial browser input omitted the required school register number; correcting the fixture allowed the final two cases to pass. No production student password was changed during testing.

Released in deployment `dpl_H5b13Fd6C8Ja6ipKA18ANySuUFiX`. Live desktop/mobile checks confirmed that the administrator can open the replacement dialog and use its visibility control, then cancel it; directory responses still exclude hashes. Password mutations were verified only against the isolated local database. The original resource catalogue, questions, reviews and practice history were preserved.
