import React, { useMemo } from 'react';
import { generateQrMatrix } from '../../utils/qrCodeGenerator';
import { Download, Printer, Check, Copy } from 'lucide-react';

export default function QrCodeView({
  value = '',
  size = 180,
  title = 'QR Tiket Pengaduan',
  subtitle = 'Pindai untuk lacak penanganan Satpol PP HST',
  showDownload = true,
  className = ''
}) {
  const [copied, setCopied] = React.useState(false);

  const matrix = useMemo(() => {
    return generateQrMatrix(value || 'HST-TICKET-DEMO');
  }, [value]);

  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const svgEl = document.getElementById(`qr-svg-${value.replace(/[^a-zA-Z0-9]/g, '')}`);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-Tiket-${value}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className={`p-4 bg-white rounded-2xl border-2 border-slate-200 text-center space-y-3 shadow-xs ${className}`}>
      {/* Title */}
      <div>
        <h4 className="text-xs font-black uppercase text-[#0F2A4A] tracking-wider">{title}</h4>
        {subtitle && <p className="text-[10px] text-slate-500 font-medium">{subtitle}</p>}
      </div>

      {/* QR Box with Border & Satpol PP Badge */}
      <div className="relative inline-block p-3 rounded-xl bg-slate-50 border border-slate-300 shadow-inner">
        <svg
          id={`qr-svg-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="mx-auto block"
          shapeRendering="crispEdges"
        >
          <rect width={size} height={size} fill="#FFFFFF" rx="8" />
          {matrix.map((row, r) =>
            row.map((isDark, c) => {
              if (!isDark) return null;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize + 0.1}
                  height={cellSize + 0.1}
                  fill="#0F2A4A"
                />
              );
            })
          )}

          {/* Center Seal */}
          <rect
            x={size * 0.38}
            y={size * 0.38}
            width={size * 0.24}
            height={size * 0.24}
            fill="#FFFFFF"
            rx="5"
          />
          <rect
            x={size * 0.40}
            y={size * 0.40}
            width={size * 0.20}
            height={size * 0.20}
            fill="#0F2A4A"
            rx="4"
          />
          <text
            x={size / 2}
            y={size / 2 + 3}
            fontFamily="'Plus Jakarta Sans', sans-serif"
            fontWeight="900"
            fontSize={size * 0.08}
            fill="#F0B429"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            HST
          </text>
        </svg>

        <div className="mt-2 font-mono text-[11px] font-extrabold text-[#0F2A4A] tracking-wider bg-white py-1 px-2 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5">
          <span>{value}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-slate-400 hover:text-blue-600 transition-colors"
            title="Salin Nomor Tiket"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {showDownload && (
        <div className="flex items-center justify-center gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Unduh QR</span>
          </button>
        </div>
      )}
    </div>
  );
}

