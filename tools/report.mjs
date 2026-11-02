// Print what each scenario's connected fill reaches.  node tools/report.mjs [levelFt ...]
import fs from 'fs';
import { analyze } from '../js/analyze.js';
export function load() {
  const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
  const b = fs.readFileSync('data/terrain/dem.i16');
  const z = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
  return { dem, z, streets: JSON.parse(fs.readFileSync('data/streets.json')), facilities: JSON.parse(fs.readFileSync('data/facilities.json')).facilities, facilityCells: JSON.parse(fs.readFileSync('data/facility-cells.json')), berkeley: new Uint8Array(fs.readFileSync('data/terrain/berkeley.bits')) };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const D = load();
  const sc = JSON.parse(fs.readFileSync('data/scenarios.json')).scenarios;
  const levels = process.argv.length > 2 ? process.argv.slice(2).map(Number).map(l => ({ label: 'level', levelFt: l })) : sc;
  for (const s of levels) {
    const r = analyze(D, s.levelFt);
    console.log(`\n${s.label}: ${s.levelFt} ft NAVD88 — Berkeley land wet ${r.wetLandHa.toFixed(0)} ha (through Albany/Emeryville ${r.flankedHa.toFixed(1)}), low not connected ${r.lowLandHa.toFixed(0)} ha; Berkeley streets wet ${(r.wetStreetM / 1000).toFixed(2)} km, low ${(r.lowStreetM / 1000).toFixed(2)} km`);
    console.log('  wet streets:', r.streets.filter(x => x.wet).slice(0, 14).map(x => `${x.name}${x.berkeley ? '' : '*'} ${Math.round(x.m)} m`).join('; ') || 'none');
    console.log('  low streets:', r.streets.filter(x => !x.wet).slice(0, 8).map(x => `${x.name}${x.berkeley ? '' : '*'} ${Math.round(x.m)} m`).join('; ') || 'none');
    console.log('  facilities:', r.facilities.map(f => `${f.label.split(' (')[0]} wet ${(100 * f.wetShare).toFixed(0)}% low ${(100 * f.lowShare).toFixed(0)}% (median ground ${f.medianGroundFt.toFixed(1)} ft)`).join('; '));
  }
}
