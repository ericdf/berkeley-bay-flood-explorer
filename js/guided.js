// Guided mode (docs/design/guided-mode.md; Eric, E14 and E15): questions a resident asks, answered from
// data/thresholds.json, the level at which the explorer's fill first reaches each place
// (tools/thresholds.mjs, SOURCE_NOTES C23). Plain language: a level is described by how often it
// happens and by when, not by its datum; "Show the numbers" adds each level in ft NAVD88 (E14).
// Every line of an answer sets the map to that level, so it can be checked in expert mode.
import { toUTM } from '../tools/utm.mjs';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ft = (v) => `${v.toFixed(2)} ft NAVD88`;

// Named levels, ft NAVD88 still water (data/scenarios.json; sources there).
const TODAY = [
  { ft: 6.2, text: 'An ordinary high tide', often: 'almost every day' },
  { ft: 7.4, text: "This winter's highest tide (Dec 24)", often: 'about once a year' },
  { ft: 8.16, text: 'A storm tide', often: 'about a 20% chance each year' },
  { ft: 8.47, text: 'A storm tide', often: 'about a 10% chance each year' },
  { ft: 9.73, text: 'A severe storm tide', often: 'about a 1% chance each year' },
  { ft: 10.91, text: 'An extreme storm tide', often: 'about a 0.2% chance each year' },
];
const STORM2050 = [10.70, 10.73, 11.03]; // 1% storm tide in 2050: City study (2018 guidance), State 2024 Intermediate-High, High
const TIDE2100 = 9.4;                     // ordinary high tide in 2100, City study (2018 guidance)
const STORM2100 = [13.0, 14.53, 16.23];   // 1% storm tide in 2100: City study, State Intermediate-High, High
const HIGHEST = 16.5;                     // the top of the sweep

const count = (arr, T) => arr.filter(v => v >= T).length;
const estimates = (n) => n === 3 ? 'under every sea level estimate' : `but only under the ${n === 1 ? 'highest' : 'two higher'} sea level estimate${n === 1 ? '' : 's'}`;

// The plain-language ladder for a threshold T: the most frequent water today that reaches it,
// then 2050 and 2100. Each rung carries the level it stands for, so a click can show it.
export function ladder(T) {
  const t = TODAY.find(r => r.ft >= T);
  const n50 = count(STORM2050, T), n00 = count(STORM2100, T);
  return [
    { when: 'Today', lv: t ? t.ft : null, text: t ? `${t.text}, ${t.often}` : "None of today's storm tides, up to one with a 0.2% chance each year" },
    { when: '2050', lv: n50 ? STORM2050.find(v => v >= T) : null, text: n50 ? `A severe storm tide (1% chance each year), ${estimates(n50)}` : 'Not by a severe storm tide under any estimate' },
    T <= TIDE2100 ? { when: '2100', lv: TIDE2100, text: "An ordinary high tide, under the City's estimate" }
      : { when: '2100', lv: n00 ? STORM2100.find(v => v >= T) : null, text: n00 ? `A severe storm tide, ${estimates(n00)}` : 'Not under any estimate' },
  ];
}

// The earliest water that reaches T, in a few words, for tables.
export function whenShort(T) {
  if (T == null || T > HIGHEST) return 'none of these levels';
  const SHORT = { 6.2: 'ordinary high tides today', 7.4: "this winter's highest tide", 8.16: 'a storm tide today (20% chance each year)',
    8.47: 'a storm tide today (10% chance each year)', 9.73: 'a severe storm tide today (1% chance each year)', 10.91: 'an extreme storm tide today (0.2% chance each year)' };
  const t = TODAY.find(r => r.ft >= T);
  if (t) return SHORT[t.ft];
  if (T <= 11.03) return "2050's severe storm tide, highest estimate";
  if (T <= 13.0) return "2100's severe storm tide, City's estimate";
  if (T <= 14.53) return "2100's severe storm tide, State's middle-high estimate";
  if (T <= 16.23) return "2100's severe storm tide, State's highest estimate";
  return 'none of these levels';
}

