// ── TYPE DEFINITIONS ──────────────────────────────────────────────────────────
const TYPES = {
  pdf:      { exts: ['pdf'],                                                      color: '#ff6b6b', label: 'PDF'     },
  archive:  { exts: ['zip','rar','7z','tar','gz','bz2','tgz','xz','tar.gz'],      color: '#ffa94d', label: 'ZIP'     },
  document: { exts: ['doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp',
                      'txt','rtf','csv','epub','pages','numbers','key'],           color: '#74c0fc', label: 'DOC'     },
  media:    { exts: ['mp3','wav','flac','ogg','m4a','aac','wma',
                      'mp4','avi','mkv','mov','webm','flv','wmv','m4v','3gp'],    color: '#b197fc', label: 'MEDIA'   },
  image:    { exts: ['jpg','jpeg','png','gif','svg','webp','bmp','ico',
                      'tiff','tif','avif','raw','cr2','nef'],                     color: '#69db7c', label: 'IMG'     },
  app:      { exts: ['exe','msi','dmg','pkg','deb','rpm','apk','iso',
                      'jar','bin','run','appimage'],                              color: '#ff8787', label: 'APP'     },
  code:     { exts: ['py','js','ts','jsx','tsx','json','xml','sql','sh',
                      'bat','ps1','yaml','yml','rb','php','java','cpp','c',
                      'h','go','rs','swift','kt','dart','lua'],                   color: '#a9e34b', label: 'CODE'    },
  other:    { exts: [],                                                            color: '#868e96', label: '???'     },
};

// ── STATE ─────────────────────────────────────────────────────────────────────
let allLinks = [];
let currentType = 'all';
let searchQuery = '';

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const scanBtn     = document.getElementById('scanBtn');
const linkList    = document.getElementById('linkList');
const searchInput = document.getElementById('searchInput');
const totalCount  = document.getElementById('totalCount');
const copyAllBtn  = document.getElementById('copyAllBtn');
const dlAllBtn    = document.getElementById('dlAllBtn');
const footerInfo  = document.getElementById('footerInfo');
const filterBar   = document.getElementById('filterBar');

// ── HELPERS ───────────────────────────────────────────────────────────────────
function classifyUrl(href, hasDownload) {
  try {
    const url = new URL(href);
    const path = url.pathname.toLowerCase();
    // handle .tar.gz and similar double-extensions
    const multi = path.match(/\.(tar\.(gz|bz2|xz)|tar)$/i);
    const ext = multi ? multi[0].slice(1) : path.split('.').pop().split('?')[0];

    for (const [type, def] of Object.entries(TYPES)) {
      if (type === 'other') continue;
      if (def.exts.includes(ext)) return type;
    }
    // fallback: treat links with download attribute as "other"
    return hasDownload ? 'other' : null;
  } catch {
    return null;
  }
}

