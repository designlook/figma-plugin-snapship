// Relay — Dev-Mode handoff intent plugin
// Plain JS, zero-build. Authors intent in Design mode, reads it in Dev mode.

const NS = "relay";          // sharedPluginData namespace
const KEY = "annotations";   // sharedPluginData key

figma.showUI(__html__, { width: 360, height: 560, themeColors: true });

function getAnnotations(node) {
  if (!node) return [];
  const raw = node.getSharedPluginData(NS, KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function setAnnotations(node, arr) {
  node.setSharedPluginData(NS, KEY, JSON.stringify(arr));
}

function selectedNode() {
  const sel = figma.currentPage.selection;
  return sel.length === 1 ? sel[0] : null;
}

function pushState() {
  const node = selectedNode();
  figma.ui.postMessage({
    type: "state",
    mode: figma.editorType, // "figma" (design) or "dev" (Dev Mode)
    multiple: figma.currentPage.selection.length > 1,
    node: node ? { id: node.id, name: node.name } : null,
    annotations: node ? getAnnotations(node) : []
  });
}

figma.on("selectionchange", pushState);
pushState();

function canEdit() {
  return figma.editorType === "figma";
}

figma.ui.onmessage = (msg) => {
  const node = selectedNode();

  if (msg.type === "add") {
    if (!canEdit()) {
      figma.ui.postMessage({ type: "error", message: "Switch to Design mode to add notes." });
      return;
    }
    if (!node) return;
    const arr = getAnnotations(node);
    arr.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      kind: msg.kind,
      text: msg.text,
      status: "draft"
    });
    setAnnotations(node, arr);
    pushState();
    return;
  }

  if (msg.type === "delete") {
    if (!canEdit() || !node) return;
    setAnnotations(node, getAnnotations(node).filter((a) => a.id !== msg.id));
    pushState();
    return;
  }

  if (msg.type === "toggle") {
    if (!canEdit() || !node) return;
    const arr = getAnnotations(node).map((a) =>
      a.id === msg.id ? Object.assign({}, a, { status: a.status === "ready" ? "draft" : "ready" }) : a
    );
    setAnnotations(node, arr);
    pushState();
    return;
  }

  if (msg.type === "export") {
    const lines = ["# Relay handoff spec — " + figma.currentPage.name, ""];
    let count = 0;
    (function walk(nodes) {
      for (const n of nodes) {
        const arr = getAnnotations(n);
        if (arr.length) {
          count += arr.length;
          lines.push("## " + n.name);
          for (const a of arr) {
            lines.push("- **" + a.kind + "** _(" + a.status + ")_: " + a.text);
          }
          lines.push("");
        }
        if ("children" in n) walk(n.children);
      }
    })(figma.currentPage.children);
    if (count === 0) lines.push("_No annotations on this page yet._");
    figma.ui.postMessage({ type: "markdown", markdown: lines.join("\n") });
    return;
  }

  if (msg.type === "resize") {
    figma.ui.resize(Math.max(320, msg.width || 360), Math.max(320, msg.height || 560));
    return;
  }
};
