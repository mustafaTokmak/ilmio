'use strict';

// Screens: #/welcome → #/organize → #/room (host)
//          #/welcome → #/join → #/room (attendee)
// Role is kept in localStorage: 'host' | 'alex' | 'deniz' | 'sam'.

const FRIENDS = ['alex', 'deniz', 'sam'];
const FRIEND_NAMES = { alex: 'Alex', deniz: 'Deniz', sam: 'Sam' };
const SAM_LINE = 'Calm home. Minimal pattern. No lettering.';

let last = null;
let polling = false;
let joinFriend = null;
let joinInfluence = null;

/* ── api ─────────────────────────────────────────────── */

function code() {
  return localStorage.getItem('ogmp-room') || 'demo';
}
function setCode(c) {
  localStorage.setItem('ogmp-room', c);
}

async function api(path, body) {
  body = Object.assign({ code: code() }, body || {});
  if (window.ogmpLocal) return window.ogmpLocal.api(path, body);
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function inviteUrl() {
  return `${location.origin}${location.pathname}#/join/${code()}`;
}

/* ── routing ─────────────────────────────────────────── */

function role() {
  return localStorage.getItem('ogmp-role') || 'host';
}
function setRole(r) {
  localStorage.setItem('ogmp-role', r);
}

function name(f) {
  const names = last && last.state && last.state.gift && last.state.gift.friendNames;
  return (names && names[f]) || FRIEND_NAMES[f];
}

function go(name) {
  if (name === 'room') location.hash = `#/room/${code()}`;
  else location.hash = '#/' + name;
}

function showScreen(name) {
  for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden');
  const scr = document.getElementById('screen-' + name);
  if (scr) scr.classList.remove('hidden');
  if (name === 'room') refresh();
  if (name === 'join') renderJoin();
}

function route() {
  const parts = (location.hash || '#/welcome').replace('#/', '').split('/');
  const h = parts[0];
  if (h === 'room') {
    if (parts[1]) setCode(parts[1]);
    showScreen('room');
  } else if (h === 'join') {
    if (parts[1]) setCode(parts[1]);
    showScreen('join');
  } else if (h === 'organize') showScreen('organize');
  else showScreen('welcome');
}

window.addEventListener('hashchange', route);
document.querySelectorAll('[data-go]').forEach((b) => {
  b.onclick = () => go(b.dataset.go);
});

/* ── state fetch + poll ──────────────────────────────── */

async function fetchState() {
  if (window.ogmpLocal) return window.ogmpLocal.state(code());
  const res = await fetch(`/api/state?code=${encodeURIComponent(code())}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function refresh() {
  let data;
  try {
    data = await fetchState();
  } catch (e) {
    last = null;
    document.getElementById('resume-room').classList.add('hidden');
    return;
  }
  last = data;
  render(data.state, data.status);
  document.getElementById('resume-room').classList.remove('hidden');

  const anyRunning = Object.values(data.state.jobs || {}).some((j) => j.status === 'running');
  if (anyRunning && !polling) {
    polling = true;
    const tick = async () => {
      const d = await fetchState();
      last = d;
      render(d.state, d.status);
      if (Object.values(d.state.jobs || {}).some((j) => j.status === 'running')) {
        setTimeout(tick, 800);
      } else {
        polling = false;
      }
    };
    setTimeout(tick, 800);
  }
}

/* ── helpers ─────────────────────────────────────────── */

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function currentVersion(state) {
  return state.versions.find((v) => v.id === state.currentVersionId);
}

function approvedCount(version) {
  return FRIENDS.filter((f) => version.approvals[f] === 'approved').length;
}

function render(state, status) {
  document.getElementById('room-gift').textContent =
    `A ${state.gift.occasion} ${state.gift.category} for ${state.gift.recipient}`;
  const rc = document.getElementById('room-code');
  if (rc) rc.textContent = `room ${code()}`;
  const invite = document.getElementById('room-invite');
  if (invite) invite.textContent = `attendee link: ${inviteUrl()}`;
  document.getElementById('story-recipient').textContent = state.gift.recipient;
  renderRoleSwitch();
  renderFriends(state);
  renderBrief(state);
  renderStage(state);
  renderApprovals(state);
  renderStory(state, status);
  renderActivity(state);
}

function renderRoleSwitch() {
  const wrap = document.getElementById('role-switch');
  wrap.innerHTML = '';
  for (const r of ['host', ...FRIENDS]) {
    const b = el('button', r === role() ? 'active' : '', r === 'host' ? 'Host' : name(r));
    b.onclick = () => { setRole(r); refresh(); };
    wrap.appendChild(b);
  }
}

/* ── friends rail ────────────────────────────────────── */

function renderFriends(state) {
  const wrap = document.getElementById('friends');
  wrap.innerHTML = '';
  for (const f of FRIENDS) {
    const box = el('div', 'friend');
    const label = el('div', 'name', name(f));
    if (role() === f) label.appendChild(el('span', 'tag', 'you'));
    box.appendChild(label);
    const c = state.contributions[f];
    if (c) {
      box.appendChild(el('p', 'memory', `“${c.text}”`));
      if (c.intendedInfluence) box.appendChild(el('p', 'influence', `intended: ${c.intendedInfluence}`));
    } else if (role() === f) {
      box.appendChild(contributionEditor(f));
    } else {
      box.appendChild(el('p', 'influence',
        role() === 'host' ? 'waiting for their memory — invite them via the attendee link' : 'hasn’t added a memory yet'));
    }
    wrap.appendChild(box);
  }
}

// Shared brainstorm panel: shows 3 idea chips at a time; an optional "steer"
// input plus a "3 more ideas" button keeps pulling fresh suggestions — each
// new batch avoids the ones already shown. Engine label is honest: OpenRouter
// on the keyed server, the local demo pool on the static build.
function ideaPanel(friend, onPick) {
  const box = el('div', 'ideas hidden');
  const chips = el('div', 'idea-chips');
  const shown = new Set();
  const steer = el('input', 'steer');
  steer.placeholder = 'steer it — e.g. "something about cats" (optional)';
  const more = el('button', 'secondary', '3 more ideas →');
  const meta = el('p', 'meta');

  box.load = async (fOverride) => {
    const f = fOverride || friend;
    more.disabled = true;
    try {
      const avoid = [...shown];
      const { ideas, engine } = window.ogmpLocal
        ? window.ogmpLocal.suggest(code(), f, { hint: steer.value, avoid })
        : await (await fetch(
            `/api/suggest?friend=${f}&code=${encodeURIComponent(code())}` +
            `&hint=${encodeURIComponent(steer.value)}&avoid=${encodeURIComponent(avoid.join('|'))}`
          )).json();
      for (const idea of ideas) {
        shown.add(idea.memory);
        const chip = el('div', 'idea-chip');
        chip.appendChild(el('span', 'idea-memory', `“${idea.memory}”`));
        chip.appendChild(el('span', 'idea-influence', `→ ${idea.influence}`));
        chip.onclick = () => { onPick(idea); box.classList.add('hidden'); };
        chips.appendChild(chip);
      }
      meta.textContent = engine && engine.startsWith('openrouter')
        ? 'AI suggestions via OpenRouter — pick one or write your own'
        : 'demo suggestions — pick one or write your own';
    } catch (e) {
      meta.textContent = e.message;
    } finally {
      more.disabled = false;
    }
  };
  more.onclick = () => box.load();

  box.appendChild(chips);
  box.appendChild(steer);
  box.appendChild(more);
  box.appendChild(meta);
  return box;
}

function contributionEditor(f) {
  const frag = document.createDocumentFragment();
  const ta = el('textarea');
  ta.id = `contrib-${f}`;
  ta.value = f === 'sam' ? SAM_LINE : '';
  frag.appendChild(ta);

  let pickedInfluence = null;
  const ideasBox = ideaPanel(f, (idea) => { ta.value = idea.memory; pickedInfluence = idea.influence; });
  const brainstormBtn = el('button', 'secondary', 'Need ideas?');
  brainstormBtn.onclick = async () => {
    if (!ideasBox.classList.contains('hidden')) { ideasBox.classList.add('hidden'); return; }
    ideasBox.classList.remove('hidden');
    ideasBox.load();
  };
  frag.appendChild(brainstormBtn);
  frag.appendChild(ideasBox);

  const btn = el('button', 'secondary', `Add ${name(f)}'s memory`);
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      await api('/api/contributions', { friend: f, text: ta.value, intendedInfluence: pickedInfluence });
      await refresh();
      await api('/api/generate');
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      btn.disabled = false;
    }
  };
  frag.appendChild(btn);
  return frag;
}

