# Prompts.md — Dev-Detective (Sprint 3)

This file logs how AI assistance was used while building this project, per the
sprint's "pair-programmer" policy. Use it as a template — replace with your own
notes on what you asked, what you learned, and where you diverged from the
suggestion.

## Prompt 1 — Understanding async/await vs. Promises

**Asked:** "Explain the difference between a `.then()` chain and `async/await`
for a fetch call, and why the 404 case needs its own check instead of relying
on `.catch()` alone."

**Takeaway:** `fetch()` only rejects on a network failure — a 404 or 403 still
resolves successfully with `response.ok === false`. That's why `fetchUser()`
checks `res.status` explicitly before deciding whether to throw, rather than
trusting `.catch()` to catch API-level errors.

## Prompt 2 — Chaining the repos request

**Asked:** "Once I have the user object, how do I use `repos_url` to fetch
their repositories, and how do I get the 5 most recent ones?"

**Takeaway:** `repos_url` is already a full endpoint on the user object, so no
manual URL building is needed. Repos aren't sorted by creation date by
default, so the array is sorted client-side by `created_at` (descending)
before slicing the top 5.

## Prompt 3 — Promise.all for Face-off mode

**Asked:** "How do I fetch two different users' data at the same time
instead of one after another, and total up their repo stars?"

**Takeaway:** `Promise.all([...])` runs both user+repo fetch chains
concurrently instead of sequentially, which is faster and is the standard
pattern for "fetch N independent things" per the sprint brief. Total stars
per user come from `repos.reduce((acc, r) => acc + r.stargazers_count, 0)`.

## Where I diverged from the AI's first suggestion

The first draft used a generic spinner ("Loading...") for the loading state.
I replaced it with the redacted-bar UI (`.redact-row` blocks) to match the
case-file visual concept and to make the loading state something a reviewer
would actually notice in the QA video, per Phase 1's requirement to
explicitly demonstrate the loading state.

## Concepts I made sure I could explain before pushing

- Why `fetch` doesn't reject on HTTP error status codes
- The difference between `Promise.all` and sequential `await` calls
- `Array.prototype.reduce` for the star-count accumulator
- `encodeURIComponent` on the username to avoid a malformed request URL