export function initGuided({ D, T, el, setLevel, focus, onQuestion }) {
  const SITE_TEXT = {
    'berkeley-forge': 'Metal works under the State stormwater permit; its runoff carried aluminum, copper, iron and zinc before a 2012 settlement.',
    'pacific-steel-geotracker': 'Closed steel foundry. Contaminated soil and groundwater, which lies as little as 1.5 ft below the ground; cleanup open.',
    'eastshore-1255': 'Former traffic-sign plant. Solvents (TCE, vinyl chloride) and gasoline-range fuel in soil, shallow groundwater and soil vapor.',
    'transfer-station': "The City's garbage and recycling transfer station: a hazardous materials locker, batteries, bulbs and a 1,000-gallon used oil tank.",
    'marine-center': 'Boatyard. Lead and copper in surface soil. Its shoreline edge is wet at ordinary high tides.',
    'terminal-mfg': 'PCE, diesel and gasoline in groundwater and soil vapor; treatment under way.',
    'eastshore-park': 'PCBs, lead and other metals in soil and groundwater.',
    'flint-ink': 'Former ink plant. Lead, kerosene and other petroleum; solvents remain in groundwater.',
  };
  const ROADS = [
    { key: 'BOLIVAR DR', street: true, name: 'Bolivar Dr', what: 'Along Aquatic Park, beside I-80.', match: (e) => e.name === 'BOLIVAR DR' },
    { key: 'Frontage roads (Eastshore Hwy)', name: 'Eastshore Hwy (the frontage road)', what: 'The local road along I-80.', match: (e) => /^EASTSHORE HWY?$/.test(e.name) && e.berkeley },
    { key: 'Marina access roads', name: 'Roads to the Marina', what: 'Marina Blvd, Spinnaker Way and University Ave west of I-80: also the only ways off the waterfront.', match: (e) => e.berkeley && D.exposure.marinaRoutes.includes(e.name) && !(e.name === 'UNIVERSITY AV' && !e.geom.every(([x]) => x <= D.exposure.marinaMaxX)) },
    { key: 'I-80 mainline', name: 'I-80 in Albany, just north of Berkeley', what: 'Its lowest stretch, by the Albany shoreline south of Golden Gate Fields: the west shoulder sits at about 10.3 ft, the lanes at 11 to 11.8 ft (SOURCE_NOTES C27).', lidar: true, match: (e) => e.freeway && !e.berkeley && /^(I80 [EW]B|JOHN T\. KNOX FREEWAY)$/.test(e.name) },
    { key: 'I-80 mainline in Berkeley', name: 'I-80 in Berkeley', what: 'The freeway, both directions.', lidar: true, match: (e) => e.freeway && e.berkeley && /^(I80 [EW]B|JOHN T\. KNOX FREEWAY)$/.test(e.name) },
    { key: 'Rail main line', rail: true, name: 'The rail line in Albany', what: "Union Pacific's main line, used by Amtrak's Capitol Corridor and San Joaquins; its lowest stretch is north of Berkeley.", lidar: true, railMatch: (e) => !e.berkeley },
    { key: 'Rail main line in Berkeley', rail: true, name: 'The rail line in Berkeley', what: 'The same line through west Berkeley.', lidar: true, railMatch: (e) => !!e.berkeley },
    { key: 'University Ave ramps', name: 'I-80 ramps at University Ave', lidar: true, match: (e) => e.freeway && /^UNIVERSITY /.test(e.name) },
    { key: 'Ashby Ave ramps', name: 'I-80 ramps at Ashby Ave', lidar: true, match: (e) => e.freeway && /^ASHBY /.test(e.name) },
    { key: 'Gilman St ramps', name: 'I-80 ramps at Gilman St', lidar: true, match: (e) => e.freeway && /^GILMAN /.test(e.name) },
  ];
  const roadT = (r) => r.street ? T.streets[r.key] || {} : T.roads[r.key] || {};
  const roadLines = (r) => r.rail ? D.rail.edges.filter(r.railMatch).map(e => e.geom) : D.streets.edges.filter(r.match).map(e => e.geom);
  const W = D.dem.width, R = D.dem.resolution, Hm = D.dem.ymax - D.dem.ymin;
  const sitePoint = (id) => {
    const site = D.exposure.sites.find(s => s.id === id), cells = site.facility ? D.facilityCells[D.facilities.findIndex(f => f.label.startsWith(site.facility))].cells : (D.siteCells[id] || []);
    let sx = 0, sy = 0; for (const i of cells) { sx += (i % W + 0.5) * R; sy += Hm - (Math.floor(i / W) + 0.5) * R; }
    return cells.length ? [sx / cells.length, sy / cells.length] : null;
  };

  const drainNote = '<p class="warn">"Up the storm drains" assumes the drain outlets to the Bay have no working tide gates. The City has not published which ones have them. Where they do, only "over the ground" applies.</p>';
  const lidarNote = '<p class="warn">For I-80, its ramps and the rail line, the terrain is bare earth: the survey removes bridges and raised decks. Caltrans and railroad profiles would settle where they really go under.</p>';

  let placeN = 0; const places = [];
  function rungs(Tv) {
    return `<ul class="rungs">${ladder(Tv).map(r => `<li class="rung"><span class="when">${r.when}</span>${r.lv
      ? `<button type="button" data-lv="${r.lv}" data-p="${placeN}">${esc(r.text)}</button>` : `<span class="no">${esc(r.text)}</span>`}</li>`).join('')}</ul>`;
  }
  function scale(Tv) {
    const pos = (v) => `${(100 * (Math.min(v, HIGHEST) - 6) / (HIGHEST - 6)).toFixed(1)}%`;
    const ticks = [[6.2, 'high tide'], [9.73, 'today'], [10.73, '2050'], [14.53, '2100']];
    return `<div class="scale" aria-hidden="true" title="Severe (1% each year) storm tides today, and the middle sea level estimate for 2050 and 2100"><div class="bar"></div>${ticks.map(([v, l]) => `<div class="tick" style="left:${pos(v)}"><span>${l}</span></div>`).join('')}${Tv <= HIGHEST ? `<div class="thr" style="left:${pos(Tv)}"><span>reaches here</span></div>` : ''}</div>`;
  }
  // One place: its name (a click shows it on the map), what it is, and a ladder per way in.
  // p: { name, what, drain, bay, touch, edge, lidar, at: [x, y] | lines, tsunami }
  function place(p) {
    placeN = places.push(p) - 1;
    const parts = [];
    if (p.drain != null && (p.bay == null || p.drain < p.bay)) parts.push(`<span class="way drain">up the storm drains</span>${rungs(p.drain)}<p class="nums">${p.edge ? 'First water' : 'A quarter or more reached'} at ${ft(p.drain)} (derived)</p>`);
    if (p.bay != null) parts.push(`<span class="way bay">over the ground from the Bay</span>${rungs(p.bay)}<p class="nums">${p.edge ? 'First water' : 'A quarter or more reached'} at ${ft(p.bay)} (derived)${p.lidar ? '; bare-earth terrain' : ''}</p>`);
    if (p.drain == null && p.bay == null) parts.push(p.touch ? `<p class="what">Only its edge is reached, and only by water above every 2100 estimate except the highest.</p><p class="nums">First water at ${ft(p.touch)} (derived)</p>` : `<p class="what">None of the water levels here reach it, up to ${ft(HIGHEST)}, above the highest estimate for 2100.</p>`);
    const first = Math.min(p.drain ?? 99, p.bay ?? 99, p.touch ?? 99);
    return `<div class="place"><h3><button type="button" data-show="${placeN}">${esc(p.name)}</button></h3>${p.what ? `<p class="what">${esc(p.what)}</p>` : ''}${p.tsunami ? '<p class="what">Inside the State\'s tsunami evacuation area.</p>' : ''}${scale(first)}${parts.join('')}</div>`;
  }
  const numsToggle = () => `<label class="toggle"><input type="checkbox" class="numsBox" ${document.body.classList.contains('shownums') ? 'checked' : ''}> Show the numbers: water levels in feet, with how each was found</label>`;

  function sitePlaces() {
    return Object.entries(T.sites).filter(([, s]) => !s.stillWaterNotApplicable).map(([id, s]) => ({
      id, name: s.name, what: SITE_TEXT[id], tsunami: s.tsunamiShare >= 0.25, at: sitePoint(id),
      drain: s.drainCountedFt ?? null, bay: s.bayCountedFt ?? null, touch: s.bayCountedFt == null ? s.bayTouchFt : null,
    })).sort((a, b) => Math.min(a.drain ?? 99, a.bay ?? 99, a.touch ?? 99) - Math.min(b.drain ?? 99, b.bay ?? 99, b.touch ?? 99));
  }
  const roadPlace = (r) => { const t = roadT(r); return { name: r.name, what: r.what, lidar: r.lidar, lines: roadLines(r), drain: t.drainFt ?? null, bay: t.bayFt ?? null }; };

  const QUESTIONS = [
    { id: 'address', title: 'Could Bay flooding reach my home or street?', sub: 'Type an address, or use your location.' },
    { id: 'toxic', title: 'When could flooding reach contaminated ground and carry it into the Bay?', sub: 'Eight sites with known pollution near the shore, and the old landfill.' },
    { id: 'roads', title: 'When does flooding close I-80, the rail line or the roads to the Marina?', sub: 'Also Bolivar Dr, the frontage road and the I-80 ramps.' },
    { id: 'king', title: "What will this winter's king tides reach?", sub: 'And where to go and see for yourself.' },
    { id: 'tsunami', title: 'What about a tsunami?', sub: "The State's evacuation area, and what is inside it." },
    { id: 'defenses', title: 'What would flood walls, raised roads or tide gates change?', sub: 'Each defense the explorer can test, side by side.' },
  ];

  function home() {
    return `<h2 class="q">What do you want to know?</h2>
      <p>Pick a question. Each answer says when Bay water reaches each place: today, by 2050 and by 2100. Click a line in an answer to see that water on the map.</p>
      <div class="qs">${QUESTIONS.map(q => `<button type="button" class="qcard" data-q="${q.id}"><b>${esc(q.title)}</b><span>${esc(q.sub)}</span></button>`).join('')}</div>
      <p class="src" style="margin-top:16px">To set any level, add rain or build your own defenses, switch to <a href="#" data-mode="expert">Expert</a>.</p>`;
  }

  function toxic() {
    // Sites reached up the drains before Bay water reaches them over the ground.
    const ps = sitePlaces(), viaDrain = ps.filter(p => p.drain != null && (p.bay == null || p.drain < p.bay));
    const drainBy = (lv) => viaDrain.filter(p => p.drain <= lv).length, first = [...viaDrain].sort((a, b) => a.drain - b.drain)[0];
    return `<h2 class="q">When could flooding reach contaminated ground?</h2>
      <p class="finding">Up the storm drains, Bay water first covers a quarter of the ${esc(first.name.split(',')[0])} site in ${esc(whenShort(first.drain))}. By 2100's severe storm tide it covers ${drainBy(13.0)} sites this way, even under the City's lowest estimate. Over the ground, it reaches none of the sites behind I-80 until it crosses the freeway corridor, which takes more water than the City's estimate for 2100 and less than the State's middle-high estimate.</p>
      ${drainNote}
      <p class="warn">Groundwater is a third way in. A USGS model (CoSMoS-GW) puts the water table at the ground surface across nearly all of the Pacific Steel and Berkeley Forge sites today, under its middle assumption about the soil (SOURCE_NOTES C22). That result swings widely with the assumption, and the levels here do not include it.</p>
      ${ps.map(place).join('')}
      <div class="place"><h3>Former Berkeley Landfill, under César Chávez Park</h3><p class="what">About 1.5 million tons of waste on Bay mud with no liner beneath it. A water level is the wrong test here: the risks are the shoreline wearing away and groundwater rising into the waste, which this explorer does not model.</p><p class="what">Inside the State's tsunami evacuation area.</p></div>
      ${numsToggle()}`;
  }

  function roads() {
    const ps = ROADS.map(roadPlace), mar = roadT(ROADS[2]), bol = roadT(ROADS[0]), fr = roadT(ROADS[1]);
    return `<h2 class="q">When does flooding close the roads and the rail line?</h2>
      <p class="finding">The roads to the Marina go under in ${esc(whenShort(mar.bayFt))}${count(STORM2050, mar.bayFt) === 3 ? ", and in 2050's severe storm tide under every sea level estimate" : ''}. Just north of Berkeley, in Albany, I-80 and the rail line follow at slightly higher water. In Berkeley itself they hold until the water crosses behind I-80: ${(() => { const rw = whenShort(roadT(ROADS.find(r => r.key === 'Rail main line in Berkeley')).bayFt), iw = whenShort(roadT(ROADS.find(r => r.key === 'I-80 mainline in Berkeley')).bayFt); return esc(rw === iw ? `both in ${rw}` : `the rail line in ${rw}, I-80 in ${iw}`); })()}. Up the drains, Bay water can reach Bolivar Dr at ${esc(whenShort(bol.drainFt))} and the frontage road in ${esc(whenShort(fr.drainFt))}.</p>
      ${drainNote}${lidarNote}
      ${ps.map(place).join('')}
      ${numsToggle()}`;
  }

  function king() {
    const KT = 7.4, hits = Object.entries(T.streets).filter(([, s]) => (s.drainFt ?? 99) <= KT || (s.bayFt ?? 99) <= KT);
    const bol = roadT(ROADS[0]);
    return `<h2 class="q">What will this winter's king tides reach?</h2>
      <p class="finding">The highest tide this winter, on December 24, can push Bay water up the storm drains onto ${hits.map(([n]) => n.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase())).join(', ') || 'no street'}, if the drain outlet there has no working tide gate. Over the ground, it stays at the shoreline.</p>
      ${drainNote}
      <p>This is no rare event. From 2016 through 2025, high tides at NOAA's Richmond gauge reached that level about 19 times a year, in every year, and stayed above it for one to three hours each time (SOURCE_NOTES C26). If Bolivar Dr's drain outlet let the Bay in, the street would flood that often. Whether it does is what the field check tests.</p>
      ${place({ name: 'Bolivar Dr', what: 'Along Aquatic Park, beside I-80.', lines: roadLines(ROADS[0]), drain: bol.drainFt ?? null, bay: bol.bayFt ?? null })}
      <p>Go and look on the mornings of Nov 24–26, Dec 23–25 and Jan 21–22. The <a href="field-guide.html">king tide field guide</a> has times, four places to stand and what to photograph. Photos test whether the drains really let the Bay in.</p>
      ${numsToggle()}`;
  }

  function tsunami() {
    const n = Object.values(T.sites).filter(s => s.tsunamiShare >= 0.25).length;
    return `<h2 class="q">What about a tsunami?</h2>
      <p class="finding">All ${n} polluted and hazardous sites in this explorer lie inside the State's tsunami evacuation area, along with the Marina, Aquatic Park and the flats east of I-80 to about Fourth St.</p>
      <p>The State draws the area for evacuation planning. It combines the largest tsunamis considered for this coast and marks ground to leave when a warning is issued. It is not a flood depth or a forecast, and this explorer does not model a tsunami's water (SOURCE_NOTES H6).</p>
      <p>A tsunami arrives as a series of surges over hours. Water that floods in also drains back out, and it can carry what it picked up, from stored chemicals and contaminated ground, into the Bay. The transfer station's draft environmental report places the site in the tsunami area and finds no risk of releasing pollutants, because rebuilding would not make it more exposed than it is now (SOURCE_NOTES T4).</p>
      <p><button type="button" data-tsunami>Show the tsunami evacuation area on the map</button></p>`;
  }

  function defenses() {
    // Places compared: the first-reached level with no defense and with each one.
    const P = [
      { name: 'Berkeley Forge & Tool', get: (x) => x.sites['berkeley-forge'] && (x.sites['berkeley-forge'].drainCountedFt ?? x.sites['berkeley-forge'].bayCountedFt) },
      { name: 'Former Pacific Steel', get: (x) => x.sites['pacific-steel-geotracker'] && (x.sites['pacific-steel-geotracker'].drainCountedFt ?? x.sites['pacific-steel-geotracker'].bayCountedFt) },
      { name: 'Transfer station', get: (x) => x.sites['transfer-station'] && (x.sites['transfer-station'].drainCountedFt ?? x.sites['transfer-station'].bayCountedFt) },
      { name: 'Roads to the Marina', get: (x) => x.roads['Marina access roads'] && x.roads['Marina access roads'].drainFt },
      { name: 'I-80 in Albany', get: (x) => x.roads['I-80 mainline'] && x.roads['I-80 mainline'].drainFt },
      { name: 'I-80 in Berkeley', get: (x) => x.roads['I-80 mainline in Berkeley'] && x.roads['I-80 mainline in Berkeley'].drainFt },
      { name: 'Rail line in Berkeley', get: (x) => x.roads['Rail main line in Berkeley'] && x.roads['Rail main line in Berkeley'].drainFt },
      { name: 'Frontage road', get: (x) => x.roads['Frontage roads (Eastshore Hwy)'] && x.roads['Frontage roads (Eastshore Hwy)'].drainFt },
    ];
    const ha = (x) => x.land['13.00'];
    const card = (d) => {
      const changed = P.filter(p => p.get(d) !== p.get(T));
      return `<div class="place"><h3>${esc(d.label)}</h3>
        <p class="what">${esc(d.cost)}.</p>
        ${changed.length ? `<table class="defs"><tr><th>Place</th><th>First reached, no defenses</th><th>With this defense</th></tr>${changed.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(whenShort(p.get(T)))}<span class="nums"><br>${ft(p.get(T))}</span></td><td>${esc(whenShort(p.get(d)))}<span class="nums"><br>${p.get(d) != null ? ft(p.get(d)) : 'not reached'}</span></td></tr>`).join('')}</table>`
          : '<p>It does not change when any of these places is first reached.</p>'}
        <p class="what">Berkeley land under water or filling up the drains in 2100's severe storm tide (City's estimate): ${ha(d)} ha, against ${ha(T)} ha with no defenses.</p></div>`;
    };
    return `<h2 class="q">What would flood defenses change?</h2>
      <p class="finding">With tide gates on every storm drain outlet, no inland site floods until the water crosses behind I-80, and the land under water in 2100's severe storm tide (City's estimate) falls from ${ha(T)} to ${ha(T.defenses.find(d => d.id === 'gates'))} ha. The City study's 2100 floodwalls change little wherever, within 30 m, they are drawn, because the water goes around their ends (SOURCE_NOTES C11, C25). Whether its 2050 walls keep Marina Blvd dry depends on their exact line, which the study's drawings would settle.</p>
      <p class="warn">Which outlets already have tide gates, and whether they work, is not published (D6). If they are all in place, that protection already exists. The walls follow lines traced from the City's 2019 study, with crests assumed at its design level plus 2 ft; the tracing is good to about 30 m. None of this includes waves or groundwater.</p>
      ${T.defenses.map(card).join('')}
      <p class="src">One spot decides when the flats behind I-80 flood: above 13.35 ft NAVD88 the water crosses the freeway corridor about 250 m south of Gilman St (SOURCE_NOTES C6). A barrier there is not yet tested. In expert mode you can draw a wall anywhere and compare.</p>
      ${numsToggle()}`;
  }

  // Address lookup (E14): the typed address goes to the U.S. Census Bureau geocoder, which answers
  // by JSONP (its JSON reply carries no CORS header); nothing is stored or put in the page's link.
  // "Use my location" reads the device's position, which stays in the browser.
  let rasters = null;
  async function loadRasters() {
    if (rasters) return rasters;
    const get = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.arrayBuffer(); });
    const [b, d] = await Promise.all([get('data/hazard/first-bay.u8'), get('data/hazard/first-drain.u8')]);
    return (rasters = { bay: new Uint8Array(b), drain: new Uint8Array(d) });
  }
  function geocode(address) {
    return new Promise((resolve, reject) => {
      const cb = `bfeGeo${Date.now()}`, s = document.createElement('script');
      const done = () => { delete window[cb]; s.remove(); clearTimeout(timer); };
      const timer = setTimeout(() => { done(); reject(new Error('timeout')); }, 15000);
      window[cb] = (j) => { done(); resolve(j); };
      s.onerror = () => { done(); reject(new Error('network')); };
      s.src = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=jsonp&callback=${cb}`;
      document.head.appendChild(s);
    });
  }
  // The lowest first-reached level on land within 12 m of the point: an address point sits at the
  // street side of the parcel, so a small radius covers the lot's frontage (model rule).
  async function lookupPoint(lon, lat, label) {
    const out = document.getElementById('addrOut');
    const [ux, uy] = toUTM(lon, lat), x = ux - D.dem.xmin, y = uy - D.dem.ymin;
    const c = Math.floor(x / R), r = Math.floor((Hm - y) / R);
    if (c < 0 || r < 0 || c >= W || r >= D.dem.height) { out.innerHTML = `<p class="finding">${esc(label)} is outside the area this explorer maps, which covers west Berkeley's shoreline and flats. There is no answer for it here.</p>`; return; }
    const ras = await loadRasters(); let bay = 255, drain = 255;
    for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) {
      const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= D.dem.height || cc >= W || dr * dr + dc * dc > 9) continue;
      const i = rr * W + cc; if (D.water0[i] || D.z[i] < 3.31 * 30.48) continue;
      bay = Math.min(bay, ras.bay[i]); drain = Math.min(drain, ras.drain[i]);
    }
    const lv = (k) => k === 255 ? null : Math.round((6 + 0.05 * k) * 100) / 100;
    const p = { name: label, what: 'The ground at and in front of this address. Floors may sit higher; floor heights are not published.', at: [x, y], bay: lv(bay), drain: lv(drain) < lv(bay) || (lv(bay) == null && lv(drain) != null) ? lv(drain) : null, edge: true };
    const first = Math.min(p.drain ?? 99, p.bay ?? 99);
    out.innerHTML = `<p class="finding">${first > HIGHEST ? `None of the water levels here reach ${esc(label)}, up to the highest estimate for 2100.` : `At ${esc(label)}, Bay water first reaches the ground in ${esc(whenShort(first))}.`}</p>${p.drain != null ? drainNote : ''}${place(p)}${numsToggle()}`;
    focus({ points: [p.at], label });
  }
  function address() {
    return `<h2 class="q">Could Bay flooding reach my home or street?</h2>
      <form class="addr" id="addrForm"><input id="addrIn" autocomplete="street-address" placeholder="e.g. 200 Marina Blvd" aria-label="Street address in Berkeley"><button type="submit">Look up</button><button type="button" id="addrLoc">Use my location</button></form>
      <p class="src">The address goes to the U.S. Census Bureau's address lookup and is not stored. Your location stays on your device.</p>
      <div id="addrOut"></div>`;
  }
  async function onAddress(text) {
    const out = document.getElementById('addrOut');
    out.innerHTML = '<p class="src">Looking up the address…</p>';
    try {
      const j = await geocode(/berkeley|albany|emeryville|,/i.test(text) ? text : `${text}, Berkeley, CA`);
      const m = j && j.result && j.result.addressMatches && j.result.addressMatches[0];
      if (!m) { out.innerHTML = '<p>The Census Bureau found no match for that address. Check the spelling, or add the city.</p>'; return; }
      await lookupPoint(m.coordinates.x, m.coordinates.y, m.matchedAddress.replace(/, CA, \d{5}$/, '').replace(/\b(\w)(\w*)/g, (s, a, b) => a + b.toLowerCase()));
    } catch (e) { out.innerHTML = '<p>The Census Bureau\'s address lookup did not answer. Try again, or use your location.</p>'; }
  }

  const RENDER = { address, toxic, roads, king, tsunami, defenses };
  let current = null;
  function show(q) {
    places.length = 0; placeN = 0;
    current = RENDER[q] ? q : null;
    el.innerHTML = current ? `<button type="button" class="back" data-home>&larr; All questions</button>${RENDER[current]()}<p style="margin-top:16px"><a href="#" data-mode="expert">Check this in expert mode &rarr;</a></p>` : home();
    el.scrollTop = 0;
    if (!current) focus(null);
    onQuestion(current);
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.dataset.q) show(t.dataset.q);
    else if (t.hasAttribute('data-home')) show(null);
    else if (t.dataset.lv) {
      el.querySelectorAll('.rung button[aria-current]').forEach(b => b.removeAttribute('aria-current')); t.setAttribute('aria-current', 'true');
      setLevel(Number(t.dataset.lv)); const p = places[Number(t.dataset.p)]; if (p) focus({ points: p.at ? [p.at] : [], lines: p.lines || [], label: p.name });
    } else if (t.dataset.show) { const p = places[Number(t.dataset.show)]; if (p) focus({ points: p.at ? [p.at] : [], lines: p.lines || [], label: p.name }); }
    else if (t.id === 'addrLoc') {
      const out = document.getElementById('addrOut');
      if (!navigator.geolocation) { out.innerHTML = '<p>This browser does not share a location.</p>'; return; }
      out.innerHTML = '<p class="src">Finding your location…</p>';
      navigator.geolocation.getCurrentPosition((pos) => lookupPoint(pos.coords.longitude, pos.coords.latitude, 'your location'),
        () => { out.innerHTML = '<p>The location was not shared. Type an address instead.</p>'; }, { timeout: 15000 });
    } else if (t.hasAttribute('data-tsunami')) setLevel(null, { tsunami: true });
  });
  el.addEventListener('submit', (e) => { if (e.target.id === 'addrForm') { e.preventDefault(); const v = document.getElementById('addrIn').value.trim(); if (v) onAddress(v); } });
  el.addEventListener('change', (e) => { if (e.target.classList.contains('numsBox')) { document.body.classList.toggle('shownums', e.target.checked); el.querySelectorAll('.numsBox').forEach(b => { b.checked = e.target.checked; }); } });
  return { show, current: () => current, questions: QUESTIONS.map(q => q.id) };
}
