/* Kamus Besar Katak — Ipusnas modern */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === t));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + t.dataset.tab));
}));
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function stripWiki(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return d.textContent || ''; }

/* ============ KAMUS ============ */
const dictInput = $('#dictInput'), dictResults = $('#dictResults'), dictStatus = $('#dictStatus');
async function searchDictionary(word) {
  const w = word.trim();
  if (!w) { dictStatus.textContent = 'ketik kata dulu'; return; }
  dictStatus.innerHTML = 'membuka kamus…';
  dictResults.innerHTML = '';
  try {
    const r = await fetch('https://id.wiktionary.org/w/api.php?action=parse&page=' + encodeURIComponent(w) + '&redirects=1&format=json&prop=wikitext&origin=*');
    const j = await r.json();
    const text = (j.parse && j.parse.wikitext && j.parse.wikitext['*']) || '';
    if (!text || /no such page/i.test(text)) throw new Error('kata tidak ada');
    const defs = extractDefs(text);
    if (!defs.length) { renderEmpty(w, 'Definisi terstruktur tidak tersedia untuk kata ini.'); return; }
    dictResults.innerHTML = `<div class="kbbi-card">
      <div class="kbbi-word"><b>${escapeHtml(w.toUpperCase())}</b><span class="kbbi-ipa">/${escapeHtml(w)}/</span></div>
      <span class="kbbi-pos">Bahasa Indonesia · kata</span>
      ${defs.map((d, i) => `<div class="kbbi-def"><span class="kbbi-def-num">${i + 1}</span><span>${escapeHtml(d)}</span></div>`).join('')}
      <div class="kbbi-example">Contoh: “${escapeHtml(w)} adalah subjek dalam kalimat.”</div>
      <div class="kbbi-source">Sumber: id.wiktionary.org (CC BY-SA)</div>
    </div>`;
    dictStatus.textContent = 'entri ditemukan';
  } catch (e) {
    renderEmpty(w, e.message);
    dictStatus.textContent = 'tak ditemukan';
  }
}
function renderEmpty(w, msg) { dictResults.innerHTML = `<div class="kbbi-empty">Keluar tak ditemukan:<br>“<b>${escapeHtml(w)}</b>”${msg ? '<br><span style="font-size:11px">' + escapeHtml(msg) + '</span>' : ''}</div>`; }
function extractDefs(text) {
  const m = text.match(/==\s*Bahasa Indonesia\s*==([\s\S]*?)(^==|$)/im);
  if (!m) return [];
  const section = m[1], lines = section.split('\n'), defs = [];
  let cur = '';
  for (const ln of lines) {
    const l = ln.trim();
    if (/^=/.test(l) || /^\{\{/.test(l) || /^\[\[Category/i.test(l)) break;
    if (/^\d+\.|^[•\-\*]/.test(l)) {
      cur = l.replace(/^\d+\.|^[•\-\*]/, '').trim();
      if (cur) defs.push(cleanWiki(cur));
    } else if (cur && l && !/^[;:]/.test(l)) {
      cur = (cur + ' ' + l).trim();
      defs[defs.length - 1] = cleanWiki(cur);
    }
  }
  return defs.length ? defs : [cleanWiki(section.slice(0, 600))];
}
function cleanWiki(s) { return s.replace(/\[\[[^\]|]*\|/g, '').replace(/\]\]/g, '').replace(/\{\{[^}]*\}\}/g, '').replace(/'''?/g, '').replace(/<[^>]*>/g, '').trim(); }
$('#dictGo').addEventListener('click', () => searchDictionary(dictInput.value));
dictInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchDictionary(dictInput.value); });

/* ============ ARSIP / DOKUMEN ============ */
const DOC_SUBJECTS = [
  { title:'Ilmu Pengetahuan Alam', wiki:'Ilmu alam', icon:'<circle cx="12" cy="12" r="8"/><path d="M12 10V7M12 14v3M9 12H7M16 12h-2"/>' },
  { title:'Ilmu Pengetahuan Sosial', wiki:'Ilmu sosial', icon:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 3-5 5-5s5 2 5 5M11 20c0-3 3-5 5-5s5 2 5 5"/>' },
  { title:'Teknik Komunikasi', wiki:'Teknik komunikasi', icon:'<path d="M4 12h16M4 8h16M4 16h10"/>' },
  { title:'Informatika', wiki:'Informatika', icon:'<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>' },
  { title:'Sejarah Kebudayaan Islam', wiki:'Sejarah kebudayaan Islam', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M12 8h.01M10 11h4"/>' },
  { title:"Qur'an Hadits", wiki:'Hadits', icon:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h6"/>' },
  { title:'Aqidah Akhlak', wiki:'Aqidah', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M10 12l2 2 4-4"/>' },
  { title:'Pancasila / PPKN', wiki:'Pancasila', icon:'<path d="M12 2l8 4v8c0 4-3 7-8 7s-8-3-8-7V6l8-4z"/><path d="M9 12l2 2 4-4"/>' },
  { title:'Bahasa Inggris', wiki:'Bahasa Inggris', icon:'<path d="M4 6h16M4 12h11M4 18h7"/>' },
  { title:'Bahasa Indonesia', wiki:'Bahasa Indonesia', icon:'<path d="M4 5h16M4 11h16M4 17h10"/>' },
  { title:'Bahasa Arab', wiki:'Bahasa Arab', icon:'<path d="M5 5h14M5 11h14M5 17h10"/>' },
  { title:'Bahasa Spanyol', wiki:'Bahasa Spanyol', icon:'<path d="M4 6h16M4 12h16M4 18h8"/>' },
  { title:'Bahasa Yunani', wiki:'Bahasa Yunani', icon:'<path d="M6 5h12M6 19h12M9 5v14M15 5v14"/>' },
  { title:'Ilmu Politik', wiki:'Ilmu politik', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M12 10v4M10 12h4"/>' },
  { title:'Matematika', wiki:'Matematika', icon:'<path d="M6 6h12M6 12h12M6 18h12"/><path d="M9 9l6 6"/>' }
];
const docGrid = $('#docGrid'), docStatus = $('#docStatus'), reader = $('#reader'), readerBody = $('#readerBody'), readerTitle = $('#readerTitle');
DOC_SUBJECTS.forEach(s => {
  const b = document.createElement('button');
  b.className = 'book-cover';
  b.innerHTML = `<svg viewBox="0 0 24 24" class="book-ico">${s.icon}</svg><h3>${escapeHtml(s.title)}</h3><span>ARSIP</span>`;
  b.addEventListener('click', () => openReader(s));
  docGrid.appendChild(b);
});
function sanitizeWiki(raw) {
  let html = raw.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'');
  html = html.replace(/<(\/?)[^>]*>/g, m => { const tag = (m.match(/<\/?([a-z0-9]+)/i)||[])[1]; const ok = ['p','br','ul','ol','li','h2','h3','h4','strong','b','em','i','blockquote','a']; return ok.includes((tag||'').toLowerCase()) ? m : ''; });
  html = html.replace(/href="[^"]*"/gi, 'target="_blank" rel="noopener"');
  return html;
}
async function openReader(s) {
  docStatus.textContent = 'membuka dokumen…';
  reader.classList.remove('hidden'); docGrid.style.display = 'none';
  readerTitle.textContent = s.title;
  readerBody.innerHTML = '<p class="hint">Memuat…</p>';
  try {
    const r = await fetch('https://id.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(s.wiki) + '&redirects=1&prop=text&format=json&origin=*');
    const j = await r.json();
    const raw = j.parse?.text?.['*'] || '';
    if (!raw) throw new Error('dokumen tidak tersedia');
    readerBody.innerHTML = sanitizeWiki(raw).slice(0, 40000);
    docStatus.textContent = 'Sumber: Wikipedia · CC BY-SA';
  } catch (e) { readerBody.innerHTML = `<p>Gagal memuat: ${escapeHtml(e.message)}</p>`; docStatus.textContent = 'gagal'; }
}
$('#readerClose').addEventListener('click', () => { reader.classList.add('hidden'); docGrid.style.display = ''; });
$('#readerNext').addEventListener('click', () => { const i = DOC_SUBJECTS.findIndex(s => s.title === readerTitle.textContent); openReader(DOC_SUBJECTS[(i+1)%DOC_SUBJECTS.length]); });

/* ============ BUKU (Open Library) ============ */
const bookSearch = $('#bookSearch'), bookGrid = $('#bookGrid'), bookStatus = $('#bookStatus');
async function searchBooks(q) {
  if (!q.trim()) return;
  bookStatus.textContent = 'mencari buku…';
  bookGrid.innerHTML = '';
  try {
    const r = await fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(q) + '&limit=15&fields=key,title,author_name,first_publish_year,cover_i,ia');
    const j = await r.json();
    if (!j.docs?.length) { bookGrid.innerHTML = '<p class="hint">Tidak ada buku.</p>'; bookStatus.textContent=''; return; }
    bookGrid.innerHTML = j.docs.map(b => {
      const cover = b.cover_i ? 'https://covers.openlibrary.org/b/id/' + b.cover_i + '-M.jpg' : '';
      const link = (b.ia && b.ia.length) ? 'https://archive.org/details/' + b.ia[0] : 'https://openlibrary.org' + b.key;
      return `<a class="book-card" href="${escapeHtml(link)}" target="_blank" rel="noopener">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(b.title||'')}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'book-cover-placeholder',textContent:'📘'}))">` : '<div class="book-cover-placeholder">📘</div>'}
        <div class="bc-body"><h4>${escapeHtml((b.title||'Tanpa judul').slice(0,80))}</h4><span>${escapeHtml((b.author_name||['Anonim']).slice(0,2).join(', '))} · ${b.first_publish_year || ''}</span></div>
      </a>`;
    }).join('');
    bookStatus.textContent = j.docs.length + ' buku ditemukan';
  } catch (e) { bookStatus.textContent = 'gagal: ' + e.message; }
}
$('#bookGo').addEventListener('click', () => searchBooks(bookSearch.value));
bookSearch.addEventListener('keydown', e => { if (e.key === 'Enter') searchBooks(bookSearch.value); });

/* ============ TERJEMAH ============ */
const LANGS = [
  {code:'id', name:'Indonesia'},{code:'en', name:'English'},{code:'jv', name:'Jawa'},{code:'su', name:'Sunda'},{code:'ms', name:'Melayu'},
  {code:'ar', name:'العربية'},{code:'es', name:'Español'},{code:'el', name:'Ελληνικά'},{code:'zh', name:'中文'},{code:'ja', name:'日本語'},{code:'ko', name:'한국어'},
  {code:'fr', name:'Français'},{code:'de', name:'Deutsch'},{code:'it', name:'Italiano'},{code:'pt', name:'Português'},{code:'ru', name:'Русский'}
];
const fromLang = $('#fromLang'), toLang = $('#toLang');
LANGS.forEach(l => { fromLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); toLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); });
fromLang.value='id'; toLang.value='en';
$('#swapLang').addEventListener('click', () => { const a = fromLang.value; fromLang.value = toLang.value; toLang.value = a; });
const fromText = $('#fromText'), toText = $('#toText');
$('#translateBtn').addEventListener('click', async () => {
  const t = fromText.value.trim(); if (!t) return;
  const btn = $('#translateBtn'); btn.textContent='Menerjemahkan…'; btn.disabled=true;
  try {
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(t) + '&langpair=' + fromLang.value + '|' + toLang.value);
    const j = await r.json();
    toText.textContent = j.responseData?.translatedText || 'Gagal menerjemahkan';
  } catch (e) { toText.textContent = 'Gagal: ' + e.message; }
  btn.textContent='Terjemahkan'; btn.disabled=false;
});
$('#copyResult').addEventListener('click', () => navigator.clipboard.writeText(toText.textContent));
$('#speakResult').addEventListener('click', () => { const u = new SpeechSynthesisUtterance(toText.textContent); u.lang = toLang.value === 'id' ? 'id-ID' : toLang.value; speechSynthesis.speak(u); });

/* ============ QURAN ============ */
const surahSelect = $('#surahSelect'), quranStatus = $('#quranStatus'), quranContent = $('#quranContent');
async function loadSurahList() {
  try { const r = await fetch('https://api.alquran.cloud/v1/surah'); const j = await r.json(); (j.data||[]).forEach(s => surahSelect.insertAdjacentHTML('beforeend', `<option value="${s.number}">${s.number}. ${s.englishName} — ${s.name}</option>`)); surahSelect.value='1'; } catch {}
}
$('#loadSurahBtn').addEventListener('click', async () => {
  const n = surahSelect.value; quranStatus.textContent='membuka mushaf…'; quranContent.innerHTML='';
  try {
    const [arR, idR] = await Promise.all([ fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`), fetch(`https://api.alquran.cloud/v1/surah/${n}/id.indonesian`) ]);
    const ar = await arR.json(), idn = await idR.json();
    const ayahs = ar.data?.ayahs||[], idAyahs = idn.data?.ayahs||[];
    quranContent.innerHTML = ayahs.map((a,i) => `<div class="ayah-card"><span class="ayah-num">Ayat ${a.numberInSurah}</span><div class="ayah-ar">${a.text}</div><div class="ayah-id">${escapeHtml(idAyahs[i]?.text||'')}</div></div>`).join('');
    quranStatus.textContent = `QS ${ar.data.englishName} · ${ar.data.numberOfAyahs} ayat · Terjemah Kemenag RI`;
  } catch (e) { quranStatus.textContent = 'gagal: ' + e.message; }
});
loadSurahList();

const deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window._dp = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').addEventListener('click', async () => { if (window._dp) { window._dp.prompt(); window._dp = null; $('#installBtn').classList.add('hidden'); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
