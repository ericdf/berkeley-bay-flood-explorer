// Print what each scenario's connected fill reaches.  node tools/report.mjs [levelFt ...]
import fs from 'fs';
import { analyze } from '../js/analyze.js';
export function load() {
  const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
  const b = fs.readFileSync('data/terrain/dem.i16');
  const z = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
  return { dem, z, streets: JSON.parse(fs.readFileSync('data/streets.json')), facilities: JSON.parse(fs.readFileSync('data/facilities.json')).facilities, facilityCells: JSON.parse(fs.readFileSync('data/facility-cells.json')), berkeley: new Uint8Array(fs.readFileSync('data/terrain/berkeley.bits')),
    drains: JSON.parse(fs.readFileSync('data/drains.json')), watershedIds: new Uint8Array(fs.readFileSync('data/hazard/watersheds.u8')),
    plans: JSON.parse(fs.readFileSync('data/plans.json')).presets };
}
// A plan from preset ids ("walls2050,roads") and tide gates ("gates" = all outfalls gated).
export function planFrom(D, spec) {
  if (!spec) return null;
  const plan = { walls: [], roads: [], gates: {} };
  for (const id of spec.split(',')) {
    if (id === 'gates') { for (const w of D.drains.watersheds) plan.gates[w.name] = true; continue; }
    const p = D.plans.find(x => x.id === id); if (!p) throw new Error(`no preset ${id}`);
    for (const w of p.walls || []) plan.walls.push({ ...w, label: `${p.label}: ${w.id}`, crestFt: p.crestFt });
    for (const r of p.roads || []) plan.roads.push({ ...r, label: p.label, crestFt: p.crestFt });
  }
  return plan;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const D = load();
  const sc = JSON.parse(fs.readFileSync('data/scenarios.json')).scenarios;
  const args = process.argv.slice(2); const pi = args.indexOf('--plan'); const plan = pi >= 0 ? planFrom(D, args.splice(pi, 2)[1]) : null;
  const levels = args.length ? args.map(Number).map(l => ({ label: 'level', levelFt: l })) : sc;
  for (const s of levels) {
    const r = analyze(D, s.levelFt, plan);
    console.log(`\n${s.label}: ${s.levelFt} ft NAVD88 — Berkeley land wet ${r.wetLandHa.toFixed(0)} ha (through Albany/Emeryville ${r.flankedHa.toFixed(1)}), low not connected ${r.lowLandHa.toFixed(0)} ha, can fill through drains ${r.drainLandHa.toFixed(0)} ha; Berkeley streets wet ${(r.wetStreetM / 1000).toFixed(2)} km, low ${(r.lowStreetM / 1000).toFixed(2)} km`);
    console.log('  wet streets:', r.streets.filter(x => x.wet).slice(0, 14).map(x => `${x.name}${x.berkeley ? '' : '*'} ${Math.round(x.m)} m`).join('; ') || 'none');
    console.log('  drain streets:', r.streets.filter(x => x.cls === 'drain').slice(0, 8).map(x => `${x.name}${x.berkeley ? '' : '*'} ${Math.round(x.m)} m`).join('; ') || 'none');
    if (r.overtopped.length) console.log('  overtopped:', r.overtopped.join('; '));
    console.log('  low streets:', r.streets.filter(x => x.cls === 'low').slice(0, 8).map(x => `${x.name}${x.berkeley ? '' : '*'} ${Math.round(x.m)} m`).join('; ') || 'none');
    console.log('  facilities:', r.facilities.map(f => `${f.label.split(' (')[0]} wet ${(100 * f.wetShare).toFixed(0)}% low ${(100 * f.lowShare).toFixed(0)}% (median ground ${f.medianGroundFt.toFixed(1)} ft)`).join('; '));
  }
}
