# Balance & Restore Clean Version 6

This is a complete replacement project built from the uploaded live project.

## Fixes
- one D1 binding only
- minimal reliable local-user insert
- complete user management page
- detailed backend errors
- R2 gallery upload, editing, ordering, visibility and deletion
- responsive mixed-size public gallery and full-image viewer
- no duplicate root website files or node_modules

## Before deployment
Create the R2 bucket once:
```powershell
npx wrangler r2 bucket create balance-restore-gallery
```

Apply migrations:
```powershell
npm install
npm run db:migrate:remote
```

The migrations do not delete the existing administrator or website content.

Deploy:
```powershell
git add .
git commit -m "Replace site with clean Version 6"
git push
```

The existing `ADMIN_SETUP_TOKEN` Worker secret can remain. It is not included in this ZIP.
