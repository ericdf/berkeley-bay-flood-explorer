// How much the City study's floodwalls depend on where this explorer traced them (SOURCE_NOTES C11,
// C25). The alignments were traced from the study's Figures 5.7 and 5.8 to about 30 m. Each wall set
// is run as traced, with every wall's ends extended 30 m and 60 m, moved 30 m in each of four
// directions, and three cells (12 m) wide, at the study's design level for that set.
//   node tools/wall-sensitivity.mjs
import { load, planFrom } from './report.mjs';
import { analyze } from '../js/analyze.js';

const D = load();
const extend = (line, m) => {
  const out = line.map(p => [...p]);
  const push = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy) || 1; return [a[0] + dx / L * m, a[1] + dy / L * m]; };
  out[0] = push(line[0], line[1]); out[out.length - 1] = push(line[line.length - 1], line[line.length - 2]);
  return out;
};
const shift = (line, dx, dy) => line.map(([x, y]) => [x + dx, y + dy]);
const variants = {
  'as traced': (w) => w,
  'ends +30 m': (w) => ({ ...w, lines: w.lines.map(l => extend(l, 30)) }),
  'ends +60 m': (w) => ({ ...w, lines: w.lines.map(l => extend(l, 60)) }),
  'moved 30 m north': (w) => ({ ...w, lines: w.lines.map(l => shift(l, 0, 30)) }),
  'moved 30 m south': (w) => ({ ...w, lines: w.lines.map(l => shift(l, 0, -30)) }),
  'moved 30 m east': (w) => ({ ...w, lines: w.lines.map(l => shift(l, 30, 0)) }),
  'moved 30 m west': (w) => ({ ...w, lines: w.lines.map(l => shift(l, -30, 0)) }),
  '12 m wide': (w) => ({ ...w, widthCells: 3 }),
};
const metrics = (r) => {
  const dt = r.facilities.find(f => /DoubleTree/.test(f.label));
  // Counted length (segments a quarter or more wet) and, after the slash, the length under water.
  const m = (n) => { const ss = r.streets.filter(s => s.name === n && s.berkeley && s.wet); return `${Math.round(ss.reduce((t, s) => t + s.m, 0))}/${Math.round(ss.reduce((t, s) => t + s.coveredM, 0))}`; };
  return { landHa: +r.wetLandHa.toFixed(1), doubleTree: Math.round(100 * dt.wetShare), marinaBlvdM: m('MARINA BL'), universityM: m('UNIVERSITY AV'), spinnakerM: m('SPINNAKER WY') };
};
const out = {};
for (const [preset, lv] of [['walls2050', 10.7], ['walls2100', 13.0]]) {
  out[preset] = { levelFt: lv, 'no walls': metrics(analyze(D, lv)) };
  const base = planFrom(D, preset);
  for (const [name, f] of Object.entries(variants)) out[preset][name] = metrics(analyze(D, lv, { ...base, walls: base.walls.map(f) }));
}
for (const [preset, rows] of Object.entries(out)) {
  console.log(`\n${preset} at ${rows.levelFt} ft NAVD88`);
  console.log('variant'.padEnd(18), 'land ha', 'DoubleTree %', 'Marina Blvd m', 'University m', 'Spinnaker m');
  for (const [k, v] of Object.entries(rows)) if (k !== 'levelFt') console.log(k.padEnd(18), String(v.landHa).padStart(7), String(v.doubleTree).padStart(12), String(v.marinaBlvdM).padStart(13), String(v.universityM).padStart(12), String(v.spinnakerM).padStart(11));
}
