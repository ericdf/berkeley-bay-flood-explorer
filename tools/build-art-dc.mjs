// Rasterize ART's disconnected low-lying areas (SOURCE_NOTES H5) onto the terrain grid.
//   node tools/build-art-dc.mjs        (reads data/raw/art-dc/lowlying_<N>.json from tools/fetch-art-dc.py)
// Writes data/hazard/art-dc-<inches>.bits (one bit per cell, row-major, 1 = inside an ART
// disconnected low-lying area at that level; a cell is inside when its center is, even-odd rule over
// every ring, as tools/build-art.mjs does) and data/hazard/art-dc.json listing the levels.
// The layer's coordinates are NAD83 / UTM zone 10N; they are used as the grid's WGS 84 / UTM zone 10N
// without a datum shift (the two datums differ by about 1 to 1.5 m in the Bay Area, under half a cell; assumption).
// ART levels are total water levels of MHHW plus N inches; in feet NAVD88 they are taken as MHHW
// 6.20 at point 518 (SOURCE_NOTES W11) plus N/12 (derived), as in tools/build-art.mjs.
import fs from 'fs';
const dir = 'data/raw/art-dc';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const R = dem.resolution, W = dem.width, H = dem.height, Hm = dem.ymax - dem.ymin;
const MHHW = 6.20;
const levels = [];
let retrieved = null;
for (const f of fs.readdirSync(dir).filter(f => /^lowlying_\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(9)) - parseInt(b.slice(9)))) {
  const src = JSON.parse(fs.readFileSync(`${dir}/${f}`));
  retrieved = src.retrieved.slice(0, 10);
  const bits = new Uint8Array(Math.ceil(W * H / 8));
  let cells = 0;
  for (const feat of src.features) {
    // A feature's rings are rasterized together (even-odd), so holes stay holes.
    const rings = feat.rings.map(r => r.map(([x, y]) => [x - dem.xmin, y - dem.ymin]));
    let ymin = Infinity, ymax = -Infinity; for (const r of rings) for (const [, y] of r) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
    if (ymax < 0 || ymin > Hm) continue;
    for (let row = Math.max(0, Math.floor((Hm - ymax) / R)); row <= Math.min(H - 1, Math.ceil((Hm - ymin) / R)); row++) {
      const y = Hm - (row + 0.5) * R, xs = [];
      for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [x1, y1] = r[i], [x2, y2] = r[j]; if ((y1 > y) !== (y2 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let c = Math.max(0, Math.ceil(xs[k] / R - 0.5)); c < W && (c + 0.5) * R <= xs[k + 1]; c++) { const i = row * W + c; if (!((bits[i >> 3] >> (i & 7)) & 1)) cells++; bits[i >> 3] |= 1 << (i & 7); }
    }
  }
  const file = `art-dc-${src.inches}.bits`;
  fs.writeFileSync(`data/hazard/${file}`, bits);
  levels.push({ inches: src.inches, levelFt: Math.round((MHHW + src.inches / 12) * 100) / 100, file, layer: src.layer, cells });
  console.log(src.layer, '->', file, `${(cells * R * R / 1e4).toFixed(1)} ha in the grid`);
}
fs.writeFileSync('data/hazard/art-dc.json', JSON.stringify({
  note: 'ART Bay Area Sea Level Rise and Shoreline Analysis Maps (AECOM 2017 for BCDC/MTC), disconnected low-lying areas: ground below the mapped water surface that is not hydraulically connected to the flooded area, areas greater than one acre only (ART GIS data catalog, p. 2), at total water levels of MHHW plus N inches, rasterized to this grid. Source: Alameda County geodatabase Alameda_SLR_ART_2017.gdb, layers Alameda_lowlying_poly_<N>, from explorer.adaptingtorisingtides.org/download (SOURCE_NOTES H5). levelFt = MHHW 6.20 ft NAVD88 at point 518 (W11) + N/12, derived.',
  provenance: { category: 'sourced', retrieved },
  levels,
}, null, 2) + '\n');
