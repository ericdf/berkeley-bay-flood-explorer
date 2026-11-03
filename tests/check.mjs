// Checks on the data and the fill.   node tests/check.mjs
// 1. Every scenario names a level and a provenance category, and every SOURCE_NOTES row it cites exists.
// 2. The fill is monotonic: a higher level never leaves a cell dry that a lower level wet.
// 3. City 2019 Marina study (SOURCE_NOTES W7, W8): at 10.7 ft NAVD88 Marina Blvd is mostly under
//    water and part of the DoubleTree grounds are wet.
// 4. Comparison with the published ART map at each ART level, on Berkeley land: reported, and each
//    level's agreement (cells wet in both / wet in either) must stay at or above 60%.
import fs from 'fs';
import { load } from '../tools/report.mjs';
import { analyze, FLANKED } from '../js/analyze.js';
import { WET } from '../js/fill.js';

let fail = 0;
const isW = (v) => v === WET || v === FLANKED;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fail++; };

const notes = fs.readFileSync('SOURCE_NOTES.md', 'utf8');
const rows = new Set([...notes.matchAll(/\*\*([A-Z]\d+)[.*\s]|\| ([A-Z]\d+) \|/g)].map(m => m[1] || m[2]));
const sc = JSON.parse(fs.readFileSync('data/scenarios.json')).scenarios;
for (const s of sc) {
  ok(typeof s.levelFt === 'number' && ['sourced', 'derived', 'inference', 'sensitivity'].includes(s.category), `${s.id}: level ${s.levelFt} ft NAVD88, ${s.category}`);
  for (const r of (s.source.match(/\b[WMFHEC]\d+\b/g) || [])) ok(rows.has(r), `${s.id}: cites ${r}, which SOURCE_NOTES.md has`);
}

const D = load();
let prev = null;
for (const lv of [6.2, 7.4, 8.47, 9.73, 10.7, 12, 13]) {
  const r = analyze(D, lv);
  if (prev) { let back = 0; for (let i = 0; i < r.state.length; i++) if ((prev[i] === WET || prev[i] === FLANKED) && !(r.state[i] === WET || r.state[i] === FLANKED)) back++; ok(back === 0, `monotonic up to ${lv} ft (${back} cells lost)`); }
  prev = r.state.slice();
}

const r107 = analyze(D, 10.7);
const marina = r107.streets.find(s => s.name === 'MARINA BL' && s.wet);
const marinaAll = D.streets.edges.filter(e => e.name === 'MARINA BL').reduce((t, e) => t + e.len, 0);
ok(marina && marina.m / marinaAll >= 0.5, `10.7 ft: Marina Blvd under water for ${marina ? Math.round(marina.m) : 0} of ${marinaAll} m (City study W8: "most likely" impassable by 2050)`);
const dt = r107.facilities.find(f => /DoubleTree/.test(f.label));
ok(dt.wetShare > 0, `10.7 ft: DoubleTree grounds ${Math.round(100 * dt.wetShare)}% under water (City study W7: two buildings' floors below the water)`);

// 5. Plans (docs/design/levers-and-drains.md). A plan only raises ground, so it never wets a cell
//    that no plan leaves dry; above every crest it changes nothing; tide gates close every drain link.
{
  const { planFrom } = await import('../tools/report.mjs');
  for (const [spec, lv] of [['walls2050', 10.7], ['walls2100', 13], ['roads', 10.7]]) {
    const plan = planFrom(D, spec), a = analyze(D, lv, null), b = analyze(D, lv, plan);
    let extra = 0; for (let i = 0; i < a.state.length; i++) if (isW(b.state[i]) && !isW(a.state[i])) extra++;
    ok(extra === 0, `${spec} at ${lv} ft wets no cell that no plan leaves dry (${extra})`);
    const hi = analyze(D, 15.5, plan), hi0 = analyze(D, 15.5, null);
    let diff = 0; for (let i = 0; i < hi.state.length; i++) if (isW(hi.state[i]) !== isW(hi0.state[i])) diff++;
    ok(diff === 0, `${spec} above its crest (15.5 ft) changes nothing (${diff} cells differ)`);
  }
  const g = analyze(D, 12, planFrom(D, 'gates'));
  ok(g.drainLandHa === 0, `tide gates on every outfall: no ground fills through drains at 12 ft (${g.drainLandHa.toFixed(1)} ha)`);
  const r = analyze(D, 10.7, planFrom(D, 'roads'));
  ok(!r.streets.some(s => s.berkeley && s.cls === 'wet'), 'Spinnaker Way and University Ave raised to 12.7 ft: no Berkeley street under water at 10.7 ft');
}

