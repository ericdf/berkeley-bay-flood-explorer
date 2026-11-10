// Guided stories, evidence briefs and the decisions page (docs/civic/insight-and-action-spec.md;
// implementation notes in docs/civic/implementation-notes.md). Built on guided mode (js/guided.js):
// it renders into the same panel, and each story step sets the map through js/main.js, which runs
// the same model as expert mode. Editorial text comes from data/civic/*.json, checked by
// js/civic/schema.js before anything is shown; every string is escaped before it reaches the page.
import { validateCivic, STAGES, normState } from './schema.js';
import { tokenValues, fill } from './tokens.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STAGE_LABEL = { discover: 'Discover', understand: 'Understand', evaluate: 'Evaluate', decide: 'Decide', act: 'Act' };
const EVIDENCE_LABEL = { observed: 'Observed', 'published-model': 'Published model', 'exploratory-model': 'This explorer\'s model (exploratory)', inference: 'Inference', unknown: 'Unknown' };
const ACTION_LABEL = { comment: 'Comment to the City', meeting: 'Speak at a meeting', subscribe: 'Follow the decision', share: 'Share the evidence' };
const EVENT_LABEL = { 'council-action': 'Council action', proposed: 'Proposed' };
const STATUS_LABEL = { investigating: 'Investigating', proposed: 'Proposed, not sent', submitted: 'Submitted', acknowledged: 'Acknowledged', 'under-review': 'Under review', decided: 'Decided', implemented: 'Implemented', closed: 'Closed' };
const DRAIN_LABEL = { hidden: 'drain pathway not shown', open: 'every modeled outfall open (no tide gates)', 'gates-closed': 'tide gates modeled closed on every outfall but the Aquatic Park tubes' };
const NOT_FORECAST = 'Not a flood forecast, an official hazard map, an engineering design or an emergency decision tool. An educational comparison on bare-earth lidar.';
export const CIVIC_FILES = ['stories', 'claims', 'issues', 'actions', 'updates'];

// Loads and checks the civic data. Returns { ok, data, errors }; a failure never throws, so the
// explorer keeps working without it.
export async function loadCivic(scenarioIds, fetchJson = (p) => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.json(); })) {
  try {
    const [files, notes] = await Promise.all([Promise.all(CIVIC_FILES.map(f => fetchJson(`data/civic/${f}.json`))), fetchJson('data/notes.json')]);
    const data = Object.fromEntries(CIVIC_FILES.map((f, k) => [f, files[k]]));
    const errors = validateCivic(data, { scenarioIds: new Set(scenarioIds), noteIds: new Set(Object.keys(notes.notes)) });
    return { ok: errors.length === 0, data, notes, errors };
  } catch (e) { return { ok: false, data: null, errors: [String(e.message || e)] }; }
}

// A scenario's level line, with its datum and category (the brief and the provenance strip).
export function levelLine(sc) {
  return sc ? `${sc.label}: ${sc.precision === 1 ? 'about ' : ''}${sc.levelFt.toFixed(sc.precision ?? 2)} ft NAVD88 still water (level: ${sc.category}; ${sc.source})` : 'Scenario not available';
}
export function stateLine(m, D) {
  const rain = m.rain ? `${m.rain.ari}-year, ${m.rain.duration.replace('-hr', '-hour')} rainstorm (${D && D.atlas ? D.atlas.depthIn[m.rain.duration][m.rain.ari].toFixed(2) + ' in, NOAA Atlas 14' : 'NOAA Atlas 14'}), ${Math.round(m.rain.blocked * 100)}% unable to drain` : 'no rain';
  return `Drains: ${DRAIN_LABEL[m.drains || 'open']}. Rain: ${rain}. Walls and raised roads: none.${m.compare === 'gates-open' ? ' Compared with every outfall open.' : ''}`;
}
const reviewExpired = (a, today) => { const t = Date.parse(a.reviewedAt) + a.reviewWindowDays * 864e5; return Date.parse(today) > t; };

