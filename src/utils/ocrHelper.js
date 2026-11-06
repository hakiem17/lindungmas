// ==============================================================================
// OCR HELPER — PEMBACA e-KTP NYATA (Tesseract.js, berjalan di browser)
// ------------------------------------------------------------------------------
// Alur: foto → pra-proses (perbesar, grayscale, kontras) → Tesseract (bahasa
// Indonesia) → teks mentah → parser per-baris toleran salah-baca → validasi
// silang dengan struktur NIK (tgl lahir & jenis kelamin tertanam di NIK).
// ==============================================================================
import { createWorker } from 'tesseract.js';
import { KECAMATAN_HST } from '../data/mockData.js';

// ------------------------------------------------------------------------------
// DATA CONTOH (hanya untuk demo / pelatihan, BUKAN hasil OCR)
// ------------------------------------------------------------------------------
export const SAMPLE_KTP_PRESETS = [
  {
    id: 'preset-syahril',
    nama: 'Syahril Ramadhan',
    nik: '6307011205850001',
    tempatLahir: 'Barabai',
    tglLahir: '1985-05-12',
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Pedagang Kaki Lima',
    alamat: 'Jl. Brigjend H. Hasan Basry No. 42, RT 004 RW 002',
    desa: 'Barabai Barat',
    kecamatan: 'Barabai',
    noHp: '081250112233',
    fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    isResidivis: true
  },
  {
    id: 'preset-maimunah',
    nama: 'Maimunah binti Arsyad',
    nik: '6307066408920002',
    tempatLahir: 'Birayang',
    tglLahir: '1992-08-24',
    jenisKelamin: 'Perempuan',
    pekerjaan: 'Wiraswasta',
    alamat: 'Pasar Birayang Blok B No. 12, RT 002 RW 001',
    desa: 'Birayang',
    kecamatan: 'Batang Alai Selatan',
    noHp: '085388991122',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
    isResidivis: false
  },
  {
    id: 'preset-rusliansyah',
    nama: 'H. Rusliansyah',
    nik: '6307021511790003',
    tempatLahir: 'Pantai Hambawang',
    tglLahir: '1979-11-15',
    jenisKelamin: 'Laki-laki',
    pekerjaan: 'Pemilik Usaha Reklame',
    alamat: 'Jl. Perintis Kemerdekaan, RT 002 RW 001',
    desa: 'Pantai Hambawang Timur',
    kecamatan: 'Labuan Amas Selatan',
    noHp: '081399448811',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    isResidivis: true
  }
];

// ------------------------------------------------------------------------------
// 1. PRA-PROSES GAMBAR (meningkatkan akurasi Tesseract secara signifikan)
// ------------------------------------------------------------------------------
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Perbesar ke lebar ±1800px, ubah ke grayscale, lalu regangkan kontras
 * (auto-level berbasis persentil) supaya teks hitam di latar biru KTP tegas.
 */
export const preprocessImage = async (dataUrl) => {
  const img = await loadImage(dataUrl);
  const TARGET_W = 1800;
  const scale = Math.min(3, Math.max(1, TARGET_W / img.width));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const gray = new Uint8ClampedArray(w * h);
  const hist = new Uint32Array(256);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    // Kanal merah diberi bobot lebih: latar biru KTP jadi terang, teks hitam tetap gelap
    const g = Math.round(d[i] * 0.5 + d[i + 1] * 0.35 + d[i + 2] * 0.15);
    gray[p] = g;
    hist[g]++;
  }

  // Auto-level: potong 1% tergelap & 1% terang
  const total = w * h;
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > total * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > total * 0.01) { hi = v; break; } }
  const range = Math.max(1, hi - lo);

  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = Math.max(0, Math.min(255, ((gray[p] - lo) * 255) / range));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

// ------------------------------------------------------------------------------
// 2. UTILITAS TEKS
// ------------------------------------------------------------------------------
const levenshtein = (a, b) => {
  a = a.toLowerCase(); b = b.toLowerCase();
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
};

const similarity = (a, b) => {
  const max = Math.max(a.length, b.length) || 1;
  return 1 - levenshtein(a, b) / max;
};

const toTitleCase = (s) =>
  s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bRt\b/g, 'RT').replace(/\bRw\b/g, 'RW');

