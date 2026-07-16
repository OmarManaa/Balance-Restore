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


## Version 6.1 Gallery Manager Fix

The Gallery now:

- loads existing R2/D1 photos automatically when Admin opens
- has a clearly visible green Upload photos button
- does not use the website Save and publish button for uploads
- shows uploaded photos immediately
- supports Move earlier and Move later
- supports title/alt-text editing
- supports hide/show
- supports permanent deletion
- displays upload and backend errors clearly

No migration or database reset is required when upgrading from Version 6.
