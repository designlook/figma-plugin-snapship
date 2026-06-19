// Snapship — log design changes on a Figma file and commit them to GitHub / GitLab.
// Changes + repo URL are stored on the file; the access token is stored locally per user.

const NS = "relay";

figma.showUI(__html__, { width: 380, height: 600, themeColors: true });

function getDoc(k, def) { const v = figma.root.getSharedPluginData(NS, k); return v || def; }
function setDoc(k, v) { figma.root.setSharedPluginData(NS, k, v); }
function getChanges() { try { return JSON.parse(getDoc("changes", "[]")); } catch (e) { return []; } }
function setChanges(arr) { setDoc("changes", JSON.stringify(arr)); }

function currentSelectionName() {
  const sel = figma.currentPage.selection;
  if (sel.length === 1) return sel[0].name;
  if (sel.length > 1) return sel.length + " elements";
  return "";
}

function selectedNode() {
  const sel = figma.currentPage.selection;
  return sel.length === 1 ? sel[0] : null;
}

function rgbToHex(c) {
  function h(n) { var s = Math.round(n * 255).toString(16); return s.length < 2 ? "0" + s : s; }
  return "#" + h(c.r) + h(c.g) + h(c.b);
}

// A short auto-summary of the element's current design state.
function nodeDetails(node) {
  if (!node) return "";
  const p = [node.type.toLowerCase().replace(/_/g, " ")];
  try { p.push(Math.round(node.width) + "×" + Math.round(node.height)); } catch (e) {}
  if (node.type === "TEXT") {
    try { const t = node.characters; if (t) p.push('"' + (t.length > 40 ? t.slice(0, 40) + "…" : t) + '"'); } catch (e) {}
  }
  try {
    if ("fills" in node && Array.isArray(node.fills)) {
      const f = node.fills.filter(function (x) { return x.type === "SOLID" && x.visible !== false; })[0];
      if (f && f.color) p.push(rgbToHex(f.color));
    }
  } catch (e) {}
  return p.join(" · ");
}

// Deep link to the node (needs figma.fileKey — only available to private/local plugins).
function nodeUrl(node) {
  try {
    var key = figma.fileKey;
    if (!key || !node) return "";
    return "https://www.figma.com/design/" + key + "/" + encodeURIComponent(figma.root.name || "file") + "?node-id=" + node.id.replace(":", "-");
  } catch (e) { return ""; }
}

function pushState() {
  figma.clientStorage.getAsync("relayToken").then(function (t) {
    figma.ui.postMessage({
      type: "state",
      changes: getChanges(),
      repo: getDoc("repoUrl", ""),
      hasToken: !!t,
      editable: figma.editorType === "figma",
      selection: currentSelectionName(),
      selectionCount: figma.currentPage.selection.length,
      fileName: figma.root.name
    });
  });
}

figma.on("selectionchange", pushState);
pushState();

function jiraLabel(url) {
  const m = (url || "").match(/([A-Z][A-Z0-9]+-\d+)/);
  return m ? m[1] : url;
}

function slug(s) { return (String(s || "element").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)) || "element"; }
function changeNodes(c) { return (c.nodes && c.nodes.length) ? c.nodes : (c.nodeId ? [{ id: c.nodeId, name: c.element }] : []); }
function changeKey(c) { var ids = changeNodes(c).map(function (n) { return n.id; }).sort().join(","); return ids || (c.element || ""); }
function imgNameFor(n) { return slug(n.name) + "-" + String(n.id).replace(/[^a-z0-9]+/gi, "-") + ".png"; }

function buildChangesMd(changes) {
  const lines = ["# Changes — " + figma.root.name, ""];
  changes.forEach(function (c) {
    lines.push("## " + (c.element || "Change"), "");
    if (c.desc) lines.push(c.desc, "");
    const links = [];
    if (c.jira) links.push("[" + jiraLabel(c.jira) + "](" + c.jira + ")");
    if (c.figmaLink) links.push("[Open in Figma](" + c.figmaLink + ")");
    if (links.length) lines.push(links.join(" · "), "");
    changeNodes(c).forEach(function (n) {
      lines.push("![" + n.name + "](img/" + imgNameFor(n) + ")", "");
    });
    lines.push("---", "");
  });
  return lines.join("\n");
}

// Indented tree of the whole file (names + types) so an AI can understand the structure.
function buildStructureMd() {
  const lines = ["# Structure — " + figma.root.name, "", "```"];
  let count = 0;
  function walk(nodes, indent) {
    for (const n of nodes) {
      if (count++ > 8000) return;
      lines.push(indent + n.name + " (" + n.type.toLowerCase().replace(/_/g, " ") + ")");
      if ("children" in n && n.children && n.children.length) walk(n.children, indent + "  ");
    }
  }
  const pages = figma.root.children;
  for (let i = 0; i < pages.length; i++) {
    if (count++ > 8000) break;
    lines.push(pages[i].name + " (page)");
    walk(pages[i].children, "  ");
  }
  lines.push("```", "");
  return lines.join("\n");
}

function safeFileKey() { try { return figma.fileKey || ""; } catch (e) { return ""; } }