// 6. Rain on a high tide (js/rain.js). No runoff held back means no pools; more held back never pools
//    less; pools never sit on ground already under Bay water; the Gilman and Codornices pools reach
//    Second St beside the transfer station, where the Draft EIR documents flooding in a 10-year storm (F8).
{
  const { planFrom } = await import('../tools/report.mjs');
  const gates = planFrom(D, 'gates');
  const none = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0 });
  ok(none.rainLandHa === 0, `rain with nothing held back: no pools (${none.rainLandHa.toFixed(1)} ha)`);
  let prevHa = 0;
  for (const b of [0.1, 0.25, 0.5, 1]) {
    const r = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: b });
    ok(r.rainLandHa >= prevHa - 1e-9, `rain held back ${b}: ${r.rainLandHa.toFixed(1)} ha pooled, not less than with less held back`);
    prevHa = r.rainLandHa;
  }
  const bay = analyze(D, 9.73, gates), wr = analyze(D, 9.73, gates, { ari: '10', duration: '6-hr', blocked: 1 });
  let onBay = 0; for (let i = 0; i < bay.state.length; i++) if (isW(bay.state[i]) && wr.state[i] === 5) onBay++;
  ok(onBay === 0, `rain pools never cover ground already under Bay water (${onBay} cells)`);
  // Runoff is conserved: each pool holds no more than its watershed's runoff (to within the 1 cm
  // the stored surface is rounded down to).
  const rc = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0.1 });
  for (const p of rc.rain.pools) ok(p.heldM3 <= p.volumeM3 * 1.001 + 1, `${p.watershed} pool holds ${Math.round(p.heldM3)} of ${Math.round(p.volumeM3)} m3 of runoff`);
  // A plan's walls count for rain: a 20 ft wall ringed close around the Schoolhouse pool's first inlet
  // keeps that pool inside it.
  const sp = rc.rain.pools.find(p => p.watershed === 'Schoolhouse');
  const [sx, sy] = sp.seed, ring = [[sx - 40, sy - 40], [sx + 40, sy - 40], [sx + 40, sy + 40], [sx - 40, sy + 40], [sx - 40, sy - 40]];
  const walled = analyze(D, 7.4, { ...gates, walls: [{ label: 'test ring', crestFt: 20, lines: [ring] }] }, { ari: '10', duration: '6-hr', blocked: 0.1 });
  const wp = walled.rain.pools.find(p => p.watershed === 'Schoolhouse');
  ok(wp.areaHa < sp.areaHa && wp.levelFt > sp.levelFt, `a ringed wall confines the Schoolhouse pool (${sp.areaHa.toFixed(1)} -> ${wp.areaHa.toFixed(1)} ha, surface ${sp.levelFt.toFixed(1)} -> ${wp.levelFt.toFixed(1)} ft NAVD88)`);
  // A street counts when its flooded samples together reach the threshold, even when split between
  // rain and drain water (Codex example: Bancroft Way edge 158 at 12 ft, open drains, 10% held back).
  const mix = analyze(D, 12, null, { ari: '10', duration: '6-hr', blocked: 0.1 });
  const e158 = mix.segs.find(x => x.e.id === 158);
  ok(e158 && e158.cls !== 'low', `a street flooded by rain and drains together is counted (Bancroft Way edge 158: ${e158 ? e158.cls : 'missing'})`);
  // Street rain depth is measured above the plan's ground, as the pools are (Codex example: a 10.5 ft
  // NAVD88 wall drawn along Virginia St edge 329).
  const e329 = D.streets.edges.find(e => e.id === 329);
  const onWall = analyze(D, 7.4, { ...gates, walls: [{ label: 'test wall', crestFt: 10.5, lines: [e329.geom] }] }, { ari: '10', duration: '6-hr', blocked: 0.1 });
  const v329 = onWall.segs.find(x => x.e.id === 329);
  ok(v329 && v329.depthFt != null && v329.depthFt <= 0.34, `street rain depth uses the plan's ground (Virginia St edge 329 on a 10.5 ft wall: ${v329 && v329.depthFt != null ? v329.depthFt.toFixed(2) : 'not pooled'} ft, at most 0.33 above the wall's crest)`);
  const r10 = analyze(D, 7.4, gates, { ari: '10', duration: '6-hr', blocked: 0.1 });
  ok(r10.streets.some(s => s.name === '2ND ST' && s.cls === 'rain'), '10-year 6-hour storm, 10% held back: Second St under pooled rain (Draft EIR F8)');
}

