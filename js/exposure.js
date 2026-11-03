// "What's exposed" (docs/design/mitigations.md; Eric's decisions E6-E8). Given a result from
// js/analyze.js and the reader's site choices, lists the pollution sources a level reaches, the
// critical services, and the ways off the waterfront. A choice never changes the water: it changes
// what is exposed (flood-proofing, moving an operation) or what the ground carries (contain, remove),
// and every choice is the reader's assumption. Works in the browser and in Node.

export const REACH = 0.25; // a site or road counts as reached when this share is under water (as tools/site-check.mjs)

const WET = (v) => v === 1 || v === 3;

// Shares of a site's cells under Bay water, filling through drains, or under pooled rain, and the
// highest water surface on it (ft NAVD88): the Bay level for Bay and drain water (drains fill to
// the Bay level), the pool surface for rain (js/rain.js; it can stand above the Bay).
function shares(D, res, cells) {
  const n = cells.length || 1; let wet = 0, drain = 0, rain = 0, top = -Infinity;
  for (const i of cells) {
    const v = res.state[i];
    if (WET(v)) { wet++; top = Math.max(top, res.levelFt); }
    else if (v === 4) { drain++; top = Math.max(top, res.levelFt); }
    else if (v === 5) { rain++; if (res.rainSurface) top = Math.max(top, res.rainSurface[i] / 30.48); }
  }
  return { wet: wet / n, drain: drain / n, rain: rain / n, waterFt: top };
}

// How a site is reached at this level, or null. The threshold applies to all the water on it
// together (Bay, drains and rain), as it does for streets (js/analyze.js); the sources are then
// named, largest first.
function reachOf(sh) {
  const total = sh.wet + sh.drain + sh.rain;
  if (total < REACH) return null;
  const parts = [['Bay water over the ground', sh.wet], ['Bay water up the storm drains', sh.drain], ['pooled rain', sh.rain]]
    .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return { how: parts.map(([h, v]) => parts.length > 1 ? `${h} (${Math.round(100 * v)}%)` : h).join(', '), share: total, main: parts[0][0] };
}

export function siteCellsFor(D, site) {
  if (site.facility) { const k = D.facilities.findIndex(f => f.label.startsWith(site.facility)); return k >= 0 ? D.facilityCells[k].cells : []; }
  return (D.siteCells && D.siteCells[site.id]) || [];
}

