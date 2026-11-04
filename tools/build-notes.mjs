// A short label for each SOURCE_NOTES.md row, so the page can show it when a reader points at a
// reference such as "W11" (E12, E16).   node tools/build-notes.mjs   writes data/notes.json
// The label is the row's bold title when it has one, otherwise the start of its text; the full row,
// with its source, is in SOURCE_NOTES.md.
import fs from 'fs';
const lines = fs.readFileSync('SOURCE_NOTES.md', 'utf8').split('\n');
const notes = {};
const clean = (t) => t.replace(/\*\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
const cut = (t, n = 160) => t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t;
for (let k = 0; k < lines.length; k++) {
  let m = /^(?:- )?\*\*([A-Z]\d+)\.?\s*([^*]*)\*\*[.:]?\s*(.*)$/.exec(lines[k]);
  if (m) {
    let rest = m[3]; for (let j = k + 1; j < lines.length && /^\s{2,}\S/.test(lines[j]) && rest.length < 200; j++) rest += ' ' + lines[j].trim();
    notes[m[1]] = cut(clean(m[2] ? m[2] : rest)); continue;
  }
  m = /^\| ([A-Z]\d+) \|(.*)$/.exec(lines[k]);
  if (m) notes[m[1]] = cut(clean(m[2].split('|').filter(Boolean).join(' · ')));
}
fs.writeFileSync('data/notes.json', JSON.stringify({ source: 'SOURCE_NOTES.md', url: 'https://github.com/ericdf/berkeley-bay-flood-explorer/blob/main/SOURCE_NOTES.md', notes }, null, 1) + '\n');
console.log(Object.keys(notes).length, 'rows;', ['W11', 'C6', 'D6', 'H6', 'E14'].map(k => `${k}: ${notes[k]}`).join('\n'));