// 7. The State's Tsunami Hazard Area (SOURCE_NOTES H6) is rasterized onto the grid and covers the
//    transfer station (C16).
{
  const m = new Uint8Array(fs.readFileSync('data/hazard/tsunami.bits')), on = (i) => (m[i >> 3] >> (i & 7)) & 1;
  ok(m.length === Math.ceil(D.dem.width * D.dem.height / 8), 'tsunami.bits matches the terrain grid');
  const k = D.facilities.findIndex(f => /Transfer station/.test(f.label)), c = D.facilityCells[k].cells;
  ok(c.every(on), 'the transfer station lies inside the State tsunami hazard area');
}

// 8. "What's exposed" (js/exposure.js). The transfer station is reached by Bay water at 13.4 ft
//    (C6, E7); choosing to exit moves waste transfer off the map (E8); removing a site's
//    contamination takes it off the count only as the reader's choice; containment does not.
{
  const { exposure } = await import('../js/exposure.js');
  const { planFrom } = await import('../tools/report.mjs');
  const X = { ...D, exposure: JSON.parse(fs.readFileSync('data/exposure.json')), siteCells: JSON.parse(fs.readFileSync('data/site-cells.json')),
    tsunami: { mask: new Uint8Array(fs.readFileSync('data/hazard/tsunami.bits')) } };
  const r = analyze(X, 13.4), e0 = exposure(X, r);
  const st = e0.sites.find(s => s.site.id === 'transfer-station');
  ok(st.reach && /Bay water over/.test(st.reach.main) && st.counts, `13.4 ft: transfer station reached by Bay water (${st.reach ? Math.round(100 * st.reach.share) : 0}% of its ground)`);
  const ex = exposure(X, r, { 'transfer-station': 'exit' });
  ok(/not checked here/.test(ex.services[0].status) && !ex.sites.find(s => s.site.id === 'transfer-station').counts, 'exit: waste transfer moves to a regional station, shown as not checked; the site no longer counts');
  const ps0 = e0.sites.find(s => s.site.id === 'pacific-steel-geotracker');
  const con = exposure(X, r, { 'pacific-steel-geotracker': 'contain' }).sites.find(s => s.site.id === 'pacific-steel-geotracker');
  const rem = exposure(X, r, { 'pacific-steel-geotracker': 'remove' }).sites.find(s => s.site.id === 'pacific-steel-geotracker');
  ok(ps0.counts && con.counts && !rem.counts, 'Pacific Steel at 13.4 ft: containment still counts, removal does not');
  const fp = exposure(X, r, { 'berkeley-forge': 'floodproof' }, 14).sites.find(s => s.site.id === 'berkeley-forge');
  const fpLow = exposure(X, r, { 'berkeley-forge': 'floodproof' }, 13).sites.find(s => s.site.id === 'berkeley-forge');
  ok(!fp.counts && fpLow.counts, 'flood-proofing to 14 ft keeps Berkeley Forge dry at 13.4; to 13 ft it does not');
  // Flood-proofing is checked against the water on the site, including a rain pool above the Bay
  // (Codex, PR #6): Bay at 7.4 ft, gates, 10-year 6-hour storm, all runoff held back.
  const rr = analyze(X, 7.4, planFrom(X, 'gates'), { ari: '10', duration: '6-hr', blocked: 1 });
  const bf = exposure(X, rr, { 'berkeley-forge': 'floodproof' }, 12).sites.find(s => s.site.id === 'berkeley-forge');
  ok(bf.reach && bf.reach.main === 'pooled rain' && bf.counts, `flood-proofing to 12 ft does not keep Berkeley Forge dry under a ${bf.sh.waterFt.toFixed(2)} ft NAVD88 rain pool`);
  // Each run keeps its own rain surface: with a plan run first and the no-plan run second (the
  // page's order), the plan's exposure still reads the plan's pools (Codex, PR #6).
  const rain12 = { ari: '10', duration: '6-hr', blocked: 1 }, gates = planFrom(X, 'gates');
  const rPlan = analyze(X, 12, gates, rain12); analyze(X, 12, null, rain12);
  const bf13 = exposure(X, rPlan, { 'berkeley-forge': 'floodproof' }, 13, gates).sites.find(s => s.site.id === 'berkeley-forge');
  ok(!bf13.counts, `12 ft, gates, rain: Berkeley Forge's own pool (${bf13.sh.waterFt.toFixed(2)} ft NAVD88) is under flood-proofing at 13 ft, read from its own run`);
  // The 25% threshold applies to all the water on a site together (Codex, PR #6): the transfer
  // station at 12 ft with open outfalls and rain is flooded through drains and by rain.
  const rMix = analyze(X, 12, null, rain12), stMix = exposure(X, rMix).sites.find(s => s.site.id === 'transfer-station');
  ok(stMix.reach && stMix.counts, `12 ft, open outfalls, rain: transfer station reached (${stMix.reach ? stMix.reach.how : 'not reached'})`);
  // I-80 counts rain and drain flooding too (Codex, PR #6): Bay at 7.4 ft, gates, all runoff held back.
  const rI = analyze(X, 7.4, planFrom(X, 'gates'), { ari: '10', duration: '6-hr', blocked: 1 });
  const i80 = exposure(X, rI).services.find(s => s.name === 'I-80');
  ok(i80.reached && /pooled rain/.test(i80.status), `I-80 under pooled rain is reported: ${i80.status.split(':')[0]}`);
  ok(e0.tsunamiCount >= 8, `${e0.tsunamiCount} listed pollution sources inside the State tsunami hazard area`);
}