/** Perbaiki karakter yang sering tertukar pada area angka (NIK, tanggal, RT/RW) */
const fixDigits = (s) =>
  s
    .replace(/[Oo°QD]/g, '0')
    .replace(/[Il|!\]\[iL]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss$]/g, '5')
    .replace(/[bG]/g, '6')
    .replace(/B/g, '8')
    .replace(/[?]/g, '7')
    .replace(/[Aa]/g, '4');

/** Bersihkan nilai field: buang titik dua, simbol sisa, spasi ganda */
const cleanValue = (s) =>
  s
    .replace(/^[\s:;.,=\-_~'"`»«>]+/, '')
    .replace(/[|_~`"»«<>]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

// ------------------------------------------------------------------------------
// 3. DEFINISI LABEL KTP (dengan variasi salah-baca yang umum)
// ------------------------------------------------------------------------------
const LABELS = [
  { key: 'nik', variants: ['nik', 'n1k', 'nlk', 'mik'] },
  { key: 'nama', variants: ['nama', 'narna', 'nema', 'name'] },
  { key: 'ttl', variants: ['tempat/tgl lahir', 'tempattgl lahir', 'tempat tgl lahir', 'tempat/tgllahir', 'tempat lahir', 'tgl lahir'] },
  { key: 'jk', variants: ['jenis kelamin', 'jeniskelamin', 'jenis kelamln'] },
  { key: 'alamat', variants: ['alamat', 'alamal', 'aiamat'] },
  { key: 'rtrw', variants: ['rt/rw', 'rtrw', 'rt/ rw', 'rt rw'] },
  { key: 'desa', variants: ['kel/desa', 'keldesa', 'kel desa', 'kelurahan', 'desa'] },
  { key: 'kecamatan', variants: ['kecamatan', 'kecamalan', 'kec'] },
  { key: 'agama', variants: ['agama', 'agarna'] },
  { key: 'status', variants: ['status perkawinan', 'statusperkawinan', 'status'] },
  { key: 'pekerjaan', variants: ['pekerjaan', 'pekerjaar', 'pekeraan'] },
  { key: 'wn', variants: ['kewarganegaraan', 'kewarganegaraar'] },
  { key: 'berlaku', variants: ['berlaku hingga', 'berlakuhingga'] }
];

/**
 * Cocokkan awal baris dengan label KTP secara fuzzy.
 * Mengembalikan { key, value } bila baris diawali label yang dikenali.
 */
const matchLabel = (line) => {
  // Pisahkan di titik dua pertama bila ada
  const colonIdx = line.search(/[:;]/);
  const candidates = [];
  if (colonIdx > 1 && colonIdx < 28) {
    candidates.push({ label: line.slice(0, colonIdx), value: line.slice(colonIdx + 1) });
  }
  // Tanpa titik dua: coba 1–3 kata pertama sebagai label
  const words = line.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    if (words.length > n) candidates.push({ label: words.slice(0, n).join(' '), value: words.slice(n).join(' ') });
  }

  let best = null;
  for (const c of candidates) {
    const norm = c.label.toLowerCase().replace(/[^a-z0-9/ ]/g, '').trim();
    if (!norm) continue;
    for (const L of LABELS) {
      for (const v of L.variants) {
        const sim = similarity(norm, v);
        const threshold = v.length <= 4 ? 0.74 : 0.7;
        if (sim >= threshold && (!best || sim > best.sim)) {
          best = { key: L.key, value: cleanValue(c.value), sim };
        }
      }
    }
  }
  return best;
};

// ------------------------------------------------------------------------------
// 4. VALIDASI & DEKODE NIK
// NIK = PP KK CC DDMMYY SSSS  (PP=prov, KK=kab, CC=kec, DD+40 bila perempuan)
// ------------------------------------------------------------------------------
export const decodeNIK = (nik) => {
  if (!/^\d{16}$/.test(nik)) return null;
  let dd = parseInt(nik.slice(6, 8), 10);
  const mm = parseInt(nik.slice(8, 10), 10);
  const yy = parseInt(nik.slice(10, 12), 10);
  const female = dd > 40;
  if (female) dd -= 40;
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return { valid: false };
  const currentYY = new Date().getFullYear() % 100;
  const year = yy > currentYY ? 1900 + yy : 2000 + yy;
  return {
    valid: true,
    kodeProvinsi: nik.slice(0, 2),
    kodeKabupaten: nik.slice(0, 4),
    jenisKelamin: female ? 'Perempuan' : 'Laki-laki',
    tglLahir: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  };
};

const extractNIK = (text) => {
  // Cari di baris berlabel NIK dulu, lalu fallback ke deretan 16 karakter mirip angka
  const lines = text.split('\n');
  const tryLine = (raw) => {
    const fixed = fixDigits(raw.replace(/\s+/g, ''));
    const m = fixed.match(/\d{16}/);
    return m ? m[0] : null;
  };
  for (const line of lines) {
    if (/n[i1l]k/i.test(line)) {
      const after = line.replace(/^.*?n[i1l]k[\s:;.]*/i, '');
      const r = tryLine(after);
      if (r) return r;
    }
  }
  for (const line of lines) {
    const r = tryLine(line);
    if (r) return r;
  }
  return '';
};

// ------------------------------------------------------------------------------
// 5. PENCOCOKAN WILAYAH (Kecamatan & Desa di Kab. HST)
// ------------------------------------------------------------------------------
const matchKecamatan = (raw) => {
  if (!raw) return null;
  const q = raw.toLowerCase().replace(/[^a-z ]/g, '').trim();
  let best = null;
  for (const k of KECAMATAN_HST) {
    const sim = similarity(q, k.nama.toLowerCase());
    if (!best || sim > best.sim) best = { nama: k.nama, sim };
  }
  return best && best.sim >= 0.6 ? best.nama : null;
};

const matchDesa = (raw, kecamatanNama) => {
  if (!raw) return null;
  const q = raw.toLowerCase().replace(/[^a-z ]/g, '').trim();
  const pools = kecamatanNama
    ? KECAMATAN_HST.filter((k) => k.nama === kecamatanNama)
    : KECAMATAN_HST;
  let best = null;
  for (const k of pools) {
    for (const d of k.desa) {
      const sim = similarity(q, d.toLowerCase());
      if (!best || sim > best.sim) best = { desa: d, kecamatan: k.nama, sim };
    }
  }
  return best && best.sim >= 0.65 ? best : null;
};

// ------------------------------------------------------------------------------
// 6. PARSER TEKS KTP (dipakai untuk hasil Tesseract maupun teks tempelan)
// ------------------------------------------------------------------------------
export const parseKTPRawText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s{2,}/g, ' ').trim())
    .filter((l) => l.length > 1);

  const fields = {};
  for (const line of lines) {
    const m = matchLabel(line);
    if (m && m.value && !fields[m.key]) fields[m.key] = m.value;
  }

  const result = {
    nik: extractNIK(rawText),
    nama: '',
    tempatLahir: '',
    tglLahir: '',
    jenisKelamin: '',
    alamat: '',
    desa: '',
    kecamatan: '',
    pekerjaan: '',
    warnings: []
  };

  // Nama: hanya huruf, titik, apostrof
  if (fields.nama) {
    result.nama = toTitleCase(fields.nama.replace(/[^A-Za-z.' ]/g, ' ').replace(/\s{2,}/g, ' ').trim());
  }

  // Tempat/Tgl Lahir: "BARABAI, 12-05-1985"
  if (fields.ttl) {
    const ttl = fields.ttl;
    const dateMatch = fixDigits(ttl.replace(/[^0-9A-Za-z\-\/.,\s]/g, '')).match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{4})/);
    if (dateMatch) {
      result.tglLahir = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    }
    const place = ttl.split(/[,.]|\d/)[0].replace(/[^A-Za-z ]/g, '').trim();
    if (place) result.tempatLahir = toTitleCase(place);
  }

  // Jenis Kelamin
  const jkSrc = (fields.jk || rawText).toUpperCase();
  if (/PEREMPUAN|PEREMPUAM|WANITA/.test(jkSrc)) result.jenisKelamin = 'Perempuan';
  else if (/LAKI|LAK1|LAKL/.test(jkSrc)) result.jenisKelamin = 'Laki-laki';

  // Alamat + RT/RW
  if (fields.alamat) result.alamat = toTitleCase(fields.alamat);
  if (fields.rtrw) {
    const rr = fixDigits(fields.rtrw).match(/(\d{1,3})\s*[\/.\-\s]\s*(\d{1,3})/);
    if (rr) {
      const rtrw = `RT ${rr[1].padStart(3, '0')} RW ${rr[2].padStart(3, '0')}`;
      result.alamat = result.alamat ? `${result.alamat}, ${rtrw}` : rtrw;
    }
  }

  // Kecamatan & Desa (dicocokkan ke master wilayah HST bila memungkinkan)
  const kecMatched = matchKecamatan(fields.kecamatan);
  result.kecamatan = kecMatched || (fields.kecamatan ? toTitleCase(fields.kecamatan.replace(/[^A-Za-z ]/g, '').trim()) : '');
  const desaMatched = matchDesa(fields.desa, kecMatched);
  if (desaMatched) {
    result.desa = desaMatched.desa;
    if (!result.kecamatan) result.kecamatan = desaMatched.kecamatan;
  } else if (fields.desa) {
    result.desa = toTitleCase(fields.desa.replace(/[^A-Za-z ]/g, '').trim());
  }
  if (fields.kecamatan && !kecMatched) {
    result.warnings.push('Kecamatan tidak ditemukan di master wilayah Kab. HST — mohon periksa (mungkin KTP luar daerah).');
  }

  // Pekerjaan
  if (fields.pekerjaan) result.pekerjaan = toTitleCase(fields.pekerjaan.replace(/[^A-Za-z/ ]/g, ' ').replace(/\s{2,}/g, ' ').trim());

  // ---- Validasi silang dengan NIK ----
  const decoded = decodeNIK(result.nik);
  if (!result.nik) {
    result.warnings.push('NIK 16 digit tidak terbaca — mohon ketik manual.');
  } else if (!decoded || !decoded.valid) {
    result.warnings.push('Struktur NIK tidak valid (tanggal di dalam NIK tidak masuk akal) — kemungkinan ada digit salah baca.');
  } else {
    if (!result.tglLahir) {
      result.tglLahir = decoded.tglLahir;
    } else if (result.tglLahir !== decoded.tglLahir) {
      result.warnings.push(`Tanggal lahir terbaca ${result.tglLahir}, sedangkan kode NIK menunjukkan ${decoded.tglLahir}. Periksa salah satunya.`);
    }
    if (!result.jenisKelamin) {
      result.jenisKelamin = decoded.jenisKelamin;
    } else if (result.jenisKelamin !== decoded.jenisKelamin) {
      result.warnings.push(`Jenis kelamin terbaca "${result.jenisKelamin}", tetapi kode NIK menunjukkan "${decoded.jenisKelamin}".`);
    }
  }

  ['nama', 'alamat'].forEach((f) => {
    if (!result[f]) result.warnings.push(`Field "${f}" tidak terbaca — mohon isi manual.`);
  });

  return result;
};

// ------------------------------------------------------------------------------
// 7. OCR NYATA DENGAN TESSERACT
// ------------------------------------------------------------------------------
/**
 * @param {File|string} input  File gambar atau dataURL
 * @param {(p:{status:string, progress:number})=>void} onProgress
 * @returns {Promise<{data:object, rawText:string, confidence:number, imageUrl:string}>}
 */
export const recognizeKTPImage = async (input, onProgress) => {
  const imageUrl = typeof input === 'string' ? input : await fileToDataUrl(input);
  onProgress?.({ status: 'Mempersiapkan gambar (perbesar & tingkatkan kontras)...', progress: 0.05 });
  const processed = await preprocessImage(imageUrl);

  const statusLabel = {
    'loading tesseract core': 'Memuat mesin OCR...',
    'initializing tesseract': 'Inisialisasi mesin OCR...',
    'loading language traineddata': 'Mengunduh model bahasa Indonesia (sekali saja)...',
    'initializing api': 'Menyiapkan pembaca...',
    'recognizing text': 'Membaca teks pada KTP...'
  };

  const worker = await createWorker('ind', 1, {
    logger: (m) => {
      onProgress?.({
        status: statusLabel[m.status] || m.status,
        progress: m.status === 'recognizing text' ? 0.3 + m.progress * 0.7 : 0.1 + (m.progress || 0) * 0.2
      });
    }
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6' // blok teks seragam — cocok untuk tata letak KTP
    });
    const { data } = await worker.recognize(processed);
    const parsed = parseKTPRawText(data.text);
    return {
      data: parsed,
      rawText: data.text,
      confidence: Math.round(data.confidence || 0),
      imageUrl
    };
  } finally {
    await worker.terminate();
  }
};
