'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
let currentMode = 'dok';
let questions   = [];
let concepts    = [];

// Endless-scroll pool for dok mode
let dokPool = [];
const DOK_BATCH = 6;

// ─── Init ────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  setCardHeight();
  window.addEventListener('resize', setCardHeight);
  await loadData();
  renderFeed();
  // Re-measure after first render in case layout shifted during load
  setCardHeight();
});

// Set --card-h = window.innerHeight minus the actual rendered heights of
// header and nav. This is reliable on every device/browser because
// window.innerHeight is always correct and offsetHeight reads after layout.
function setCardHeight() {
  const header = document.getElementById('app-header');
  const nav    = document.getElementById('bottom-nav');
  const h = window.innerHeight - header.offsetHeight - nav.offsetHeight;
  if (h > 0) {
    document.documentElement.style.setProperty('--card-h', h + 'px');
  }
}

async function loadData() {
  try {
    const [qRes, cRes] = await Promise.all([
      fetch('data/questions.json'),
      fetch('data/concepts.json')
    ]);
    questions = await qRes.json();
    concepts  = await cRes.json();
  } catch (e) {
    console.error('Failed to load data', e);
  }
}

// ─── Mode Switch ─────────────────────────────────────────────────────────────
window.switchMode = function(mode) {
  if (mode === currentMode) return;
  currentMode = mode;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  renderFeed();
};

// ─── Render ───────────────────────────────────────────────────────────────────
function renderFeed() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';

  if (currentMode === 'dok') {
    dokPool = [];           // reset pool on each entry into dok
    appendDokCards(DOK_BATCH);
    setupDokSentinel(feed);
  } else {
    const items  = currentMode === 'questions' ? questions : concepts;
    const tplId  = currentMode === 'questions' ? 'question-card-tpl' : 'concept-card-tpl';
    items.forEach(item => feed.appendChild(buildCard(tplId, item)));
  }

  feed.scrollTo({ top: 0, behavior: 'instant' });
}

// ─── Dok endless scroll ───────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextDokItems(count) {
  const items = [];
  while (items.length < count) {
    if (dokPool.length === 0) dokPool = shuffle(questions.map((_, i) => i));
    items.push(questions[dokPool.shift()]);
  }
  return items;
}

function appendDokCards(count) {
  const feed = document.getElementById('feed');
  // Remove old sentinel if present
  const old = feed.querySelector('.dok-sentinel');
  if (old) old.remove();

  nextDokItems(count).forEach(q =>
    feed.appendChild(buildCard('question-card-tpl', q))
  );
}

function setupDokSentinel(feed) {
  const sentinel = document.createElement('div');
  sentinel.className = 'dok-sentinel';
  feed.appendChild(sentinel);

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && currentMode === 'dok') {
      appendDokCards(DOK_BATCH);
      setupDokSentinel(feed); // re-attach at new end
      observer.disconnect();
    }
  }, { root: feed, threshold: 0.1 });

  observer.observe(sentinel);
}

// ─── Card builders ────────────────────────────────────────────────────────────
function buildCard(tplId, item) {
  const tpl  = document.getElementById(tplId);
  const frag = tpl.content.cloneNode(true);
  const el   = frag.querySelector('.card');
  if (tplId === 'question-card-tpl') buildQuestionCard(el, item);
  else buildConceptCard(el, item);
  return el;
}

// ─── Question Card ────────────────────────────────────────────────────────────
function buildQuestionCard(el, q) {
  const diffBadge = el.querySelector('.badge-difficulty');
  diffBadge.textContent = q.difficulty;
  diffBadge.className = `badge-difficulty ${q.difficulty.toLowerCase()}`;

  el.querySelector('.badge-number').textContent      = q.number;
  el.querySelector('.card-title').textContent        = q.title;
  el.querySelector('.card-description').textContent  = q.description;

  // Examples
  const exList = el.querySelector('.examples-list');
  q.examples.forEach((ex, i) => {
    const block = document.createElement('div');
    block.className = 'example-block';
    block.innerHTML =
      `<div class="ex-label">Example ${i + 1}</div>` +
      `<div><strong>Input:</strong> ${escHtml(ex.input)}</div>` +
      `<div><strong>Output:</strong> ${escHtml(ex.output)}</div>` +
      (ex.explanation ? `<div><strong>Why:</strong> ${escHtml(ex.explanation)}</div>` : '');
    exList.appendChild(block);
  });

  // Hints
  const hintsList = el.querySelector('.hints-list');
  q.hints.forEach(h => {
    const li = document.createElement('li');
    li.textContent = h;
    hintsList.appendChild(li);
  });

  // DS tags
  const tagsRow = el.querySelector('.tags-row');
  if (q.tags && q.tags.length) {
    const label = document.createElement('span');
    label.className = 'tags-label';
    label.textContent = 'Uses:';
    tagsRow.appendChild(label);
    q.tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    });
  }

  buildSolutionArea(el, q);
}

