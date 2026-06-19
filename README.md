# Snapship — Commit Design Changes to Repo (GitHub, GitLab)

Snapship turns the changes you make in a Figma file into a clean pull/merge request: a written
change log, a JSON manifest, and a screenshot of every changed element — with deep links back to
Figma. It's built so an **AI coding agent can read the MR and implement the feature** from a PRD.

Zero build step — plain JS, runs straight from `manifest.json`.

---

## What it does

- **Log a change** — select one or more elements in Figma, optionally paste a **Jira link**, write a
  **description**, and click **Add change**. The selected elements (name + node id) are captured
  automatically. Re-logging the same element replaces its earlier entry (de-duped per element).
- **Changes list** — everything logged for this file, stored on the file itself.
- **Edit the PR/MR title** — prefilled with `Snapship changes — <file>`; change it to anything.
- **Commit Changes** — pushes to GitHub or GitLab on a new branch and opens a **PR / MR** containing:
  - `handoff/changes.md` — human-readable log (description, Jira link, **Open in Figma** link, screenshot per element).
  - `handoff/changes.json` — machine-readable manifest (per change: description, jira, figmaLink, and each element's `name` / `nodeId` / `image`).
  - `handoff/img/*.png` — a screenshot of each changed element, named by element + node id.
  - **PR/MR body** = an instruction template telling an AI agent how to implement the changes.
  The change queue clears once the commit succeeds.
- **Repo setup** — the repo URL is saved **with the Figma file** (so it's remembered per file and shared
  with teammates who open it); the access token is stored **locally on your machine** (Figma
  `clientStorage`), never in the file. Change either anytime with the **Change** button.

---

## Install & test locally

1. Open the **Figma desktop app** (plugin development requires it).
2. **Plugins → Development → Import plugin from manifest…** → pick `manifest.json` in this folder.
   (Re-import only when `manifest.json` changes; for code edits just re-run.)
3. Run **Snapship**. First run: open repo setup, paste your repo URL + token, **Save**.
4. Select an element on the canvas → write a description (and/or Jira link) → **Add change**.
5. Adjust the **PR / MR title** → **Commit Changes** → it opens a PR/MR and shows the link.
6. After editing `code.js` / `ui.html`, just re-run the plugin (**Ctrl/Cmd + Alt + P**) — no re-import.

---

## How to select (important)

Snapship attaches each change to **whatever you have selected**, so select the *thing you mean*:

- **Select the frame/component itself**, not its inner pieces. Click the element once to select the
  top-level frame; the screenshot and node link then represent the whole design, not a stray layer.
- **Don't drag-select a region** or double-click deep into a frame — that grabs dozens of child layers.
- If you select **more than 10 elements**, Snapship shows a warning: that's almost always the *contents*
  of a frame rather than the frame. Press **Esc** and click the frame once, or pick the parent in the
  **Layers panel**, then re-add.
- To attach a change to several distinct elements on purpose, multi-select them (Shift-click) — Snapship
  captures a screenshot of each.

---

## Repo + token

- **GitHub** — a classic PAT with the **`repo`** scope is simplest. (Fine-grained PATs must grant
  **Contents** and **Pull requests** read/write on the repo, and be approved by the org if it's an org repo.)
- **GitLab** — a PAT with the **`api`** scope.
- The token is stored in Figma `clientStorage` (local, per user) — never written to the file.

---

## Best use — feed it to an AI agent

Snapship's output is designed to drive an automated build, not just document handoff:

1. A designer logs changes in Figma and commits → a PR/MR appears with `changes.json` + screenshots +
   Figma links + the agent instruction body.
2. Paste your **PRD link + acceptance criteria** into the PR/MR body where indicated.
3. Point an AI coding agent (with the **Figma Dev Mode MCP** connected) at the PR/MR. For each change it:
   - reads `changes.json` to get the element `nodeId`s and intent,
   - calls the Figma MCP `get_design_context` / `get_variable_defs` on each node for the **exact** spec
     and tokens (and Code Connect mappings if set up),
   - implements against your PRD's acceptance criteria.

Why this split: Snapship carries **intent + which nodes changed + stable links**; the Figma MCP supplies the
**pixel-exact spec live at build time** (so it never goes stale). That combination is what lets an agent
build a feature accurately instead of guessing from a screenshot.

---

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Plugin manifest (network access to GitHub/GitLab; `enablePrivatePluginApi` for the Figma link) |
| `code.js` | Main thread — change storage, repo settings, image export, commit orchestration |
| `ui.html` | UI — add change, list, repo setup, GitHub/GitLab commit |

---

## Notes & caveats

- The **Open in Figma** link needs `figma.fileKey`, which is only available to **private/local** plugins
  (hence `enablePrivatePluginApi`). This means Snapship can run locally and be published *privately to an
  org*, but **not to the public Community store** while it uses the file link. If `fileKey` is empty, the
  per-element `figmaLink` still carries the file key + node id.
- Network calls go straight to the GitHub/GitLab APIs from the plugin sandbox; if a call is blocked the
  status shows the exact error. A clean `403` is almost always a token-permission issue, not the code.
- Screenshots are exported fresh **at commit time** from the live elements; a deleted element is skipped.

## License

MIT — see `LICENSE`.