/* ── brief + stage ───────────────────────────────────── */

function renderBrief(state) {
  const v = currentVersion(state);
  document.getElementById('brief-text').textContent = v ? v.brief.text : '—';
  document.getElementById('brief-fp').textContent = v ? v.brief.fingerprint : '—';
}

function renderStage(state) {
  const wrap = document.getElementById('stage');
  wrap.innerHTML = '';
  const ordered = [...state.versions].sort((a, b) => b.n - a.n);

  for (const v of ordered) {
    const isCurrent = v.id === state.currentVersionId && v.status !== 'stale';
    const card = el('div', 'product' + (v.status === 'stale' ? ' stale' : ''));

    if (v.bundle) {
      const img = el('img');
      img.src = '/' + v.bundle.image;
      img.alt = v.bundle.product.name;
      card.appendChild(img);
    }

    const head = el('div', 'body');
    const badge = el('span', 'badge' + (isCurrent ? ' current' : ''),
      v.status === 'stale' ? `${v.id} · superseded` : `${v.id} · current`);
    head.appendChild(badge);

    if ((v.status === 'pending' || v.status === 'provider-empty' || v.status === 'mismatch') && isCurrent) {
      const running = Object.values(state.jobs || {}).some(
        (j) => j.status === 'running' && j.versionId === v.id
      );
      const box = el('div', 'pending-box');
      box.appendChild(el('p', null, v.status === 'provider-empty'
        ? 'No recorded result exists for this exact brief — provider-pending state, no fake result shown.'
        : v.status === 'mismatch'
          ? 'The returned result did not match this brief and was rejected.'
          : running
            ? 'Generating a proposal for this brief…'
            : 'The brief changed. A new proposal is needed before anyone can approve.'));
      if (!running) {
        const btn = el('button', 'big', v.status === 'pending' ? 'Generate proposal' : 'Try again');
        btn.onclick = async () => {
          btn.disabled = true;
          try { await api('/api/generate'); await refresh(); }
          catch (e) { alert(e.message); btn.disabled = false; }
        };
        box.appendChild(btn);
      }
      card.appendChild(head);
      card.appendChild(box);
      wrap.appendChild(card);
      continue;
    }

    if (v.bundle) {
      head.appendChild(el('h4', null, v.bundle.product.name));
      head.appendChild(el('span', 'badge provenance', v.bundle.provenance.label));
      const cfg = el('p', 'config');
      for (const [k, val] of Object.entries(v.bundle.product.configuration)) {
        cfg.appendChild(el('span', null, `${k}: ${String(val)}`));
      }
      head.appendChild(cfg);
      for (const c of v.bundle.callouts || []) {
        head.appendChild(el('p', 'callout',
          `${name(c.friend)} → ${c.intended} (intended, unverified)`));
      }
      if (v.quote) {
        const q = el('div', 'quote');
        q.appendChild(el('div', 'price', `${v.quote.unitPrice} ${v.quote.currency}`));
        q.appendChild(el('div', 'fields',
          `qty ${v.quote.quantity} · shipping ${v.quote.shipping} · tax ${v.quote.tax} · duties ${v.quote.duties}` +
          ` · rev ${v.quote.revision}` + (v.quote.expiresAt ? ` · expires ${v.quote.expiresAt}` : ' · no expiry given')));
        head.appendChild(q);
      } else {
        head.appendChild(el('p', 'meta', 'No quote on file — artwork can be reviewed, no priced handoff claim.'));
      }
      card.appendChild(head);
    }
    wrap.appendChild(card);
  }
}

