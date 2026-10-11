'use strict';

const FRIENDS = ['alex', 'deniz', 'sam'];
const FRIEND_NAMES = { alex: 'Alex', deniz: 'Deniz', sam: 'Sam' };
// The staged third contribution, per the demo storyboard.
const SAM_LINE = 'Calm home. Minimal pattern. No lettering.';

let last = null;
let polling = false;

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function refresh() {
  const res = await fetch('/api/state');
  const data = await res.json();
  last = data;
  render(data.state, data.status);

  const anyRunning = Object.values(data.state.jobs || {}).some((j) => j.status === 'running');
  if (anyRunning && !polling) {
    polling = true;
    const tick = async () => {
      const r = await fetch('/api/state');
      const d = await r.json();
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
  document.getElementById('gift-line').textContent =
    `A ${state.gift.occasion} ${state.gift.category} for ${state.gift.recipient}`;

  renderFriends(state);
  renderBrief(state);
  renderStage(state);
  renderApprovals(state);
  renderStory(state, status);
  renderActivity(state);
}

function renderFriends(state) {
  const wrap = document.getElementById('friends');
  wrap.innerHTML = '';
  for (const f of FRIENDS) {
    const card = el('div', 'friend');
    card.appendChild(el('h3', null, FRIEND_NAMES[f]));
    const c = state.contributions[f];
    if (c) {
      card.appendChild(el('p', 'memory', `“${c.text}”`));
      if (c.intendedInfluence) {
        card.appendChild(el('p', 'influence', `intended: ${c.intendedInfluence}`));
      }
    } else {
      const ta = el('textarea');
      ta.id = `contrib-${f}`;
      ta.value = SAM_LINE;
      card.appendChild(ta);

      // Brainstorm: many people stall on a blank box — offer memory+motif ideas.
      let pickedInfluence = null;
      const ideasBox = el('div', 'ideas hidden');
      const brainstormBtn = el('button', 'secondary', 'Need ideas?');
      brainstormBtn.onclick = async () => {
        if (!ideasBox.classList.contains('hidden')) {
          ideasBox.classList.add('hidden');
          return;
        }
        const res = await fetch(`/api/suggest?friend=${f}`);
        const { ideas } = await res.json();
        ideasBox.innerHTML = '';
        for (const idea of ideas) {
          const chip = el('div', 'idea-chip');
          chip.appendChild(el('span', 'idea-memory', `“${idea.memory}”`));
          chip.appendChild(el('span', 'idea-influence', `→ ${idea.influence}`));
          chip.onclick = () => {
            ta.value = idea.memory;
            pickedInfluence = idea.influence;
            ideasBox.classList.add('hidden');
          };
          ideasBox.appendChild(chip);
        }
        ideasBox.appendChild(el('p', 'meta', 'demo suggestions — pick one or write your own'));
        ideasBox.classList.remove('hidden');
      };
      card.appendChild(brainstormBtn);
      card.appendChild(ideasBox);

      const btn = el('button', null, `Add ${FRIEND_NAMES[f]}'s memory`);
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          await api('/api/contributions', {
            friend: f,
            text: ta.value,
            intendedInfluence: pickedInfluence,
          });
          await refresh();
          // Auto-start generation for the new brief — the "one click" stage move.
          await api('/api/generate');
          await refresh();
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      };
      card.appendChild(btn);
    }
    wrap.appendChild(card);
  }
}

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

    const head = el('div', 'body');
    const badge = el('span', 'badge' + (isCurrent ? ' current' : ''),
      v.status === 'stale' ? `${v.id} · superseded` : `${v.id} · current`);
    head.appendChild(badge);

    if (v.status === 'pending' && isCurrent) {
      const running = Object.values(state.jobs || {}).some(
        (j) => j.status === 'running' && j.versionId === v.id
      );
      const box = el('div', 'pending-box');
      box.appendChild(el('p', null,
        running
          ? 'Generating a proposal for this brief…'
          : 'The brief changed. A new proposal is needed before anyone can approve.'));
      if (!running) {
        const btn = el('button', null, 'Generate proposal');
        btn.onclick = async () => {
          btn.disabled = true;
          try { await api('/api/generate'); await refresh(); }
          catch (e) { alert(e.message); btn.disabled = false; }
        };
        box.appendChild(btn);
      }
      card.appendChild(box);
      card.appendChild(head);
      wrap.appendChild(card);
      continue;
    }

    if ((v.status === 'provider-empty' || v.status === 'mismatch') && isCurrent) {
      const box = el('div', 'pending-box');
      box.appendChild(el('p', null,
        v.status === 'provider-empty'
          ? 'No recorded result exists for this exact brief. (Provider-pending state — no fake result is shown.)'
          : 'The returned result did not match this brief and was rejected.'));
      const btn = el('button', null, 'Try again');
      btn.onclick = async () => { await api('/api/generate'); await refresh(); };
      box.appendChild(btn);
      card.appendChild(box);
      card.appendChild(head);
      wrap.appendChild(card);
      continue;
    }

    if (v.bundle) {
      const img = el('img');
      img.src = '/' + v.bundle.image;
      img.alt = v.bundle.product.name;
      card.appendChild(img);
      head.appendChild(el('h4', null, v.bundle.product.name));
      const prov = el('span', 'badge provenance', v.bundle.provenance.label);
      head.appendChild(prov);

      const cfg = el('p', 'config');
      for (const [k, val] of Object.entries(v.bundle.product.configuration)) {
        cfg.appendChild(el('span', null, `${k}: ${String(val)}`));
      }
      head.appendChild(cfg);

      if (v.bundle.callouts) {
        for (const c of v.bundle.callouts) {
          head.appendChild(el('p', 'influence',
            `${FRIEND_NAMES[c.friend]} → ${c.intended} (intended influence, unverified)`));
        }
      }

      if (v.quote) {
        const q = el('div', 'quote');
        q.appendChild(el('div', 'price', `${v.quote.unitPrice} ${v.quote.currency}`));
        const fields = el('div', 'fields',
          `qty ${v.quote.quantity} · shipping ${v.quote.shipping} · tax ${v.quote.tax} · duties ${v.quote.duties}` +
          ` · rev ${v.quote.revision}` + (v.quote.expiresAt ? ` · expires ${v.quote.expiresAt}` : ' · no expiry given'));
        q.appendChild(fields);
        head.appendChild(q);
      } else {
        head.appendChild(el('p', 'meta', 'No quote on file — artwork can be reviewed, but no priced handoff claim.'));
      }
      card.appendChild(head);
    }
    wrap.appendChild(card);
  }
}

