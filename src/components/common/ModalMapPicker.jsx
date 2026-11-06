import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Compass, 
  Navigation, 
  Crosshair, 
  Check, 
  X, 
  Building2, 
  AlertCircle,
  HelpCircle,
  ZoomIn
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';

export default function ModalMapPicker({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  currentKecamatan = 'Barabai',
  currentDesa = '',
  onSelectLocation,
  title = "Pilih Titik Lokasi Kejadian (Input di Luar TKP)",
  subtitle = "Digunakan apabila pencatatan dilakukan di luar lokasi (misal di Kantor Mako Satpol PP)",
  note = "Titik koordinat ini akan disimpan sebagai lokasi fisik penindakan/kejadian."
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Default coordinate if empty or invalid
  const defaultLat = parseFloat(initialLat) || -2.5833;
  const defaultLng = parseFloat(initialLng) || 115.3811;

  const [tempLat, setTempLat] = useState(defaultLat);
  const [tempLng, setTempLng] = useState(defaultLng);
  const [isGettingCurrentGPS, setIsGettingCurrentGPS] = useState(false);
  const [selectedQuickKec, setSelectedQuickKec] = useState(currentKecamatan || 'Barabai');

  // Synchronize initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      const initLatVal = parseFloat(initialLat) || -2.5833;
      const initLngVal = parseFloat(initialLng) || 115.3811;
      setTempLat(initLatVal);
      setTempLng(initLngVal);
      setSelectedQuickKec(currentKecamatan || 'Barabai');
    }
  }, [isOpen, initialLat, initialLng, currentKecamatan]);

  // Initialize and manage Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [tempLat, tempLng],
        zoom: 15,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Satpol PP Kab. Hulu Sungai Tengah',
        maxZoom: 19
      }).addTo(map);

      // Custom Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-map-picker-pin',
        html: `
          <div style="
            background-color: #DC2626;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid white;
            box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
            cursor: grab;
          ">
            <span style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: 800;">📍</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });

      // Draggable Marker
      const marker = L.marker([tempLat, tempLng], {
        icon: pinIcon,
        draggable: true,
        autoPan: true
      }).addTo(map);

      marker.bindTooltip('Geser pin atau klik peta untuk pindahkan titik kejadian', {
        permanent: false,
        direction: 'top',
        offset: [0, -32]
      });

      // Circle indicator
      const circle = L.circle([tempLat, tempLng], {
        radius: 35,
        color: '#DC2626',
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#EF4444',
        fillOpacity: 0.15
      }).addTo(map);

      markerRef.current = marker;
      circleRef.current = circle;
      mapInstanceRef.current = map;

      // Update on drag
      marker.on('drag', (e) => {
        const pos = e.target.getLatLng();
        circle.setLatLng(pos);
      });

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const newLat = parseFloat(pos.lat.toFixed(6));
        const newLng = parseFloat(pos.lng.toFixed(6));
        setTempLat(newLat);
        setTempLng(newLng);
        circle.setLatLng([newLat, newLng]);
      });

      // Update on click anywhere on map
      map.on('click', (e) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        setTempLat(newLat);
        setTempLng(newLng);
      });

      // Force recalculation of container size
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Jump to selected Kecamatan center
  const handleJumpToKecamatan = (kecNama) => {
    setSelectedQuickKec(kecNama);
    const kecObj = KECAMATAN_HST.find(k => k.nama.toLowerCase() === kecNama.toLowerCase());
    if (kecObj && mapInstanceRef.current && markerRef.current && circleRef.current) {
      const newLat = parseFloat(kecObj.lat.toFixed(6));
      const newLng = parseFloat(kecObj.lng.toFixed(6));
      setTempLat(newLat);
      setTempLng(newLng);
      markerRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.setView([newLat, newLng], 15, { animate: true });
    }
  };

  // Get current device GPS inside modal
  const handleGetDeviceLocation = () => {
    if ('geolocation' in navigator) {
      setIsGettingCurrentGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = parseFloat(pos.coords.latitude.toFixed(6));
          const newLng = parseFloat(pos.coords.longitude.toFixed(6));
          setTempLat(newLat);
          setTempLng(newLng);
          if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            circleRef.current.setLatLng([newLat, newLng]);
            mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
          }
          setIsGettingCurrentGPS(false);
        },
        (err) => {
          setIsGettingCurrentGPS(false);
          alert('Gagal mengambil titik GPS: ' + (err.message || 'Izin lokasi tidak diberikan.'));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Perangkat tidak mendukung geolokasi');
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelectLocation(tempLat, tempLng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0F2A4A] tracking-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Tutup Peta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Quick Jump Controls */}
        <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          {/* Quick Kecamatan Select */}
          <div className="sm:col-span-6 flex items-center gap-1.5">
            <span className="font-bold text-slate-700 shrink-0 text-[11px] flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0F2A4A]" />
              Lompat ke Kec:
            </span>
            <select
              value={selectedQuickKec}
              onChange={(e) => handleJumpToKecamatan(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
            >
              {KECAMATAN_HST.map(k => (
                <option key={k.id} value={k.nama}>
                  Kec. {k.nama} ({k.pusat})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div className="sm:col-span-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleGetDeviceLocation}
              disabled={isGettingCurrentGPS}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Arahkan pin ke lokasi GPS perangkat Anda saat ini"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>{isGettingCurrentGPS ? 'Mencari...' : 'GPS Saya Saat Ini'}</span>
            </button>

            {currentKecamatan && (
              <button
                type="button"
                onClick={() => handleJumpToKecamatan(currentKecamatan)}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                title={`Pusatkan ke Kec. ${currentKecamatan} sesuai form`}
              >
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                <span>Pusatkan Kec. Form</span>
              </button>
            )}
          </div>
        </div>

        {/* Map Body Container */}
        <div className="relative flex-1 bg-slate-100 min-h-[380px] sm:min-h-[420px]">
          <div ref={mapContainerRef} className="w-full h-[380px] sm:h-[420px]" />

          {/* Floating Instructions / Hint Pill */}
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs text-slate-700 flex items-center gap-2 max-w-sm pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-semibold text-[11px]">
              Klik di mana saja pada peta atau geser pin merah ke lokasi tempat kejadian.
            </span>
          </div>

          {/* Floating Live Coordinates Box */}
          <div className="absolute bottom-3 right-3 z-[400] bg-[#0F2A4A]/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs space-y-0.5">
            <span className="text-[10px] text-slate-300 block font-semibold uppercase tracking-wider">Koordinat Terpilih:</span>
            <div className="font-mono font-bold text-sm text-[#F0B429]">
              {tempLat.toFixed(6)}, {tempLng.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 text-[11px]">
            {note}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#0F2A4A] hover:bg-[#14365D] text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-[#F0B429]" />
              <span>Gunakan Titik Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

