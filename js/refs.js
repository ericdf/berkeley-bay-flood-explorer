// Source references on the page ("W11", "SOURCE_NOTES C6") become links to SOURCE_NOTES.md, with
// the row's label shown on hover and focus (data/notes.json, tools/build-notes.mjs; E12, E16).
// Only references that name a row the notes hold are linked.
export function watchRefs(notes, roots) {
  const re = /\b([A-Z]\d{1,2})\b/g, SKIP = new Set(['A', 'BUTTON', 'SCRIPT', 'STYLE', 'INPUT', 'SELECT', 'OPTION', 'TEXTAREA', 'CANVAS']);
  let busy = false;
  const link = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => {
      for (let p = n.parentElement; p && p !== root.parentElement; p = p.parentElement) if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      re.lastIndex = 0; return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } });
    const todo = []; while (walker.nextNode()) todo.push(walker.currentNode);
    for (const n of todo) {
      const text = n.nodeValue, frag = document.createDocumentFragment(); let last = 0, hit = false;
      for (const m of text.matchAll(re)) {
        const label = notes.notes[m[1]]; if (!label) continue;
        hit = true; frag.append(text.slice(last, m.index));
        const a = document.createElement('a');
        a.className = 'ref'; a.href = notes.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = m[1]; a.title = `${m[1]}: ${label}`;
        frag.append(a); last = m.index + m[1].length;
      }
      if (hit) { frag.append(text.slice(last)); n.replaceWith(frag); }
    }
  };
  const run = () => { if (busy) return; busy = true; try { for (const r of roots) if (r) link(r); } finally { busy = false; } };
  const obs = new MutationObserver(() => { obs.disconnect(); run(); for (const r of roots) if (r) obs.observe(r, { childList: true, subtree: true }); });
  run(); for (const r of roots) if (r) obs.observe(r, { childList: true, subtree: true });
}
