// Checks on the civic stories, claims, issues, actions and updates (data/civic/*.json) and on the
// code that shows them (js/civic/). docs/civic/insight-and-action-spec.md §12.   node tests/civic-check.mjs
// 1. The data pass js/civic/schema.js, and broken data fail it.
// 2. Every claim's tokens get a value from its model state, and the values hang together.
// 3. Hiding the drain pathway only relabels cells; the model's fill is unchanged.
// 4. Links: story routes round-trip, and links from before stories open as they did.
// 5. The copied brief carries the same sources, datum, assumptions and limitations as the shown one.
import fs from 'fs';
import { load } from '../tools/report.mjs';
import { analyze, DRAIN, STREET_WET_SHARE } from '../js/analyze.js';
import { LOW } from '../js/fill.js';
import { validateCivic } from '../js/civic/schema.js';
import { tokenValues, fill, hideDrains } from '../js/civic/tokens.js';
import { buildBrief, briefText, CIVIC_FILES } from '../js/civic/civic.js';
import { encodeView, decodeView } from '../js/share.js';

let fail = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fail++; };
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const data = Object.fromEntries(CIVIC_FILES.map(f => [f, read(`data/civic/${f}.json`)]));
const scenarios = read('data/scenarios.json').scenarios;
const notes = read('data/notes.json');
const ctx = { scenarioIds: new Set(scenarios.map(s => s.id)), noteIds: new Set(Object.keys(notes.notes)) };

// The schema checks every cited row against data/notes.json, so a row added to SOURCE_NOTES.md
// needs node tools/build-notes.mjs before a story can cite it.

// 1. Schema.
const errs = validateCivic(data, ctx);
ok(errs.length === 0, `civic data pass the schema${errs.length ? ':\n  ' + errs.join('\n  ') : ''}`);
const broken = (what, mutate, expect) => {
  const d = structuredClone(data); mutate(d);
  const e = validateCivic(d, ctx);
  ok(e.some(m => expect.test(m)), `rejected: ${what}`);
};
broken('an unknown scenario', d => { d.stories.stories[0].steps[0].mapState.sc = 'y9999'; }, /not in data\/scenarios/);
broken('a token with no claim', d => { d.stories.stories[0].steps[0].body += ' {{wetLandHa}}'; }, /no claim/);
broken('a claim checked on another state', d => { d.claims.claims.find(c => c.id === 'drain-c2').scenarioState.sc = 'y500'; }, /different model state/);
broken('a deadline with no source', d => { d.actions.actions[0].deadline = '2026-12-01'; }, /deadline needs/);
broken('a status no record shows', d => { d.actions.actions[0].status = 'submitted'; }, /needs a sourced update/);
broken('an email address', d => { d.actions.actions[0].recipientUrlOrEmail = 'someone@example.org'; }, /https|email/);
broken('a source row that does not exist', d => { d.issues.issues[0].sourceRefs.push('Q99'); }, /not a SOURCE_NOTES/);
broken('an agency with no source or tentative mark', d => { d.issues.issues[0].responsibleAgencies[0].verified = 'yes'; }, /sourced or tentative/);
broken('"flood protection achieved"', d => { d.stories.stories[0].steps[3].whatChanged = 'Flood protection achieved.'; }, /protection language/);
broken('a story with no uncertainty statement', d => { for (const s of d.stories.stories[0].steps) s.caveats = []; }, /uncertainty/);
broken('stages out of order', d => { d.stories.stories[0].steps[0].stage = 'act'; }, /in order/);
broken('rain with the drains hidden', d => { d.stories.stories[0].steps[0].mapState.rain = { ari: '10', duration: '6-hr', blocked: 1 }; }, /rain needs/);
broken('an issue status that is not its latest update', d => { d.issues.issues[0].status = 'decided'; }, /latest update/);
broken('a story id used twice', d => { d.stories.stories.push(structuredClone(d.stories.stories[0])); }, /duplicate/);

// 2. Token values from the model.
const D = load();
const sc = (id) => scenarios.find(s => s.id === id);
const run = (m) => {
  const gates = {}; for (const w of D.drains.watersheds) gates[w.name] = true;
  const plan = m.drains === 'gates-closed' ? { walls: [], roads: [], gates } : null;
  let res = analyze(D, sc(m.sc).levelFt, plan, m.rain || null);
  if (m.drains === 'hidden') res = hideDrains(res, DRAIN, LOW, STREET_WET_SHARE);
  return { res, base: m.compare === 'gates-open' ? analyze(D, sc(m.sc).levelFt, null, m.rain || null) : null };
};
const values = {};
for (const c of data.claims.claims) {
  const v = values[c.id] = tokenValues({ ...run(c.scenarioState), D, rainOpt: c.scenarioState.rain });
  const missing = c.tokens.filter(t => v[t] == null);
  ok(!missing.length, `${c.id}: every token has a value (${fill(c.text, v)})`);
}
ok(Number(values['drain-c3'].drainLandHa) <= Number(values['drain-c3'].baseDrainLandHa), 'gates modeled closed never leave more ground filling up the drains than open outfalls');
ok(Number(values['drain-c3'].aquaticParkDrainHa) <= Number(values['drain-c3'].drainLandHa), 'the Aquatic Park share is part of the total');
ok(values['drain-c4'].rainDepthIn === D.atlas.depthIn['6-hr']['10'].toFixed(2), `rain depth is NOAA Atlas 14's (${values['drain-c4'].rainDepthIn} in)`);