/* ── approvals + host quote ──────────────────────────── */

function renderApprovals(state) {
  const wrap = document.getElementById('approvals');
  const host = document.getElementById('host-box');
  const hint = document.getElementById('approve-hint');
  wrap.innerHTML = '';
  host.innerHTML = '';
  hint.textContent = '';

  const v = currentVersion(state);
  if (!v) return;
  const me = role();
  const isHost = me === 'host';
  hint.textContent = isHost
    ? 'Staged demo controls — each button acts as that friend, bound to the current version.'
    : `You are ${name(me)} — approve or request a change on the current proposal.`;
  const count = approvedCount(v);

  for (const f of FRIENDS) {
    const box = el('div', 'approval');
    box.appendChild(el('div', 'who', name(f) + (f === me ? ' (you)' : '')));
    const st = v.approvals[f];
    box.appendChild(el('div', 'state ' + st,
      st === 'approved' ? 'approved' : st === 'change_requested' ? 'change requested' : 'awaiting'));
    if (v.status === 'ready' && (isHost || f === me)) {
      const approveBtn = el('button', null, 'Approve');
      approveBtn.disabled = st === 'approved';
      approveBtn.onclick = async () => {
        try { await api('/api/approve', { versionId: v.id, friend: f }); await refresh(); }
        catch (e) { alert(e.message); }
      };
      const changeBtn = el('button', 'secondary', 'Request change');
      changeBtn.onclick = async () => {
        const note = prompt('What should change?');
        try { await api('/api/request-change', { versionId: v.id, friend: f, note }); await refresh(); }
        catch (e) { alert(e.message); }
      };
      box.appendChild(approveBtn);
      box.appendChild(changeBtn);
    }
    wrap.appendChild(box);
  }

  const line = el('p', 'meta', `${count}/3 friends approved ${v.id}`);
  host.appendChild(line);

  if (isHost && v.status === 'ready' && v.quote) {
    const accepted = v.hostAcceptance && v.hostAcceptance.quoteRevision === v.quote.revision;
    const acc = el('button', null, accepted ? 'Quote accepted ✓' : 'Host: accept this quote');
    acc.disabled = accepted;
    acc.onclick = async () => {
      try { await api('/api/accept-quote', { versionId: v.id }); await refresh(); }
      catch (e) { alert(e.message); }
    };
    const refreshBtn = el('button', 'secondary', 'Refresh price (demo)');
    refreshBtn.onclick = async () => {
      const q = { ...v.quote };
      delete q.revision;
      delete q.refreshedAt;
      q.unitPrice = (parseFloat(q.unitPrice) + 1.5).toFixed(2);
      try { await api('/api/refresh-price', { versionId: v.id, quote: q }); await refresh(); }
      catch (e) { alert(e.message); }
    };
    host.appendChild(acc);
    host.appendChild(refreshBtn);
  }
}

