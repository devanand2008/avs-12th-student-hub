# Student activation with administrator approval

This site uses `STUDENT_ACTIVATION_MODE=admin` in `.env.local`. Students activate through administrator review and password login. An SMS provider is not required in this mode. Approval does not claim that a student's phone number has been verified.

1. A student completes `/register`. Their account remains pending and no login session is created. Registration does not ask them to choose a password.
2. An administrator opens `/admin/students`, reviews the student's identity, and chooses **Approve** next to their account.
3. The administrator confirms approval and receives a generated temporary password. Share the Student ID and temporary password privately with the correct student.
4. The student signs in at `/login`. Their first login opens `/change-password`; they must enter the temporary password and choose their own password before accessing lessons.
5. Later logins use their Student ID, email or mobile number and personal password. Password resets and account deactivation remain available to administrators.

Accounts created by an administrator through the form, import or student creation script are approved immediately in this mode. Public registration cannot set approval, administrator roles or phone-verification fields. Approval records its timestamp and administrator in the student profile and audit log. Concurrent approval requests issue one valid temporary password. Approval replaces the registration password, and subsequent password changes invalidate the temporary password and previous sessions.

The migration is `supabase/migrations/20261007144717_admin_student_approval.sql`; apply it after the account-directory and first-login OTP migrations. Rebuild and restart after changing the environment. The application checks this migration before allowing administrator approval.

Students who already completed genuine phone verification retain access to their existing accounts and passwords. Unverified existing accounts remain pending until approved. The sample fixture is unchanged. New approvals never set `phoneVerifiedAt`, `phoneVerifiedNumber` or a Supabase Auth phone confirmation.

`/admin/backend` shows the active activation method. Old `/login/mobile` and `/login/otp` links explain administrator approval and point to password login. The OTP API cannot send or consume SMS codes in admin mode.

To use real SMS in the future, configure a provider in Supabase and select `STUDENT_ACTIVATION_MODE=sms`; follow [the SMS setup guide](OTP_SETUP.md). Approval alone is insufficient to satisfy phone verification in that mode.

Validation includes role and RPC permissions, rejected forged approval fields, concurrent approvals, temporary-password invalidation, desktop/mobile registration and approval, first-login password setup and deactivation of a logged-in student.
