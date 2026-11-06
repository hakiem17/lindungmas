import React from 'react';

export const StageBadge = ({ stage }) => {
  const normalized = (stage || '').toLowerCase();
  
  const map = {
    pernyataan: {
      label: 'Tahap Pernyataan',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    sp1: {
      label: 'Peringatan 1 (SP1)',
      bg: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      dot: 'bg-amber-600'
    },
    sp2: {
      label: 'Peringatan 2 (SP2)',
      bg: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
      dot: 'bg-orange-600'
    },
    sp3: {
      label: 'Peringatan 3 (SP3)',
      bg: 'bg-red-100 text-red-800 border-red-300 font-bold',
      dot: 'bg-red-600 animate-pulse'
    },
    eksekusi: {
      label: 'Eksekusi / Bongkar',
      bg: 'bg-rose-950 text-rose-200 border-rose-800 font-bold',
      dot: 'bg-rose-500 animate-ping'
    },
    selesai: {
      label: 'Selesai / Taat',
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
      dot: 'bg-emerald-600'
    }
  };

  const item = map[normalized] || {
    label: stage,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${item.bg}`}>
      <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
      {item.label}
    </span>
  );
};

export const SourceBadge = ({ source }) => {
  const map = {
    patroli: { label: 'Patroli Regu', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    pengaduan: { label: 'Pengaduan Warga', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    inisiatif_skpd: { label: 'Inisiatif SKPD', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
  };
  const item = map[source] || { label: source, bg: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.bg}`}>
      {item.label}
    </span>
  );
};

