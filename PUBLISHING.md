# Relay — Figma Community Publishing Kit

Everything to paste into the **Plugins → Development → Publish** form. Copy is written to match
what the plugin actually does today (don't overclaim — it drives bad reviews). Roadmap items are
clearly marked "coming soon."

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
Relay — Handoff Intent
```

### Tagline (one line, ~shown under the name)
```
Capture interaction, state & accessibility intent — and hand it to developers as a spec.
```

### Short description (first line of the listing)
```
Designers attach the intent pixels can't show — interactions, states, accessibility — and Relay turns it into a clean handoff spec developers can read and export.
```

### Full description (paste into the description box)
```
Handoff breaks because intent never reaches the developer. Measurements and colors are easy — what's missing is the behavior: what happens on tap, which states exist, what the empty and error cases are, and the accessibility semantics. That intent lives in the designer's head, not the pixels.

Relay fixes that. Instead of a blank notes box, it gives you structured templates for the things developers actually need, then turns them into a spec they can read and paste into their workflow.

WHAT IT DOES
• Attach typed intent to any element — Interaction, States & logic, Accessibility.
• Structured templates prompt for the specifics (trigger, behavior, motion, states, role, label, keyboard) so nothing gets forgotten.
• Mark each note Draft or Ready as the design firms up.
• Read-only developer view to review intent without changing the design.
• Export a clean Markdown handoff spec — grouped by element, with copy-paste accessibility attributes (role / aria-label).

WHO IT'S FOR
Product teams where designers and front-end developers hand off regularly — especially anyone who's tired of implementations drifting from the design because the intent got lost.

WHY IT'S DIFFERENT
Freeform comments and annotations let you write anything (and forget everything). Relay is opinionated: it captures a complete, structured handoff and lets you take it out of Figma as a spec — including ready-to-paste ARIA.

Free to use. No account, no backend — notes are stored on the file itself.

COMING SOON
More intent types (responsive, motion, content rules, edge cases), and export to Jira / Linear / Storybook.

Feedback welcome — it directly shapes what ships next.
```

### Tags (add up to ~12)
```
handoff, developer handoff, dev mode, annotations, accessibility, a11y, specs, documentation, design systems, engineering, qa, intent
```

### Support contact
Use a real inbox you'll check. Options:
- Email: `scott.yu@gmail.com` (or set up a dedicated `support@…` later)
- Or a GitHub issues URL: `https://github.com/designlook/relay-figma-plugin/issues`

### Permissions / network access
Already set in `manifest.json`: **no network access** (`allowedDomains: ["none"]`). Say so if asked —
it's a trust signal: the plugin sends nothing anywhere.

---

## Screenshots to take (1–5, in this order)

Capture at 16:9 (e.g. 1920×960). Frame the plugin panel over a real-looking design file.

1. **Authoring** — the Interaction template filled in on a selected component. Caption: "Capture the intent pixels can't show."
2. **A note card** — an element with Interaction + Accessibility notes, one marked Ready. Caption: "Typed, structured — not a blank box."
3. **Developer view** — the read-only dev preview of the same element. Caption: "Developers read the intent, no guesswork."
4. **Markdown export** — the exported spec with the `role`/`aria-label` code block visible. Caption: "Export a dev-ready spec, ARIA included."
5. (Optional) **The three tabs** — Interaction / States / A11y. Caption: "Interaction, states, and accessibility."

Tip: the cover image (`assets/cover-1920x960.png`) already illustrates the design→Dev Mode flow and can double as screenshot #1 or the hero.

---

## Before you click Publish

- [ ] Icon + cover uploaded
- [ ] At least 2–3 screenshots
- [ ] Name, tagline, description pasted
- [ ] Tags added
- [ ] Support contact set
- [ ] Test the plugin once more from a clean run (Ctrl+Alt+P)
- [ ] Optional: attach a small **playground file** (a sample frame with a couple of notes already added) so reviewers/users can try it instantly

Then **Submit for review**. Approval typically takes a few days. Updates are bumped and re-reviewed.

## Going paid later
To charge for a Pro tier: get approved to sell on Community, connect **Stripe**, and set a price
(one-time or subscription, $2 minimum). Keep the core free tier to drive installs and search ranking.
