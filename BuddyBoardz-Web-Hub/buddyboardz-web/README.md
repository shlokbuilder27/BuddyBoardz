# BuddyBoardz Web Hub

Responsive, multi-page static website for BuddyBoardz.

## Pages
- `index.html` — Home
- `philosophy.html` — Book + Pen + Brain manifesto
- `how-it-works.html` — Four product modules
- `blueprint.html` — Subject overview and chapter lists
- `install.html` — Android, iOS and desktop PWA installation guide
- `open-source.html` — Open-source and privacy principles

## Run locally
Run the portal from this folder:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`. If the Python launcher is unavailable, use VS Code Live Server or `npx serve .`.

The `Open BuddyBoardz 10` links automatically point to `http://localhost:3005` when the portal is opened on localhost, and to `https://buddyboardz10.pages.dev` on production hosts. Start the app shell separately on port 3005 for local end-to-end testing.

## Brand assets
- `assets/buddyboardz-mark.png` is derived from the supplied `Secondary.png` BB monogram.
- `assets/buddyboardz-wordmark.png` is derived from the supplied `Logo.png` wordmark.
- Original source canvases are retained in `assets/` for future brand work.

## Local fonts / offline use
The stylesheet references `fonts/AgravePro.ttf` and `fonts/Asimovian.ttf` using local `@font-face` declarations. Those binary font files were not included in the supplied assets. Add the properly licensed files with those exact names to the `fonts/` directory. Until then, system fallbacks render the site without external font requests. No Google Fonts CDN is used.

## Before launch
1. Replace the GitHub placeholder (`https://github.com/`) in `open-source.html` with the actual BuddyBoardz repository URL.
2. Verify blueprint figures against current official GSEB documentation.
3. Confirm the deployed PWA URL and privacy notice against the live application.
