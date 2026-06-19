# Relay — Handoff Intent (Figma plugin)

Surfaces designer **intent** — interactions, states, and accessibility — that pixels can't
convey. Designers author notes on elements in **Design mode**; developers read them in the
**Dev Mode** inspect panel and export a clean Markdown spec.

Working prototype. Zero build step — plain JS, runs straight from `manifest.json`.

## What it does (MVP)

- Attach intent notes to any single element, typed **Interaction / States / Accessibility**.
- Notes are stored on the node via `sharedPluginData`, so they travel with the file.
- Mark a note **Ready** (vs Draft).
- In **Dev Mode** the plugin is read-only — developers select an element and read the intent.
- **Export Markdown** of every annotated element on the page (paste into a PR/Jira/Linear).

## Test it locally

1. Use the **Figma desktop app** (plugin development requires it).
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` in this folder.
4. Open any design file. **Select one element**, run **Plugins → Development → Relay — Handoff Intent**.
5. Pick a tab (Interaction / States / A11y), type the intent, **Add note**. Add a few.
6. Click **Export Markdown** to see the page spec.
7. Switch the file to **Dev Mode** (top-right toggle), run Relay again, select the same element —
   you'll see the notes read-only, and can export.

To reload after editing the code: **Plugins → Development → Relay → right-click → Reload**, or
re-run the plugin.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Plugin manifest (runs in both `figma` and `dev` editors) |
| `code.js` | Plugin main thread — storage, selection, export |
| `ui.html` | Plugin UI — authoring + read-only views |

## Roadmap (post-MVP)

- More intent types: responsive/breakpoints, motion, content rules, edge cases, data binding.
- Native Dev Mode **inspect panel** integration + codegen output.
- Team templates, status workflow, Jira/Linear/Storybook export.
- See `../figma-handoff-plugin-spec.md` for the full spec.

## License

MIT — see `LICENSE`.