function getFilename(href) {
  try {
    const url = new URL(href);
    const parts = url.pathname.split('/');
    const raw = parts[parts.length - 1] || url.hostname;
    return decodeURIComponent(raw) || url.hostname;
  } catch {
    return href.split('/').pop() || href;
  }
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── EXTRACTION (injected into page) ──────────────────────────────────────────
function extractLinksFromPage() {
  const EXT_MAP = {
    pdf:      ['pdf'],
    archive:  ['zip','rar','7z','tar','gz','bz2','tgz','xz'],
    document: ['doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','txt','rtf','csv','epub','pages','numbers','key'],
    media:    ['mp3','wav','flac','ogg','m4a','aac','wma','mp4','avi','mkv','mov','webm','flv','wmv','m4v','3gp'],
    image:    ['jpg','jpeg','png','gif','svg','webp','bmp','ico','tiff','tif','avif'],
    app:      ['exe','msi','dmg','pkg','deb','rpm','apk','iso','jar','bin','run','appimage'],
    code:     ['py','js','ts','jsx','tsx','json','xml','sql','sh','bat','ps1','yaml','yml','rb','php','java','cpp','c','h','go','rs','swift','kt','dart','lua'],
  };

  const allExts = Object.values(EXT_MAP).flat();
  const links = [];
  const seen = new Set();

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('#')) return;
    if (seen.has(href)) return;

    const hasDownload = a.hasAttribute('download');

    let type = null;
    try {
      const url = new URL(href);
      const path = url.pathname.toLowerCase();
      const multiExt = path.match(/\.(tar\.(gz|bz2|xz))$/i);
      const ext = multiExt ? multiExt[0].slice(1) : path.split('.').pop().split('?')[0];

      for (const [t, exts] of Object.entries(EXT_MAP)) {
        if (exts.includes(ext)) { type = t; break; }
      }
      if (!type && hasDownload) type = 'other';
    } catch { return; }

    if (!type) return;
    seen.add(href);

    let filename = '';
    try {
      const url = new URL(href);
      const parts = url.pathname.split('/');
      filename = decodeURIComponent(parts[parts.length - 1] || url.hostname);
    } catch {
      filename = href.split('/').pop() || href;
    }

    links.push({
      url: href,
      filename: filename || href,
      type,
      text: (a.textContent || '').trim().slice(0, 80),
      hasDownload,
    });
  });

  return links;
}

