# Installing Relay

## 1. Local install (development)

Requires the **Figma desktop app** — the browser version can't load a local manifest.

1. Open the Figma desktop app.
2. Top-left menu → **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` in this folder
   (`C:\Users\scott\Documents\Claude\Projects\Business Ideas 2026\relay-figma-plugin\manifest.json`).
4. Open any design file, **select one element**, then
   **menu → Plugins → Development → Relay — Handoff Intent**
   (or right-click the canvas → Plugins → Development → Relay).
5. Test the developer side: toggle **Dev Mode** (the `</>` switch top-right, or **Shift + D**),
   then run Relay again — it shows the notes read-only with an export option.

**Reloading after code edits:** just re-run the plugin — quickest is **Ctrl + Alt + P**
(rerun last plugin). No reinstall needed; the plugin points at these local files.

## 1b. Re-testing after you change the code

You do **not** need to delete or re-import the plugin. A development plugin points at these
local files, so each time you run it, the latest `code.js` and `ui.html` are loaded fresh.

To pick up changes:
1. If the plugin panel is open, close it (✕).
2. Re-run it — **Ctrl + Alt + P** (rerun last plugin), or right-click canvas →
   **Plugins → Development → Relay — Handoff Intent**.

That's it. Editing `code.js` or `ui.html` only requires a re-run.

**Exception — manifest changes:** if you edit `manifest.json` (name, id, fields), re-import it:
**Plugins → Development → Manage plugins in development → remove Relay**, then
**Import plugin from manifest…** again. Code/UI edits never need this.

## 2. Publishing to the Figma Community ("marketplace")

1. Desktop app → **menu → Plugins → Development → Manage plugins in development**,
   find Relay → **Publish** (or right-click the plugin → Publish).
2. Complete the listing:
   - Name + one-line tagline
   - Description (treat like SEO — exact-match title, keyword-rich body)
   - **128×128** icon
   - **1920×960** cover image
   - Screenshots, tags, support contact
3. **Submit for review.** Figma checks it against the plugin guidelines; approval usually takes a few days.
4. Once approved it's live on Community. Each update is bumped and re-reviewed.
5. **To charge (later):** get approved to sell, connect **Stripe**, set a price
   (one-time or subscription, $2 minimum). This enables the Pro tier.

## 3. How end users install it once published

Figma → **Resources panel / Plugins search** → search "Relay" → **Run** (or **Save** to keep it).
From the Community page it's a one-click "Open in Figma / Save." No manifest or desktop-only
requirement for them.
