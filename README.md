# Balance & Restore — Production Version 7

This is the consolidated production project based on Version 6.1.

## Critical gallery fix

The previous public `site.js` used undefined functions:

- `setText()`
- `setVisible()`

This stopped JavaScript before `loadGallery()` ran.

Version 7 uses one consistent implementation and loads:

- `/api/content`
- `/api/gallery`
- R2 image URLs

The three already-uploaded photos remain in D1/R2 and will display automatically.

## Included

- Public responsive website
- Working Services, About, Gallery and FAQ navigation
- Setmore links
- SVG social/contact buttons
- D1 content management
- Local login and user management
- R2 gallery upload
- Existing gallery management
- Move earlier/later
- Hide/show
- Edit title and alternative text
- Delete photo
- Full-size lightbox
- Browser cache-busting for CSS and JavaScript

## Upgrade from Version 6.1

Replace the current project files with this folder.

Do not reset D1 and do not recreate the R2 bucket.

No new migration is required.

Deploy:

```powershell
npm install
git add .
git commit -m "Deploy production Version 7"
git push
```

After Cloudflare finishes:

1. Open the main site.
2. Press Ctrl+F5 once.
3. Open `https://restore-cupping.com/#gallery`.
4. The existing gallery photos should appear.

## Important Admin behaviour

- **Upload photos** uploads gallery files immediately.
- Each gallery card's **Save changes** updates that photo.
- The bottom **Save and publish** button is for normal website content, not gallery uploads.