// ─── Concept Card ─────────────────────────────────────────────────────────────
function buildConceptCard(el, c) {
  el.querySelector('.badge-category').textContent   = c.category;
  el.querySelector('.card-title').textContent       = c.title;
  el.querySelector('.card-description').textContent = c.description;
  el.querySelector('.visual-diagram').textContent   = c.diagram;

  const pointsList = el.querySelector('.points-list');
  c.keyPoints.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    pointsList.appendChild(li);
  });

  buildSolutionArea(el, c);
}

// ─── Solution Area (shared) ───────────────────────────────────────────────────
function buildSolutionArea(el, item) {
  const langs      = Object.keys(item.solutions);
  const tabsEl     = el.querySelector('.lang-tabs');
  const codeEl     = el.querySelector('.solution-code');
  const approachEl = el.querySelector('.approach-text');
  const timeEl     = el.querySelector('.complexity-badge.time');
  const spaceEl    = el.querySelector('.complexity-badge.space');

  if (timeEl && item.timeComplexity) {
    timeEl.textContent  = `Time: ${item.timeComplexity}`;
    spaceEl.textContent = `Space: ${item.spaceComplexity}`;
  }
  if (approachEl && item.approach) {
    approachEl.textContent = item.approach;
  }

  let activeLang = langs[0];

  function renderCode(lang) {
    activeLang = lang;
    codeEl.className = `solution-code language-${hlLang(lang)}`;
    codeEl.textContent = item.solutions[lang];
    codeEl.removeAttribute('data-highlighted');
    hljs.highlightElement(codeEl);
    tabsEl.querySelectorAll('.lang-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.lang === lang)
    );
  }

  langs.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-tab' + (lang === activeLang ? ' active' : '');
    btn.textContent = langLabel(lang);
    btn.dataset.lang = lang;
    btn.addEventListener('click', () => renderCode(lang));
    tabsEl.appendChild(btn);
  });

  setTimeout(() => renderCode(activeLang), 0);
}

// ─── Toggle Handlers ──────────────────────────────────────────────────────────
window.toggleSolution = function(btn) {
  const card      = btn.closest('.card');
  const area      = card.querySelector('.solution-area');
  const cardInner = card.querySelector('.card-inner');
  const visible   = area.style.display !== 'none';

  area.style.display = visible ? 'none' : 'block';

  const isQuestion = card.classList.contains('question-card');
  btn.textContent = visible
    ? (isQuestion ? 'Show Solution' : 'Show Code Example')
    : 'Hide Solution';

  if (!visible) {
    // Wait one frame for the area to paint, then scroll card-inner
    // so the language tabs + code are visible.
    requestAnimationFrame(() => {
      const areaRect  = area.getBoundingClientRect();
      const innerRect = cardInner.getBoundingClientRect();
      cardInner.scrollTo({
        top: cardInner.scrollTop + (areaRect.top - innerRect.top) - 8,
        behavior: 'smooth'
      });
    });
  }
};

// Programmatic card navigation — works even when card-inner is scrolled
window.navigateCard = function(btn, dir) {
  const feed  = document.getElementById('feed');
  const cardH = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--card-h')
  );
  feed.scrollBy({ top: dir * cardH, behavior: 'smooth' });
};

window.toggleHints = function(btn) {
  const card    = btn.closest('.card');
  const section = card.querySelector('.hints-section');
  const visible = section.style.display !== 'none';
  section.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? 'Show Hints' : 'Hide Hints';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function hlLang(lang) {
  const map = { javascript: 'javascript', python: 'python', go: 'go', java: 'java' };
  return map[lang] || 'plaintext';
}

function langLabel(lang) {
  const labels = { python: 'Python', go: 'Go', javascript: 'JS', java: 'Java' };
  return labels[lang] || lang;
}