if (fs.existsSync('data/hazard/art.json')) {
  const art = JSON.parse(fs.readFileSync('data/hazard/art.json'));
  const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
  console.log('\nART comparison on Berkeley land (cells not open Bay): ours = connected fill at the same level');
  console.log('inches  level  ART ha  ours ha  both ha  ART only  ours only  agreement (both / either)');
  for (const l of art.levels) {
    const m = new Uint8Array(fs.readFileSync(`data/hazard/${l.file}`));
    const r = analyze(D, l.levelFt);
    let a = 0, o = 0, b = 0;
    for (let i = 0; i < r.state.length; i++) {
      if (!inB(i) || D.water0[i]) continue;
      const A = (m[i >> 3] >> (i & 7)) & 1, O = r.state[i] === WET || r.state[i] === FLANKED;
      if (A) a++; if (O) o++; if (A && O) b++;
    }
    const ha = (n) => (n * 16 / 1e4).toFixed(1).padStart(7);
    const agree = a + o - b ? b / (a + o - b) : 1;
    ok(agree >= 0.6, `ART + ${l.inches} in: agreement ${(100 * agree).toFixed(0)}%, at least 60%, a floor under the 68-92% recorded in SOURCE_NOTES C1`);
    console.log(`${String(l.inches).padStart(6)}  ${l.levelFt.toFixed(2).padStart(5)} ${ha(a)}  ${ha(o)}  ${ha(b)}  ${ha(a - b)}  ${ha(o - b)}    ${(a + o - b ? 100 * b / (a + o - b) : 100).toFixed(0)}%`);
  }
}
// 4b. ART's ten levels and its disconnected low-lying areas (SOURCE_NOTES H5, C1, C6, C20). art.json
//     lists all ten levels, the three the Caltrans service lacks read from the Alameda County
//     geodatabase; art-dc.json lists the same ten, so the page's disconnected outline can follow the
//     ART outline's nearest level; at + 84 in (13.20 ft NAVD88) ART has none of the transfer station
//     under connected flooding and about two fifths of it disconnected; the page has the toggle, off by
//     default, with its provenance line.
if (fs.existsSync('data/hazard/art.json') && fs.existsSync('data/hazard/art-dc.json')) {
  const art = JSON.parse(fs.readFileSync('data/hazard/art.json')), dc = JSON.parse(fs.readFileSync('data/hazard/art-dc.json'));
  const TEN = [12, 24, 36, 48, 52, 66, 77, 84, 96, 108], NB = Math.ceil(D.dem.width * D.dem.height / 8);
  ok(JSON.stringify(art.levels.map(l => l.inches)) === JSON.stringify(TEN), `art.json lists all ten ART levels (${art.levels.map(l => l.inches).join(', ')} in)`);
  ok(art.levels.every(l => fs.readFileSync(`data/hazard/${l.file}`).length === NB), 'every ART connected mask matches the terrain grid');
  ok(art.levels.filter(l => l.source === 'geodatabase').map(l => l.inches).join() === '48,77,84' && art.levels.filter(l => l.source === 'geodatabase').every(l => /^Alameda_inundation_poly_\d+$/.test(l.layer) && l.retrieved),
    'ART + 48, + 77 and + 84 in are the geodatabase layers Alameda_inundation_poly_<N>, with retrieval dates');
  ok(art.levels.every(l => Math.abs(l.levelFt - (6.2 + l.inches / 12)) < 0.006), 'ART levels in ft NAVD88 are MHHW 6.20 + N/12 (W11)');
  ok(JSON.stringify(dc.levels.map(l => l.inches)) === JSON.stringify(TEN) && dc.levels.every(l => fs.readFileSync(`data/hazard/${l.file}`).length === NB),
    'art-dc.json lists the same ten levels, each mask matching the terrain grid');
  const k = D.facilities.findIndex(f => /Transfer station/.test(f.label)), tc = D.facilityCells[k].cells.filter(i => !D.water0[i]);
  const share = (file) => { const m = new Uint8Array(fs.readFileSync(`data/hazard/${file}`)); return tc.filter(i => (m[i >> 3] >> (i & 7)) & 1).length / tc.length; };
  const c84 = share(art.levels.find(l => l.inches === 84).file), d84 = share(dc.levels.find(l => l.inches === 84).file);
  ok(c84 === 0 && d84 > 0.35 && d84 < 0.5, `ART + 84 in (13.20 ft NAVD88): transfer station ${(100 * c84).toFixed(0)}% connected flooding, ${(100 * d84).toFixed(0)}% disconnected low-lying (C6, C20: 0% and 42%)`);
  ok(share(art.levels.find(l => l.inches === 96).file) > 0.9, 'ART + 96 in (14.20 ft NAVD88) floods the transfer station from the Bay');
  const html = fs.readFileSync('index.html', 'utf8'), js = fs.readFileSync('js/main.js', 'utf8');
  const box = /<input id="showArtDc" type="checkbox"[^>]*>/.exec(html);
  ok(box && !/checked/.test(box[0]), 'index.html has the ART disconnected low-lying outline, off by default');
  const line = html.slice(html.indexOf('id="showArtDc"'), html.indexOf('id="artDcNote"'));
  ok(/published hazard layer/.test(line) && /ART, 2017/.test(line) && /not connected to the Bay/.test(line) && /one acre/.test(line) && /storm drains or from groundwater/.test(line) && /Not a flood forecast/.test(line),
    'its provenance line names the published layer, the one-acre threshold, drains and groundwater, and says it is not a flood forecast');
  ok(/function artDcLevel[\s\S]*nearestArt\(levelFt\)/.test(js) && /fetch\(`data\/hazard\/\$\{l\.file\}`\)/.test(js.slice(js.indexOf('function artDcMask'))),
    'js/main.js draws it at the ART outline\'s nearest level and loads each mask when first shown');
}

