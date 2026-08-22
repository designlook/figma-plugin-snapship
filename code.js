// Snapship — log design changes on a Figma file and commit them to GitHub / GitLab.
// Changes + repo URL are stored on the file; the access token is stored locally per user.

const NS = "snapship";

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

function getReposAsync() {
  return figma.clientStorage.getAsync("repos").then(function (v) { try { return JSON.parse(v || "[]"); } catch (e) { return []; } });
}

function pushState() {
  Promise.all([getReposAsync(), figma.clientStorage.getAsync("lastRepo")]).then(function (res) {
    var repos = res[0], last = res[1] || "";
    var selected = getDoc("repoUrl", "") || last || (repos[0] && repos[0].url) || "__zip__";
    figma.ui.postMessage({
      type: "state",
      changes: getChanges(),
      repos: repos.map(function (r) { return { url: r.url, folder: r.folder || "", hasToken: !!r.token }; }),
      selected: selected,
      hasToken: repos.some(function (r) { return r.url === selected && r.token; }),
      editable: true,
      selection: currentSelectionName(),
      selectionCount: figma.currentPage.selection.length,
      fileName: figma.root.name,
      folder: getDoc("folder", ""),
      clearFolder: getDoc("clearFolder", "0") === "1",
      skipStructure: getDoc("skipStructure", "0") === "1",
      mdMode: getDoc("mdMode", "single")
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
function mdNameFor(n) { return imgNameFor(n).replace(/\.png$/i, ".md"); }
function sanitizeFolder(s) {
  var f = String(s || "").trim().replace(/\\/g, "/").replace(/[^A-Za-z0-9._/-]/g, "-").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  f = f.split("/").filter(function (p) { return p && p !== ".."; }).join("/");
  return f || "handoff";
}

function changeMdBody(c, n, imgRel) {
  const lines = ["# " + ((n && n.name) || c.element || "Change"), ""];
  if (c.desc) lines.push(c.desc, "");
  if (c.figmaLink) lines.push("[Open in Figma](" + c.figmaLink + ")", "");
  if (n && imgRel) lines.push("![" + n.name + "](" + imgRel + ")", "");
  return lines.join("\n");
}

function buildChangesMd(changes) {
  const lines = ["# Changes — " + figma.root.name, ""];
  changes.forEach(function (c) {
    lines.push("## " + (c.element || "Change"), "");
    if (c.desc) lines.push(c.desc, "");
    const links = [];
    if (c.figmaLink) links.push("[Open in Figma](" + c.figmaLink + ")");
    if (links.length) lines.push(links.join(" · "), "");
    changeNodes(c).forEach(function (n) {
      lines.push("![" + n.name + "](img/" + imgNameFor(n) + ")", "");
    });
    lines.push("---", "");
  });
  return lines.join("\n");
}

function buildMdFiles(changes) {
  if (getDoc("mdMode", "single") !== "perImage") {
    return [{ name: "changes.md", markdown: buildChangesMd(changes) }];
  }
  const files = [];
  changes.forEach(function (c) {
    const ns = changeNodes(c);
    if (!ns.length) {
      files.push({ name: slug(c.element || "change") + ".md", markdown: changeMdBody(c, null, "") });
      return;
    }
    ns.forEach(function (n) {
      files.push({ name: "img/" + mdNameFor(n), markdown: changeMdBody(c, n, imgNameFor(n)) });
    });
  });
  return files;
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
function buildPrBody(base) {
  const key = safeFileKey();
  return [
    "Generated by Snapship.",
    "",
    "## For the implementing agent",
    "",
    "1. Read `" + base + "/changes.json` — each change has a description and the changed Figma elements (name, nodeId, screenshot).",
    "2. For each element, fetch the exact spec via the Figma MCP: `get_design_context` (file key + nodeId) and `get_variable_defs` for tokens. Use Code Connect mappings when available.",
    "3. Use `" + base + "/structure.md` to understand the file's layout and naming.",
    "4. Implement the changes described above.",
    "",
    "Screenshots: `" + base + "/img/`." + (key ? " Figma file key: `" + key + "`." : "")
  ].join("\n");
}

async function exportImages(changes) {
  const images = [];
  for (const c of changes) {
    const ns = changeNodes(c);
    for (let idx = 0; idx < ns.length; idx++) {
      const node = await figma.getNodeByIdAsync(ns[idx].id);
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
  return images;
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "addChange") {
    const arr = getChanges();
    const sel = figma.currentPage.selection;
    const nodes = sel.map(function (n) { return { id: n.id, name: n.name }; });
    const nc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      element: currentSelectionName(),
      nodes: nodes,
      figmaLink: nodes.length ? nodeUrl(sel[0]) : "",
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
    if (msg.folder) setDoc("folder", msg.folder);
    pushState();
    return;
  }

  if (msg.type === "deleteChange") {
    setChanges(getChanges().filter(function (c) { return c.id !== msg.id; }));
    pushState();
    return;
  }

  if (msg.type === "addRepo") {
    const url = (msg.url || "").trim();
    if (!url) { pushState(); return; }
    getReposAsync().then(function (repos) {
      let found = false;
      repos = repos.map(function (r) {
        if (r.url === url) { found = true; return { url: url, token: msg.token || r.token, folder: (msg.folder !== undefined ? msg.folder : r.folder) || "" }; }
        return r;
      });
      if (!found) repos.push({ url: url, token: msg.token || "", folder: msg.folder || "" });
      figma.clientStorage.setAsync("repos", JSON.stringify(repos)).then(function () {
        setDoc("repoUrl", url);
        figma.clientStorage.setAsync("lastRepo", url).then(pushState);
      });
    });
    return;
  }

  if (msg.type === "selectRepo") {
    const url = (msg.url || "").trim();
    setDoc("repoUrl", url);
    figma.clientStorage.setAsync("lastRepo", url).then(pushState);
    return;
  }

  if (msg.type === "removeRepo") {
    getReposAsync().then(function (repos) {
      repos = repos.filter(function (r) { return r.url !== msg.url; });
      figma.clientStorage.setAsync("repos", JSON.stringify(repos)).then(function () {
        if (getDoc("repoUrl", "") === msg.url) setDoc("repoUrl", repos[0] ? repos[0].url : "");
        pushState();
      });
    });
    return;
  }

  if (msg.type === "setClearFolder") {
    setDoc("clearFolder", msg.on ? "1" : "0");
    pushState();
    return;
  }

  if (msg.type === "setSkipStructure") {
    setDoc("skipStructure", msg.on ? "1" : "0");
    pushState();
    return;
  }

  if (msg.type === "setMdMode") {
    setDoc("mdMode", msg.mode === "perImage" ? "perImage" : "single");
    pushState();
    return;
  }

  if (msg.type === "commit") {
    const url = (msg.repo || getDoc("repoUrl", "")).trim();
    const changes = getChanges();
    if (!changes.length) { figma.ui.postMessage({ type: "commitDone", ok: false, message: "No changes to commit." }); return; }
    setDoc("repoUrl", url);
    if (msg.folder !== undefined) setDoc("folder", msg.folder || "");
    const commitFolder = (msg.folder !== undefined ? msg.folder : getDoc("folder", "")) || "";

    (async function () {
      let structure = "";
      if (getDoc("skipStructure", "0") !== "1") {
        try { await figma.loadAllPagesAsync(); } catch (e) {}
        structure = buildStructureMd();
      }
      const images = await exportImages(changes);

      const mdFiles = buildMdFiles(changes);
      if (url === "__zip__" || !url) {
        const base = sanitizeFolder(commitFolder);
        figma.ui.postMessage({ type: "doZip", mdFiles: mdFiles, structure: structure, json: buildChangesJson(changes), fileName: figma.root.name, base: base, images: images });
        return;
      }
      const repos = await getReposAsync();
      const entry = repos.filter(function (r) { return r.url === url; })[0];
      if (!entry || !entry.token) { figma.ui.postMessage({ type: "commitDone", ok: false, message: "That repository has no token — add it in Settings." }); return; }
      const base = sanitizeFolder([entry.folder || "", commitFolder].filter(Boolean).join("/"));
      figma.ui.postMessage({ type: "doCommit", repoUrl: url, token: entry.token, mdFiles: mdFiles, structure: structure, json: buildChangesJson(changes), prBody: buildPrBody(base), fileName: figma.root.name, base: base, images: images });
    })();
    return;
  }

  if (msg.type === "committed") {
    setChanges([]); // queue pushed — clear it
    if (getDoc("clearFolder", "0") === "1") setDoc("folder", "");
    pushState();
    return;
  }

  if (msg.type === "openUrl") { if (msg.url) figma.openExternal(msg.url); return; }

  if (msg.type === "resize") {
    figma.ui.resize(Math.max(340, msg.width || 380), Math.max(360, msg.height || 600));
    return;
  }
};
