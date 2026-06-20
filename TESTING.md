# Testing Snapship — step-by-step walkthrough

A 5-minute scripted test so you can see exactly what the plugin does and what it outputs.
Works on a **free** Figma account.

## Setup

1. Open the **Figma desktop app**, create a new design file.
2. Draw a rectangle (press **R**, drag). In the Layers panel, double-click its name and rename it
   **`Button / Primary`**.
3. Run the plugin: **Plugins → Development → Snapship**
   (or **Ctrl+Alt+P** if it was the last plugin run).

## Step 1 — Select the element

- Click the `Button / Primary` rectangle.
- **Expected:** the plugin panel shows the element name and "No changes logged yet."
- If you see "Select elements to log a change," nothing is selected — click the layer.

## Step 2 — Add a change

- Fill in the **description**: `Updated button radius to 8px and changed fill to brand blue`
- Leave **commit folder** blank for now.
- Click **Add change**.
- **Expected:** the form clears and a change card appears with the element name and your description.

## Step 3 — Add another change

- Select a different element (or draw a new one and rename it `Nav / Header`).
- Description: `Added sticky positioning to header, z-index 100`
- Click **Add change**.
- **Expected:** a second card appears.

## Step 4 — Configure a repository (Settings)

- Click the **⚙ settings** icon (top-right).
- Enter a GitHub repo URL (e.g. `https://github.com/yourname/yourrepo`) and a personal access token.
- Optionally set a **default folder** (e.g. `Docs/Designs`).
- Click **Save**.
- **Expected:** the repo appears in the repo list, the Commit button becomes active.

## Step 5 — Edit the PR title and commit

- Back on the main view, edit the **PR title** if desired.
- Click **Commit Changes**.
- **Expected:** Snapship exports screenshots, pushes a branch `snapship-changes-<timestamp>`,
  creates a PR/MR, and shows a success message with a link to the PR.

## Step 6 — Check the PR

Open the PR on GitHub/GitLab. You should see:
- `changes.md` — human-readable log with Figma links and inline screenshots
- `changes.json` — machine-readable manifest
- `structure.md` — full file tree
- `img/` folder — PNG screenshots of each changed element
- PR body — AI agent instruction template referencing the committed files

## Step 7 — Confirm queue clears

After a successful commit, **Expected:** the change queue empties automatically.

## What "good" looks like

- Logging a change feels like a quick commit message, not a documentation task.
- The PR body gives an AI agent everything it needs to implement the change without guessing.
- Screenshots land in `img/` alongside the spec files.

## Notes & gotchas

- **Commit only works in design mode** — you need the Figma desktop app and a valid token.
- **NS key changed** from `relay` to `snapship` — existing plugin data stored under the old key
  won't carry over. Start fresh after migrating.
- Nothing leaves your machine except to your own repo via the GitHub/GitLab API.