/* ── story card + narrative ──────────────────────────── */

function renderStory(state, status) {
  const panel = document.getElementById('story-panel');
  const card = document.getElementById('story-card');
  if (!status.unanimous) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  card.innerHTML = '';

  const v = currentVersion(state);
  card.appendChild(el('p', null,
    `For ${state.gift.recipient} — three friends, three memories, one ${state.gift.category}.`));

  for (const inf of v.brief.influences) {
    const callout = (v.bundle.callouts || []).find((c) => c.friend === inf.friend);
    const row = el('div', 'story-row');
    row.appendChild(el('span', 'who', name(inf.friend)));
    row.appendChild(el('span', 'arrow', '→'));
    row.appendChild(el('span', null,
      `“${inf.contribution}” → ${callout ? callout.intended : 'visible in the design'} (intended influence)`));
    card.appendChild(row);
  }

  if (v.narrative) {
    const n = el('div', 'narrative');
    n.appendChild(el('p', 'narrative-text', `“${v.narrative.text}”`));
    n.appendChild(el('p', 'meta', v.narrative.label));
    card.appendChild(n);
  } else {
    const genBtn = el('button', 'secondary', 'Generate gift narrative');
    genBtn.onclick = async () => {
      genBtn.disabled = true;
      try { await api('/api/narrative', { versionId: v.id }); await refresh(); }
      catch (e) { alert(e.message); genBtn.disabled = false; }
    };
    card.appendChild(genBtn);
  }

  if (status.quoteAccepted) {
    card.appendChild(el('p', 'meta',
      `Host accepted the quote: ${v.quote.unitPrice} ${v.quote.currency} for qty ${v.quote.quantity} (rev ${v.quote.revision}). ` +
      `Shipping/tax/duties: ${v.quote.shipping}/${v.quote.tax}/${v.quote.duties}. No landed total is claimed.`));
  } else {
    card.appendChild(el('p', 'meta', 'Artwork approved by all three friends. No priced handoff has been accepted.'));
  }
}

function renderActivity(state) {
  const ul = document.getElementById('activity');
  ul.innerHTML = '';
  for (const a of [...state.activity].reverse()) {
    const li = el('li');
    li.appendChild(el('span', 't', a.at.slice(11, 19)));
    li.appendChild(el('span', null, `${a.event}${a.detail ? ' — ' + a.detail : ''}`));
    ul.appendChild(li);
  }
}

/* ── organizer onboarding ────────────────────────────── */

document.getElementById('org-next').onclick = () => {
  document.getElementById('org-friends').classList.remove('hidden');
  document.getElementById('org-next').closest('.frame').classList.add('hidden');
};
document.getElementById('org-back2').onclick = () => {
  document.getElementById('org-friends').classList.add('hidden');
  document.getElementById('org-next').closest('.frame').classList.remove('hidden');
};

document.getElementById('org-create').onclick = async () => {
  const btn = document.getElementById('org-create');
  btn.disabled = true;
  try {
    const res = await api('/api/gift', {
      recipient: document.getElementById('org-recipient').value,
      occasion: document.getElementById('org-occasion').value,
      category: document.getElementById('org-category').value,
      friendNames: {
        alex: document.getElementById('org-friend-alex').value,
        deniz: document.getElementById('org-friend-deniz').value,
        sam: document.getElementById('org-friend-sam').value,
      },
      prefill: document.getElementById('org-prefill').checked,
    });
    if (res.code) setCode(res.code);
    setRole('host');
    go('room');
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = false;
  }
};

