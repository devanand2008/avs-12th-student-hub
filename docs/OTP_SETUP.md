# First-login mobile OTP

The current site uses **administrator approval and password login** because an SMS provider is not configured. Follow [the administrator approval guide](ADMIN_APPROVAL_SETUP.md) for the active flow. This guide describes the optional `STUDENT_ACTIVATION_MODE=sms` flow.

Students verify their Indian mobile number once, choose a personal password, then sign in with their Student ID, email or mobile number and password. Administrators continue to use password login.

## Enable actual SMS delivery

The admin page at `/admin/backend` checks database connectivity and phone authentication separately. A connected database does not imply that SMS delivery is configured. Use **Open phone verification settings** to open the connected project's Phone provider. The app checks these settings without sending an SMS; even when Phone is enabled, verify a real delivery before enrolling students.

Real SMS OTP requires an SMS provider account. For Twilio, configure its Account SID, Auth Token and Messaging Service SID in Supabase. A Supabase anonymous/public key cannot enable Phone or configure an SMS provider. The connected database tool also cannot change these Auth settings without Auth configuration access. If a provider account is unavailable, the existing sample student can still test password login and the learning features; creating that sample does not activate SMS for other students.

1. Connect your Supabase project using [the database setup guide](SUPABASE_SETUP.md).
2. Run `supabase/migrations/20261007_first_login_otp.sql` after `20261007_account_directory.sql`. This adds verification fields and a server-only transaction. Existing accounts remain unverified; students without a mobile number need their profile updated by an administrator before activation.
3. In your Supabase project's Authentication settings, enable the **Phone** provider and phone signups. The application requests SMS verification only for existing, active AVS student profiles; it never grants access from an arbitrary Supabase Auth identity.
4. Configure an SMS provider in Supabase, such as Twilio. Put that provider's credentials in the Supabase dashboard, not browser code or this repository. See [Supabase's phone authentication and SMS provider guide](https://supabase.com/docs/guides/auth/phone-login).
5. Configure a **6-digit** OTP, **300-second** expiry and at least **60 seconds** between sends. The application also limits sends per phone/IP and verification attempts. For a real deployment, use HTTPS and set `APP_ORIGIN` to its origin.
6. Run `npm run db:setup`, rebuild/restart the app, register a student with a mobile number you control, and verify actual delivery. Until the project and SMS provider are configured, the app reports that SMS could not be sent. It does not substitute a fake code or print real codes.

## Student flow

- `/register` saves a pending profile without issuing a login session, then opens `/login/mobile`.
- `/login/mobile` accepts the account's 10-digit mobile number, sends an SMS through Supabase Auth, and opens `/login/otp`.
- `/login/otp` provides code entry, masked phone display, countdown, error messages, resend cooldown and change-number navigation. Only a valid code bound to a signed, HttpOnly challenge cookie can activate the profile.
- Verification persists the verified number and timestamp, invalidates the account's previous password and sessions, and opens `/change-password`. The student can set a personal password without knowing an admin-generated temporary password. This permission expires after ten minutes and is removed once the password is set.
- Future logins use the password at `/login`. The phone OTP endpoint rejects completed first logins; it is not a password-reset shortcut. If the ten-minute password setup session expires before completion, the student can verify a fresh OTP to finish setup. Administrator password resets retain their existing temporary-password flow.

Both mobile verification pages provide a password-sign-in link. An already-verified number returns `PHONE_ALREADY_VERIFIED` (409), and the mobile form opens password login with that number filled in. This navigation grants no session; the password is still required. Disabled phone authentication returns `PHONE_OTP_UNAVAILABLE` (503), provider delivery failures return `SMS_DELIVERY_FAILED` (503), and send limits remain 429. Errors never mark a phone verified.

The SMS signup request includes the saved student name in Supabase Auth metadata. This satisfies the connected project's existing profile-creation trigger, which requires `name` or an email for a new Auth identity. The name comes from the existing active AVS profile; role and verification still come from the server and a valid OTP.

There is no global `DISABLE_PHONE_OTP` shortcut. For local app testing, a clearly labelled sample may be provisioned administratively; this does not establish real phone ownership or enable SMS for other students. The sample account's current credentials are stored in ignored `.local/student-access.txt`.

The old password is invalidated at verification so somebody who registered another person's phone earlier cannot retain access. A mobile-number change invalidates verification because it is bound to the current normalized number. Phone numbers must identify one student; shared family numbers cannot be assigned to multiple accounts.

## Backend and testing

The API routes are `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`, and `GET /api/auth/otp/status`. Password login refuses unverified students, registration never signs them in, and session checks verify the live profile. Codes and Supabase access/refresh tokens are never returned by the app API. The service key remains server-only. Supabase Auth verifies SMS ownership; normal AVS authentication and password storage continue to use the custom PostgreSQL account tables and signed cookies.

`npm test` tests signed challenge expiry/tampering, phone binding, the verification transaction and the real Supabase SDK against a local fixture. Playwright tests the first-login pages, password setup, subsequent password login, invalid/expired codes, replay, cooldown and attempt limits on desktop and mobile.

The local fixture simulates SMS and has a test-only code inspection route. That route exists only in `tests/helpers/postgrest.ts`, is never part of the product, and uses the fixture service key. Tests send no real SMS. Live SMS delivery must be checked separately with your configured provider.
