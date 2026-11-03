// Write data/site-cells.json: the grid cells of each site in data/sites-checked.json (tools/site-cells.mjs),
// for the page's "What's exposed" panel.   node tools/build-site-cells.mjs
import fs from 'fs';
import { siteCells } from './site-cells.mjs';
const dem = JSON.parse(fs.readFileSync('data/terrain/dem.json'));
const out = {};
for (const s of JSON.parse(fs.readFileSync('data/sites-checked.json')).sites) out[s.id] = siteCells(dem, s);
fs.writeFileSync('data/site-cells.json', JSON.stringify(out) + '\n');
console.log(`${Object.keys(out).length} sites`);
