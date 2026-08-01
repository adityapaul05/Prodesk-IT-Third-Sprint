# Dev-Detective

A client-side GitHub lookup tool built for Sprint 3 ("The API Hunter"). Native
`fetch`, `async/await`, and JSON parsing only — no frameworks, no build step.

## What it covers

**Phase 1 — Base MVP**
- Search input + profile ("dossier") card
- `GET https://api.github.com/users/{username}`
- Renders avatar, name, bio, join date, portfolio URL
- Loading state (redacted-bar animation) while the request is in flight
- Clean "No Record Found" state on a 404 — the app never crashes

**Phase 2 — Data expansion**
- Chains a second fetch to the user's `repos_url`
- Renders the top 5 most recently created repos as clickable links
  (`target="_blank" rel="noopener noreferrer"`)
- Formats ISO timestamps (`2023-01-25T12:00:00Z`) into `25 Jan 2023`

**Phase 3 — Face-off mode**
- Toggle reveals a second input
- `Promise.all()` fetches both subjects concurrently
- Reduces each subject's repos to a total star count
- Stamps a green "Winner" / red "Loser" (or "Tie") on each dossier

## Run it locally

No build tools needed — plain HTML/CSS/JS.

```bash
# any static server works, e.g.:
npx serve .
# or just open index.html directly in a browser
```

## Deploy (Vercel / Netlify)

Since this is static HTML/CSS/JS with no build step:

- **Vercel:** import the repo, leave the framework preset as "Other" — no
  build command, output directory is the project root.
- **Netlify:** same — no build command, publish directory `/`.

## Version control

This repo ships with real incremental commit history (scaffold → Phase 1 →
Phase 2 → Phase 3 → docs → bugfix) instead of one boilerplate drop. To push it
as-is:

```bash
git remote add origin <your-empty-repo-url>
git branch -M main
git push -u origin main
```

## Known issue fixed

Large numbers (high star counts, long repo names, long bios) previously
overflowed the dossier cards' fixed-width layout. Fixed by:
- `toLocaleString()` on star counts and repo counts, so `192843` renders as `192,843`
- `minmax(0, 1fr)` on grid columns so cells can shrink instead of forcing overflow
- ellipsis truncation on long repo names, with the star count kept at a fixed width
- `overflow-wrap: anywhere` on bios/usernames/contact URLs

## A note on API rate limits

GitHub allows 60 unauthenticated requests/hour per IP. If you hit a 403 while
testing repeatedly, the app shows an "Access Restricted" message rather than
crashing. For heavier testing, generate a personal access token and add an
`Authorization: Bearer <token>` header to the two `fetch()` calls in
`script.js`.

## Files

- `index.html` — markup and structure
- `styles.css` — all styling, layout, and animation
- `script.js` — search logic, GitHub API calls, and rendering
- `Prompts.md` — AI pair-programming log for this sprint's submission
