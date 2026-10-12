# Render hosting

The service is [avs-12-hub](https://avs-12-hub.onrender.com), in Singapore, linked to this repository's `main` branch. The Next.js frontend and API routes run together. Accounts, questions, notes, videos and practice history continue to use the existing Supabase project; no database migration or teacher publication is part of deployment.

Render settings: Node 24.19.0, free compute, build `npm ci --include=dev && npm run build`, start `npm run start:web`, port 10000, health path `/`. Development dependencies are explicitly installed because Tailwind, PostCSS and TypeScript are required during the production build, even with `NODE_ENV=production`. `render.yaml` passes Render Blueprint validation. Cloud textbook delivery uses the catalog's verified official PDF URLs, and `AI_PROVIDER=excerpts` uses existing study material without requiring the laptop's Gemma process. Student activation preserves the existing production setting, `admin`.

Private `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, a separate generated `SESSION_SECRET`, and `APP_ORIGIN=https://avs-12-hub.onrender.com` are configured on the service. Demo data and demo logins are disabled. Never commit private environment files or local reviewer credentials. Existing administrator accounts remain in Supabase; deployment does not reset their passwords.

The Tamil Physics teacher review remains a separate loopback-only laptop workflow. Its private decisions, identities and source-page images are excluded from Git and deployment. The 15 candidates remain held and are not automatically imported or published by the web start command.

`.github/workflows/render-wake-up.yml` requests `/api/auth/config` every ten minutes, at minutes 3, 13, 23, 33, 43 and 53. It can also be run from GitHub Actions using **Run workflow**. It needs no passwords or database keys and validates the JSON response. GitHub scheduled runs can be delayed or disabled after prolonged repository inactivity, so this is a best-effort wake-up schedule, not an uptime guarantee. [GitHub scheduling documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [Render free-service limits](https://render.com/docs/free) describe these limits.

To redeploy the exact pushed revision after CLI sign-in:

```powershell
render workspace set tea-d7os0j77f7vs73b3std0 --output json
render deploys create srv-db6h5orl550s73ase73g --commit <pushed-commit-sha> --wait --confirm --output json
```

Use the [Render dashboard](https://dashboard.render.com/web/srv-db6h5orl550s73ase73g) to inspect build/deploy logs. A successful local build or service creation is not proof of a live deployment: confirm the deploy state and public app before reporting success.
