// Fills a story's {{tokens}} from one run of the model (js/analyze.js), so every number a story
// shows comes from the state its step sets, never from a stored figure. Works in Node too, so the
// checks (tests/civic-check.mjs) compute the same values the page shows.
const ha = (v) => (v == null || !Number.isFinite(v) ? null : v < 100 ? v.toFixed(1) : String(Math.round(v)));

// res: this step's result (drain pathway hidden or not, as the step shows it); base: the
// comparison run, or null; D: the loaded data; rainOpt: the step's rain settings, or null.
export function tokenValues({ res, base, D, rainOpt }) {
  const byWs = Object.entries(res.drainHa || {}).filter(([, v]) => v >= 0.05).sort((a, b) => b[1] - a[1]);
  return {
    wetLandHa: ha(res.wetLandHa),
    lowLandHa: ha(res.lowLandHa),
    drainLandHa: ha(res.drainLandHa),
    drainByWatershed: byWs.length ? byWs.map(([k, v]) => `${k} ${ha(v)} ha`).join(', ') : 'none',
    aquaticParkDrainHa: ha((res.drainHa || {})['Aquatic Park'] || 0),
    baseDrainLandHa: base ? ha(base.drainLandHa) : null,
    rainLandHa: res.rain ? ha(res.rainLandHa) : null,
    rainDepthIn: rainOpt && D.atlas ? D.atlas.depthIn[rainOpt.duration][rainOpt.ari].toFixed(2) : null,
  };
}

// Replaces each {{token}}; a token with no value reads "not available", never a guess.
export function fill(text, values) {
  return String(text).replace(/\{\{(\w+)\}\}/g, (m, k) => (values && values[k] != null ? values[k] : '[not available]'));
}

// The drain pathway hidden: low ground that would fill through the drains is shown as what it is
// before the drain rule (js/analyze.js markDrains) runs, cut off from the Bay. A display choice,
// exact because markDrains only relabels LOW cells; the fill itself is unchanged.
export function hideDrains(res, DRAIN, LOW, STREET_WET_SHARE) {
  const state = res.state.slice();
  for (let i = 0; i < state.length; i++) if (state[i] === DRAIN) state[i] = LOW;
  const relabel = (s) => {
    if (s.cls !== 'drain') return s;
    const lowShare = s.lowShare + s.drainShare;
    // The same rule as js/analyze.js: a quarter of the length under water, then the larger share.
    const cls = s.wetShare + s.rainShare >= STREET_WET_SHARE ? (s.wetShare >= s.rainShare ? 'wet' : 'rain') : lowShare >= STREET_WET_SHARE ? 'low' : null;
    return { ...s, drainShare: 0, lowShare, cls, wet: cls === 'wet' };
  };
  return { ...res, state, lowLandHa: res.lowLandHa + res.drainLandHa, drainLandHa: 0, drainHa: {},
    segs: res.segs.map(relabel).filter(s => s.cls), railSegs: (res.railSegs || []).map(relabel).filter(s => s.cls && s.cls !== 'low'), drainHidden: true };
}