// 9. USGS CoSMoS v2.1 (SOURCE_NOTES H1; tools/build-cosmos.mjs). Every scenario's mask fits the
//    grid; the flooded area never shrinks as sea level rise grows, for a given storm; the stored
//    best-matching still water level reproduces with the page's analysis, and nearby levels match no
//    better; CoSMoS does not reach the transfer station with up to 2 m of rise and a 100-year storm,
//    and covers it at 5 m.
if (fs.existsSync('data/hazard/cosmos.json')) {
  const cos = JSON.parse(fs.readFileSync('data/hazard/cosmos.json'));
  const inB = (i) => (D.berkeley[i >> 3] >> (i & 7)) & 1;
  const masks = {};
  for (const s of cos.scenarios) masks[s.id] = new Uint8Array(fs.readFileSync(`data/hazard/${s.file}`));
  ok(cos.scenarios.length >= 45 && cos.scenarios.every(s => masks[s.id].length === Math.ceil(D.dem.width * D.dem.height / 8)), `${cos.scenarios.length} CoSMoS masks match the terrain grid`);
  ok(/not still water/.test(cos.note) && cos.provenance.category === 'sourced', 'cosmos.json says CoSMoS is not still water and carries its provenance');
  for (const st of ['w000', 'w001', 'w020', 'w100', 'wkt']) {
    const ha = cos.scenarios.filter(s => s.storm === st).sort((a, b) => a.slrM - b.slrM).map(s => s.cosmosHa);
    ok(ha.every((v, k) => !k || v >= ha[k - 1]), `CoSMoS ${st}: Berkeley land flooded grows with sea level rise (${ha.join(', ')} ha)`);
  }
  const agreeAt = (m, lv) => {
    const r = analyze(D, lv); let a = 0, o = 0, b = 0;
    for (let i = 0; i < r.state.length; i++) {
      if (!inB(i) || D.water0[i]) continue;
      const A = (m[i >> 3] >> (i & 7)) & 1, O = isW(r.state[i]);
      if (A) a++; if (O) o++; if (A && O) b++;
    }
    return a + o - b ? b / (a + o - b) : 1;
  };
  for (const id of ['slr100_w100', 'slr150_w100', 'slr200_w100']) {
    const s = cos.scenarios.find(x => x.id === id), lv = s.bestMatch.levelFt, ag = agreeAt(masks[id], lv);
    ok(Math.abs(ag - s.bestMatch.agreement) < 0.002, `${id}: agreement ${(100 * ag).toFixed(1)}% at ${lv} ft NAVD88, as stored`);
    ok(agreeAt(masks[id], lv - 0.5) <= ag + 1e-9 && agreeAt(masks[id], lv + 0.5) <= ag + 1e-9, `${id}: 0.5 ft below or above ${lv} ft NAVD88 matches no better`);
  }
  for (const s of cos.scenarios.filter(x => x.storm === 'w100' && x.slrM >= 1.25 && x.slrM <= 2)) ok(s.bestMatch.agreement >= 0.55, `${s.id}: best agreement ${(100 * s.bestMatch.agreement).toFixed(0)}%, at least 55%, a floor under the 63-71% recorded`);
  const k = D.facilities.findIndex(f => /Transfer station/.test(f.label)), tc = D.facilityCells[k].cells;
  const share = (id) => tc.filter(i => (masks[id][i >> 3] >> (i & 7)) & 1).length / tc.length;
  ok(cos.scenarios.filter(s => s.slrM <= 2).every(s => share(s.id) === 0), 'CoSMoS reaches none of the transfer station with up to 2 m of sea level rise, any storm');
  ok(share('slr500_w100') > 0.9, `CoSMoS 5 m + 100-year storm covers ${(100 * share('slr500_w100')).toFixed(0)}% of the transfer station`);
  console.log('\nCoSMoS comparison on Berkeley land: ours = connected fill at the best-matching still water level (derived)');
  console.log('scenario      CoSMoS ha  water surface off Berkeley (ft NAVD88, median)  best level  ours ha  CoSMoS only  ours only  agreement');
  for (const s of cos.scenarios) console.log(`${s.id.padEnd(12)} ${String(s.cosmosHa).padStart(9)}  ${(s.waterSurface ? s.waterSurface.medianFt.toFixed(2) : 'n/a').padStart(46)}  ${s.bestMatch.levelFt.toFixed(2).padStart(10)}  ${String(s.bestMatch.oursHa).padStart(7)}  ${String(s.bestMatch.cosmosOnlyHa).padStart(11)}  ${String(s.bestMatch.oursOnlyHa).padStart(9)}  ${(100 * s.bestMatch.agreement).toFixed(0).padStart(8)}%`);
}

