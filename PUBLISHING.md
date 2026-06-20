# Snapship — Figma Community Publishing Kit

Everything to paste into the **Plugins → Development → Publish** form.

---

## Asset checklist

| Asset | Spec | Status |
|---|---|---|
| Icon | 128×128 PNG | ✅ `assets/icon-128.png` |
| Cover art | 1920×960 PNG | ✅ `assets/cover-1920x960.png` |
| Screenshots | 1–5, 1920×960 (or 16:9) | ⬜ capture per "Screenshots to take" below |
| Creator profile | Figma handle/avatar | ⬜ set up on your Figma account |
| Support contact | email or URL | ⬜ see below |

---

## Field-by-field

### Name
```
Snapship — Commit Design Changes to Repo (GitHub, GitLab)
```

### Tagline
```
Select elements, describe the change, commit — Snapship opens a PR/MR with screenshots and an AI-ready spec.
```

### Short description
```
Snapship turns Figma changes into a clean pull/merge request: a written log, a machine-readable manifest, a file structure map, and a screenshot of every changed element — with deep links back to Figma.
```

### Full description
```
Handoff breaks when design changes aren't communicated clearly. Snapship fixes that by turning the changes you make in a Figma file into a structured PR/MR an AI coding agent can read and implement.

WHAT IT DOES
• Log a change — select elements, write a description, optionally set a commit folder, click Add change. Re-logging an element replaces its earlier entry (de-duped per element).
• Manage repositories — add multiple GitHub/GitLab repos, each with its own token and default folder. Switch the active repo from settings.
• Commit Changes — pushes to a new branch and opens a PR/MR automatically.

WHAT GETS COMMITTED
Each commit lands on a new branch (snapship-changes-<timestamp>) and opens a PR/MR with:
• changes.md — human-readable log with Open in Figma links and screenshots
• changes.json — machine-readable manifest (description, figmaLink, element name/nodeId/image)
• structure.md — indented tree of the whole file (page → frame → element)
• img/<element>.png — screenshot of each changed element
• PR/MR body — instruction template for an AI agent to implement the changes

WHO IT'S FOR
Product teams and solo designers who want design changes to flow directly into a developer workflow or AI coding agent — with zero manual export steps.

WHY IT'S DIFFERENT
Most handoff tools describe the final design state. Snapship captures what changed and why, packages it for an AI agent, and opens the PR in one click.

Zero build step — plain JS, runs straight from manifest.json.
Free to use. No account, no backend beyond your own repo token.
```

### Tags
```
handoff, developer handoff, pull request, github, gitlab, commit, AI agent, design-to-code, changelog, screenshots, documentation, engineering
```

### Support contact
- Email: `scott.yu@gmail.com`
- GitHub issues: `https://github.com/designlook/snapship/issues`
- Figma Community: `https://www.figma.com/community/plugin/1649742475700979863`

### Permissions / network access
Set in `manifest.json`: **network access to GitHub and GitLab APIs only** (no data sent elsewhere).

---

## Screenshots to take (1–5, in this order)

Capture at 16:9 (e.g. 1920×960). Frame the plugin panel over a real-looking design file.

1. **Add change** — select a component, fill in the description, click Add change. Caption: "Log what changed and why."
2. **Change list** — two or three changes queued up. Caption: "Build a commit queue before pushing."
3. **Settings panel** — repo URL + token configured, folder set. Caption: "Works with GitHub and GitLab."
4. **PR/MR opened** — show the resulting GitHub PR body with the AI instruction template. Caption: "One click opens a PR an AI agent can implement."
5. (Optional) **structure.md in GitHub** — the file tree output. Caption: "AI gets the full file map."

---

## Before you click Publish

- [ ] Icon + cover uploaded
- [ ] At least 2–3 screenshots
- [ ] Name, tagline, description pasted
- [ ] Tags added
- [ ] Support contact set
- [ ] Test the plugin once more from a clean run (Ctrl+Alt+P)

Then **Submit for review**. Approval typically takes a few days.

## Going paid later
To charge for a Pro tier: get approved to sell on Community, connect **Stripe**, and set a price
(one-time or subscription, $2 minimum). Keep the core free tier to drive installs and search ranking.
