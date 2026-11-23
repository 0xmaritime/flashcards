/* QA Interview Flashcards.
   The deck lives in deck.json: one card per interview question, in study order.
   The only things remembered are the chosen topic, set, order and the card you stopped on,
   kept in this browser's localStorage. Answers are not scored or tracked. */
(() => {
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('qafc:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('qafc:' + k, JSON.stringify(v)); } catch (e) { /* private mode: keep working without saving */ } }
};
try { localStorage.removeItem('qafc:marks'); } catch (e) { /* left over from the first version, which tracked answers */ }

const stage = $('stage'), actions = $('actions'), topicSel = $('topicSel'), setSel = $('setSel');

let ALL = [];                                   // every card, in study order
// topic: 'all' | 's:<section>' | 't:<topic id>'   set: which cards   mode: 'seq' | 'rnd'
// id: the card on screen   order: card ids in the current random order
const st = Object.assign({ topic: 'all', set: 'all', mode: 'seq', id: null, order: null }, store.get('state', {}));
let deck = [], i = 0, flipped = false, finished = false;

const save = () => store.set('state', st);

/* ---------- building the deck ---------- */
function inSet(c) {
  if (st.topic !== 'all') {
    const v = st.topic.slice(2);
    if (st.topic[0] === 's' ? c.s !== v : c.tid !== v) return false;
  }
  if (st.set === 'none') return !!c.none;
  if (st.set === 'gap') return !!c.gap;
  return true;
}
function shuffle(a) {
  for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
  return a;
}
/* keep: stay on the saved card if it is still in the deck. reshuffle: draw a new random order. */
function build({ keep = false, reshuffle = false } = {}) {
  let list = ALL.filter(inSet);
  if (st.mode === 'rnd') {
    const byId = new Map(list.map(c => [c.id, c]));
    let order = !reshuffle && Array.isArray(st.order) ? st.order.filter(id => byId.has(id)) : null;
    if (!order || order.length !== list.length) order = shuffle(list.map(c => c.id));
    st.order = order;
    list = order.map(id => byId.get(id));
  } else {
    st.order = null;
  }
  deck = list; i = 0; flipped = false; finished = false;
  if (keep && st.id) { const k = deck.findIndex(c => c.id === st.id); if (k >= 0) i = k; }
  save();
  render();
}

/* ---------- drawing ---------- */
function utilRow() {
  const parts = [];
  if (st.mode === 'rnd' && deck.length > 1) parts.push('<button class="link" data-act="reshuffle">Shuffle again</button>');
  parts.push('<span class="keys"><kbd>Space</kbd> answer, then next · <kbd>←</kbd> <kbd>→</kbd> move</span>');
  return '<div class="util">' + parts.join('') + '</div>';
}
function render() {
  actions.className = 'actions';

  if (!deck.length) {
    $('pos').textContent = '0 cards';
    $('bar').style.width = '0';
    stage.innerHTML = `<article class="card done"><h2 class="q">No cards here.</h2><p class="hint" style="margin:0">Try another topic or set.</p>
      <div class="done-actions"><button class="btn small primary" data-act="all">Show all cards</button></div></article>`;
    actions.innerHTML = '';
    return;
  }
  if (finished) {
    $('pos').textContent = `${deck.length} / ${deck.length}`;
    $('bar').style.width = '100%';
    stage.innerHTML = `<article class="card done"><span class="eyebrow">Deck finished</span><h2 class="q">${deck.length} ${deck.length === 1 ? 'card' : 'cards'} done.</h2>
      <div class="done-actions"><button class="btn small primary" data-act="restart">${st.mode === 'rnd' ? 'Shuffle and start over' : 'Start over'}</button></div></article>`;
    actions.innerHTML = '<button class="btn nav" data-act="prev" aria-label="Previous card">←</button>';
    return;
  }

  const x = deck[i];
  st.id = x.id; save();
  $('pos').textContent = `${i + 1} / ${deck.length}`;
  $('bar').style.width = (i / deck.length * 100) + '%';
  stage.innerHTML = `<article class="card ${flipped ? '' : 'ask'}" id="card">
    <span class="eyebrow">${esc(x.s)} · ${esc(x.t)}</span>
    <h2 class="q">${esc(x.q)}</h2>
    ${flipped
      ? `<div class="answer"><p class="a">${esc(x.a)}</p><details class="more"><summary>More detail</summary><div class="d">${x.d}</div></details></div>`
      : '<p class="hint">Say your answer out loud, then tap the card.</p>'}
  </article>` + utilRow();
  stage.scrollTop = 0;

  const prev = `<button class="btn nav" data-act="prev" aria-label="Previous card"${i === 0 ? ' disabled' : ''}>←</button>`;
  if (flipped) {
    actions.className = 'actions flipped';
    actions.innerHTML = prev + `<button class="btn primary" data-act="next">${i === deck.length - 1 ? 'Finish' : 'Next card'}</button>`;
  } else {
    actions.innerHTML = prev + '<button class="btn primary" data-act="flip">Show answer</button><button class="btn nav" data-act="next" aria-label="Skip to the next card">→</button>';
  }
}

/* ---------- moving through the deck ---------- */
function flip() { if (!flipped && deck.length && !finished) { flipped = true; render(); } }
function go(d) {
  if (!deck.length) return;
  if (finished) { if (d < 0) { finished = false; i = deck.length - 1; flipped = false; render(); } return; }
  if (i + d < 0) return;
  if (i + d >= deck.length) { finished = true; render(); return; }
  i += d; flipped = false; render();
}
function setMode(mode) {
  if (st.mode === mode) return;
  st.mode = mode;
  syncControls();
  // Going back to "in order" stays on the same card; going random starts a fresh shuffle from it.
  build({ keep: true, reshuffle: true });
  if (mode === 'rnd' && deck.length) {           // put the current card first so nothing jumps under the reader
    const k = deck.findIndex(c => c.id === st.id);
    if (k > 0) { const [cur] = deck.splice(k, 1); deck.unshift(cur); st.order = deck.map(c => c.id); i = 0; save(); render(); }
  }
}
function syncControls() {
  $('modeSeq').setAttribute('aria-pressed', st.mode === 'seq');
  $('modeRnd').setAttribute('aria-pressed', st.mode === 'rnd');
  topicSel.value = st.topic; setSel.value = st.set;
}

/* ---------- input ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act],[data-mode]');
  if (b) {
    if (b.dataset.mode) { setMode(b.dataset.mode); return; }
    switch (b.dataset.act) {
      case 'flip': flip(); break;
      case 'prev': go(-1); break;
      case 'next': go(1); break;
      case 'restart': build({ reshuffle: true }); break;
      case 'reshuffle': build({ reshuffle: true }); break;
      case 'all': st.set = 'all'; st.topic = 'all'; syncControls(); build({ reshuffle: true }); break;
    }
    return;
  }
  if (e.target.closest('#card.ask')) flip();
});
topicSel.addEventListener('change', () => { st.topic = topicSel.value; build({ reshuffle: true }); });
setSel.addEventListener('change', () => { st.set = setSel.value; build({ reshuffle: true }); });

document.addEventListener('keydown', e => {
  if (e.target.closest('select,input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === ' ' || e.key === 'Enter') {
    if (e.target.closest('button,summary') || finished || !deck.length) return;
    e.preventDefault();
    if (flipped) go(1); else flip();
  }
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
});

// Swipe left for the next card, right for the previous one. Sideways-scrolling tables and code keep their own scroll.
let touch = null;
stage.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) { touch = null; return; }
  const scroller = e.target.closest('.tbl,pre');
  if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) { touch = null; return; }
  touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
stage.addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
  touch = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) go(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---------- start ---------- */
function fillMenus(sets) {
  [...new Set(ALL.map(c => c.s))].forEach(s => {
    const g = document.createElement('optgroup'); g.label = s;
    const add = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; g.appendChild(o); };
    add('s:' + s, 'All of ' + s);
    [...new Set(ALL.filter(c => c.s === s).map(c => c.tid))].forEach(tid => add('t:' + tid, ALL.find(c => c.tid === tid).t));
    topicSel.appendChild(g);
  });
  // Extra sets are named in deck.json, and only listed when some card belongs to them.
  ['none', 'gap'].forEach(key => {
    if (sets && sets[key] && ALL.some(c => c[key])) { const o = document.createElement('option'); o.value = key; o.textContent = sets[key]; setSel.appendChild(o); }
  });
  if (![...topicSel.options].some(o => o.value === st.topic)) st.topic = 'all';
  if (![...setSel.options].some(o => o.value === st.set)) st.set = 'all';
  if (st.mode !== 'rnd') st.mode = 'seq';
}

fetch('deck.json')
  .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(data => {
    ALL = data.cards || [];
    fillMenus(data.sets);
    syncControls();
    build({ keep: true });
  })
  .catch(() => {
    $('pos').textContent = '';
    stage.innerHTML = '<article class="card done"><h2 class="q">The cards did not load.</h2><p class="hint" style="margin:0">Check your connection, then reload the page.</p><div class="done-actions"><button class="btn small primary" onclick="location.reload()">Reload</button></div></article>';
  });

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
})();
