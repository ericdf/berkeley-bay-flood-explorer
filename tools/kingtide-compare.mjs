// Compare volunteer king tide readings with NOAA's predicted level at Richmond (9414863)
// and with the explorer's "this winter's king tide" level (scenario 7.4 ft NAVD88, W14).
//   node tools/kingtide-compare.mjs                     reads data/field/kingtide-*.csv
//   node tools/kingtide-compare.mjs data/field/x.csv    reads the files named
// Field CSV columns: date_time_lst_ldt,observed_ft_navd88   (local time, "YYYY-MM-DD HH:MM")
// Predictions: data/raw/noaa/richmond-predictions-kingtide.csv (tools/fetch-noaa-predictions.py),
// hourly, linearly interpolated to the observed minute. Datum: NAVD88 for every level.
import fs from 'fs';
import path from 'path';

const NOTE = "NOAA's predictions leave out wind and atmospheric pressure. The predicted level is the baseline; the observation is the field reading.";
const EXPLORER_FT = 7.4; // explorer scenario level, ft NAVD88 (W14; data/scenarios.json)
const PRED = 'data/raw/noaa/richmond-predictions-kingtide.csv';

const wall = s => { const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/); if (!m) return null; return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000; };
const rows = f => fs.readFileSync(f, 'utf8').trim().split('\n').slice(1).map(l => l.split(',').map(x => x.trim()));

function predictions() {
  return rows(PRED).map(([t, v]) => [wall(t), +v]).filter(([t]) => t !== null);
}
function predictedAt(preds, t) {
  for (let i = 0; i + 1 < preds.length; i++) {
    const [t0, v0] = preds[i], [t1, v1] = preds[i + 1];
    if (t >= t0 && t <= t1) return v0 + (v1 - v0) * (t - t0) / (t1 - t0);
  }
  return null;
}
const sign = x => (x >= 0 ? '+' : '') + x.toFixed(2);

const files = process.argv.length > 2 ? process.argv.slice(2)
  : fs.existsSync('data/field') ? fs.readdirSync('data/field').filter(f => /^kingtide-.*\.csv$/.test(f)).sort().map(f => path.join('data/field', f)) : [];
console.log(NOTE);
console.log(`Datum: all levels ft NAVD88. Baseline: NOAA predicted, Richmond 9414863 (${PRED}). Explorer level: ${EXPLORER_FT} ft NAVD88, a sourced explorer level, not a measurement.`);
if (files.length === 0) { console.log('No field readings found (data/field/kingtide-YYYY-MM-DD.csv).'); console.log(NOTE); process.exit(0); }

const preds = predictions();
console.log('');
console.log('file | time (lst_ldt) | observed ft NAVD88 | predicted ft NAVD88 | observed − predicted | 7.4 − predicted (explorer)');
for (const f of files) {
  for (const [ts, obs] of rows(f)) {
    const t = wall(ts), o = +obs;
    const p = t === null ? null : predictedAt(preds, t);
    if (t === null || p === null || Number.isNaN(o)) { console.log(`${f} | ${ts} | ${obs} | no prediction for this time or unreadable row`); continue; }
    console.log(`${f} | ${ts} | ${o.toFixed(2)} | ${p.toFixed(2)} | ${sign(o - p)} | ${sign(EXPLORER_FT - p)}`);
  }
}
console.log('');
console.log(NOTE);