// ── SCAN ──────────────────────────────────────────────────────────────────────
async function scanPage() {
  scanBtn.disabled = true;
  scanBtn.textContent = '…';

  linkList.innerHTML = `
    <div class="state-box">
      <div class="loader"></div>
      <div class="state-text">Scanning page…</div>
    </div>`;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractLinksFromPage,
    });

    allLinks = (results && results[0] && results[0].result) ? results[0].result : [];
    renderAll();
  } catch (err) {
    linkList.innerHTML = `
      <div class="state-box">
        <div class="state-icon">⚠️</div>
        <div class="state-text">Cannot scan this page.</div>
        <div class="state-sub">${err.message || 'Check extension permissions.'}</div>
      </div>`;
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan';
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function getFilteredLinks() {
  return allLinks.filter(link => {
    const matchType = currentType === 'all' || link.type === currentType;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      link.filename.toLowerCase().includes(q) ||
      link.url.toLowerCase().includes(q) ||
      link.text.toLowerCase().includes(q);
    return matchType && matchSearch;
  });
}

function renderAll() {
  updateCounts();
  updateFilterStyles();
  renderLinks();
  updateFooter();
}

function updateCounts() {
  const total = allLinks.length;
  totalCount.textContent = total;

  const counts = { all: total };
  for (const type of Object.keys(TYPES)) {
    counts[type] = allLinks.filter(l => l.type === type).length;
  }

  for (const [type, count] of Object.entries(counts)) {
    const el = document.getElementById(`cnt-${type}`);
    if (el) el.textContent = count > 0 ? `(${count})` : '';
  }

  // Hide zero-count tabs (except "all")
  filterBar.querySelectorAll('.filter-tab[data-type]').forEach(tab => {
    const type = tab.dataset.type;
    if (type === 'all') return;
    tab.classList.toggle('hidden', counts[type] === 0);
  });
}

function updateFilterStyles() {
  filterBar.querySelectorAll('.filter-tab').forEach(tab => {
    const type = tab.dataset.type;
    const def = TYPES[type];
    const isActive = tab.classList.contains('active');
    if (isActive && def) {
      tab.style.background = def.color;
      tab.style.color = '#000';
    } else {
      tab.style.background = '';
      tab.style.color = '';
    }
  });
}

function renderLinks() {
  const filtered = getFilteredLinks();

  if (allLinks.length === 0) {
    linkList.innerHTML = `
      <div class="state-box">
        <div class="state-icon">📭</div>
        <div class="state-text">No download links found on this page.</div>
        <div class="state-sub">Try a different page or check the URL.</div>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    linkList.innerHTML = `
      <div class="state-box">
        <div class="state-icon">🔎</div>
        <div class="state-text">No links match your filter.</div>
      </div>`;
    return;
  }

  linkList.innerHTML = filtered.map((link, i) => {
    const def = TYPES[link.type] || TYPES.other;
    const name = truncate(link.filename, 38);
    const urlShort = truncate(link.url.replace(/^https?:\/\//, ''), 52);
    return `
      <div class="link-item">
        <div class="type-dot" style="background:${def.color}"></div>
        <div class="link-info">
          <div class="link-filename" title="${escHtml(link.filename)}">${escHtml(name)}</div>
          <div class="link-url" title="${escHtml(link.url)}">${escHtml(urlShort)}</div>
        </div>
        <span class="type-badge" style="background:${def.color}22;color:${def.color}">${def.label}</span>
        <div class="link-actions">
          <button class="action-btn" data-idx="${i}" data-action="copy" title="Copy URL">⎘</button>
          <button class="action-btn dl" data-idx="${i}" data-action="dl" title="Download">↓</button>
        </div>
      </div>`;
  }).join('');

  // Attach click handlers to action buttons
  linkList.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const link = filtered[idx];
      if (!link) return;
      if (btn.dataset.action === 'copy') copyLink(btn, link.url);
      if (btn.dataset.action === 'dl')   downloadLink(link.url, link.filename);
    });
  });
}

function updateFooter() {
  const filtered = getFilteredLinks();
  const n = filtered.length;
  const total = allLinks.length;

  if (total === 0) {
    footerInfo.textContent = 'No links extracted yet';
    copyAllBtn.disabled = true;
    dlAllBtn.disabled = true;
  } else {
    footerInfo.textContent = n === total
      ? `${total} link${total !== 1 ? 's' : ''} found`
      : `Showing ${n} of ${total}`;
    copyAllBtn.disabled = n === 0;
    dlAllBtn.disabled = n === 0;
  }
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function copyLink(btn, url) {
  try {
    await navigator.clipboard.writeText(url);
    const original = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  } catch {
    // Fallback: create a temp textarea
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

async function downloadLink(url, filename) {
  try {
    await chrome.downloads.download({ url, filename: filename || undefined, saveAs: false });
  } catch {
    // Fallback: open in new tab
    chrome.tabs.create({ url, active: false });
  }
}

function copyAllLinks() {
  const filtered = getFilteredLinks();
  const text = filtered.map(l => l.url).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    copyAllBtn.textContent = '✓ Copied!';
    copyAllBtn.classList.add('copied');
    setTimeout(() => {
      copyAllBtn.textContent = 'Copy All';
      copyAllBtn.classList.remove('copied');
    }, 2000);
  });
}

async function downloadAllLinks() {
  const filtered = getFilteredLinks();
  dlAllBtn.disabled = true;
  dlAllBtn.textContent = '…';
  for (const link of filtered) {
    try {
      await chrome.downloads.download({ url: link.url, saveAs: false });
      await new Promise(r => setTimeout(r, 200)); // slight delay between downloads
    } catch { /* skip failed */ }
  }
  dlAllBtn.disabled = false;
  dlAllBtn.textContent = '↓ All';
}

// ── EVENT LISTENERS ───────────────────────────────────────────────────────────
scanBtn.addEventListener('click', scanPage);

filterBar.addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  filterBar.querySelectorAll('.filter-tab').forEach(t => {
    t.classList.remove('active');
    t.style.background = '';
    t.style.color = '';
  });
  tab.classList.add('active');
  currentType = tab.dataset.type;
  const def = TYPES[currentType];
  if (def) {
    tab.style.background = def.color;
    tab.style.color = '#000';
  }
  renderLinks();
  updateFooter();
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderLinks();
  updateFooter();
});

copyAllBtn.addEventListener('click', copyAllLinks);
dlAllBtn.addEventListener('click', downloadAllLinks);

// ── AUTO-SCAN on popup open ───────────────────────────────────────────────────
scanPage();