// 10. USGS CoSMoS-GW groundwater (SOURCE_NOTES H7, C22; tools/build-cosmos-gw.mjs and
//     tools/compare-cosmos-gw.mjs). Self-contained. Masks fit the grid and do not overlap; stored
//     areas reproduce; ground marine, emergent or within 1 m of the surface never shrinks as the rise
//     grows; the transfer station has no cell deeper than 2 m at 0 m of rise (F6 measures 5 to 10 ft);
//     Pacific Steel's point is emergent at 0 m, as the City's screening reports (F19); CoSMoS-GW's
//     marine inundation agrees with the explorer's Bay water at the matched level (MHHW 6.20 ft NAVD88
//     plus the rise, a derived choice) at 75% or more from 1.5 m of rise up, and like the fill it keeps
//     the flats behind I-80 out at 2.0 m (12.76 ft NAVD88) and takes them at 2.5 m (14.40; C6: 13.35).
if (fs.existsSync('data/hazard/cosmos-gw.json')) {
  const gw = JSON.parse(fs.readFileSync('data/hazard/cosmos-gw.json'));
  const gbit = (m, i) => (m[i >> 3] >> (i & 7)) & 1, NB = Math.ceil(D.dem.width * D.dem.height / 8);
  const gm = {};
  for (const s of gw.scenarios) gm[s.id] = Object.fromEntries(Object.entries(s.files).map(([k, f]) => [k, new Uint8Array(fs.readFileSync(`data/hazard/${f}`))]));
  ok(gw.scenarios.length === 12 && gw.scenarios.every(s => Object.values(gm[s.id]).length === 4 && Object.values(gm[s.id]).every(m => m.length === NB)), `${gw.scenarios.length} CoSMoS-GW rises, four class masks each, match the terrain grid`);
  ok(/not a flood depth/.test(gw.note) && /1\.0 m\/day/.test(gw.note) && gw.provenance.category === 'sourced', 'cosmos-gw.json says a groundwater depth is not a flood depth, names the conductivity case and carries its provenance');
  let overlap = 0;
  for (const s of gw.scenarios) { const ms = Object.values(gm[s.id]); for (let b = 0; b < NB; b++) { let seen = 0; for (const m of ms) { if (seen & m[b]) overlap++; seen |= m[b]; } } }
  ok(overlap === 0, `CoSMoS-GW class masks never overlap (${overlap} bytes with a shared bit)`);
  const gInB = (i) => gbit(D.berkeley, i), MSLC = 3.31 * 30.48;
  let reproduced = true;
  for (const s of gw.scenarios) for (const k of Object.keys(s.files)) {
    let n = 0; for (let i = 0; i < D.z.length; i++) if (gInB(i) && !D.water0[i] && D.z[i] !== -32768 && D.z[i] >= MSLC && gbit(gm[s.id][k], i)) n++;
    if (Math.abs(n * D.dem.resolution ** 2 / 1e4 - s.berkeleyLandHa[k]) > 0.06) reproduced = false;
  }
  ok(reproduced, 'CoSMoS-GW Berkeley land areas reproduce from the masks');
  const near = gw.scenarios.map(s => s.berkeleyLandHa.marine + s.berkeleyLandHa.emergent + s.berkeleyLandHa['0to1m']);
  ok(near.every((v, k) => !k || v >= near[k - 1] - 0.05), `CoSMoS-GW Berkeley land marine, emergent or within 1 m grows with the rise (${near.map(v => v.toFixed(0)).join(', ')} ha)`);
  const { compare, PLACES } = await import('../tools/compare-cosmos-gw.mjs');
  const cmp = compare(), at = (id) => cmp.find(o => o.id === id), pl = (o, name) => o.places[PLACES.findIndex(([n]) => n.startsWith(name))];
  const ts0 = pl(at('slr000'), 'Transfer station');
  ok(ts0.deeper === 0 && ts0.emergent + ts0['0to1m'] >= 0.85, `CoSMoS-GW at 0 m: transfer station ${(100 * ts0.emergent).toFixed(0)}% emergent, ${(100 * ts0['0to1m']).toFixed(0)}% 0-1 m, ${(100 * ts0['1to2m']).toFixed(0)}% 1-2 m, none deeper (Draft EIR F6: 5 to 10 ft below ground)`);
  ok(pl(at('slr000'), 'Pacific Steel').emergent >= 0.95, 'CoSMoS-GW at 0 m: Pacific Steel, 1333 Second St, emergent (the City screening, F19: "0 m; emergent")');
  for (const o of cmp.filter(x => x.slrM >= 1.5)) ok(o.agreeMarine >= 0.75, `CoSMoS-GW ${o.slrM} m: marine inundation vs the explorer's Bay water at ${o.levelFt} ft NAVD88, ${(100 * o.agreeMarine).toFixed(0)}% (both / either), at least 75%, a floor under the 79-97% recorded`);
  const ts2 = pl(at('slr200'), 'Transfer station'), ts25 = pl(at('slr250'), 'Transfer station');
  ok(ts2.marine === 0 && ts2.oursWet === 0 && ts25.marine >= 0.5 && ts25.oursWet >= 0.5, `transfer station: CoSMoS-GW marine 0% at 2.0 m and ${(100 * ts25.marine).toFixed(0)}% at 2.5 m; the fill 0% at 12.76 and ${(100 * ts25.oursWet).toFixed(0)}% at 14.40 ft NAVD88`);
  console.log('\nCoSMoS-GW on Berkeley land (ha; MHHW, Kh 1.0 m/day; depth to groundwater, not a flood depth)');
  console.log('rise m  marine  emergent  0-1 m  1-2 m');
  for (const s of gw.scenarios) console.log(`${s.slrM.toFixed(2).padStart(6)}  ${String(s.berkeleyLandHa.marine).padStart(6)}  ${String(s.berkeleyLandHa.emergent).padStart(8)}  ${String(s.berkeleyLandHa['0to1m']).padStart(5)}  ${String(s.berkeleyLandHa['1to2m']).padStart(5)}`);
}
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
