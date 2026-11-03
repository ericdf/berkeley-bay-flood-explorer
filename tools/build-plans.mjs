// Preset plans from the City's 2019 Marina sea level rise study (SOURCE_NOTES P1–P8).
//   node tools/build-plans.mjs
// Floodwall alignments are traced by eye from Figures 5.7 (2050) and 5.8 (2100), rendered at 150
// dpi and shown at 1.5x, in that rendering's pixels (TRACE below). They are placed on the grid by
// the figures' stated scale (1 in = 1,000 ft) and one landmark: the DoubleTree buildings drawn in
// the figure (pixel 385, 165) at the hotel's OpenStreetMap centroid (grid 1355, 3304 m). With that
// fit, the network's Marina Blvd, Spinnaker Way and University Ave fall on the roads in the
// figure's aerial photo. Positions are approximate, about +/- 30 m (assumption).
// Crests: the study draws floodwall heights as "varies" (Figs. 5.9, 5.10). The explorer uses the
// design still-water level plus the 2 ft freeboard the study states for raised roads (Zone 7):
// 10.7 + 2 = 12.7 ft NAVD88 for 2050, 13.0 + 2 = 15.0 for 2100 (assumption, SOURCE_NOTES P4).
import fs from 'fs';
const K = 0.3048 * 1000 / 150 / 1.5; // meters per traced pixel
const toGrid = ([u, v]) => [Math.round((1355 + (u - 385) * K) * 10) / 10, Math.round((3304 - (v - 165) * K) * 10) / 10];
const TRACE = {
  // Figure 5.7 (2050)
  northBasin: [[405, 15], [485, 125], [560, 108], [650, 92], [750, 72], [850, 52], [885, 40], [930, 18]],
  harborEdge2050: [[240, 170], [300, 155], [370, 148], [385, 175], [390, 230], [445, 245], [490, 262], [515, 300], [530, 350]],
  universityNorth: [[585, 550], [600, 510], [640, 485], [700, 470], [800, 452], [900, 428], [970, 410]],
  // Figure 5.8 (2100), in addition to northBasin and universityNorth
  harborRing: [[155, 310], [150, 235], [175, 195], [240, 168], [370, 150], [385, 172], [390, 240], [470, 245], [510, 265], [530, 300], [555, 365], [575, 420], [590, 470], [570, 500], [450, 525], [300, 560], [240, 555], [225, 480], [215, 390], [190, 380]],
  seawall: [[590, 470], [600, 520], [600, 620], [420, 650]],
};
const lines = Object.fromEntries(Object.entries(TRACE).map(([k, v]) => [k, v.map(toGrid)]));
const plans = {
  note: 'Preset plans. Walls: alignments traced from the City 2019 Marina study figures (tools/build-plans.mjs); crests are the study\'s design water level plus 2 ft freeboard (assumption). Roads: Shoreline Zones 7 and 8 of the same study. Costs are the study\'s cumulative estimates in 2019 dollars. SOURCE_NOTES P1-P8.',
  presets: [
    { id: 'walls2050', label: 'City study floodwalls for 2050 (Figure 5.7)', crestFt: 12.7, category: 'sourced alignment (traced), assumed crest',
      cost: '$14.3 million cumulative for 2050 protection (2019 dollars)', source: 'City 2019 Marina study §5.3.1, Figure 5.7; cost §5.4 (P2, P4, P5)',
      walls: [{ id: 'northBasin', lines: [lines.northBasin] }, { id: 'harborEdge', lines: [lines.harborEdge2050] }, { id: 'universityNorth', lines: [lines.universityNorth] }] },
    { id: 'walls2100', label: 'City study floodwalls for 2100 (Figure 5.8)', crestFt: 15.0, category: 'sourced alignment (traced), assumed crest',
      cost: '$31.5 million cumulative for 2100 protection (2019 dollars)', source: 'City 2019 Marina study §5.3.1, Figure 5.8; cost §5.4 (P3, P4, P5)',
      walls: [{ id: 'northBasin', lines: [lines.northBasin] }, { id: 'harborRing', lines: [lines.harborRing] }, { id: 'universityNorth', lines: [lines.universityNorth] }, { id: 'seawall', lines: [lines.seawall] }] },
    { id: 'roads', label: 'Raise Spinnaker Way and University Ave west of I-80 (Zones 7, 8)', crestFt: 12.7, category: 'sourced (freeboard rule), assumed design level',
      cost: 'Part of the revetment program, $5.4 million cumulative by 2050 (2019 dollars)', source: 'City 2019 Marina study §5.3.1, Shoreline Zones 7 and 8; cost §5.4 (P5, P6, P7)',
      roads: [{ names: ['SPINNAKER WY', 'UNIVERSITY AV'], maxX: 2300 }] },
  ],
};
fs.writeFileSync('data/plans.json', JSON.stringify(plans, null, 1) + '\n');
console.log(Object.entries(lines).map(([k, v]) => `${k}: ${v.length} points, ${v.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - v[i][0], p[1] - v[i][1]), 0).toFixed(0)} m`).join('\n'));