// The evidence brief: one model, rendered as HTML and as plain text, so a copied brief carries
// the same sources, datum, assumptions and limitations as the one on screen.
export function buildBrief({ data, story, D, scenarios, values, link, today }) {
  const C = new Map(data.claims.claims.map(c => [c.id, c]));
  const issues = data.issues.issues.filter(i => story.issueIds.includes(i.id));
  const claims = [...new Set(story.steps.flatMap(s => s.claimIds))].map(id => C.get(id));
  const sc = (id) => scenarios.find(s => s.id === id);
  const shows = claims.map(c => ({
    text: fill(c.text, values[c.id]), evidence: EVIDENCE_LABEL[c.evidenceClass],
    level: levelLine(sc(c.scenarioState.sc)), state: stateLine(c.scenarioState, D), sources: c.sourceRefs, limitations: c.limitations,
  }));
  const notEstablished = [...new Set([...claims.flatMap(c => c.limitations), ...story.steps.flatMap(s => s.caveats)])];
  const actions = data.actions.actions.filter(a => issues.some(i => i.id === a.issueId));
  const sources = [...new Set([...story.sourceInventory, ...claims.flatMap(c => c.sourceRefs), ...story.steps.flatMap(s => s.sourceRefs)])].sort();
  return { title: story.title, reviewed: story.reviewedBy ? `${story.updatedAt}, reviewed by ${story.reviewedBy}` : `${story.updatedAt}; not yet reviewed by the maintainer`,
    concern: story.dek, shows, notEstablished, issues, actions: actions.map(a => ({ ...a, expired: reviewExpired(a, today) })), sources, link, disclaimer: NOT_FORECAST };
}
export function briefText(b, notesUrl) {
  const L = [];
  L.push(b.title, `Evidence brief, dated ${b.reviewed}`, '', 'The concern', b.concern, '', 'What the explorer shows');
  for (const s of b.shows) L.push(`- ${s.text}`, `  Evidence: ${s.evidence}.`, `  Level: ${s.level}.`, `  Model settings: ${s.state}`, `  Sources: ${s.sources.join(', ')}.`);
  L.push('', 'What it does not establish');
  for (const t of b.notEstablished) L.push(`- ${t}`);
  for (const i of b.issues) {
    L.push('', 'Open questions and alternatives', i.question, i.decision);
    for (const g of i.evidenceGaps) L.push(`- Missing: ${g.item}. ${g.why}`);
    for (const a of i.alternatives) L.push(`- Option: ${a.label}. ${a.detail} Tradeoffs: ${a.tradeoffs}`);
    L.push('', 'Who could answer');
    for (const a of i.responsibleAgencies) L.push(`- ${a.name} (${a.verified === 'sourced' ? 'sourced' : 'tentative, not confirmed'}): ${a.role}`);
  }
  for (const a of b.actions) {
    L.push('', 'What residents can ask for', `Status: ${STATUS_LABEL[a.status]} (as of ${a.reviewedAt}${a.expired ? '; check current details, this was last reviewed more than ' + a.reviewWindowDays + ' days ago' : ''}).`,
      `To: ${a.recipientName}, ${a.recipientUrlOrEmail}`, `Asks for: ${a.requestedOutcome}`, `Deadline: ${a.deadline ? `${a.deadline} (${a.deadlineSource})` : 'none on record'}.`);
  }
  L.push('', `Sources (SOURCE_NOTES.md rows, ${notesUrl}): ${b.sources.join(', ')}`, `Link to this story: ${b.link}`, '', b.disclaimer);
  return L.join('\n');
}
function briefHtml(b) {
  return `<article class="brief">
    <h2 class="q">${esc(b.title)}</h2>
    <p class="src">Evidence brief, dated ${esc(b.reviewed)}</p>
    <h3>The concern</h3><p>${esc(b.concern)}</p>
    <h3>What the explorer shows</h3>
    <ul>${b.shows.map(s => `<li><p>${esc(s.text)}</p><p class="src"><span class="cat">${esc(s.evidence)}</span> ${esc(s.level)}.<br>Model settings: ${esc(s.state)}<br>Sources: ${esc(s.sources.join(', '))}</p></li>`).join('')}</ul>
    <h3>What it does not establish</h3>
    <ul class="limits">${b.notEstablished.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    ${b.issues.map(i => `<h3>Open questions and alternatives</h3><p>${esc(i.question)} ${esc(i.decision)}</p>
      <ul>${i.evidenceGaps.map(g => `<li>Missing: <b>${esc(g.item)}</b>. ${esc(g.why)}</li>`).join('')}</ul>
      <ul>${i.alternatives.map(a => `<li>Option: <b>${esc(a.label)}</b>. ${esc(a.detail)} <span class="src">Tradeoffs: ${esc(a.tradeoffs)}</span></li>`).join('')}</ul>
      <h3>Who could answer</h3><ul>${i.responsibleAgencies.map(a => `<li>${esc(a.name)} <span class="cat">${a.verified === 'sourced' ? 'sourced' : 'tentative'}</span>: ${esc(a.role)}</li>`).join('')}</ul>`).join('')}
    ${b.actions.map(a => `<h3>What residents can ask for</h3>${statusBadge(a)}<p>To: ${esc(a.recipientName)}. Asks for: ${esc(a.requestedOutcome)} Deadline: ${a.deadline ? esc(`${a.deadline} (${a.deadlineSource})`) : 'none on record'}.</p>`).join('')}
    <p class="src">Sources (rows in SOURCE_NOTES.md): ${esc(b.sources.join(', '))}</p>
    <p class="src">Link: ${esc(b.link)}</p>
    <p class="warn">${esc(b.disclaimer)}</p>
  </article>`;
}
function statusBadge(a) {
  return `<p><span class="status">${esc(STATUS_LABEL[a.status])}</span> <span class="src">as of ${esc(a.reviewedAt)}</span></p>${a.expired ? `<p class="warn">Check current details: this was last reviewed more than ${a.reviewWindowDays} days ago.</p>` : ''}`;
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back */ }
  try {
    const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false; }
}

