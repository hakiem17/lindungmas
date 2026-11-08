import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = 
  getEnv('VITE_SUPABASE_URL') || 
  getEnv('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnv('SUPABASE_URL') || 
  'https://hgbtaojwqstxwolvhukp.supabase.co';

// Menggunakan key dari environment (mendukung secret/service key untuk sinkronisasi live & publishable anon key)
const supabaseKey =
  getEnv('VITE_SUPABASE_SECRET_KEY') ||
  getEnv('SUPABASE_SECRET_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('SUPABASE_PUBLISHABLE_KEY') ||
  'sb_publishable_BPCKAgdRcLnPswESdqDB7w_0-ZhCx2H';

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co'));
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Tes koneksi ke Supabase dan verifikasi ketersediaan tabel LINDUNGMAS HST
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('master_fasilitas_poskamling')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, count: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