function renderApprovals(state) {
  const wrap = document.getElementById('approvals');
  const host = document.getElementById('host-box');
  wrap.innerHTML = '';
  host.innerHTML = '';

  const v = currentVersion(state);
  if (!v) return;
  const count = approvedCount(v);

  for (const f of FRIENDS) {
    const box = el('div', 'approval');
    box.appendChild(el('div', 'who', FRIEND_NAMES[f]));
    const st = v.approvals[f];
    box.appendChild(el('div', 'state ' + st,
      st === 'approved' ? 'approved' : st === 'change_requested' ? 'change requested' : 'awaiting'));
    if (v.status === 'ready') {
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

  if (v.status === 'ready' && v.quote) {
    const accepted = v.hostAcceptance && v.hostAcceptance.quoteRevision === v.quote.revision;
    const acc = el('button', null, accepted ? 'Quote accepted ✓' : 'Host: accept this quote');
    acc.disabled = accepted;
    acc.onclick = async () => {
      try { await api('/api/accept-quote', { versionId: v.id }); await refresh(); }
      catch (e) { alert(e.message); }
    };
    const refreshBtn = el('button', 'secondary', 'Refresh price (demo)');
    refreshBtn.onclick = async () => {
      // Price-only refresh: same configuration, nudged price. Artwork approvals
      // stay valid; host acceptance resets.
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

  // Gift narrative — generated once all friends approve.
  if (v.narrative) {
    const n = el('div', 'narrative');
    n.appendChild(el('p', 'narrative-text', `“${v.narrative.text}”`));
    n.appendChild(el('p', 'meta', v.narrative.label));
    card.appendChild(n);
  } else {
    const genBtn = el('button', null, 'Generate gift narrative');
    genBtn.onclick = async () => {
      genBtn.disabled = true;
      try { await api('/api/narrative', { versionId: v.id }); await refresh(); }
      catch (e) { alert(e.message); genBtn.disabled = false; }
    };
    card.appendChild(genBtn);
  }

  for (const inf of v.brief.influences) {
    const callout = (v.bundle.callouts || []).find((c) => c.friend === inf.friend);
    const row = el('div', 'story-row');
    row.appendChild(el('span', 'who', FRIEND_NAMES[inf.friend]));
    row.appendChild(el('span', 'arrow', '→'));
    row.appendChild(el('span', null,
      `“${inf.contribution}” → ${callout ? callout.intended : 'visible in the design'} (intended influence)`));
    card.appendChild(row);
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

document.getElementById('reset').onclick = async () => {
  if (!confirm('Reset the demo to the seeded state?')) return;
  await api('/api/reset');
  await refresh();
};

refresh();
