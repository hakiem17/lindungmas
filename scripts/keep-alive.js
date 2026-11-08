#!/usr/bin/env node
/**
 * ==============================================================================
 * LINDUNGMAS HST — SUPABASE KEEP-ALIVE PING SCRIPT
 * ==============================================================================
 * Script ini berfungsi mengirimkan request ringan (ping) secara berkala ke
 * Supabase Database & Auth API agar project Supabase (Free Tier) tidak masuk
 * ke status "PAUSED" karena tidak ada aktivitas selama 7 hari berturut-turut.
 *
 * Cara Penggunaan:
 *   1. Jalankan sekali:
 *      npm run keep-alive
 *      atau: node scripts/keep-alive.js
 *
 *   2. Jalankan berkala otomatis:
 *      - Via GitHub Actions (rekomendasi terbaik, 100% gratis di cloud)
 *      - Via cron job di VPS / server lokal
 *      - Via mode loop: node scripts/keep-alive.js --loop
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Baca variabel dari file .env secara manual (tanpa butuh dependensi dotenv tambahan)
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hgbtaojwqstxwolvhukp.supabase.co';

const SUPABASE_KEY = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_BPCKAgdRcLnPswESdqDB7w_0-ZhCx2H';

async function pingEndpoint(name, urlPath) {
  const fullUrl = `${SUPABASE_URL.replace(/\/$/, '')}${urlPath}`;
  const startTime = Date.now();

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'User-Agent': 'Lindungmas-KeepAlive/1.0'
      }
    });

    const elapsed = Date.now() - startTime;
    return {
      name,
      url: fullUrl,
      status: res.status,
      ok: res.ok,
      elapsedMs: elapsed
    };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    return {
      name,
      url: fullUrl,
      status: 0,
      ok: false,
      error: err.message,
      elapsedMs: elapsed
    };
  }
}

async function runKeepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`🛡️  LINDUNGMAS HST — SUPABASE KEEP-ALIVE PING`);
  console.log(`⏰  Waktu Eksekusi: ${timestamp}`);
  console.log(`🌐  Target Host   : ${SUPABASE_URL}`);
  console.log(`======================================================`);

  // 1. Ping PostgreSQL via PostgREST (Memastikan Database Engine tetap hidup & aktif)
  const dbResult = await pingEndpoint('PostgreSQL Database Query', '/rest/v1/satlinmas?select=id&limit=1');
  if (dbResult.ok) {
    console.log(`✅ [${dbResult.status}] ${dbResult.name}: BERHASIL (${dbResult.elapsedMs}ms)`);
  } else {
    console.warn(`⚠️  [${dbResult.status}] ${dbResult.name}: PERINGATAN (${dbResult.error || 'Non-200 status'})`);
  }

  // 2. Ping Auth Service (Memastikan GoTrue Authentication API aktif)
  const authResult = await pingEndpoint('GoTrue Auth Health Check', '/auth/v1/health');
  if (authResult.ok) {
    console.log(`✅ [${authResult.status}] ${authResult.name}: BERHASIL (${authResult.elapsedMs}ms)`);
  } else {
    console.warn(`⚠️  [${authResult.status}] ${authResult.name}: PERINGATAN (${authResult.error || 'Non-200 status'})`);
  }

  const isSuccess = dbResult.ok || authResult.ok;
  if (isSuccess) {
    console.log(`\n🎉 STATUS: Proyek Supabase TERBUKTI AKTIF! Timer jeda 7 hari telah berhasil di-reset.`);
  } else {
    console.error(`\n❌ STATUS: Semua ping gagal. Periksa koneksi internet atau validitas API Key.`);
    if (!process.argv.includes('--loop')) {
      process.exitCode = 1;
    }
  }
  console.log(`======================================================\n`);
}

// Mode Loop (jika dijalankan dengan argumen --loop, ping setiap 48 jam)
const isLoop = process.argv.includes('--loop');
if (isLoop) {
  const INTERVAL_HOURS = 48;
  const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
  console.log(`🔄 Mode Loop Aktif: Script akan mengirim ping otomatis setiap ${INTERVAL_HOURS} jam.`);
  runKeepAlive();
  setInterval(runKeepAlive, INTERVAL_MS);
} else {
  runKeepAlive();
}

