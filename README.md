# Balance & Restore Fresh Version 5

Complete fresh replacement with working navigation, a softer feminine design, social icons, and local D1 users.

## Security

Passwords use PBKDF2-SHA256 with random salts and 210,000 iterations. Sessions use random tokens, store only token hashes in D1, and use Secure + HttpOnly + SameSite=Strict cookies. Write requests use CSRF tokens. Five failed logins in 15 minutes temporarily block further attempts.

Only these emails can create users, disable users and reset passwords:

- haneen.jalal@gmail.com
- omar.manaa@gmail.com

## Preserve your real D1 binding

Use `wrangler.example.jsonc` only as a reference. Keep your existing `wrangler.jsonc`, but make sure `run_worker_first` contains `/api/*` and `/admin/*`.

Create the setup token as a secret:

```powershell
npx wrangler secret put ADMIN_SETUP_TOKEN
```

Use a long random value. Do not commit it to GitHub.

## Fresh reset

Back up D1 first. This removes old content and local users:

```powershell
npm run db:fresh:remote
npm run db:migrate:remote
```

## First administrator

After deployment open:

`https://restore-cupping.com/admin/setup/`

Use the setup token and either approved administrator email. Passwords require at least 12 characters with upper-case, lower-case and a number.

## Login and users

- Login: `https://restore-cupping.com/admin/login/`
- Users: `https://restore-cupping.com/admin/users/`

## Contact icons

Email is included by default. Add the correct WhatsApp and Instagram URLs in Admin → Contact. Their icon buttons will then appear and work.

## Deploy

```powershell
npm install
npm run db:migrate:remote
git add .
git commit -m "Deploy fresh Balance Restore v5"
git push
```
