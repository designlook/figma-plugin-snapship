// Relay — log changes on a Figma file and commit them to GitHub / GitLab.
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
      selectionDetails: nodeDetails(selectedNode())
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
function imgName(c) { return slug(c.element) + "-" + c.id + ".png"; }

function buildChangesMd(changes) {
  const lines = ["# Changes — " + figma.root.name, ""];
  changes.forEach(function (c) {
    lines.push("## " + (c.element || "Change"), "");
    if (c.details) lines.push("`" + c.details + "`", "");
    if (c.desc) lines.push(c.desc, "");
    const links = [];
    if (c.jira) links.push("[" + jiraLabel(c.jira) + "](" + c.jira + ")");
    if (c.figmaLink) links.push("[Open in Figma](" + c.figmaLink + ")");
    if (links.length) lines.push(links.join(" · "), "");
    if (c.nodeId) lines.push("![" + (c.element || "element") + "](img/" + imgName(c) + ")", "");
    lines.push("---", "");
  });
  return lines.join("\n");
}

figma.ui.onmessage = (msg) => {
  if (msg.type === "addChange") {
    if (figma.editorType !== "figma") {
      figma.ui.postMessage({ type: "err", message: "Switch to Design mode to add changes." });
      return;
    }
    const arr = getChanges();
    const sn = selectedNode();
    arr.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      element: currentSelectionName(),
      details: nodeDetails(sn),
      nodeId: sn ? sn.id : "",
      figmaLink: nodeUrl(sn),
      jira: msg.jira || "",
      desc: msg.desc || "",
      ts: Date.now()
    });
    setChanges(arr);
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
        if (!c.nodeId) continue;
        const node = figma.getNodeById(c.nodeId);
        if (node && node.exportAsync) {
          try {
            const bytes = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
            images.push({ name: imgName(c), bytes: Array.from(bytes) });
          } catch (e) {}
        }
      }
      figma.ui.postMessage({ type: "doCommit", repoUrl: repo, token: token, markdown: buildChangesMd(changes), fileName: figma.root.name, images: images });
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