/* ── attendee onboarding ─────────────────────────────── */

// Join screen: with a valid room code the friend picker shows; without one
// (or if the code is wrong) the code-entry frame shows instead.
async function renderJoin() {
  const entry = document.getElementById('join-entry');
  const pick = document.getElementById('join-pick');
  entry.classList.add('hidden');
  pick.classList.add('hidden');
  document.getElementById('join-write').classList.add('hidden');
  document.getElementById('join-done').classList.add('hidden');
  try {
    const data = await fetchState();
    last = data;
    renderJoinPick();
    pick.classList.remove('hidden');
  } catch {
    entry.classList.remove('hidden');
  }
}

document.getElementById('join-code-go').onclick = async () => {
  const c = document.getElementById('join-code').value.trim();
  if (!c) return;
  setCode(c);
  location.hash = `#/join/${c}`;
  renderJoin();
};

function renderJoinPick() {
  const grid = document.getElementById('join-who');
  grid.innerHTML = '';
  const contribs = last ? last.state.contributions : {};
  for (const f of FRIENDS) {
    const b = el('button', 'who-card');
    b.appendChild(el('span', null, name(f)));
    b.appendChild(el('small', null, contribs[f] ? 'memory added' : 'not yet added'));
    b.onclick = () => openJoinWrite(f);
    grid.appendChild(b);
  }
}

function openJoinWrite(f) {
  joinFriend = f;
  joinInfluence = null;
  document.getElementById('join-pick').classList.add('hidden');
  document.getElementById('join-done').classList.add('hidden');
  document.getElementById('join-write').classList.remove('hidden');
  const gift = last.state.gift;
  document.getElementById('join-title').textContent = `${name(f)}, add your memory`;
  document.getElementById('join-context').textContent =
    `${gift.recipient} is celebrating a ${gift.occasion}. Your memory shapes the ${gift.category}'s design — the others already shared:`;
  const others = document.getElementById('join-others');
  others.innerHTML = '';
  for (const of2 of FRIENDS) {
    if (of2 === f) continue;
    const c = last.state.contributions[of2];
    if (c) {
      const line = el('div', 'other-line');
      line.appendChild(el('b', null, `${name(of2)}: `));
      line.appendChild(el('span', null, `“${c.text}”`));
      others.appendChild(line);
    }
  }
  document.getElementById('join-text').value = f === 'sam' ? SAM_LINE : '';
}

document.getElementById('join-back').onclick = () => {
  document.getElementById('join-write').classList.add('hidden');
  document.getElementById('join-pick').classList.remove('hidden');
};

const joinIdeaPanel = ideaPanel(null, (idea) => {
  document.getElementById('join-text').value = idea.memory;
  joinInfluence = idea.influence;
  document.getElementById('join-ideas').classList.add('hidden');
});
document.getElementById('join-ideas').replaceWith(joinIdeaPanel);
joinIdeaPanel.id = 'join-ideas';

document.getElementById('join-brainstorm').onclick = async () => {
  const box = joinIdeaPanel;
  if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.load(joinFriend);
};

document.getElementById('join-submit').onclick = async () => {
  const btn = document.getElementById('join-submit');
  btn.disabled = true;
  try {
    await api('/api/contributions', {
      friend: joinFriend,
      text: document.getElementById('join-text').value,
      intendedInfluence: joinInfluence,
    });
    await api('/api/generate');
    await refresh();
    setRole(joinFriend);
    document.getElementById('join-write').classList.add('hidden');
    const done = document.getElementById('join-done');
    done.classList.remove('hidden');
    document.getElementById('join-done-text').textContent =
      'Your memory changed the design brief — a new proposal is being prepared for everyone to approve.';
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = false;
  }
};

document.getElementById('join-watch').onclick = () => go('room');
document.getElementById('join-code').onkeydown = (e) => {
  if (e.key === 'Enter') document.getElementById('join-code-go').click();
};

/* ── reset + boot ────────────────────────────────────── */

document.getElementById('reset').onclick = async () => {
  if (!confirm('Reset the demo to the seeded state?')) return;
  await api('/api/reset');
  setRole('host');
  go('welcome');
  await refresh();
};

document.getElementById('resume-room').onclick = () => go('room');

(async () => {
  route();
  await refresh();
  renderJoinPick();
})();
