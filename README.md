# Balance & Restore Complete v3

This is a complete replacement project, not a patch.

## Important

Keep your existing production `wrangler.jsonc`, because it already contains your correct D1 database ID and admin email.

Copy these new folders/files over the existing project:

- `public/`
- `src/`
- `migrations/`
- `package.json`
- `.gitignore`

Use `wrangler.example.jsonc` only as a reference. Do not overwrite your working `wrangler.jsonc` unless you copy your real values into it.

## Why this version is safer

- Old D1 content is deeply merged with current defaults.
- Missing settings no longer remove website sections.
- Invalid or incomplete old JSON falls back safely.
- Promotions support enabled/disabled, start date and end date.
- Blank promotion dates mean always active.
- The admin save API returns normalized complete content.
- A reset-to-recommended-defaults button is included.
- Public JavaScript tolerates missing optional arrays and fields.

## Test

1. `npm install`
2. `npm run dev`
3. Test the public website.
4. Test `/admin/`.
5. Change one item and save.
6. Refresh the public site.
7. Test promotion with blank dates.
8. Test promotion with future/expired dates.

## Deploy

```powershell
git add .
git commit -m "Replace website with complete admin v3"
git push
```

Cloudflare will deploy automatically.
