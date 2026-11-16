/* Kamus Besar Katak — app logic */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- tabs ---------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === t));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + t.dataset.tab));
}));

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function stripWikiHtml(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return d.textContent || ''; }

/* ================= KAMUS ================= */
const dictInput = $('#dictInput'), dictResults = $('#dictResults'), dictStatus = $('#dictStatus'), dictHint = $('#dictHint');

async function searchDictionary(word) {
  dictStatus.innerHTML = '<span class="spinner"></span> Mencari…';
  dictHint.style.display = 'none';
  dictResults.innerHTML = '';
  const w = word.trim();
  if (!w) { dictStatus.textContent = 'ketik kata dulu'; dictHint.style.display=''; return; }

  // coba Bahasa Indonesia dulu (Wiktionary main API)
  let html = '';
  try {
    const r = await fetch('https://id.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=' + encodeURIComponent(w) + '&format=json&origin=*');
    const j = await r.json();
    const pages = Object.values(j.query?.pages || {});
    for (const p of pages) {
      const txt = (p.extract || '').trim();
      if (txt && !txt.startsWith('Wikipedia does not have')) {
        html += renderWiktionaryExtract(txt, 'Bahasa Indonesia (Wikt.org)');
      }
    }
  } catch {}
  // coba English (RESTful)
  try {
    const r = await fetch('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(w));
    if (r.ok) {
      const j = await r.json();
      for (const entries of Object.values(j)) {
        for (const e of entries) {
          html += `<div class="result-card"><span class="pos">${escapeHtml(e.partOfSpeech || 'word')} · EN</span><h3>${escapeHtml(w)}</h3><div class="definition">${escapeHtml(stripWikiHtml((e.definitions[0]?.definition)||''))}</div><a class="link-wiki" href="https://en.wiktionary.org/wiki/${encodeURIComponent(w)}" target="_blank" rel="noopener">Wiktionary EN →</a></div>`;
          break;
        }
      }
    }
  } catch {}
  if (!html) html = `<div class="errorbox">Kata “${escapeHtml(w)}” tidak ditemukan. Coba kata dasar atau klik acak: <b>katak, rumah, ilmu, bahasa</b></div>`;
  dictResults.innerHTML = html;
  dictStatus.textContent = 'hasil pencarian';
}

function renderWiktionaryExtract(txt, src) {
  // split jadi paragraf sederhana
  const paras = txt.split(/\n+/).filter(p => p.trim().length > 12).slice(0, 8);
  return `<div class="result-card"><span class="pos">${escapeHtml(src)}</span><h3>${escapeHtml($('#dictInput').value.trim())}</h3>` +
    paras.map(p => `<div class="definition">${escapeHtml(p)}</div>`).join('') + '</div>';
}
$('#dictGo').addEventListener('click', () => searchDictionary(dictInput.value));
dictInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchDictionary(dictInput.value); });

/* ================= TERJEMAH ================= */
const LANGS = [
  {code:'id', name:'Bahasa Indonesia'},{code:'en', name:'English'},{code:'jv', name:'Jawa (Javanese)'},{code:'su', name:'Sunda'},{code:'ms', name:'Melayu'},
  {code:'ar', name:'العربية'},{code:'es', name:'Español'},{code:'el', name:'Ελληνικά'},{code:'zh', name:'中文'},{code:'ja', name:'日本語'},{code:'ko', name:'한국어'},
  {code:'fr', name:'Français'},{code:'de', name:'Deutsch'},{code:'it', name:'Italiano'},{code:'pt', name:'Português'},{code:'ru', name:'Русский'},
  {code:'hi', name:'हिन्दी'},{code:'ur', name:'اردو'},{code:'fa', name:'فارسی'},{code:'bn', name:'বাংলা'},{code:'ta', name:'தமிழ்'}
];
const fromLang = $('#fromLang'), toLang = $('#toLang');
LANGS.forEach(l => { fromLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); toLang.insertAdjacentHTML('beforeend', `<option value="${l.code}">${l.name}</option>`); });
fromLang.value = 'id'; toLang.value = 'en';
$('#swapLang').addEventListener('click', () => { const a=fromLang.value; fromLang.value=toLang.value; toLang.value=a; });
const fromText = $('#fromText'), toText = $('#toText'), translateHistory = $('#translateHistory');

function pushHistory(orig, trans, from, to) {
  try { const arr = JSON.parse(localStorage.getItem('kkb-trans-history') || '[]'); arr.unshift({orig,trans,from,to,t:Date.now()}); localStorage.setItem('kkb-trans-history', JSON.stringify(arr.slice(0,12))); renderHistory(); } catch {}
}
function renderHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem('kkb-trans-history') || '[]');
    translateHistory.innerHTML = arr.map(h => `<div class="hist-item"><div>${escapeHtml(h.orig.slice(0,40))} → ${escapeHtml(h.trans.slice(0,40))}</div><span>${h.from.toUpperCase()} → ${h.to.toUpperCase()}</span></div>`).join('');
  } catch {}
}
renderHistory();

