# Balance & Restore custom admin v1

Includes a public website, `/admin/` dashboard, Cloudflare D1 storage and Cloudflare Access-compatible protection.

## Setup
1. `npm install`
2. `npx wrangler login`
3. `npm run db:create`
4. Copy the D1 database ID into `wrangler.jsonc`.
5. Replace `REPLACE_WITH_YOUR_EMAIL` with your login email.
6. `npm run db:migrate:remote`
7. Push to GitHub and set Cloudflare deploy command to `npm run deploy`.
8. Protect `/admin/*` and `/api/admin/*` with Cloudflare Access, allowing only your email.
9. Open `https://restore-cupping.com/admin/`.
