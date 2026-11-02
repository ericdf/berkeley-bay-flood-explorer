// Rasterize the ART Bay Area flooding maps (SOURCE_NOTES H5) onto the terrain grid.
//   node tools/build-art.mjs <dir with art_<layer>.geojson from tools/fetch-art.py>
// Writes data/hazard/art-<inches>.bits (one bit per cell, row-major, 1 = flooded in ART at that
// level, any depth class) and data/hazard/art.json listing the levels.
// ART levels are total water levels of MHHW plus N inches; in feet NAVD88 they are taken as
// MHHW 6.20 at point 518 (SOURCE_NOTES W11) plus N/12 (derived).
import fs from 'fs';
import { toUTM } from './utm.mjs';
const dir = process.argv[2];
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const R = dem.resolution, W = dem.width, H = dem.height, Hm = dem.ymax - dem.ymin;
const MHHW = 6.20;
const levels = [];
for (const f of fs.readdirSync(dir).filter(f => /^art_\d+\.geojson$/.test(f)).sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))) {
  const fc = JSON.parse(fs.readFileSync(`${dir}/${f}`));
  if (!fc.features.length) continue;
  const name = fc.features[0].properties.layer; // e.g. "BCDC SLR 2.0 ft (24 in)"
  const inches = Number(/\((\d+) in\)/.exec(name)[1]);
  const bits = new Uint8Array(Math.ceil(W * H / 8));
  for (const feat of fc.features) for (const poly of feat.geometry.coordinates) {
    const rings = poly.map(r => r.map(([lo, la]) => { const [x, y] = toUTM(lo, la); return [x - dem.xmin, y - dem.ymin]; }));
    let ymin = Infinity, ymax = -Infinity; for (const r of rings) for (const [, y] of r) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    if (ymax < 0 || ymin > Hm) continue;
    for (let row = Math.max(0, Math.floor((Hm - ymax) / R)); row <= Math.min(H - 1, Math.ceil((Hm - ymin) / R)); row++) {
      const y = Hm - (row + 0.5) * R, xs = [];
      for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < W && (c + 0.5) * R <= xs[k + 1]; c++) { const i = row * W + c; bits[i >> 3] |= 1 << (i & 7); }
    }
  }
  const file = `art-${inches}.bits`;
  fs.writeFileSync(`data/hazard/${file}`, bits);
  levels.push({ inches, levelFt: Math.round((MHHW + inches / 12) * 100) / 100, file, layer: name });
  console.log(name, '->', file);
}
fs.writeFileSync('data/hazard/art.json', JSON.stringify({
  note: 'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), flooded area connected to the Bay at total water levels of MHHW plus N inches, rasterized to this grid. Source service: caltrans-gis.dot.ca.gov CHhqenvi/DEA_BCDC_polygon_SLR MapServer (SOURCE_NOTES H5). levelFt = MHHW 6.20 ft NAVD88 at point 518 (W11) + N/12, derived.',
  provenance: { category: 'sourced', retrieved: new Date().toISOString().slice(0, 10) },
  levels,
}, null, 2) + '\n');
