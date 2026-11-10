// Checks the civic data layer (data/civic/*.json; docs/civic/insight-and-action-spec.md §6, §12).
// Works in the browser and in Node, with no dependencies. validateCivic returns a list of
// problems; an empty list means the data may be shown. The page shows no story whose data fail.

export const STAGES = ['discover', 'understand', 'evaluate', 'decide', 'act'];
export const EVIDENCE = ['observed', 'published-model', 'exploratory-model', 'inference', 'unknown'];
export const STATUS = ['investigating', 'proposed', 'submitted', 'acknowledged', 'under-review', 'decided', 'implemented', 'closed'];
export const ACTION_TYPES = ['records-request', 'comment', 'meeting', 'subscribe', 'share'];
export const DRAINS = ['hidden', 'open', 'gates-closed'];
export const COMPARE = ['gates-open'];
export const RAIN_ARI = ['2', '10', '100'], RAIN_DUR = ['6-hr', '24-hr'], RAIN_BLOCKED = [1, 0.5, 0.25, 0.1];
// Tokens a story may fill from a run of the model (js/civic/tokens.js), and what each needs.
export const TOKENS = {
  wetLandHa: {}, lowLandHa: {}, drainLandHa: {}, drainByWatershed: {}, aquaticParkDrainHa: {},
  baseDrainLandHa: { compare: true }, rainLandHa: { rain: true }, rainDepthIn: { rain: true },
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isDate = (v) => typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v));
const tokensIn = (s) => [...String(s || '').matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
const sameState = (a, b) => JSON.stringify(normState(a)) === JSON.stringify(normState(b));
export function normState(m) {
  return m ? { sc: m.sc ?? null, drains: m.drains ?? 'open', rain: m.rain ?? null, compare: m.compare ?? null } : null;
}

// data: { stories, claims, issues, actions, updates } as loaded (each file's object).
// ctx: { scenarioIds: Set, noteIds: Set, verifiedUrls?: Set }
export function validateCivic(data, ctx) {
  const errs = [], err = (m) => errs.push(m);
  const ids = new Map();
  const unique = (kind, id) => { if (typeof id !== 'string' || !ID.test(id)) err(`${kind}: bad id ${JSON.stringify(id)}`); const k = `${kind}:${id}`; if (ids.has(k)) err(`${kind}: duplicate id ${id}`); ids.set(k, true); };
  const refs = (where, list) => { if (!Array.isArray(list)) { err(`${where}: sourceRefs must be a list`); return; } for (const r of list) if (!ctx.noteIds.has(r)) err(`${where}: source ${r} is not a SOURCE_NOTES.md row`); };
  const str = (where, v, req = true) => { if (v == null ? req : typeof v !== 'string' || !v.trim()) err(`${where}: missing text`); };
  const url = (where, u) => { if (u == null) return; if (typeof u !== 'string' || !/^https:\/\/[^\s"<>]+$/.test(u)) err(`${where}: URL must be https and plain (${u})`); };
  const mapState = (where, m) => {
    if (!m || typeof m !== 'object') { err(`${where}: mapState missing`); return; }
    for (const k of Object.keys(m)) if (!['sc', 'drains', 'rain', 'compare'].includes(k)) err(`${where}: unknown mapState field ${k}`);
    if (!ctx.scenarioIds.has(m.sc)) err(`${where}: scenario ${m.sc} is not in data/scenarios.json`);
    if (m.drains != null && !DRAINS.includes(m.drains)) err(`${where}: drains must be one of ${DRAINS.join(', ')}`);
    if (m.compare != null && !COMPARE.includes(m.compare)) err(`${where}: compare must be one of ${COMPARE.join(', ')}`);
    if (m.compare === 'gates-open' && m.drains !== 'gates-closed') err(`${where}: comparing with open gates needs drains "gates-closed"`);
    if (m.rain != null) {
      const r = m.rain;
      if (!RAIN_ARI.includes(r.ari) || !RAIN_DUR.includes(r.duration) || !RAIN_BLOCKED.includes(r.blocked)) err(`${where}: rain settings must be ones the page offers`);
      if (m.drains === 'hidden') err(`${where}: rain needs the drain pathway shown`);
    }
  };
  const S = data.stories?.stories, C = data.claims?.claims, I = data.issues?.issues, A = data.actions?.actions, U = data.updates?.updates;
  for (const [k, v] of Object.entries({ stories: S, claims: C, issues: I, actions: A, updates: U })) if (!Array.isArray(v)) { err(`${k}: list missing`); return errs; }
  for (const f of Object.values(data)) if (f.schemaVersion !== 1) err('schemaVersion must be 1');

  const claims = new Map(C.map(c => [c.id, c]));
  for (const c of C) {
    unique('claim', c.id); str(`claim ${c.id}`, c.text);
    if (!EVIDENCE.includes(c.evidenceClass)) err(`claim ${c.id}: evidenceClass must be one of ${EVIDENCE.join(', ')}`);
    refs(`claim ${c.id}`, c.sourceRefs);
    if (!isDate(c.verifiedAt)) err(`claim ${c.id}: verifiedAt must be a date`);
    if (!Array.isArray(c.limitations) || !c.limitations.length) err(`claim ${c.id}: needs at least one limitation`);
    const used = tokensIn(c.text);
    if (/\d/.test(c.text.replace(/\{\{\w+\}\}/g, '')) || used.length) {
      if (!c.scenarioState) err(`claim ${c.id}: a quantitative claim needs scenarioState`); else mapState(`claim ${c.id}`, c.scenarioState);
    }
    for (const t of used) {
      if (!TOKENS[t]) err(`claim ${c.id}: unknown token ${t}`);
      else if (!(c.tokens || []).includes(t)) err(`claim ${c.id}: token ${t} not listed in tokens`);
      else if (TOKENS[t].rain && !c.scenarioState?.rain) err(`claim ${c.id}: token ${t} needs rain in scenarioState`);
      else if (TOKENS[t].compare && !c.scenarioState?.compare) err(`claim ${c.id}: token ${t} needs a comparison in scenarioState`);
    }
  }

  const issues = new Map(I.map(i => [i.id, i]));
  for (const i of I) {
    unique('issue', i.id); str(`issue ${i.id}`, i.question); str(`issue ${i.id} decision`, i.decision);
    if (!STATUS.includes(i.status)) err(`issue ${i.id}: status must be one of ${STATUS.join(', ')}`);
    if (!isDate(i.updatedAt)) err(`issue ${i.id}: updatedAt must be a date`);
    refs(`issue ${i.id}`, i.sourceRefs);
    for (const a of i.responsibleAgencies || []) {
      str(`issue ${i.id} agency`, a.name);
      if (!['sourced', 'tentative'].includes(a.verified)) err(`issue ${i.id}: agency ${a.name} must be marked sourced or tentative`);
      if (a.verified === 'sourced' && !(a.sourceRefs || []).length) err(`issue ${i.id}: agency ${a.name} is marked sourced with no source`);
      refs(`issue ${i.id} agency ${a.name}`, a.sourceRefs || []);
    }
    if (!(i.responsibleAgencies || []).length) err(`issue ${i.id}: needs a responsible agency, sourced or tentative`);
    for (const g of i.evidenceGaps || []) { str(`issue ${i.id} gap`, g.item); refs(`issue ${i.id} gap ${g.item}`, g.sourceRefs || []); }
    for (const al of i.alternatives || []) str(`issue ${i.id} alternative`, al.label);
  }

  const actions = new Map(A.map(a => [a.id, a]));
  for (const a of A) {
    unique('action', a.id);
    if (!issues.has(a.issueId)) err(`action ${a.id}: issue ${a.issueId} not found`);
    if (!ACTION_TYPES.includes(a.type)) err(`action ${a.id}: type must be one of ${ACTION_TYPES.join(', ')}`);
    if (!STATUS.includes(a.status)) err(`action ${a.id}: status must be one of ${STATUS.join(', ')}`);
    str(`action ${a.id} recipient`, a.recipientName); str(`action ${a.id} outcome`, a.requestedOutcome);
    url(`action ${a.id}`, a.recipientUrlOrEmail); url(`action ${a.id}`, a.infoUrl);
    if ((a.recipientUrlOrEmail || a.infoUrl) && !isDate(a.linksCheckedAt)) err(`action ${a.id}: links need a linksCheckedAt date`);
    if (/@/.test(a.recipientUrlOrEmail || '')) err(`action ${a.id}: email addresses are not listed; link to the official page instead`);
    if (ctx.verifiedUrls) for (const u of [a.recipientUrlOrEmail, a.infoUrl]) if (u && !ctx.verifiedUrls.has(u)) err(`action ${a.id}: ${u} is not in the verified link list`);
    if (a.deadline != null && (!isDate(a.deadline) || !a.deadlineSource)) err(`action ${a.id}: a deadline needs a date and a dated source`);
    if (!isDate(a.reviewedAt)) err(`action ${a.id}: reviewedAt must be a date`);
    if (!Number.isInteger(a.reviewWindowDays) || a.reviewWindowDays <= 0) err(`action ${a.id}: reviewWindowDays must be a positive whole number`);
    if (a.status !== 'proposed' && a.status !== 'investigating' && !U.some(u => u.issueId === a.issueId && u.statusAfter === a.status && (u.sourceRefs || []).length)) err(`action ${a.id}: status ${a.status} needs a sourced update recording it`);
    refs(`action ${a.id}`, a.sourceRefs);
  }

  let prevDate = {};
  for (const u of U) {
    unique('update', u.id);
    if (!issues.has(u.issueId)) err(`update ${u.id}: issue ${u.issueId} not found`);
    if (!isDate(u.date)) err(`update ${u.id}: date must be a date`);
    if (prevDate[u.issueId] && u.date < prevDate[u.issueId]) err(`update ${u.id}: updates are appended in date order`);
    prevDate[u.issueId] = u.date;
    if (u.statusAfter != null && !STATUS.includes(u.statusAfter)) err(`update ${u.id}: statusAfter not in the vocabulary`);
    if (u.statusBefore != null && !STATUS.includes(u.statusBefore)) err(`update ${u.id}: statusBefore not in the vocabulary`);
    if (!(u.sourceRefs || []).length) err(`update ${u.id}: needs a source`);
    refs(`update ${u.id}`, u.sourceRefs || []);
  }
  // An issue's status is its latest update's.
  for (const i of I) { const last = U.filter(u => u.issueId === i.id).at(-1); if (last && last.statusAfter !== i.status) err(`issue ${i.id}: status ${i.status} differs from its latest update (${last.statusAfter})`); }

  for (const s of S) {
    unique('story', s.id); str(`story ${s.id}`, s.title); str(`story ${s.id} dek`, s.dek);
    if (s.slug !== s.id) err(`story ${s.id}: slug must equal id`);
    if (!isDate(s.updatedAt)) err(`story ${s.id}: updatedAt must be a date`);
    if (!EVIDENCE.includes(s.evidenceStatus)) err(`story ${s.id}: evidenceStatus must be one of ${EVIDENCE.join(', ')}`);
    for (const id of s.issueIds || []) if (!issues.has(id)) err(`story ${s.id}: issue ${id} not found`);
    refs(`story ${s.id} inventory`, s.sourceInventory || []);
    if (!s.publishChecklist) err(`story ${s.id}: needs a publish checklist`);
    if (!Array.isArray(s.steps) || !s.steps.length) { err(`story ${s.id}: no steps`); continue; }
    const stepIds = new Set(); let lastStage = 0, caveats = 0;
    for (const st of s.steps) {
      const w = `story ${s.id} step ${st.id}`;
      if (stepIds.has(st.id)) err(`${w}: duplicate step id`); stepIds.add(st.id);
      const k = STAGES.indexOf(st.stage);
      if (k < 0) err(`${w}: stage must be one of ${STAGES.join(', ')}`); else if (k < lastStage) err(`${w}: stages go in order`); else lastStage = k;
      str(w, st.heading); str(w, st.body); str(`${w} whatChanged`, st.whatChanged);
      mapState(w, st.mapState); refs(w, st.sourceRefs);
      caveats += (st.caveats || []).length;
      const used = tokensIn(st.body);
      for (const t of used) {
        const c = (st.claimIds || []).map(id => claims.get(id)).find(c => c && (c.tokens || []).includes(t));
        if (!c) err(`${w}: token ${t} has no claim in claimIds that carries it`);
        else if (!sameState(c.scenarioState, st.mapState)) err(`${w}: claim ${c.id} was checked on a different model state`);
      }
      for (const id of st.claimIds || []) if (!claims.has(id)) err(`${w}: claim ${id} not found`);
      if (st.showIssue && !['evidenceGaps', 'alternatives', 'actions'].includes(st.showIssue)) err(`${w}: showIssue must be evidenceGaps, alternatives or actions`);
      if (/\b(will flood|will close|is protected|flood protection achieved)\b/i.test(`${st.heading} ${st.body} ${st.whatChanged}`)) err(`${w}: forecast or protection language`);
    }
    if (!caveats) err(`story ${s.id}: needs at least one uncertainty statement`);
    if (STAGES.indexOf(s.steps.at(-1).stage) !== STAGES.length - 1) err(`story ${s.id}: the last step is the act stage`);
  }
  return errs;
}
