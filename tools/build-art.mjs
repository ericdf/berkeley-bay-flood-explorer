// Rasterize the ART Bay Area flooding maps as the Caltrans service serves them (SOURCE_NOTES H5) onto
// the terrain grid. Kept to reproduce the comparison in SOURCE_NOTES C1: since 2026-11-04 the explorer
// uses the Alameda County geodatabase for all ten levels (tools/build-art-dc.mjs --connected), and this
// tool never writes to data/hazard.
//   node tools/build-art.mjs <dir with art_<layer>.geojson from tools/fetch-art.py> <out dir>
// Writes <out dir>/art-<inches>.bits (one bit per cell, row-major, 1 = flooded in ART at that level,
// any depth class) and <out dir>/art.json listing the levels (+ 12, 24, 36, 52, 66, 96 and 108 in; the
// service has no + 84 in layer and returned no polygons for + 48 and + 77 in).
// The service stores Web Mercator (WGS 84) and is read in WGS 84 longitude and latitude (outSR 4326);
// how its data were brought from NAD83 is not stated (the service lists the transformation
// WGS_1984_(ITRF00)_To_NAD_1983, Esri 108190).
// ART levels are total water levels of MHHW plus N inches; in feet NAVD88 they are taken as
// MHHW 6.20 at point 518 (SOURCE_NOTES W11) plus N/12 (derived).
import fs from 'fs';
import { fileURLToPath } from 'url';
import { toUTM } from './utm.mjs';

const NOTE = 'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), flooded area connected to the Bay at total water levels of MHHW plus N inches, as served by caltrans-gis.dot.ca.gov CHhqenvi/DEA_BCDC_polygon_SLR MapServer (+ 12, 24, 36, 52, 66, 96 and 108 in), rasterized to this grid. Not used by the explorer since 2026-11-04 (SOURCE_NOTES C1, H5). levelFt = MHHW 6.20 ft NAVD88 at point 518 (W11) + N/12, derived.';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
const [dir, OUT] = process.argv.slice(2);
if (!dir || !OUT || OUT.replace(/\/$/, '') === 'data/hazard') { console.error('usage: node tools/build-art.mjs <geojson dir> <out dir, not data/hazard>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
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
  fs.writeFileSync(`${OUT}/${file}`, bits);
  levels.push({ inches, levelFt: Math.round((MHHW + inches / 12) * 100) / 100, file, layer: name });
  console.log(name, '->', file);
}
fs.writeFileSync(`${OUT}/art.json`, JSON.stringify({
  note: NOTE,
  provenance: { category: 'sourced', retrieved: new Date().toISOString().slice(0, 10) },
  levels,
}, null, 2) + '\n');
}
