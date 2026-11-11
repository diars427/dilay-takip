/* YKS Dilay Takip - bulut katmani (Supabase). Hem telefondaki uygulama hem bilgisayardaki YKS App kullanir.
   Tum veriler tek tabloda: kv(store, k, v). store: plan | takip | kapali | kaynak | deneme | kapak
   Cihazda IndexedDB'de onbellek tutulur: internet yokken de acilir, degisiklikler sonra gonderilir. */
window.Bulut = (function () {
  const A = window.DT_AYAR || {};
  const TEST = !/^https:\/\//.test(A.SUPABASE_URL || '');
  let sb = null, oturum = null, rol = null, eposta = '';
  let C = {};            // onbellek: C[store][k] = v
  let son = '1970-01-01T00:00:00.000Z';
  let kuyruk = [];       // gonderilemeyen yazmalar
  let durum = TEST ? 'test' : 'bekliyor';
  const dinle = [];
  const haber = (n) => dinle.forEach(f => { try { f(n); } catch (e) { console.error(e); } });

  /* ---- IndexedDB onbellek ---- */
  const DBP = new Promise(r => {
    try {
      const q = indexedDB.open('dilay_takip_bulut', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('o');
      q.onsuccess = () => r(q.result); q.onerror = () => r(null);
    } catch (e) { r(null); }
  });
  const idb = (m, k, v) => DBP.then(db => new Promise(r => {
    if (!db) return r(null);
    try {
      const s = db.transaction('o', m === 'get' ? 'readonly' : 'readwrite').objectStore('o');
      const q = m === 'get' ? s.get(k) : s.put(v, k);
      q.onsuccess = () => r(q.result); q.onerror = () => r(null);
    } catch (e) { r(null); }
  }));
  let kayZ = null;
  function kaydet() { clearTimeout(kayZ); kayZ = setTimeout(() => idb('put', 'durum', { C, son, kuyruk, rol, eposta }), 400); }

  function uygula(store, k, v) {
    const S = C[store] = C[store] || {};
    const once = S[k] === undefined ? null : S[k];
    if (v === null || v === undefined) delete S[k]; else S[k] = v;
    return JSON.stringify(once) !== JSON.stringify(v === undefined ? null : v);
  }

  async function baslat() {
    const o = await idb('get', 'durum');
    if (o) { C = o.C || {}; son = o.son || son; kuyruk = o.kuyruk || []; rol = o.rol || null; eposta = o.eposta || ''; }
    if (TEST) { rol = localStorage.getItem('dt_test_rol') || 'dilay'; eposta = 'test'; return { girisli: true, rol }; }
    if (!window.supabase) { durum = 'çevrimdışı'; return { girisli: !!rol, rol }; }
    sb = window.supabase.createClient(A.SUPABASE_URL, A.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dilay-takip-oturum' } });
    try {
      const { data } = await sb.auth.getSession();
      oturum = data.session;
    } catch (e) { oturum = null; }
    if (oturum) { eposta = oturum.user.email; await rolOku(); }
    else if (!navigator.onLine && rol) return { girisli: true, rol };   // internetsiz: son bilinen oturumla ac
    else { rol = null; }
    return { girisli: !!oturum && !!rol, rol, eposta, yetkisiz: !!oturum && !rol };
  }
  async function rolOku() {
    try {
      const { data, error } = await sb.from('uyeler').select('rol').maybeSingle();
      if (!error) rol = data ? data.rol : null;
    } catch (e) { }
    kaydet();
  }
  async function giris(e, p) {
    if (TEST) return { ok: true };
    const { data, error } = await sb.auth.signInWithPassword({ email: e.trim(), password: p });
    if (error) return { ok: false, hata: error.message };
    oturum = data.session; eposta = oturum.user.email;
    // baska bir kullaniciya gecildiyse onbellegi temizle
    C = {}; son = '1970-01-01T00:00:00.000Z'; kuyruk = [];
    await rolOku();
    if (!rol) return { ok: false, hata: 'Bu e-posta listede yok. Supabase\'deki "uyeler" tablosuna eklenmeli.' };
    await cek();
    return { ok: true, rol };
  }
  async function cikis() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) { } }
    oturum = null; rol = null; C = {}; kuyruk = []; son = '1970-01-01T00:00:00.000Z';
    await idb('put', 'durum', null);
  }

  /* ---- yaz: once cihazda, sonra bulutta ---- */
  async function yaz(list) {
    list = list.filter(x => x && x.s && x.k != null);
    if (!list.length) return true;
    let degisti = false;
    list.forEach(x => { if (uygula(x.s, String(x.k), x.v === undefined ? null : x.v)) degisti = true; });
    if (degisti) haber({ yerel: true });
    if (TEST) { kaydet(); return true; }
    list.forEach(x => {
      kuyruk = kuyruk.filter(q => !(q.s === x.s && q.k === String(x.k)));
      kuyruk.push({ s: x.s, k: String(x.k), v: x.v === undefined ? null : x.v });
    });
    kaydet();
    return gonder();
  }
  let gonderiliyor = null;
  async function gonder() {
    if (TEST || !sb || !oturum) return false;
    if (gonderiliyor) { await gonderiliyor; if (!kuyruk.length) return true; }
    gonderiliyor = (async () => {
      while (kuyruk.length) {
        const parca = kuyruk.slice(0, 200);
        try {
          const { error } = await sb.from('kv').upsert(parca.map(q => ({ store: q.s, k: q.k, v: q.v })), { onConflict: 'store,k' });
          if (error) {
            durum = 'hata: ' + error.message; haber({ durum });
            if (/row-level security|permission|policy/i.test(error.message)) { kuyruk = kuyruk.slice(parca.length); kaydet(); continue; }
            return false;
          }
          kuyruk = kuyruk.slice(parca.length); kaydet();
        } catch (e) { durum = 'çevrimdışı'; haber({ durum }); return false; }
      }
      durum = 'çevrimiçi'; haber({ durum });
      return true;
    })();
    const r = await gonderiliyor; gonderiliyor = null; return r;
  }
  /* ---- cek: buluttaki yeni degisiklikleri al ---- */
  let cekiliyor = false;
  async function cek() {
    if (TEST || !sb || !oturum || cekiliyor) return false;
    cekiliyor = true;
    let degisti = false;
    try {
      await gonder();
      // 3 sn geriden basla (ayni anda yazilanlar kacmasin)
      let since = new Date(new Date(son).getTime() - 3000).toISOString();
      for (let tur = 0; tur < 50; tur++) {
        const { data, error } = await sb.from('kv').select('store,k,v,updated_at').gt('updated_at', since).order('updated_at').limit(1000);
        if (error) { durum = 'hata: ' + error.message; break; }
        data.forEach(r => {
          if (kuyruk.some(q => q.s === r.store && q.k === r.k)) return;   // bende bekleyen daha yeni bir degisiklik var
          if (uygula(r.store, r.k, r.v)) degisti = true;
          if (r.updated_at > son) son = r.updated_at;
        });
        if (data.length < 1000) break;
        since = data[data.length - 1].updated_at;
      }
      if (!/^hata/.test(durum)) durum = 'çevrimiçi';
      kaydet();
    } catch (e) { durum = 'çevrimdışı'; }
    cekiliyor = false;
    haber({ uzak: degisti, durum });
    return degisti;
  }

  /* ---- deneme PDF'leri (Supabase Storage, "pdf" kovasi) ---- */
  async function pdfYukle(yol, file) {
    if (TEST) { await idb('put', 'pdf:' + yol, file); return { ok: true }; }
    if (!sb || !oturum) return { ok: false, hata: 'giriş yok' };
    try {
      const { error } = await sb.storage.from('pdf').upload(yol, file, { upsert: true, contentType: 'application/pdf' });
      return error ? { ok: false, hata: error.message } : { ok: true };
    } catch (e) { return { ok: false, hata: 'internet yok' }; }
  }
  const pdfOnbellek = {};
  async function pdfAl(yol) {
    if (pdfOnbellek[yol]) return { ok: true, url: pdfOnbellek[yol] };
    let blob = await idb('get', 'pdf:' + yol);
    if (!blob && !TEST && sb) {
      try { const { data, error } = await sb.storage.from('pdf').download(yol); if (error) return { ok: false, hata: error.message }; blob = data; idb('put', 'pdf:' + yol, blob); }
      catch (e) { return { ok: false, hata: 'internet yok' }; }
    }
    if (!blob) return { ok: false, hata: 'PDF bulunamadı' };
    return { ok: true, url: pdfOnbellek[yol] = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' })) };
  }

  return {
    TEST, baslat, giris, cikis, yaz, cek, gonder, pdfYukle, pdfAl,
    on: f => dinle.push(f),
    get: (s, k) => { const S = C[s]; return S && S[k] !== undefined ? S[k] : null; },
    hepsi: s => C[s] || {},
    get rol() { return rol; }, get eposta() { return eposta; }, get durum() { return durum; },
    get bekleyen() { return kuyruk.length; }
  };
})();
