'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
let currentMode = 'questions';
let questions = [];
let concepts  = [];

// ─── Init ────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  await loadData();
  renderFeed();
  observeCards();
});

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

  const items = currentMode === 'questions' ? questions : concepts;
  const tplId  = currentMode === 'questions' ? 'question-card-tpl' : 'concept-card-tpl';

  items.forEach(item => {
    const card = buildCard(tplId, item);
    feed.appendChild(card);
  });

  // Scroll back to top on mode switch
  feed.scrollTo({ top: 0, behavior: 'instant' });
  updateCounter(1, items.length);
}

function buildCard(tplId, item) {
  const tpl  = document.getElementById(tplId);
  const frag = tpl.content.cloneNode(true);
  const el   = frag.querySelector('.card');

  if (tplId === 'question-card-tpl') {
    buildQuestionCard(el, item);
  } else {
    buildConceptCard(el, item);
  }

  return el;
}

// ─── Question Card ────────────────────────────────────────────────────────────
function buildQuestionCard(el, q) {
  // Meta badges
  const diffBadge = el.querySelector('.badge-difficulty');
  diffBadge.textContent = q.difficulty;
  diffBadge.className = `badge-difficulty ${q.difficulty.toLowerCase()}`;

  el.querySelector('.badge-category').textContent = q.category;
  el.querySelector('.badge-number').textContent   = q.number;
  el.querySelector('.card-title').textContent      = q.title;
  el.querySelector('.card-description').textContent = q.description;

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

  // Solution area
  buildSolutionArea(el, q);
}

// ─── Concept Card ─────────────────────────────────────────────────────────────
function buildConceptCard(el, c) {
  el.querySelector('.badge-category').textContent    = c.category;
  el.querySelector('.card-title').textContent        = c.title;
  el.querySelector('.card-description').textContent  = c.description;
  el.querySelector('.visual-diagram').textContent    = c.diagram;

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
  const langs     = Object.keys(item.solutions);
  const tabsEl    = el.querySelector('.lang-tabs');
  const codeEl    = el.querySelector('.solution-code');
  const approachEl= el.querySelector('.approach-text');
  const timeEl    = el.querySelector('.complexity-badge.time');
  const spaceEl   = el.querySelector('.complexity-badge.space');

  // Complexity (questions only)
  if (timeEl && item.timeComplexity) {
    timeEl.textContent  = `Time: ${item.timeComplexity}`;
    spaceEl.textContent = `Space: ${item.spaceComplexity}`;
  }

  // Approach (questions only)
  if (approachEl && item.approach) {
    approachEl.textContent = item.approach;
  }

  let activeLang = langs[0];

  function renderCode(lang) {
    activeLang = lang;
    const code = item.solutions[lang];
    codeEl.className = `solution-code language-${hlLang(lang)}`;
    codeEl.textContent = code;
    hljs.highlightElement(codeEl);

    tabsEl.querySelectorAll('.lang-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.lang === lang);
    });
  }

  // Build tabs
  langs.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'lang-tab' + (lang === activeLang ? ' active' : '');
    btn.textContent = langLabel(lang);
    btn.dataset.lang = lang;
    btn.addEventListener('click', () => renderCode(lang));
    tabsEl.appendChild(btn);
  });

  // Initial render (deferred so highlight.js is ready)
  setTimeout(() => renderCode(activeLang), 0);
}

// ─── Toggle Handlers ──────────────────────────────────────────────────────────
window.toggleSolution = function(btn) {
  const card    = btn.closest('.card');
  const area    = card.querySelector('.solution-area');
  const visible = area.style.display !== 'none';
  area.style.display = visible ? 'none' : 'block';
  btn.textContent = visible
    ? (currentMode === 'questions' ? 'Show Solution' : 'Show Code Example')
    : 'Hide Solution';
};

window.toggleHints = function(btn) {
  const card    = btn.closest('.card');
  const section = card.querySelector('.hints-section');
  const visible = section.style.display !== 'none';
  section.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? 'Show Hints' : 'Hide Hints';
};

// ─── Card Counter (Intersection Observer) ────────────────────────────────────
function observeCards() {
  const feed    = document.getElementById('feed');
  const counter = document.getElementById('card-counter');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = Array.from(feed.querySelectorAll('.card'));
        const idx   = cards.indexOf(entry.target) + 1;
        updateCounter(idx, cards.length);
      }
    });
  }, { root: feed, threshold: 0.5 });

  // Re-observe when mode changes (feed is re-rendered)
  const feedMutationObs = new MutationObserver(() => {
    feed.querySelectorAll('.card').forEach(c => observer.observe(c));
  });
  feedMutationObs.observe(feed, { childList: true });
}

function updateCounter(current, total) {
  document.getElementById('card-counter').textContent = `${current} / ${total}`;
}

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