// Machine-readable manifest an AI agent can parse deterministically.
function buildChangesJson(changes) {
  const out = {
    file: figma.root.name,
    fileKey: safeFileKey(),
    generatedBy: "Snapship",
    changes: changes.map(function (c) {
      return {
        id: c.id,
        description: c.desc || "",
        jira: c.jira || "",
        figmaLink: c.figmaLink || "",
        elements: changeNodes(c).map(function (n) {
          return { name: n.name, nodeId: n.id, image: "img/" + imgNameFor(n) };
        })
      };
    })
  };
  return JSON.stringify(out, null, 2);
}

// PR/MR body that orchestrates an implementing AI agent.
function buildPrBody() {
  const key = safeFileKey();
  return [
    "Generated by Snapship.",
    "",
    "## For the implementing agent",
    "",
    "1. Read `handoff/changes.json` — each change has a description, Jira link, and the changed Figma elements (name, nodeId, screenshot).",
    "2. For each element, fetch the exact spec via the Figma MCP: `get_design_context` (file key + nodeId) and `get_variable_defs` for tokens. Use Code Connect mappings when available.",
    "3. Use `handoff/structure.md` to understand the file's layout and naming.",
    "4. Implement so the acceptance criteria in the PRD (below) pass.",
    "",
    "Screenshots: `handoff/img/`." + (key ? " Figma file key: `" + key + "`." : ""),
    "",
    "<!-- Paste PRD link + acceptance criteria here -->"
  ].join("\n");
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "addChange") {
    if (figma.editorType !== "figma") {
      figma.ui.postMessage({ type: "err", message: "Switch to Design mode to add changes." });
      return;
    }
    const arr = getChanges();
    const sel = figma.currentPage.selection;
    const nodes = sel.map(function (n) { return { id: n.id, name: n.name }; });
    const nc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      element: currentSelectionName(),
      nodes: nodes,
      figmaLink: nodes.length ? nodeUrl(sel[0]) : "",
      jira: msg.jira || "",
      desc: msg.desc || "",
      ts: Date.now()
    };
    // de-dupe per element: any element in the new change is removed from earlier changes;
    // an earlier change that loses all its elements is dropped.
    const newIds = {};
    nodes.forEach(function (n) { newIds[n.id] = true; });
    const cleaned = [];
    arr.forEach(function (c) {
      const orig = changeNodes(c);
      if (!orig.length) { cleaned.push(c); return; } // description-only change — keep
      const kept = orig.filter(function (n) { return !newIds[n.id]; });
      if (kept.length) {
        const el = kept.length === 1 ? kept[0].name : kept.length + " elements";
        cleaned.push(Object.assign({}, c, { nodes: kept, element: el }));
      }
    });
    cleaned.push(nc);
    setChanges(cleaned);
    pushState();
    return;
  }

  if (msg.type === "deleteChange") {
    setChanges(getChanges().filter(function (c) { return c.id !== msg.id; }));
    pushState();
    return;
  }

  if (msg.type === "saveRepo") {
    setDoc("repoUrl", (msg.repo || "").trim());
    if (msg.token) { figma.clientStorage.setAsync("relayToken", msg.token).then(pushState); }
    else { pushState(); }
    return;
  }

  if (msg.type === "clearToken") {
    figma.clientStorage.setAsync("relayToken", "").then(pushState);
    return;
  }

  if (msg.type === "commit") {
    const repo = (msg.repo || getDoc("repoUrl", "")).trim();
    if (!repo) { figma.ui.postMessage({ type: "commitDone", ok: false, message: "Set a repository first." }); return; }
    setDoc("repoUrl", repo);
    const changes = getChanges();
    if (!changes.length) { figma.ui.postMessage({ type: "commitDone", ok: false, message: "No changes to commit." }); return; }
    const go = async function (token) {
      if (!token) { figma.ui.postMessage({ type: "commitDone", ok: false, message: "Set an access token first." }); return; }
      const images = [];
      for (const c of changes) {
        const ns = changeNodes(c);
        for (let idx = 0; idx < ns.length; idx++) {
          const node = figma.getNodeById(ns[idx].id);
          if (node && node.exportAsync) {
            try {
              const w = node.width || 0;
              const constraint = w > 1440 ? { type: "WIDTH", value: 1440 } : { type: "SCALE", value: 2 };
              const bytes = await node.exportAsync({ format: "PNG", constraint: constraint });
              images.push({ name: imgNameFor(ns[idx]), bytes: Array.from(bytes) });
            } catch (e) {}
          }
        }
      }
      figma.ui.postMessage({ type: "doCommit", repoUrl: repo, token: token, markdown: buildChangesMd(changes), structure: buildStructureMd(), json: buildChangesJson(changes), prBody: buildPrBody(), fileName: figma.root.name, images: images });
    };
    if (msg.token) { figma.clientStorage.setAsync("relayToken", msg.token).then(function () { go(msg.token); }); }
    else { figma.clientStorage.getAsync("relayToken").then(go); }
    return;
  }

  if (msg.type === "committed") {
    setChanges([]); // queue pushed — clear it
    pushState();
    return;
  }

  if (msg.type === "openUrl") { if (msg.url) figma.openExternal(msg.url); return; }

  if (msg.type === "resize") {
    figma.ui.resize(Math.max(340, msg.width || 380), Math.max(360, msg.height || 600));
    return;
  }
};
