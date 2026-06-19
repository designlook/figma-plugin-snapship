# Relay — Figma change log → GitHub / GitLab

Log the changes you make in a Figma file, then commit them to your repo as a PR/MR.
Zero build step — plain JS, runs straight from `manifest.json`.

## What it does

- **Add a change** — select one or more elements, optionally paste a **Jira link**, write a **description**,
  and click **Add change**. The selected elements are captured automatically. Logging a change for an
  element you've already logged replaces the earlier entry (de-duped per element).
- **Changes list** — everything you've logged for this file, stored on the file itself.
- **Commit Changes** — pushes the list to GitHub or GitLab as `handoff/changes.md` (plus a **PNG** of each
  element under `handoff/img/`) on a new branch and opens a **PR / MR**, with a deep **Figma link** back to
  each element. The queue clears once it's committed. (The Figma link needs `figma.fileKey`, which is only
  available to private/local plugins — hence `enablePrivatePluginApi` in the manifest.)
- **Structure map** — every commit also writes `handoff/structure.md`, an indented tree of the whole file
  (every page → frame → element, with name + type) so an AI or developer can understand the file's layout.
- **Repo setup** — the first time, set a **repo URL** + **access token**. The URL is saved *with the Figma
  file* (so it's remembered per file); the token is stored *locally on your machine*. Change it anytime
  with the **Change** button.

## Test locally

1. Figma desktop app → **Plugins → Development → Import plugin from manifest…** → pick `manifest.json`.
2. Run **Relay**. First run: set your repo URL + token.
3. Select an element, add a change (Jira link and/or description), then **Commit Changes**.
4. Re-running after code edits: just re-run the plugin (Ctrl+Alt+P) — no re-import needed.

## Repo + token

- **GitHub**: classic PAT with the **`repo`** scope (simplest), or a fine-grained PAT with **Contents** and
  **Pull requests** read/write on the repo.
- **GitLab**: PAT with the **`api`** scope.
- The token lives in Figma `clientStorage` (local, per user) — never saved in the file.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Plugin manifest (network access to GitHub/GitLab APIs) |
| `code.js` | Main thread — change storage, repo settings, commit orchestration |
| `ui.html` | UI — add change, list, repo setup, GitHub/GitLab commit |

## License

MIT — see `LICENSE`.