// 3. Hiding the drains: the same fill, drain cells shown as low ground.
{
  const lv = sc('y100').levelFt, r = analyze(D, lv), h = hideDrains(r, DRAIN, LOW, STREET_WET_SHARE);
  let diff = 0; for (let i = 0; i < r.state.length; i++) if (h.state[i] !== (r.state[i] === DRAIN ? LOW : r.state[i])) diff++;
  ok(diff === 0 && h.state.every(v => v !== DRAIN), `hidden drains: only drain cells change, to low ground (${diff} other cells differ)`);
  ok(Math.abs(h.lowLandHa - (r.lowLandHa + r.drainLandHa)) < 1e-9 && h.wetLandHa === r.wetLandHa, 'hidden drains: Bay-wet land unchanged, low land gains exactly the drain land');
  ok(r.state.some(v => v === DRAIN), 'the model still marks drain cells (the original state is not changed)');
}

// 4. Links.
{
  const legacy = decodeView('#sc=y100&mode=expert');
  ok(legacy.sc === 'y100' && legacy.mode === 'expert' && legacy.story == null && legacy.view == null, 'a link from before stories (#sc=y100&mode=expert) opens as before');
  const s = { sc: 'y100', mode: 'guided', story: 'drain-backflow', step: '4' };
  const back = decodeView('#' + encodeView(s));
  ok(back.sc === 'y100' && back.mode === 'guided' && back.story === 'drain-backflow' && back.step === '4', `story link round-trips (${encodeView(s)})`);
  ok(decodeView('#' + encodeView({ ...s, step: 'brief' })).step === 'brief', 'brief link round-trips');
  ok(decodeView('#' + encodeView({ mode: 'guided', view: 'decisions' })).view === 'decisions', 'decisions link round-trips');
  ok(decodeView('#view=<script>').view === null, 'an unknown view is dropped');
  const odd = decodeView('#story=' + encodeURIComponent('<img src=x>') + '&step=99');
  ok(odd.story === '<img src=x>' && odd.step === '99', 'an unknown story id is kept as text, so the page can say it is not available (it is escaped when shown)');
  const civicSrc = fs.readFileSync('js/civic/civic.js', 'utf8');
  ok(/innerHTML = `[\s\S]*esc\(route\.missing\)/.test(civicSrc), 'the "not available" message escapes the id');
}

// 5. Brief: one model for both renderings, so check the text against it.
{
  const story = data.stories.stories[0];
  const b = buildBrief({ data, story, D, scenarios, values, link: 'https://example.invalid/#story=drain-backflow&step=brief', today: '2026-11-10' });
  const t = briefText(b, notes.url);
  const allSources = data.claims.claims.flatMap(c => c.sourceRefs);
  ok(allSources.every(r => t.includes(r)), 'copied brief lists every claim source');
  ok(t.includes('ft NAVD88') && t.includes('still water'), 'copied brief names the datum and still water');
  ok(b.notEstablished.length > 0 && b.notEstablished.every(l => t.includes(l)), `copied brief keeps all ${b.notEstablished.length} limitations`);
  ok(/Not a flood forecast/.test(t) && t.includes('What it does not establish'), 'copied brief keeps the disclaimer and the limits section');
  ok(!/\[not available\]/.test(t), 'copied brief has every number');
  ok(/Proposed, not submitted/.test(t), 'copied brief gives the request status as not submitted');
  const late = buildBrief({ data, story, D, scenarios, values, link: '', today: '2027-06-01' });
  ok(late.actions.every(a => a.expired) && /check current details/.test(briefText(late, notes.url)), 'past its review window, a request says to check current details');
}

// Pages that link here: no new third-party scripts.
const html = fs.readFileSync('index.html', 'utf8');
ok(!/<script[^>]+src="https?:/.test(html), 'index.html loads no third-party script');

console.log(fail ? `\n${fail} check(s) failed` : '\nall civic checks passed');
process.exit(fail ? 1 : 0);
