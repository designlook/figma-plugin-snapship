# Snapship — Commit Design Changes to Repo (GitHub, GitLab)

Snapship turns the changes you make in a Figma file into a clean pull/merge request: a written
change log, a machine-readable manifest, a structure map of the file, and a screenshot of every
changed element — with deep links back to Figma. It's built so an **AI coding agent can read the MR
and implement the feature** from a PRD.

Zero build step — plain JS, runs straight from `manifest.json`.

---

## What it does

- **Log a change** — select one or more elements, write a **description**, optionally set a **commit
  folder**, and click **Add change**. The selected elements (name + node id) are captured automatically.
  Re-logging an element replaces its earlier entry (de-duped per element). Add is disabled with on-screen
  instructions until you select something.
- **Settings (⚙ top-right)** — manage **multiple repositories** (add several, pick the active one;
  defaults to the last used), each with its own **token** and **default folder**, plus a **reuse-folder**
  toggle (on by default).
- **Edit the PR/MR title** before committing.
- **Commit Changes** — pushes to GitHub or GitLab on a new branch and opens a **PR / MR**.

---

## What gets committed

Each commit goes to a new branch (`snapship-changes-<timestamp>`) and opens a PR/MR. Files land under
**`<repo default folder>/<commit folder>/`** (e.g. repo default `Docs/Designs` + commit folder `NX-3829`
→ `Docs/Designs/NX-3829/`); empty parts are skipped, default base is `handoff/`, slashes nest:

| File | Purpose |
|---|---|
| `<folder>/changes.md` | Human-readable log — description, **Open in Figma** link, screenshot per element |
| `<folder>/changes.json` | Machine-readable manifest (per change: `description`, `figmaLink`, each element's `name`/`nodeId`/`image`) |
| `<folder>/structure.md` | Indented tree of the whole file (page → frame → element, name + type) |
| `<folder>/img/<element>-<nodeId>.png` | A screenshot of each changed element |
| PR/MR **body** | Instruction template telling an AI agent how to implement (fetch specs via the Figma MCP, satisfy the PRD) |

---

## How to select (important)

Snapship attaches each change to **whatever is selected**, so select the *thing you mean*:

- **Select the frame/component itself**, not its inner pieces — click it once to select the
  top-level frame.
- **Don't drag-select a region** or double-click deep into a frame — that grabs dozens of child layers.
- Selecting **more than 10 elements** triggers a warning (that's almost always the *contents* of a
  frame, not the frame). Press **Esc** and click the frame once, or pick the parent in the Layers panel.
- To attach a change to several distinct elements on purpose, Shift-click them — each gets a screenshot.

---

## Install & test locally

1. Open the **Figma desktop app** (required for plugin development).
2. **Plugins → Development → Import plugin from manifest…** → pick `manifest.json`.
   Re-import only when `manifest.json` changes; for code edits just re-run (**Ctrl/Cmd + Alt + P**).
3. Run **Snapship** → open **Settings (⚙)** → paste repo URL + token → **Save**.
4. Select an element → write a description → **Add change**.
5. Adjust the **PR / MR title** → **Commit Changes** → it opens a PR/MR and shows the link.

---

## Repo + token

- **GitHub** — a classic PAT with the **`repo`** scope is simplest. (Fine-grained PATs must grant
  **Contents** and **Pull requests** read/write on the repo, and be org-approved for org repos.)
- **GitLab** — a PAT with the **`api`** scope.

### Is the token safe?

- Stored in **Figma `clientStorage`** — local to your machine, sandboxed to this one plugin.
- **Never written to the Figma file** and **never synced** to Figma's servers — teammates don't get it.
- Sent **only to GitHub/GitLab over HTTPS** at commit time.
- **Not** additionally encrypted at rest by the plugin (`clientStorage` is local storage, not a vault).
  Use a **minimal-scope token** (single repo, least privileges) to keep any local exposure low-risk.

---

## Best use — feed it to an AI agent

1. A designer logs changes and commits → a PR/MR appears with `changes.json`, screenshots, Figma
   links, `structure.md`, and the agent instruction body.
2. Paste your **PRD link + acceptance criteria** into the PR/MR body where indicated.
3. Point an AI coding agent (with the **Figma Dev Mode MCP** connected) at the PR/MR. For each change it:
   - reads `changes.json` for `nodeId`s and intent,
   - calls the Figma MCP `get_design_context` / `get_variable_defs` per node for the **exact** spec and
     tokens (and Code Connect mappings if set up),
   - uses `structure.md` for placement, and implements against the PRD's acceptance criteria.

Why this split: Snapship carries **intent + which nodes changed + stable links**; the Figma MCP supplies
the **pixel-exact spec live at build time**, so it never goes stale.

---

## How it works (technical)

**Two contexts, message-passing:**
- `code.js` — the plugin **main thread** (Figma sandbox): reads/writes the document, exports images,
  builds the markdown/JSON, orchestrates the commit. No DOM, no `fetch` here.
- `ui.html` — the plugin **UI iframe** (real browser context): the interface, and all GitHub/GitLab
  `fetch` calls. They talk over `postMessage` (`figma.ui.postMessage` ↔ `onmessage`).

**Storage:**
- **Per file** — `figma.root.setSharedPluginData("relay", …)`: selected `repoUrl`, `changes`, `folder`
  (last commit folder), `reuseId`. Travels with the Figma file.
- **Per user, local** — `figma.clientStorage`: `repos` (array of `{ url, token, folder }`) and `lastRepo`.
  Tokens never leave your machine. *(Internal keys are still namespaced `relay` from the original name.)*

**Commit pipeline (UI iframe):**
1. `code.js` exports each changed node via `node.exportAsync({ format: "PNG" })` — capped to 1440px
   wide for speed — and base64-encodes in the UI.
2. GitHub: `GET /repos/:o/:r` (default branch) → `GET …/git/ref/heads/:base` (sha) →
   `POST …/git/refs` (new branch) → for each file `PUT …/contents/:path` (looks up the file's sha on
   the branch, retries on 422) → `POST …/pulls`.
   GitLab: `GET /projects/:id` → single `POST …/repository/commits` with all file actions
   (`encoding: base64`) on a new branch via `start_branch` → `POST …/merge_requests`.
3. The resulting PR/MR URL is shown and opened via `figma.openExternal`.

**Figma deep link:** built from `figma.fileKey` + node id. `figma.fileKey` is only exposed to
private/local plugins, so the manifest sets `enablePrivatePluginApi: true`. If empty, the per-element
`figmaLink` still carries the file key + node id.

**Manifest highlights:** `editorType: ["figma","dev"]`, `enablePrivatePluginApi: true`,
`networkAccess.allowedDomains: ["https://api.github.com","https://gitlab.com"]`.

---

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Plugin manifest (network access, private API flag) |
| `code.js` | Main thread — storage, image export, markdown/JSON/structure builders, commit orchestration |
| `ui.html` | UI — add change, list, settings, reuse toggle, GitHub/GitLab commit |

---

## Caveats

- The **Open in Figma** link needs `figma.fileKey` → Snapship can run locally and be published
  **privately to an org**, but **not to the public Community store** while it uses the file link.
- Network calls go straight to the GitHub/GitLab APIs from the plugin sandbox; a clean `403` is almost
  always a token-permission issue, not the code.
- Screenshots are exported fresh **at commit time**; a deleted element is skipped.

## License

MIT — see `LICENSE`.