// el: the guided panel. scenarios: data/scenarios.json's list. D: loaded data, or null when the map
// failed to load (stories then show text only). setState(mapState): sets the map for a step.
// compute(mapState) -> { res, base }: runs the model for a state without drawing it.
// openExpert(mapState): opens expert mode at that state. onRoute(): the URL should be rewritten.
export function initCivic({ el, civic, scenarios, D, setState, compute, openExpert, onRoute, beforeNavigate = () => {}, today = new Date().toISOString().slice(0, 10) }) {
  const { data, notes } = civic.ok ? civic : { data: null, notes: null };
  let route = null; // { story, step: number (0-based) | 'brief' } | { view: 'decisions' } | { missing }
  const cache = new Map();
  const valuesFor = (m) => {
    if (!D || !compute) return null;
    const k = JSON.stringify(normState(m));
    if (!cache.has(k)) { const { res, base } = compute(m); cache.set(k, tokenValues({ res, base, D, rainOpt: m.rain })); }
    return cache.get(k);
  };
  const story = (id) => data && data.stories.stories.find(s => s.id === id);
  // An action's text, with its numbers from the model at its claim's state.
  const actionText = (a) => {
    const c = (a.claimIds || []).map(id => data.claims.claims.find(x => x.id === id))[0];
    return fill(a.requestText, c ? valuesFor(c.scenarioState) : null);
  };
  const linkFor = (r) => { const u = new URL(location.href); u.hash = routeHash(r); return u.toString(); };

  function homeBlock() {
    if (!data) return '';
    return `<section class="civic-home" aria-labelledby="civicH">
      <h2 class="q" id="civicH">Follow a question through its evidence</h2>
      <div class="qs">${data.stories.stories.map(s => `<button type="button" class="qcard" data-story="${esc(s.id)}"><b>${esc(s.title)}</b><span>${esc(s.locationLabel)}. ${esc(EVIDENCE_LABEL[s.evidenceStatus])}; an evidence brief and a change to ask for.</span></button>`).join('')}</div>
      <p class="src"><a href="#" data-civic="decisions">Decisions and actions</a> · <a href="https://github.com/ericdf/berkeley-bay-flood-explorer/blob/main/SOURCE_NOTES.md" target="_blank" rel="noopener">About the evidence</a></p>
    </section>`;
  }

  function stepHtml(s, k) {
    const st = s.steps[k], sc = scenarios.find(x => x.id === st.mapState.sc), vals = valuesFor(st.mapState);
    const C = new Map(data.claims.claims.map(c => [c.id, c]));
    const issue = data.issues.issues.find(i => s.issueIds.includes(i.id));
    const stageNav = `<ol class="stages" aria-label="Story stages">${STAGES.map(g => `<li${g === st.stage ? ' aria-current="step"' : ''}>${STAGE_LABEL[g]}</li>`).join('')}</ol>`;
    const claims = st.claimIds.map(id => C.get(id)).map(c => `<li><span class="cat">${esc(EVIDENCE_LABEL[c.evidenceClass])}</span> <span class="src">checked ${esc(c.verifiedAt)}; sources ${esc(c.sourceRefs.join(', '))}</span><ul>${c.limitations.map(l => `<li>${esc(l)}</li>`).join('')}</ul></li>`).join('');
    let extra = '';
    if (issue && st.showIssue === 'evidenceGaps') extra = `<h3>Evidence the model lacks</h3><ul>${issue.evidenceGaps.map(g => `<li><b>${esc(g.item)}.</b> ${esc(g.why)}</li>`).join('')}</ul>`;
    if (issue && st.showIssue === 'alternatives') extra = `<h3>Options</h3><ul>${issue.alternatives.map(a => `<li><b>${esc(a.label)}.</b> ${esc(a.detail)} <span class="src">Tradeoffs: ${esc(a.tradeoffs)}</span></li>`).join('')}</ul>`;
    if (issue && st.showIssue === 'actions') extra = actionsHtml(issue);
    return `<button type="button" class="back" data-home>&larr; All questions</button>
      <p class="src">${esc(s.locationLabel)} · <span class="cat">${esc(EVIDENCE_LABEL[s.evidenceStatus])}</span> · updated ${esc(s.updatedAt)}${s.reviewedBy ? '' : ' · not yet reviewed by the maintainer'}</p>
      <h2 class="q">${esc(s.title)}</h2>
      ${k === 0 ? `<p>${esc(s.dek)}</p>` : ''}
      ${stageNav}
      <h3 class="stephead" tabindex="-1">${k + 1} of ${s.steps.length}. ${esc(st.heading)}</h3>
      <p>${esc(fill(st.body, vals))}</p>
      <p class="changed"><b>What changed?</b> ${esc(st.whatChanged)}</p>
      <div class="prov"><p class="src"><b>Map:</b> ${esc(levelLine(sc))}.</p><p class="src">${esc(stateLine(st.mapState, D))}</p>${D ? '' : '<p class="warn">The map and its numbers did not load. The text above stands; numbers read "not available".</p>'}</div>
      ${st.caveats.length ? `<ul class="limits">${st.caveats.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${claims ? `<details class="claims"><summary>How sure is this?</summary><ul>${claims}</ul></details>` : ''}
      ${st.sourceRefs.length ? `<p class="src">Sources: ${esc(st.sourceRefs.join(', '))}</p>` : ''}
      ${extra}
      <nav class="stepnav" aria-label="Story steps">
        <button type="button" data-step="${k - 1}" ${k === 0 ? 'disabled' : ''}>&larr; Previous</button>
        ${k < s.steps.length - 1 ? `<button type="button" data-step="${k + 1}">Next &rarr;</button>` : `<button type="button" data-step="brief">Evidence brief &rarr;</button>`}
      </nav>
      <p class="src"><a href="#" data-expert>Explore this step in the full model &rarr;</a> · <button type="button" class="linkish" data-step="brief">Evidence brief</button> · <button type="button" class="linkish" data-copy-link>Copy a link to this step</button> <span class="copied" role="status"></span></p>
      <p class="src">${esc(NOT_FORECAST)}</p>`;
  }

  function actionsHtml(issue) {
    const acts = data.actions.actions.filter(a => a.issueId === issue.id).map(a => ({ ...a, expired: reviewExpired(a, today) }));
    return acts.map(a => `<div class="action">
      <h3>${esc(ACTION_LABEL[a.type] || a.type)}</h3>
      ${statusBadge(a)}
      <p>To: ${esc(a.recipientName)}. <a href="${esc(a.recipientUrlOrEmail)}" target="_blank" rel="noopener">Open ${esc(a.linkLabel || 'the official page')}</a>${a.infoUrl ? ` · <a href="${esc(a.infoUrl)}" target="_blank" rel="noopener">${esc(a.infoLabel || 'More information')}</a>` : ''} <span class="src">(links checked ${esc(a.linksCheckedAt)})</span></p>
      <p>Asks for: ${esc(a.requestedOutcome)}</p>
      <p>Deadline: ${a.deadline ? esc(`${a.deadline} (${a.deadlineSource})`) : 'none on record.'}</p>
      <label for="req-${esc(a.id)}">Text to copy and edit:</label>
      <textarea id="req-${esc(a.id)}" class="reqtext" rows="12" readonly>${esc(actionText(a))}</textarea>
      <p><button type="button" data-copy-request="${esc(a.id)}">Copy the text</button> <span class="copied" role="status"></span></p>
      <p class="src">Copying sends nothing, and this page never asks for your name or contact details.${a.privacyNote ? ' ' + esc(a.privacyNote) : ''}</p>
    </div>`).join('') + `<p class="src"><a href="#" data-civic="decisions">Status and history &rarr;</a></p>`;
  }

  function decisionsHtml() {
    return `<button type="button" class="back" data-home>&larr; All questions</button>
      <h2 class="q">Decisions and actions</h2>
      <p>Open questions the explorer raises, who could answer them, and what has happened since. A status changes here only when a dated record shows it.</p>
      ${data.issues.issues.map(i => {
        const log = data.updates.updates.filter(u => u.issueId === i.id);
        return `<div class="place"><h3>${esc(i.question)}</h3>
          <p><span class="status">${esc(STATUS_LABEL[i.status])}</span> <span class="src">updated ${esc(i.updatedAt)}</span></p>
          <p>${esc(i.decision)}</p>
          <h3>Who could answer</h3><ul>${i.responsibleAgencies.map(a => `<li>${esc(a.name)} <span class="cat">${a.verified === 'sourced' ? 'sourced' : 'tentative'}</span>: ${esc(a.role)} <span class="src">${esc((a.sourceRefs || []).join(', '))}</span></li>`).join('')}</ul>
          <h3>Options</h3><ul>${i.alternatives.map(a => `<li><b>${esc(a.label)}.</b> ${esc(a.detail)}</li>`).join('')}</ul>
          ${actionsHtml(i)}
          <h3>History</h3><ol class="log">${log.map(u => `<li><b>${esc(u.date)}</b> ${esc(STATUS_LABEL[u.statusAfter] || EVENT_LABEL[u.eventType] || u.eventType)}: ${esc(u.summary)} <span class="src">${esc(u.sourceRefs.join(', '))}</span></li>`).join('')}</ol>
          <p class="src">Stories: ${data.stories.stories.filter(s => s.issueIds.includes(i.id)).map(s => `<a href="#" data-story="${esc(s.id)}">${esc(s.title)}</a>`).join(', ')}</p></div>`;
      }).join('')}`;
  }

  function briefPage(s) {
    const values = {}; for (const c of data.claims.claims) values[c.id] = valuesFor(c.scenarioState);
    const b = buildBrief({ data, story: s, D, scenarios, values, link: linkFor({ story: s.id, step: 'brief' }), today });
    return { b, html: `<button type="button" class="back" data-story="${esc(s.id)}">&larr; Back to the story</button>
      <p class="noprint"><button type="button" data-copy-brief>Copy the brief as text</button> <button type="button" data-print>Print</button> <button type="button" class="linkish" data-copy-link>Copy a link</button> <span class="copied" role="status"></span></p>
      ${briefHtml(b)}` };
  }

  let lastBrief = null;
  function render() {
    lastBrief = null;
    if (route.missing) {
      el.innerHTML = `<button type="button" class="back" data-home>&larr; All questions</button><h2 class="q">This story is not available</h2>
        <p>The link names ${esc(route.missing)}, which this version of the explorer does not have${civic.ok ? '' : ', or its story data did not load'}. Nothing on the map was changed to stand in for it.</p>
        <p class="src">Data version: civic schema 1${data ? `, stories updated ${esc(data.stories.stories.map(s => s.updatedAt).sort().at(-1))}` : ''}.</p>`;
      return;
    }
    if (route.view === 'decisions') { el.innerHTML = decisionsHtml(); el.scrollTop = 0; return; }
    const s = story(route.story);
    if (route.step === 'brief') { const p = briefPage(s); lastBrief = p.b; el.innerHTML = p.html; setState(s.steps.at(-1).mapState); el.scrollTop = 0; return; }
    el.innerHTML = stepHtml(s, route.step);
    setState(s.steps[route.step].mapState);
    el.scrollTop = 0;
    const h = el.querySelector('.stephead'); if (h && document.activeElement && el.contains(document.activeElement)) h.focus({ preventScroll: true });
  }

  // Opens a route; returns false when it is not a civic route. A reader's click adds a history
  // entry, so Back returns to the previous step; opening a link or going Back does not.
  function open(r, fromReader = true) {
    if (!r || (!r.story && r.view !== 'decisions')) return false;
    if (fromReader) beforeNavigate();
    if (r.view === 'decisions') route = data ? { view: 'decisions' } : { missing: 'the decisions page' };
    else if (r.story) {
      const s = story(r.story), n = r.step === 'brief' ? 'brief' : Number(r.step ?? 1) - 1;
      route = !s ? { missing: `the story "${r.story}"` }
        : n === 'brief' || (Number.isInteger(n) && n >= 0 && n < s.steps.length) ? { story: s.id, step: n } : { missing: `step ${r.step} of "${s.title}"` };
    } else return false;
    render(); onRoute(); return true;
  }

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button, a'); if (!t || !el.contains(t)) return;
    const status = (msg) => { const s = t.parentElement.querySelector('.copied'); if (s) s.textContent = msg; };
    if (t.dataset.story) { e.preventDefault(); open({ story: t.dataset.story, step: 1 }); }
    else if (t.dataset.civic === 'decisions') { e.preventDefault(); open({ view: 'decisions' }); }
    else if (t.dataset.step != null && route && route.story) { open({ story: route.story, step: t.dataset.step === 'brief' ? 'brief' : Number(t.dataset.step) + 1 }); }
    else if (t.hasAttribute('data-expert') && route && route.story) { e.preventDefault(); const s = story(route.story); openExpert(s.steps[route.step === 'brief' ? s.steps.length - 1 : route.step].mapState); }
    else if (t.hasAttribute('data-copy-link')) status(await copyText(location.href) ? 'Link copied.' : `Copy this link: ${location.href}`);
    else if (t.hasAttribute('data-copy-brief') && lastBrief) status(await copyText(briefText(lastBrief, notes ? notes.url : 'SOURCE_NOTES.md')) ? 'Brief copied as text. You can edit it before you share it.' : 'Copy did not work in this browser; select the brief and copy it.');
    else if (t.hasAttribute('data-print')) window.print();
    else if (t.dataset.copyRequest) { const a = data.actions.actions.find(x => x.id === t.dataset.copyRequest); status(await copyText(actionText(a)) ? 'Copied. Nothing was sent.' : 'Copy did not work; select the text above and copy it.'); }
  });

  return {
    ok: civic.ok, homeBlock, open,
    leave() { route = null; },
    route: () => route,
    hashParams: () => !route || route.missing ? {} : route.view ? { view: route.view } : { story: route.story, step: route.step === 'brief' ? 'brief' : String(route.step + 1) },
  };
}

// The part of the URL a civic route adds (js/share.js carries it).
export function routeHash(r) {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  for (const k of ['story', 'step', 'view']) p.delete(k);
  if (r.view) p.set('view', r.view); if (r.story) { p.set('story', r.story); p.set('step', String(r.step)); }
  p.set('mode', 'guided');
  return p.toString();
}
