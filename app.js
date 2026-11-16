/* Kamus Besar Katak — Perpustakaan */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- tab nav ---------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === t));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + t.dataset.tab));
}));

function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function stripWiki(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return d.textContent || ''; }

/* ================= KAMUS / KBBI ================= */
const dictInput = $('#dictInput'), dictResults = $('#dictResults'), dictStatus = $('#dictStatus'), dictHint = $('#dictHint');

async function searchDictionary(word) {
  const w = word.trim();
  if (!w) { dictStatus.textContent = 'ketik kata dulu'; return; }
  dictStatus.innerHTML = '<span style="opacity:.7">Membuka kartokatalog…</span>';
  dictHint.style.display = 'none';
  dictResults.innerHTML = '';
  try {
    const r = await fetch('https://id.wiktionary.org/w/api.php?action=parse&page=' + encodeURIComponent(w) + '&redirects=1&format=json&prop=wikitext&origin=*');
    const j = await r.json();
    const text = (j.parse && j.parse.wikitext && j.parse.wikitext['*']) || '';
    if (!text || /no such page/i.test(text)) { throw new Error('kata tidak ada di kamus'); }
    const defs = extractDefs(text, w);
    if (!defs.length) { renderKbbi(w, ['Definisi tidak tersedia dalam format terstruktur.'], 'id.wiktionary.org'); return; }
    renderKbbi(w, defs, 'id.wiktionary.org (CC BY-SA)');
  } catch (e) {
    dictResults.innerHTML = `<div class="kbbi-empty">Keluar tak ditemukan: “${escapeHtml(w)}”<br><span style="font-size:11px">${escapeHtml(e.message)}</span></div>`;
    dictStatus.textContent = 'kata tak ditemukan';
  }
}
function extractDefs(text, word) {
  // Ambil definisi setelah '== Bahasa Indonesia =='
  const m = text.match(/==\s*Bahasa Indonesia\s*==([\s\S]*?)(^==|$)/im);
  if (!m) return [];
  const section = m[1];
  // Ambil definisi non-bullet: baris bermula angka atau titik
  const defs = [];
  const lines = section.split('\n');
  let current = '';
  for (const ln of lines) {
    const l = ln.trim();
    if (l.startsWith('=') || l.startsWith('{{') || l.startsWith('[[Category')) break;
    if (/^\d+\.|^[•\-\*]/.test(l)) {
      current = l.replace(/^\d+\.|^[•\-\*]/, '').trim();
      if (current) defs.push(cleanWiki(current));
    } else if (current && l && !/^[;:]/.test(l)) {
      if (!current.endsWith('.')) current += ' ' + l; else current = l;
      defs[defs.length - 1] = cleanWiki(current);
    }
  }
  return defs.length ? defs : [cleanWiki(section.replace(/\n+/g, ' ').slice(0, 300))];
}
function cleanWiki(s) {
  return s.replace(/\[\[[^\]|]*\|/g, '').replace(/\]\]/g, '').replace(/\{\{[^}]*\}\}/g, '').replace(/'''?/g, '').replace(/<[^>]*>/g, '').trim();
}
function renderKbbi(word, defs, src) {
  dictStatus.textContent = 'entri ditemukan';
  dictResults.innerHTML = `<div class="kbbi-card">
    <div class="kbbi-word"><span>${escapeHtml(word.toUpperCase())}</span><span class="kbbi-ipa">/${escapeHtml(word.toLowerCase())}/</span></div>
    <span class="kbbi-pos">KATA · BAHASA INDONESIA</span>
    ${defs.map((d, i) => `<div class="kbbi-def"><span class="kbbi-def-num">${i + 1}</span>${escapeHtml(d)}</div>`).join('')}
    <div class="kbbi-example">Contoh: “${escapeHtml(word)} sedang digunakan dalam kalimat.”</div>
    <div class="kbbi-source">Sumber: ${escapeHtml(src)}</div>
  </div>`;
}
$('#dictGo').addEventListener('click', () => searchDictionary(dictInput.value));
dictInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchDictionary(dictInput.value); });

/* ================= ARSIP ILMU ================= */
const DOC_SUBJECTS = [
  { key:'Ipa', title:'Ilmu Pengetahuan Alam', wiki:'Ilmu alam', icon:'<circle cx="12" cy="12" r="8"/><path d="M12 10V7M12 14v3M9 12H7M16 12h-2"/>' },
  { key:'Ips', title:'Ilmu Pengetahuan Sosial', wiki:'Ilmu sosial', icon:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 3-5 5-5s5 2 5 5M11 20c0-3 3-5 5-5s5 2 5 5"/>' },
  { key:'Tk', title:'Teknik Komunikasi', wiki:'Teknik komunikasi', icon:'<path d="M4 12h16M4 8h16M4 16h10"/>' },
  { key:'Informatika', title:'Informatika', wiki:'Informatika', icon:'<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>' },
  { key:'Ski', title:'Sejarah Kebudayaan Islam', wiki:'Sejarah kebudayaan Islam', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M12 8h.01M10 11h4"/>' },
  { key:'Quran', title:"Qur'an Hadits", wiki:'Hadits', icon:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h6"/>' },
  { key:'Aqidah', title:'Aqidah Akhlak', wiki:'Aqidah', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M10 12l2 2 4-4"/>' },
  { key:'Ppkn', title:'Pancasila / PPKN', wiki:'Pancasila', icon:'<path d="M12 2l8 4v8c0 4-3 7-8 7s-8-3-8-7V6l8-4z"/><path d="M9 12l2 2 4-4"/>' },
  { key:'BahasaInggris', title:'Bahasa Inggris', wiki:'Bahasa Inggris', icon:'<path d="M4 6h16M4 12h11M4 18h7"/>' },
  { key:'BahasaIndonesia', title:'Bahasa Indonesia', wiki:'Bahasa Indonesia', icon:'<path d="M4 5h16M4 11h16M4 17h10"/>' },
  { key:'BahasaArab', title:'Bahasa Arab', wiki:'Bahasa Arab', icon:'<path d="M5 5h14M5 11h14M5 17h10"/>' },
  { key:'BahasaSpanyol', title:'Bahasa Spanyol', wiki:'Bahasa Spanyol', icon:'<path d="M4 6h16M4 12h16M4 18h8"/>' },
  { key:'BahasaYunani', title:'Bahasa Yunani', wiki:'Bahasa Yunani', icon:'<path d="M6 5h12M6 19h12M9 5v14M15 5v14"/>' },
  { key:'IlmuPolitik', title:'Ilmu Politik', wiki:'Ilmu politik', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M12 10v4M10 12h4"/>' },
  { key:'Matematika', title:'Matematika', wiki:'Matematika', icon:'<path d="M6 6h12M6 12h12M6 18h12"/><path d="M9 9l6 6"/>' }
];
const docGrid = $('#docGrid'), docStatus = $('#docStatus'), reader = $('#reader'), readerBody = $('#readerBody'), readerTitle = $('#readerTitle');
DOC_SUBJECTS.forEach(s => {
  const b = document.createElement('button');
  b.className = 'book-cover';
  b.innerHTML = `<svg viewBox="0 0 24 24" class="book-ico">${s.icon}</svg><h3>${escapeHtml(s.title)}</h3><span>ARSIP · WIKI</span>`;
  b.addEventListener('click', () => openReader(s));
  docGrid.appendChild(b);
});
function sanitizeWiki(raw) {
  let html = raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<(\/?)[^>]*>/g, (m) => {
    const tag = (m.match(/<\/?([a-z0-9]+)/i) || [])[1];
    const allowed = ['p','br','ul','ol','li','h2','h3','h4','strong','b','em','i','blockquote','a'];
    return allowed.includes((tag || '').toLowerCase()) ? m : '';
  });
  html = html.replace(/href="[^"]*"/gi, 'target="_blank" rel="noopener"');
  return html;
}
async function openReader(s) {
  docStatus.innerHTML = '<span style="opacity:.7">Membuka arsip …</span>';
  readerTitle.textContent = s.title;
  reader.classList.remove('hidden');
  docGrid.style.display = 'none';
  readerBody.innerHTML = '<p style="opacity:.6;font-style:italic">Memuat koleksi…</p>';
  try {
    const r = await fetch('https://id.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(s.wiki) + '&redirects=1&prop=text&format=json&origin=*');
    const j = await r.json();
    const raw = j.parse?.text?.['*'] || '';
    if (!raw) throw new Error('dokumen arsip tidak tersedia');
    readerBody.innerHTML = sanitizeWiki(raw).slice(0, 40000);
    docStatus.textContent = 'Sumber: Wikipedia (CC BY-SA) — ' + s.title;
  } catch (e) {
    readerBody.innerHTML = `<p style="color:#8a362f">Dokumen tak bisa dimuat: ${escapeHtml(e.message)}</p>`;
    docStatus.textContent = 'gagal';
  }
}
$('#readerClose').addEventListener('click', () => { reader.classList.add('hidden'); docGrid.style.display = ''; });
$('#readerNext').addEventListener('click', () => { const idx = DOC_SUBJECTS.findIndex(s => s.wiki === readerTitle.textContent); const next = DOC_SUBJECTS[(idx + 1) % DOC_SUBJECTS.length]; openReader(next); });

/* ================= TERJEMAH ================= */
const LANGS = [
  {code:'id', name:'Indonesia'},{code:'en', name:'English'},{code:'jv', name:'Jawa'},{code:'su', name:'Sunda'},{code:'ms', name:'Melayu'},
  {code:'ar', name:'العربية'},{code:'es', name:'Español'},{code:'el', name:'Ελληνικά'},{code:'zh', name:'中文'},{code:'ja', name:'日本語'},{code:'ko', name:'한국어'},
  {code:'fr', name:'Français'},{code:'de', name:'Deutsch'},{code:'it', name:'Italiano'},{code:'pt', name:'Português'},{code:'ru', name:'Русский'},
  {code:'hi', name:'हिन्दी'},{code:'ur', name:'اردو'},{code:'fa', name:'فارسی'},{code:'bn', name:'বাংলা'},{code:'ta', name:'தமிழ்'}
];
const fromLang = $('#fromLang'), toLang = $('#toLang');
LANGS.forEach(l => { fromLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); toLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); });
fromLang.value = 'id'; toLang.value = 'en';
$('#swapLang').addEventListener('click', () => { const a = fromLang.value; fromLang.value = toLang.value; toLang.value = a; });
const fromText = $('#fromText'), toText = $('#toText'), historyEl = $('#translateHistory');
function pushHistory(orig, trans, from, to) { try { const arr = JSON.parse(localStorage.getItem('kkb-trans') || '[]'); arr.unshift({orig,trans,from,to,t:Date.now()}); localStorage.setItem('kkb-trans', JSON.stringify(arr.slice(0,12))); renderHistory(); } catch {} }
function renderHistory() { try { const arr = JSON.parse(localStorage.getItem('kkb-trans') || '[]'); historyEl.innerHTML = arr.map(h => `<div class="hist-item"><div>${escapeHtml(h.orig.slice(0,46))} → ${escapeHtml(h.trans.slice(0,46))}</div><span>${h.from.toUpperCase()} → ${h.to.toUpperCase()}</span></div>`).join(''); } catch {} }
renderHistory();
$('#translateBtn').addEventListener('click', async () => {
  const text = fromText.value.trim(); if (!text) return;
  const btn = $('#translateBtn'); btn.textContent = 'Menerjemahkan…'; btn.disabled = true;
  try {
    const pair = `${fromLang.value}|${toLang.value}`;
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + pair);
    const j = await r.json();
    if (j.responseStatus === 200 && j.responseData?.translatedText) { toText.textContent = j.responseData.translatedText; pushHistory(text, j.responseData.translatedText, fromLang.value, toLang.value); }
    else toText.textContent = 'Gagal menerjemahkan.';
  } catch (e) { toText.textContent = 'Gagal menghubungi server: ' + e.message; }
  btn.textContent = 'Terjemahkan'; btn.disabled = false;
});
$('#copyResult').addEventListener('click', () => navigator.clipboard.writeText(toText.textContent));
$('#speakResult').addEventListener('click', () => { const u = new SpeechSynthesisUtterance(toText.textContent); u.lang = toLang.value === 'id' ? 'id-ID' : toLang.value; speechSynthesis.speak(u); });

/* ================= QUR'AN ================= */
const surahSelect = $('#surahSelect'), quranStatus = $('#quranStatus'), quranContent = $('#quranContent');
async function loadSurahList() {
  try { const r = await fetch('https://api.alquran.cloud/v1/surah'); const j = await r.json(); (j.data || []).forEach(s => surahSelect.insertAdjacentHTML('beforeend', `<option value="${s.number}">${s.number}. ${s.englishName} — ${s.name}</option>`)); surahSelect.value = '1'; } catch (e) { quranStatus.textContent = 'gagal memuat daftar surat'; }
}
$('#loadSurahBtn').addEventListener('click', async () => {
  const n = surahSelect.value; quranStatus.innerHTML = '<span style="opacity:.7">Membuka mushaf…</span>'; quranContent.innerHTML = '';
  try {
    const [arR, idR] = await Promise.all([ fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`), fetch(`https://api.alquran.cloud/v1/surah/${n}/id.indonesian`) ]);
    const ar = await arR.json(), idn = await idR.json();
    const ayahs = ar.data?.ayahs || [], idAyahs = idn.data?.ayahs || [];
    quranContent.innerHTML = ayahs.map((a, i) => `<div class="ayah-card"><span class="ayah-num">Ayat ${a.numberInSurah}</span><div class="ayah-ar">${a.text}</div><div class="ayah-id">${escapeHtml(idAyahs[i]?.text || '')}</div></div>`).join('');
    quranStatus.textContent = `QS ${ar.data.englishName} (${ar.data.numberOfAyahs} ayat) — Terjemah Kemenag RI`;
  } catch (e) { quranStatus.textContent = 'gagal: ' + e.message; }
});
loadSurahList();

// PWA
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); deferred = null; $('#installBtn').classList.add('hidden'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
