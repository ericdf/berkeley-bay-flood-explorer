// Fetch the explorer's terrain grid from the USGS 3DEP dynamic elevation service (best available
// data for each cell: the 1 m lidar DEMs here). The service is asked for 1 m cells (nearest
// neighbor) in 16 tiles, and each 4 m cell is the mean of its 16 one-meter values. A 4 m export
// with bilinear resampling matched the published ART flood maps worse (SOURCE_NOTES C1).
//   node tools/fetch-dem.mjs
// Writes data/terrain/dem.i16 (int16 little-endian, centimeters NAVD88, rows north to south,
// -32768 = no data) and data/terrain/dem.json. The grid is aligned with the wildfire simulator's
// 4 m grid (berkeley-wildfire-simulator data/terrain), so the two can be compared cell by cell.
// That grid has a 200 m strip coded 0 m through the Marina at easting 560,000 (SOURCE_NOTES F12),
// which is why this explorer fetches terrain directly.
import fs from 'fs';
import { toUTM } from './utm.mjs';
import { readTiff } from './tiff.mjs';
import { BBOX } from './bbox.mjs';

const R = 4, X0 = 558896, Y0 = 4188272; // wildfire simulator grid origin
const corners = [[BBOX.west, BBOX.south], [BBOX.west, BBOX.north], [BBOX.east, BBOX.south], [BBOX.east, BBOX.north]].map(([lo, la]) => toUTM(lo, la));
const xmin = Math.max(X0, X0 + Math.floor((Math.min(...corners.map(c => c[0])) - X0) / R) * R);
const xmax = X0 + Math.ceil((Math.max(...corners.map(c => c[0])) - X0) / R) * R;
const ymin = Math.max(Y0, Y0 + Math.floor((Math.min(...corners.map(c => c[1])) - Y0) / R) * R);
const ymax = Y0 + Math.ceil((Math.max(...corners.map(c => c[1])) - Y0) / R) * R;
const W = (xmax - xmin) / R, H = (ymax - ymin) / R;
const svc = 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage';
const N = 4, TW = W, TH = H; // 4 x 4 tiles of W x H one-meter cells = the grid at 4 m
const sum = new Float64Array(W * H), cnt = new Uint8Array(W * H);
for (let tr = 0; tr < N; tr++) for (let tc = 0; tc < N; tc++) {
  const x0 = xmin + tc * TW, y1 = ymax - tr * TH;
  const url = `${svc}?bbox=${x0},${y1 - TH},${x0 + TW},${y1}&bboxSR=32610&imageSR=32610&size=${TW},${TH}`
    + '&format=tiff&pixelType=F32&noDataInterpretation=esriNoDataMatchAny&interpolation=RSP_NearestNeighbor&f=image';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`3DEP ${res.status} for tile ${tr},${tc}`);
  const t = readTiff(Buffer.from(await res.arrayBuffer()));
  if (t.width !== TW || t.height !== TH) throw new Error(`tile size ${t.width}x${t.height}`);
  for (let r = 0; r < TH; r++) for (let c = 0; c < TW; c++) {
    const v = t.data[r * TW + c];
    if (!Number.isFinite(v) || v < -100 || v > 300) continue;
    const i = Math.floor((tr * TH + r) / N) * W + Math.floor((tc * TW + c) / N);
    sum[i] += v; cnt[i]++;
  }
  process.stdout.write(`tile ${tr},${tc} `);
}
const url = `${svc} (1 m, nearest neighbor, 16 tiles, mean to 4 m)`;
const out = new Int16Array(W * H);
let nod = 0;
for (let i = 0; i < out.length; i++) { if (!cnt[i]) { out[i] = -32768; nod++; } else out[i] = Math.round(sum[i] / cnt[i] * 100); }
fs.writeFileSync('data/terrain/dem.i16', Buffer.from(out.buffer));
fs.writeFileSync('data/terrain/dem.json', JSON.stringify({
  crs: 'EPSG:32610 (WGS 84 / UTM zone 10N)', units: 'meters', verticalDatum: 'NAVD88',
  encoding: 'int16 little-endian; value = elevation in centimeters NAVD88; -32768 = no data; rows run north to south',
  width: W, height: H, resolution: R, xmin, ymin, xmax, ymax, nodataCells: nod,
  retrieved: new Date().toISOString(),
  provenance: { category: 'derived', source: 'USGS 3DEP dynamic elevation service, 3DEPElevation ImageServer exportImage at 1 m (nearest neighbor), mean of each 4 x 4 block', url },
}, null, 2) + '\n');
console.log(`${W} x ${H} cells, ${nod} no-data`);
