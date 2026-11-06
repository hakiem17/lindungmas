import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'navy', badgeText, badgeColor = 'emerald' }) {
  const colorMap = {
    navy: 'bg-[#0F2A4A] text-white',
    gold: 'bg-[#F0B429] text-[#0F2A4A]',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-extrabold text-[#0F2A4A] mt-1.5 tracking-tight">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] || 'bg-slate-100 text-slate-700'} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">{subtitle}</span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
            badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-700' :
            badgeColor === 'amber' ? 'bg-amber-50 text-amber-700' :
            badgeColor === 'red' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