// choices: { [siteId]: 'none' | 'floodproof' | 'move' | 'exit' | 'contain' | 'remove' }, floodproofFt.
// plan: the plan used for res (for tide gates). Returns rows for the panel.
export function exposure(D, res, choices = {}, floodproofFt = null, plan = null) {
  const X = D.exposure, lv = res.levelFt;
  const tsu = D.tsunami && D.tsunami.mask, inTsu = (i) => tsu && ((tsu[i >> 3] >> (i & 7)) & 1);
  const sites = X.sites.map(site => {
    const cells = siteCellsFor(D, site), sh = shares(D, res, cells), reach = site.stillWaterNotApplicable ? null : reachOf(sh);
    const tsunami = cells.length ? cells.filter(inTsu).length / cells.length : 0;
    const c = choices[site.id] || 'none';
    const inUse = site.kinds.includes('in use'), inGround = site.kinds.includes('in ground');
    // What still counts as exposed after the reader's choice.
    const useGone = c === 'move' || c === 'exit';
    // Flood-proofing holds while the water on the site, Bay or pooled rain, stays at or below it.
    const siteWater = sh.waterFt > -Infinity ? sh.waterFt : lv;
    const useDry = c === 'floodproof' && floodproofFt != null && siteWater <= floodproofFt;
    const groundGone = c === 'remove';
    const exposedUse = inUse && !useGone && !useDry;
    const exposedGround = inGround && !groundGone;
    const counts = !!reach && (exposedUse || exposedGround);
    const notes = [];
    if (c === 'floodproof') notes.push(useDry
      ? `stored materials kept dry: flood-proofed to ${floodproofFt} ft NAVD88, above the water on the site (your assumption; still water only, not tsunami)`
      : `the water on the site, ${siteWater.toFixed(1)} ft NAVD88, is over the flood-proofing (${floodproofFt} ft NAVD88; your assumption)`);
    if (c === 'move') notes.push('operation moved away (your assumption); its ground stays');
    if (c === 'exit') notes.push('the City stops running a transfer station; waste goes to a regional one (your assumption; E7). Its ground stays');
    if (c === 'contain') notes.push('contained (your assumption): caps and vapor controls can fail when flooded or under rising groundwater (F17)');
    if (c === 'remove') notes.push('contamination removed (your assumption)');
    return { site, reach, sh, tsunami, choice: c, counts, inTsunami: tsunami >= REACH && (exposedUse || exposedGround), notes };
  });
  // Critical services: functions, attached to whichever facility performs them (E8).
  const station = sites.find(s => s.site.id === 'transfer-station');
  const exited = station && station.choice === 'exit';
  const roadM = (names, maxX) => {
    const set = new Set(names), by = {};
    for (const s of res.segs) {
      if (!set.has(s.e.name) || !s.e.berkeley || !['wet', 'drain', 'rain'].includes(s.cls)) continue;
      if (maxX != null && s.e.name === 'UNIVERSITY AV' && !s.e.geom.every(([x]) => x <= maxX)) continue;
      by[s.e.name] = (by[s.e.name] || 0) + s.e.len;
    }
    return by;
  };
  // I-80: freeway lines flooded by any source, Bay water, drains or pooled rain, as js/analyze.js classes them.
  const i80By = { wet: 0, drain: 0, rain: 0 };
  for (const s of res.segs) if (s.e.freeway && s.cls in i80By) i80By[s.cls] += s.e.len;
  const i80 = i80By.wet + i80By.drain + i80By.rain;
  const i80Parts = [['Bay water', i80By.wet], ['through drains', i80By.drain], ['pooled rain', i80By.rain]].filter(([, m]) => m > 0).map(([h, m]) => `${h} ${(m / 1000).toFixed(2)} km`);
  const gates = plan && plan.gates && Object.keys(plan.gates).length > 0;
  const services = [
    { name: 'Waste transfer', facility: exited ? 'a regional transfer station' : 'the City transfer station',
      status: exited ? 'not checked here: outside the map; choosing a regional station includes its own flood and tsunami check (E8)'
        : station.reach ? `reached: ${station.reach.how}, ${Math.round(100 * station.reach.share)}% of its ground` : 'not reached at this level',
      reached: !exited && !!station.reach, tsunami: !exited && station.tsunami >= REACH },
    { name: 'Frontage roads', roads: roadM(X.frontageRoads), reachedKey: true },
    { name: 'Marina access roads, also the ways off the waterfront', roads: roadM(X.marinaRoutes, X.marinaMaxX), reachedKey: true, wayOut: true },
    { name: 'Storm drain outfalls', status: gates ? 'tide gates on every outfall (your assumption)' : 'assumed open: which outfalls have working tide gates is not published (D6)', reached: !gates },
    // I-80 last among the roads: bare-earth lidar removes the raised deck and overpasses, so its
    // figure is the least certain here (an outside review, 2026-11-03); the caveat leads.
    { name: 'I-80', status: i80 > 0 ? `on bare-earth lidar, which removes the raised deck and overpasses, ${(i80 / 1000).toFixed(2)} km of freeway lines in both directions and ramps, in Berkeley and beyond, are flooded (${i80Parts.join(', ')}); Caltrans road profiles are needed to confirm (F2)` : 'not reached at this level', reached: i80 > 0 },
    { name: 'Sanitary sewers', status: 'not modeled (F15)', reached: null },
  ];
  for (const s of services) if (s.reachedKey) {
    const parts = Object.entries(s.roads).map(([n, m]) => `${n.replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase())} ${Math.round(m)} m`);
    s.reached = parts.length > 0; s.status = parts.length ? `under water or flooded: ${parts.join(', ')}` : 'not reached at this level';
  }
  return { sites, services, reachedCount: sites.filter(s => s.counts).length, tsunamiCount: sites.filter(s => s.inTsunami).length };
}