$('#translateBtn').addEventListener('click', async () => {
  const text = fromText.value.trim();
  if (!text) return;
  const btn = $('#translateBtn');
  btn.textContent = 'Menerjemahkan…'; btn.disabled = true;
  try {
    const pair = `${fromLang.value}|${toLang.value}`;
    const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + pair);
    const j = await r.json();
    if (j.responseStatus === 200 && j.responseData?.translatedText) {
      toText.value = j.responseData.translatedText;
      pushHistory(text, j.responseData.translatedText, fromLang.value, toLang.value);
    } else {
      toText.value = 'Gagal menerjemahkan. Coba lagi.';
    }
  } catch (e) {
    toText.value = 'Gagal menghubungi server terjemahan: ' + e.message;
  }
  btn.textContent = 'Terjemahkan'; btn.disabled = false;
});
$('#copyResult').addEventListener('click', () => { toText.select(); navigator.clipboard.writeText(toText.value); });
$('#speakResult').addEventListener('click', () => { const u = new SpeechSynthesisUtterance(toText.value); u.lang = toLang.value === 'id' ? 'id-ID' : toLang.value; speechSynthesis.speak(u); });

/* ================= DOKUMEN ================= */
const DOC_SUBJECTS = [
  { key:'Ipa', title:'Ilmu Pengetahuan Alam', wiki:'Ilmu alam', icon:'<circle cx="12" cy="12" r="8"/><path d="M12 10V7M12 14v3M9 12H7M16 12h-2"/>' },
  { key:'Ips', title:'Ilmu Pengetahuan Sosial', wiki:'Ilmu sosial', icon:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 3-5 5-5s5 2 5 5M11 20c0-3 3-5 5-5s5 2 5 5"/>' },
  { key:'Tk', title:'Teknik Komunikasi', wiki:'Teknik komunikasi', icon:'<path d="M4 12h16M4 8h16M4 16h10"/>' },
  { key:'Informatika', title:'Informatika', wiki:'Informatika', icon:'<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>' },
  { key:'Ski', title:'Sejarah Kebudayaan Islam', wiki:'Sejarah kebudayaan Islam', icon:'<path d="M12 3l8 4v6c0 4-3 7-8 7s-8-3-8-7V7l8-4z"/><path d="M12 8h.01M10 11h4"/>' },
  { key:'QuranHadits', title:"Qur'an Hadits", wiki:'Hadits', icon:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h6"/>' },
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
const docGrid = $('#docGrid');
DOC_SUBJECTS.forEach(s => {
  const btn = document.createElement('button');
  btn.className = 'doc-card';
  btn.innerHTML = `<svg viewBox="0 0 24 24">${s.icon}</svg><span>${escapeHtml(s.title)}</span>`;
  btn.addEventListener('click', () => loadDoc(s));
  docGrid.appendChild(btn);
});
const docStatus = $('#docStatus'), docContent = $('#docContent');
function sanitizeWikiHtml(raw) {
  let html = raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<(\/?)[^>]*>/g, (m) => {
    const tag = (m.match(/<\/?([a-z0-9]+)/i) || [])[1];
    const allowed = ['p','br','ul','ol','li','h2','h3','h4','strong','b','em','i','blockquote','a'];
    return allowed.includes((tag||'').toLowerCase()) ? m : '';
  });
  html = html.replace(/href="[^"]*"/gi, 'target="_blank" rel="noopener"');
  return html;
}
async function loadDoc(s) {
  docStatus.innerHTML = '<span class="spinner"></span> Memuat ' + escapeHtml(s.title) + '…';
  docContent.innerHTML = '';
  try {
    const r = await fetch('https://id.wikipedia.org/w/api.php?action=parse&page=' + encodeURIComponent(s.wiki) + '&redirects=1&prop=text&format=json&origin=*');
    const j = await r.json();
    const raw = j.parse?.text?.['*'] || '';
    if (!raw) throw new Error('Artikel tidak tersedia');
    docContent.innerHTML = sanitizeWikiHtml(raw).slice(0, 30000);
    docStatus.textContent = 'Sumber: Wikipedia (CC BY-SA) — ' + s.title;
  } catch (e) {
    docContent.innerHTML = `<div class="errorbox">Artikel tidak bisa dimuat: ${escapeHtml(e.message)}. Coba lagi nanti.</div>`;
    docStatus.textContent = 'gagal';
  }
}

/* ================= QUR'AN ================= */
const surahSelect = $('#surahSelect'), quranStatus = $('#quranStatus'), quranContent = $('#quranContent');
async function loadSurahList() {
  try {
    const r = await fetch('https://api.alquran.cloud/v1/surah');
    const j = await r.json();
    (j.data || []).forEach(s => {
      surahSelect.insertAdjacentHTML('beforeend', `<option value="${s.number}">${s.number}. ${s.englishName} (${s.name})</option>`);
    });
    surahSelect.value = '1';
  } catch (e) { quranStatus.textContent = 'gagal memuat daftar surat: ' + e.message; }
}
$('#loadSurahBtn').addEventListener('click', async () => {
  const n = surahSelect.value; quranStatus.innerHTML = '<span class="spinner"></span> Memuat surat…'; quranContent.innerHTML = '';
  try {
    const [arR, idR] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/surah/${n}/id.indonesian`)
    ]);
    const ar = await arR.json(), idn = await idR.json();
    const ayahs = ar.data?.ayahs || [], idAyahs = idn.data?.ayahs || [];
    quranContent.innerHTML = ayahs.map((a, i) => `<div class="ayah-card"><span class="ayah-num">Ayat ${a.numberInSurah}</span><div class="ayah-ar">${a.text}</div><div class="ayah-id">${escapeHtml(idAyahs[i]?.text || '')}</div></div>`).join('');
    quranStatus.textContent = `Surat ${ar.data.englishName} (${ar.data.numberOfAyahs} ayat) — teks & terjemah Indonesia (Mufti/Kemenag)`;
  } catch (e) { quranStatus.textContent = 'gagal: ' + e.message; }
});
loadSurahList();

/* ================= PWA ================= */
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); deferred = null; $('#installBtn').classList.add('hidden'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
