import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  ShieldAlert, 
  Compass, 
  Info,
  Layers,
  Trophy,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Eye,
  Users,
  Scale,
  Search,
  Filter,
  Building2,
  ChevronRight,
  Map as MapIcon,
  Check,
  X,
  RefreshCw,
  ZoomIn,
  Loader2,
  Sparkles,
  Palette
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { getWilayahList } from '../../data/storageService';
import { StageBadge } from '../common/Badge';
import { formatPersonilList } from '../pengaduan/BukuRegisterPengaduan';

// ==============================================================================
// SKALA GRADASI WARNA SPASIAL (CHOROPLETH DENSITY TIERS)
// ==============================================================================
export const GRADASI_TIERS = [
  { min: 0, max: 0, label: '0 (Kondusif)', level: 'Aman' },
  { min: 1, max: 2, label: '1 - 2 (Rendah)', level: 'Rendah' },
  { min: 3, max: 5, label: '3 - 5 (Sedang)', level: 'Sedang' },
  { min: 6, max: 9, label: '6 - 9 (Tinggi)', level: 'Tinggi' },
  { min: 10, max: Infinity, label: '10+ (Prioritas Utama)', level: 'Sangat Tinggi' }
];

export const getGradasiColor = (count, palette = 'trantibum') => {
  if (count <= 0) {
    return {
      fill: '#F1F5F9',
      border: '#94A3B8',
      opacity: 0.18,
      label: 'Kondusif (0)',
      tier: 'aman',
      textColor: '#475569',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
    };
  }

  if (palette === 'spektrum_satpol') {
    if (count <= 2) {
      return {
        fill: '#93C5FD',
        border: '#2563EB',
        opacity: 0.45,
        label: `Rendah (${count})`,
        tier: 'rendah',
        textColor: '#1E40AF',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }
    if (count <= 5) {
      return {
        fill: '#FCD34D',
        border: '#D97706',
        opacity: 0.55,
        label: `Sedang (${count})`,
        tier: 'sedang',
        textColor: '#B45309',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }
    if (count <= 9) {
      return {
        fill: '#FB923C',
        border: '#EA580C',
        opacity: 0.65,
        label: `Tinggi (${count})`,
        tier: 'tinggi',
        textColor: '#C2410C',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300'
      };
    }
    return {
      fill: '#DC2626',
      border: '#991B1B',
      opacity: 0.75,
      label: `Prioritas Utama (${count})`,
      tier: 'prioritas',
      textColor: '#991B1B',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold'
    };
  }

  // Default Palette: 'trantibum' (Traffic Light Hijau - Kuning - Oranye - Merah)
  if (count <= 2) {
    return {
      fill: '#4ADE80',
      border: '#16A34A',
      opacity: 0.40,
      label: `Rendah (${count})`,
      tier: 'rendah',
      textColor: '#15803D',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  }
  if (count <= 5) {
    return {
      fill: '#FACC15',
      border: '#CA8A04',
      opacity: 0.50,
      label: `Sedang (${count})`,
      tier: 'sedang',
      textColor: '#A16207',
      badgeClass: 'bg-yellow-100 text-yellow-900 border-yellow-300'
    };
  }
  if (count <= 9) {
    return {
      fill: '#FB923C',
      border: '#EA580C',
      opacity: 0.60,
      label: `Tinggi (${count})`,
      tier: 'tinggi',
      textColor: '#C2410C',
      badgeClass: 'bg-orange-100 text-orange-900 border-orange-300'
    };
  }
  return {
    fill: '#EF4444',
    border: '#B91C1C',
    opacity: 0.75,
    label: `Prioritas Utama (${count})`,
    tier: 'prioritas',
    textColor: '#991B1B',
    badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold'
  };
};

// Koordinat Bounding Box Kabupaten Hulu Sungai Tengah
const HST_BOUNDS = [
  [-2.782556, 115.154723], // South-West
  [-2.452358, 115.821807]  // North-East
];
const HST_CENTER = [-2.6175, 115.4883];
const BARABAI_CENTER = [-2.5833, 115.3811];

export default function PetaSpasialHST({ 
  pelanggaranList = [], 
  rekapTrantibumList = [], 
  onSelectPelanggaran 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const kecamatanLayerRef = useRef(null);
  const desaLayerRef = useRef(null);
  
  // Layer lookup map untuk zooming cepat ke fitur terpilih
  const desaFeaturesMapRef = useRef(new Map());
  const kecFeaturesMapRef = useRef(new Map());

  // GeoJSON Data State
  const [geoKecamatanData, setGeoKecamatanData] = useState(null);
  const [geoDesaData, setGeoDesaData] = useState(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Filter States
  const [selectedSource, setSelectedSource] = useState('semua'); // 'semua' | 'penindakan' | 'pelanggaran'
  const [selectedKecamatan, setSelectedKecamatan] = useState('semua');
  const [selectedDesa, setSelectedDesa] = useState('semua');
  const [selectedTindakan, setSelectedTindakan] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSideTab, setActiveSideTab] = useState('ranking'); // 'ranking' | 'desa_rawan' | 'titik'

  // Layer Visibility & Gradasi Toggles
  const [showKecamatanBorders, setShowKecamatanBorders] = useState(true);
  const [showDesaBorders, setShowDesaBorders] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [useGradasi, setUseGradasi] = useState(true); // Default ON dengan gradasi warna choropleth
  const [gradasiPalette, setGradasiPalette] = useState('trantibum'); // 'trantibum' | 'spektrum_satpol'

  // Master wilayah list
  const wilayahList = useMemo(() => getWilayahList() || KECAMATAN_HST, []);

  // =========================================================================
  // 1. FETCH GEOJSON ASSETS (Kecamatan & 169 Desa HST)
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGeo(true);
    setLoadError(null);

    Promise.all([
      fetch('/peta/map.json')
        .then(res => {
          if (!res.ok) throw new Error('Gagal memuat batas kecamatan');
          return res.json();
        }),
      fetch('/peta/desa_hst.geojson')
        .then(res => {
          if (!res.ok) throw new Error('Gagal memuat batas desa HST');
          return res.json();
        })
    ])
      .then(([kecData, desaData]) => {
        if (!isMounted) return;
        setGeoKecamatanData(kecData);
        setGeoDesaData(desaData);
        setIsLoadingGeo(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Error loading GeoJSON:', err);
        setLoadError(err.message || 'Gagal memuat berkas peta spasial');
        setIsLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // 2. GABUNGKAN & STANDARISASI TITIK SPASIAL
  // =========================================================================
  const allMapPoints = useMemo(() => {
    const points = [];

    // A. Titik dari Rekap Kegiatan Penindakan & Trantibum
    (rekapTrantibumList || []).forEach((item) => {
      if (item.lat && item.lng) {
        points.push({
          id: `trb-${item.id}`,
          originalId: item.id,
          sourceType: 'penindakan',
          sourceLabel: 'Kegiatan Penindakan Trantibum',
          title: item.jenisPengaduan || 'Kegiatan Trantibum',
          tindakLanjut: item.tindakLanjut || 'Penertiban',
          status: item.statusPengaduan || 'Terlayani',
          pelapor: item.namaPelapor || 'Masyarakat',
          personil: formatPersonilList(item.personil),
          perda: item.perdaYangDipakai || 'Perda No 6 Tahun 2024 Trantibum',
          tanggal: item.tanggal || '-',
          kecamatan: item.kecamatan || 'Barabai',
          desa: item.desa || '',
          lokasi: item.lokasi || '',
          lat: Number(item.lat),
          lng: Number(item.lng),
          raw: item
        });
      }
    });

    // B. Titik dari Berkas Pelanggaran Perda
    (pelanggaranList || []).forEach((item) => {
      if (item.lat && item.lng) {
        points.push({
          id: `plg-${item.id}`,
          originalId: item.id,
          sourceType: 'pelanggaran',
          sourceLabel: 'Berkas Pelanggaran Perda',
          title: item.namaPelanggar || 'Pelanggaran Perda',
          tindakLanjut: item.statusTindakLanjut ? `Tahap ${item.statusTindakLanjut}` : 'Peneguran',
          status: item.isSelesai ? 'Selesai' : `Tahap ${item.statusTindakLanjut}`,
          pelapor: item.petugasPencatat || 'Petugas Patroli',
          personil: item.petugasPencatat ? [item.petugasPencatat] : [],
          perda: Array.isArray(item.perdaIds) ? item.perdaIds.join(', ') : (item.perdaYangDipakai || 'Perda No 6 Tahun 2024'),
          tanggal: item.tanggal || '-',
          kecamatan: item.kecamatan || 'Barabai',
          desa: item.desa || '',
          lokasi: item.lokasiNama || item.alamat || '',
          lat: Number(item.lat),
          lng: Number(item.lng),
          raw: item
        });
      }
    });

    return points;
  }, [rekapTrantibumList, pelanggaranList]);

  // =========================================================================
  // 3. DAFTAR DESA DINAMIS SESUAI KECAMATAN YANG DIPILIH
  // =========================================================================
  const availableDesaList = useMemo(() => {
    if (!geoDesaData || !geoDesaData.features) return [];

    let features = geoDesaData.features;
    if (selectedKecamatan !== 'semua') {
      features = features.filter(
        f => f.properties.WADMKC && f.properties.WADMKC.toLowerCase() === selectedKecamatan.toLowerCase()
      );
    }

    const map = new Map();
    features.forEach(f => {
      const nama = f.properties.NAMOBJ;
      const kec = f.properties.WADMKC;
      if (nama && !map.has(nama)) {
        map.set(nama, {
          nama,
          kecamatan: kec,
          areaHa: Math.round((f.properties.SHAPE_Area || 0) / 10000),
          properties: f.properties
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [geoDesaData, selectedKecamatan]);

  // Informasi Desa Terpilih
  const selectedDesaInfo = useMemo(() => {
    if (selectedDesa === 'semua' || !geoDesaData) return null;

    const feature = geoDesaData.features.find(f => {
      const matchDesa = f.properties.NAMOBJ && f.properties.NAMOBJ.toLowerCase() === selectedDesa.toLowerCase();
      if (selectedKecamatan === 'semua') return matchDesa;
      return matchDesa && f.properties.WADMKC && f.properties.WADMKC.toLowerCase() === selectedKecamatan.toLowerCase();
    });

    if (!feature) return null;

    const props = feature.properties;
    const desaPoints = allMapPoints.filter(p => 
      p.desa && p.desa.toLowerCase() === selectedDesa.toLowerCase()
    );
    const penindakanCount = desaPoints.filter(p => p.sourceType === 'penindakan').length;
    const pelanggaranCount = desaPoints.filter(p => p.sourceType === 'pelanggaran').length;

    return {
      nama: props.NAMOBJ,
      kecamatan: props.WADMKC,
      luasHa: Math.round((props.SHAPE_Area || 0) / 10000).toLocaleString('id-ID'),
      kodePum: props.KDEPUM || props.KDCPUM || '-',
      remark: props.REMARK || 'Wilayah Terverifikasi BIG',
      penindakanCount,
      pelanggaranCount,
      totalTitik: desaPoints.length
    };
  }, [selectedDesa, selectedKecamatan, geoDesaData, allMapPoints]);

  // =========================================================================
  // 4. ANALISIS STATISTIK & PERINGKAT AREA PELANGGARAN TERBANYAK
  // =========================================================================
  const areaRanking = useMemo(() => {
    const sourcePoints = allMapPoints.filter(p => {
      if (selectedSource === 'semua') return true;
      return p.sourceType === selectedSource;
    });

    const totalAll = sourcePoints.length;

    const stats = wilayahList.map(kec => {
      const kecPoints = sourcePoints.filter(p => p.kecamatan.toLowerCase() === kec.nama.toLowerCase());
      const penindakanCount = kecPoints.filter(p => p.sourceType === 'penindakan').length;
      const pelanggaranCount = kecPoints.filter(p => p.sourceType === 'pelanggaran').length;
      const total = kecPoints.length;

      // Cari desa/kelurahan dengan kejadian terbanyak di kecamatan ini
      const desaMap = {};
      kecPoints.forEach(p => {
        if (p.desa) desaMap[p.desa] = (desaMap[p.desa] || 0) + 1;
      });
      const topDesa = Object.keys(desaMap).sort((a, b) => desaMap[b] - desaMap[a])[0] || '-';

      return {
        id: kec.id,
        nama: kec.nama,
        lat: kec.lat,
        lng: kec.lng,
        total,
        penindakanCount,
        pelanggaranCount,
        topDesa,
        percentage: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);

    return stats;
  }, [allMapPoints, selectedSource, wilayahList]);

  // Top Desa Rawan Terbanyak
  const topDesaRanking = useMemo(() => {
    const desaCounts = {};
    allMapPoints.forEach(p => {
      if (!p.desa) return;
      const key = `${p.desa}|${p.kecamatan}`;
      if (!desaCounts[key]) {
        desaCounts[key] = {
          desa: p.desa,
          kecamatan: p.kecamatan,
          penindakan: 0,
          pelanggaran: 0,
          total: 0
        };
      }
      if (p.sourceType === 'penindakan') desaCounts[key].penindakan += 1;
      if (p.sourceType === 'pelanggaran') desaCounts[key].pelanggaran += 1;
      desaCounts[key].total += 1;
    });

    return Object.values(desaCounts).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [allMapPoints]);

  // Lookup data agregasi statistik kejadian per kecamatan untuk gradasi cepat
  const kecStatsMap = useMemo(() => {
    const map = new Map();
    areaRanking.forEach(item => {
      map.set(item.nama.toLowerCase(), item);
    });
    return map;
  }, [areaRanking]);

  // Lookup data agregasi statistik kejadian per desa/kelurahan untuk gradasi cepat
  const desaStatsMap = useMemo(() => {
    const map = new Map();
    allMapPoints.forEach(p => {
      if (!p.desa) return;
      const dName = p.desa.toLowerCase().trim();
      const kName = (p.kecamatan || '').toLowerCase().trim();
      const fullKey = `${kName}_${dName}`;

      const curr = map.get(fullKey) || { total: 0, penindakan: 0, pelanggaran: 0, desa: p.desa, kecamatan: p.kecamatan };
      curr.total += 1;
      if (p.sourceType === 'penindakan') curr.penindakan += 1;
      else curr.pelanggaran += 1;
      map.set(fullKey, curr);

      const currD = map.get(dName) || { total: 0, penindakan: 0, pelanggaran: 0, desa: p.desa, kecamatan: p.kecamatan };
      currD.total += 1;
      if (p.sourceType === 'penindakan') currD.penindakan += 1;
      else currD.pelanggaran += 1;
      map.set(dName, currD);
    });
    return map;
  }, [allMapPoints]);

  // Area dengan Pelanggaran Terbanyak (#1)
  const topArea = areaRanking[0] || { nama: 'Barabai', total: 0, percentage: 0, topDesa: '-' };
  const totalPointsCount = allMapPoints.length;
  const totalPenindakan = allMapPoints.filter(p => p.sourceType === 'penindakan').length;
  const totalPelanggaran = allMapPoints.filter(p => p.sourceType === 'pelanggaran').length;

  // =========================================================================
  // 5. FILTER TITIK SPASIAL AKTIF
  // =========================================================================
  const filteredPoints = useMemo(() => {
    return allMapPoints.filter(item => {
      const matchSource = selectedSource === 'semua' || item.sourceType === selectedSource;
      const matchKec = selectedKecamatan === 'semua' || 
        item.kecamatan.toLowerCase() === selectedKecamatan.toLowerCase();
      const matchDesa = selectedDesa === 'semua' || 
        (item.desa && item.desa.toLowerCase() === selectedDesa.toLowerCase());
      const matchTindakan = selectedTindakan === 'semua' || 
        item.tindakLanjut.toLowerCase().includes(selectedTindakan.toLowerCase());
      const matchSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.perda.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSource && matchKec && matchDesa && matchTindakan && matchSearch;
    });
  }, [allMapPoints, selectedSource, selectedKecamatan, selectedDesa, selectedTindakan, searchQuery]);

  // =========================================================================
  // 6. INISIALISASI PETA LEAFLET (Fokus Hulu Sungai Tengah)
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Inisialisasi peta berfokus penuh pada Hulu Sungai Tengah
      const map = L.map(mapContainerRef.current, {
        center: HST_CENTER,
        zoom: 11,
        zoomControl: true,
        maxBounds: [
          [-3.1000, 114.8000],
          [-2.2000, 116.2000]
        ],
        minZoom: 9
      });

      // Fit bounds langsung ke seluruh Kabupaten Hulu Sungai Tengah
      map.fitBounds(HST_BOUNDS, { padding: [15, 15] });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Satpol PP Kab. Hulu Sungai Tengah',
        maxZoom: 18
      }).addTo(map);

      // Layer groups terpisah
      kecamatanLayerRef.current = L.layerGroup().addTo(map);
      desaLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // 7. RENDER LAYER BATAS KECAMATAN DARI map.json DENGAN GRADASI WARNA
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !kecamatanLayerRef.current || !geoKecamatanData) return;

    kecamatanLayerRef.current.clearLayers();
    kecFeaturesMapRef.current.clear();

    if (!showKecamatanBorders) return;

    const kecGeoJsonLayer = L.geoJSON(geoKecamatanData, {
      style: (feature) => {
        const rawNama = feature.properties?.nama || '';
        const kecNama = rawNama.toLowerCase();
        const stat = kecStatsMap.get(kecNama);
        const count = stat ? stat.total : 0;
        const isSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === kecNama;

        if (useGradasi) {
          const g = getGradasiColor(count, gradasiPalette);
          return {
            color: isSelected ? '#0F2A4A' : g.border,
            weight: isSelected ? 3.5 : 2,
            opacity: isSelected ? 1 : 0.85,
            fillColor: isSelected ? '#F0B429' : g.fill,
            fillOpacity: isSelected ? 0.70 : g.opacity,
            dashArray: isSelected ? null : (count === 0 ? '4, 4' : null)
          };
        }

        return {
          color: isSelected ? '#0F2A4A' : '#1E3A8A',
          weight: isSelected ? 3 : 1.5,
          opacity: isSelected ? 1 : 0.7,
          fillColor: isSelected ? '#3B82F6' : '#0F2A4A',
          fillOpacity: isSelected ? 0.08 : 0.02,
          dashArray: isSelected ? null : '4, 4'
        };
      },
      onEachFeature: (feature, layer) => {
        const rawNama = feature.properties?.nama || '';
        // Konversi ke Title Case: BARABAI -> Barabai
        const titleNama = rawNama
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        kecFeaturesMapRef.current.set(rawNama.toLowerCase(), layer);
        kecFeaturesMapRef.current.set(titleNama.toLowerCase(), layer);

        const stat = kecStatsMap.get(rawNama.toLowerCase());
        const count = stat ? stat.total : 0;
        const g = getGradasiColor(count, gradasiPalette);

        // Tooltip Kecamatan Interaktif
        layer.bindTooltip(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; padding: 4px; min-width: 160px;">
            <div style="font-weight: 800; color: #0F2A4A; font-size: 12px;">Kecamatan ${titleNama}</div>
            ${useGradasi ? `
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background-color: ${g.fill}; border: 1.5px solid ${g.border};"></span>
                <span style="font-size: 10.5px; font-weight: 800; color: ${g.textColor};">${g.label}</span>
              </div>
            ` : ''}
            <div style="font-size: 9.5px; color: #475569; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #CBD5E1;">
              🚨 Penindakan: <b>${stat?.penindakanCount || 0}</b> &bull; ⚖️ Pelanggaran: <b>${stat?.pelanggaranCount || 0}</b>
            </div>
            <div style="font-size: 9px; color: #0284C7; font-weight: 700; margin-top: 2px;">Klik untuk zoom & filter kecamatan</div>
          </div>
        `, {
          sticky: true,
          direction: 'center',
          className: 'custom-leaflet-tooltip'
        });

        // Hover Effect
        layer.on({
          mouseover: (e) => {
            const l = e.target;
            const isSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === titleNama.toLowerCase();
            if (!isSelected) {
              l.setStyle({
                weight: 3,
                fillOpacity: useGradasi ? Math.min(g.opacity + 0.2, 0.85) : 0.25,
                color: '#0F2A4A'
              });
            }
          },
          mouseout: (e) => {
            const l = e.target;
            const isSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === titleNama.toLowerCase();
            if (!isSelected) {
              kecGeoJsonLayer.resetStyle(l);
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedKecamatan(titleNama);
            setSelectedDesa('semua');
            if (mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 14 });
            }
          }
        });
      }
    });

    kecamatanLayerRef.current.addLayer(kecGeoJsonLayer);
  }, [geoKecamatanData, selectedKecamatan, showKecamatanBorders, useGradasi, gradasiPalette, kecStatsMap]);

  // =========================================================================
  // 8. RENDER LAYER BATAS 169 DESA DARI desa_hst.geojson DENGAN GRADASI
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !desaLayerRef.current || !geoDesaData) return;

    desaLayerRef.current.clearLayers();
    desaFeaturesMapRef.current.clear();

    if (!showDesaBorders) return;

    const desaGeoJsonLayer = L.geoJSON(geoDesaData, {
      style: (feature) => {
        const props = feature.properties || {};
        const namaDesa = (props.NAMOBJ || '').toLowerCase();
        const namaKec = (props.WADMKC || '').toLowerCase();

        const isDesaSelected = selectedDesa !== 'semua' && selectedDesa.toLowerCase() === namaDesa;
        const isKecSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === namaKec;

        const fullKey = `${namaKec}_${namaDesa}`;
        const dStat = desaStatsMap.get(fullKey) || desaStatsMap.get(namaDesa);
        const count = dStat ? dStat.total : 0;

        if (isDesaSelected) {
          // Sorot penuh untuk Desa yang dipilih
          return {
            color: '#0F2A4A',
            weight: 3.5,
            opacity: 1,
            fillColor: '#F0B429',
            fillOpacity: 0.70
          };
        }

        if (useGradasi) {
          const g = getGradasiColor(count, gradasiPalette);

          if (count > 0) {
            // Desa yang ada kejadian: warna gradasi kontras
            return {
              color: isKecSelected ? '#0F2A4A' : g.border,
              weight: isKecSelected ? 2.5 : 1.5,
              opacity: isKecSelected ? 1 : 0.85,
              fillColor: g.fill,
              fillOpacity: Math.min(g.opacity + 0.1, 0.80),
              dashArray: null
            };
          }

          // Desa tanpa kejadian (0)
          if (isKecSelected) {
            return {
              color: '#3B82F6',
              weight: 1.5,
              opacity: 0.7,
              fillColor: '#93C5FD',
              fillOpacity: 0.15,
              dashArray: '2, 3'
            };
          }

          return {
            color: '#94A3B8',
            weight: 0.8,
            opacity: 0.5,
            fillColor: '#F1F5F9',
            fillOpacity: 0.08,
            dashArray: '2, 2'
          };
        }

        if (isKecSelected) {
          // Desa-desa di dalam kecamatan yang dipilih
          return {
            color: '#2563EB',
            weight: 1.5,
            opacity: 0.8,
            fillColor: '#3B82F6',
            fillOpacity: 0.12,
            dashArray: '2, 3'
          };
        }

        // Tampilan default desa seluruh HST
        return {
          color: '#94A3B8',
          weight: 0.8,
          opacity: 0.5,
          fillColor: '#64748B',
          fillOpacity: 0.03,
          dashArray: '2, 2'
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const namaDesa = props.NAMOBJ || 'Desa';
        const namaKec = props.WADMKC || 'HST';
        const luasHa = Math.round((props.SHAPE_Area || 0) / 10000);

        const key = `${namaKec.toLowerCase()}_${namaDesa.toLowerCase()}`;
        desaFeaturesMapRef.current.set(key, layer);
        desaFeaturesMapRef.current.set(namaDesa.toLowerCase(), layer);

        const dStat = desaStatsMap.get(key) || desaStatsMap.get(namaDesa.toLowerCase());
        const dCount = dStat ? dStat.total : 0;
        const dGradasi = getGradasiColor(dCount, gradasiPalette);

        // Tooltip informatif saat hover
        layer.bindTooltip(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; padding: 4px; min-width: 150px;">
            <div style="font-weight: 800; color: #0F2A4A; font-size: 11.5px;">Desa/Kel. ${namaDesa}</div>
            <div style="font-size: 10px; color: #475569;">Kec. ${namaKec} &bull; Luas: ${luasHa.toLocaleString('id-ID')} Ha</div>
            ${useGradasi ? `
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px;">
                <span style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background-color: ${dGradasi.fill}; border: 1px solid ${dGradasi.border};"></span>
                <span style="font-size: 10px; font-weight: 800; color: ${dGradasi.textColor};">
                  ${dCount > 0 ? `${dCount} Kejadian (${dGradasi.tier.toUpperCase()})` : 'Situasi Aman'}
                </span>
              </div>
            ` : ''}
            <div style="font-size: 9px; color: #0284C7; font-weight: 600; margin-top: 3px;">Klik untuk fokus wilayah desa</div>
          </div>
        `, {
          sticky: true,
          direction: 'top',
          className: 'custom-desa-tooltip'
        });

        // Hover Effect
        layer.on({
          mouseover: (e) => {
            const l = e.target;
            const isSelected = selectedDesa !== 'semua' && selectedDesa.toLowerCase() === namaDesa.toLowerCase();
            if (!isSelected) {
              l.setStyle({
                weight: 2.5,
                fillOpacity: useGradasi ? Math.min(dGradasi.opacity + 0.25, 0.9) : 0.25,
                color: '#0F2A4A'
              });
            }
          },
          mouseout: (e) => {
            const l = e.target;
            const isSelected = selectedDesa !== 'semua' && selectedDesa.toLowerCase() === namaDesa.toLowerCase();
            if (!isSelected) {
              desaGeoJsonLayer.resetStyle(l);
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedKecamatan(namaKec);
            setSelectedDesa(namaDesa);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 15 });
            }
          }
        });
      }
    });

    desaLayerRef.current.addLayer(desaGeoJsonLayer);
  }, [geoDesaData, selectedKecamatan, selectedDesa, showDesaBorders, useGradasi, gradasiPalette, desaStatsMap]);

  // =========================================================================
  // 9. UPDATE MARKERS TITIK PENINDAKAN & PELANGGARAN
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (!showMarkers) return;

    filteredPoints.forEach((item) => {
      // Tentukan warna & ikon marker berdasarkan tipe & tindakan
      let colorHex = '#D97706'; // Amber default
      let iconEmoji = '📍';

      if (item.sourceType === 'penindakan') {
        const t = (item.tindakLanjut || '').toLowerCase();
        if (t.includes('penertiban')) {
          colorHex = '#DC2626'; // Merah penertiban
          iconEmoji = '🚨';
        } else if (t.includes('pengawasan')) {
          colorHex = '#0284C7'; // Biru pengawasan
          iconEmoji = '👁️';
        } else if (t.includes('pengamanan')) {
          colorHex = '#D97706'; // Amber pengamanan
          iconEmoji = '🛡️';
        } else {
          colorHex = '#EA580C'; // Oranye peneguran
          iconEmoji = '⚠️';
        }
      } else {
        // Berkas Pelanggaran Perda
        const s = (item.status || '').toLowerCase();
        if (s.includes('sp3') || s.includes('eksekusi')) {
          colorHex = '#991B1B'; // Merah tua
          iconEmoji = '⚖️';
        } else if (s.includes('selesai')) {
          colorHex = '#059669'; // Hijau
          iconEmoji = '✅';
        } else {
          colorHex = '#D97706'; // Kuning SP1/SP2
          iconEmoji = '⚖️';
        }
      }

      // Marker kustom HTML Pin
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${colorHex};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); color: white; font-size: 12px; font-weight: bold;">${iconEmoji}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      // Isi Popup Informatif
      const isPenindakan = item.sourceType === 'penindakan';
      const personilBadges = (item.personil || [])
        .map(p => `<span style="background: #EEF2F6; color: #1E293B; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block; margin-right: 3px; margin-bottom: 2px;">${p}</span>`)
        .join('');

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; width: 250px; line-height: 1.4; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${isPenindakan ? '#FEF2F2; color: #DC2626; border: 1px solid #FECACA;' : '#EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;'}">
              ${isPenindakan ? '🚨 Penindakan Trantibum' : '⚖️ Pelanggaran Perda'}
            </span>
            <span style="font-size: 10px; color: #64748B; font-weight: 600;">${item.tanggal}</span>
          </div>

          <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin-bottom: 2px;">${item.title}</div>
          
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 8px; margin: 6px 0; font-size: 11px;">
            <div style="color: #0F2A4A; font-weight: 700;">📍 Kec. ${item.kecamatan}${item.desa ? ', Desa ' + item.desa : ''}</div>
            <div style="color: #475569; font-size: 10.5px; margin-top: 2px;">${item.lokasi || '-'}</div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 6px;">
            <span style="color: #64748B;">Tindakan / Status:</span>
            <span style="font-weight: 700; color: ${colorHex};">${item.tindakLanjut} (${item.status})</span>
          </div>

          ${item.personil && item.personil.length > 0 ? `
            <div style="margin-bottom: 6px;">
              <div style="font-size: 10px; color: #64748B; font-weight: 700; margin-bottom: 2px;">Petugas Penangan:</div>
              <div>${personilBadges}</div>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #64748B; font-family: monospace;">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
            <a 
              href="https://www.google.com/maps?q=${item.lat},${item.lng}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="color: #2563EB; font-size: 10.5px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 2px;"
            >
              Buka Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current.addLayer(marker);
    });
  }, [filteredPoints, showMarkers]);

  // =========================================================================
  // 10. HANDLERS NAVIGASI & ZOOMING PETA
  // =========================================================================

  // Handle Pilih Kecamatan
  const handleSelectKecamatan = (kecNama) => {
    setSelectedKecamatan(kecNama);
    setSelectedDesa('semua');

    if (!mapInstanceRef.current) return;

    if (kecNama === 'semua') {
      mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15], duration: 1 });
      return;
    }

    // Cek apakah ada layer polygon batas kecamatan
    const targetLayer = kecFeaturesMapRef.current.get(kecNama.toLowerCase());
    if (targetLayer) {
      mapInstanceRef.current.fitBounds(targetLayer.getBounds(), { padding: [30, 30], maxZoom: 14, duration: 1.2 });
    } else {
      // Fallback ke koordinat pusat kecamatan
      const selectedKecObj = wilayahList.find(k => k.nama.toLowerCase() === kecNama.toLowerCase());
      if (selectedKecObj && selectedKecObj.lat && selectedKecObj.lng) {
        mapInstanceRef.current.flyTo([selectedKecObj.lat, selectedKecObj.lng], 13, { duration: 1.2 });
      }
    }
  };

  // Handle Pilih Desa
  const handleSelectDesa = (desaNama) => {
    setSelectedDesa(desaNama);

    if (!mapInstanceRef.current) return;

    if (desaNama === 'semua') {
      // Jika membatalkan desa, kembali fokus ke kecamatan terpilih atau seluruh HST
      if (selectedKecamatan !== 'semua') {
        const kecLayer = kecFeaturesMapRef.current.get(selectedKecamatan.toLowerCase());
        if (kecLayer) {
          mapInstanceRef.current.fitBounds(kecLayer.getBounds(), { padding: [30, 30], maxZoom: 14, duration: 1 });
        }
      } else {
        mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15], duration: 1 });
      }
      return;
    }

    // Cari layer polygon desa yang sesuai
    let targetKey = `${selectedKecamatan.toLowerCase()}_${desaNama.toLowerCase()}`;
    let desaLayer = desaFeaturesMapRef.current.get(targetKey) || desaFeaturesMapRef.current.get(desaNama.toLowerCase());

    if (desaLayer) {
      mapInstanceRef.current.fitBounds(desaLayer.getBounds(), { padding: [40, 40], maxZoom: 15, duration: 1.2 });
      
      // Jika kecamatan belum terpilih, sinkronkan otomatis
      if (selectedKecamatan === 'semua' && desaLayer.feature?.properties?.WADMKC) {
        setSelectedKecamatan(desaLayer.feature.properties.WADMKC);
      }
    }
  };

  // Fokus Penuh Seluruh Kabupaten HST
  const handleFocusHST = () => {
    setSelectedKecamatan('semua');
    setSelectedDesa('semua');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15], duration: 1.2 });
    }
  };

  // Fokus Ibukota Barabai
  const handleFocusBarabai = () => {
    handleSelectKecamatan('Barabai');
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE AREA INSIGHT BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#1E3A8A] text-white p-5 rounded-2xl shadow-md border border-slate-700/50 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Trophy className="w-48 h-48 text-[#F0B429]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F0B429] text-[#0F2A4A] flex items-center gap-1.5 shadow-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  ANALISIS SPASIAL KABUPATEN HULU SUNGAI TENGAH
                </span>
                <span className="text-xs text-slate-300 font-medium">11 Kecamatan &bull; 169 Desa/Kelurahan</span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
                <span>Area Pelanggaran & Penindakan Terbanyak:</span>
                <span className="text-[#F0B429] underline decoration-[#F0B429]/40 underline-offset-4">
                  Kecamatan {topArea.nama}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Peta terintegrasi dengan data spasial poligon resmi <b>Kabupaten Hulu Sungai Tengah</b>. Memungkinkan pimpinan dan petugas penegak Perda melakukan seleksi presisi hingga level <b>Desa / Kelurahan</b> untuk menentukan penempatan patroli trantibum.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleFocusHST}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                title="Fokuskan kembali peta ke seluruh wilayah Kabupaten HST"
              >
                <Compass className="w-4 h-4 text-[#F0B429]" />
                <span>Seluruh HST</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectKecamatan(topArea.nama)}
                className="px-4 py-2.5 bg-[#F0B429] hover:bg-[#d99f1f] text-[#0F2A4A] text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Fokus Prioritas ({topArea.nama})</span>
              </button>
            </div>
          </div>

          {/* 4 Mini KPI Indicator Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center font-bold text-base shrink-0">
                🚨
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Penindakan Trantibum</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalPenindakan} Titik Lapangan</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-[#F0B429] flex items-center justify-center font-bold text-base shrink-0">
                ⚖️
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Pelanggaran Perda</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalPelanggaran} Kasus BAP</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-base shrink-0">
                🏘️
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Batas Wilayah Desa</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">169 Desa / Kel.</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base shrink-0">
                🗺️
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Total Titik Terpetakan</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalPointsCount} Koordinat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP CONTROLLER: HIERARCHICAL SELECTOR & FILTER BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Source Selector + Layer Toggles */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Source Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedSource('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSource === 'semua'
                  ? 'bg-white text-[#0F2A4A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Titik ({allMapPoints.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('penindakan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === 'penindakan'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚨 Penindakan ({totalPenindakan})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('pelanggaran')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === 'pelanggaran'
                  ? 'bg-[#0F2A4A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚖️ Pelanggaran Perda ({totalPelanggaran})</span>
            </button>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Layer Poligon:</span>
            
            <button
              type="button"
              onClick={() => setShowKecamatanBorders(!showKecamatanBorders)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showKecamatanBorders
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showKecamatanBorders ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
              <span>Kecamatan (11)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDesaBorders(!showDesaBorders)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showDesaBorders
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showDesaBorders ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
              <span>Desa (169)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMarkers(!showMarkers)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showMarkers
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showMarkers ? 'bg-red-600' : 'bg-slate-300'}`}></span>
              <span>Titik Kejadian</span>
            </button>

            {/* SEPARATOR */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1"></div>

            {/* TOGGLE GRADASI WARNA SPASIAL */}
            <button
              type="button"
              onClick={() => setUseGradasi(!useGradasi)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                useGradasi
                  ? 'bg-gradient-to-r from-emerald-50 via-amber-50 to-rose-50 text-[#0F2A4A] border-amber-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
              title="Aktifkan pewarnaan poligon menggunakan gradasi kepadatan kejadian (Choropleth)"
            >
              <Palette className={`w-3.5 h-3.5 ${useGradasi ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Gradasi Spasial: <b>{useGradasi ? 'Aktif' : 'Mati'}</b></span>
            </button>

            {/* PILIHAN PALET WARNA GRADASI */}
            {useGradasi && (
              <select
                value={gradasiPalette}
                onChange={(e) => setGradasiPalette(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-300 bg-white text-slate-700 outline-hidden cursor-pointer"
                title="Pilih tema palet gradasi warna"
              >
                <option value="trantibum">Palet: Trantibum (Hijau ➜ Merah)</option>
                <option value="spektrum_satpol">Palet: Spektrum (Biru ➜ Emas)</option>
              </select>
            )}
          </div>
        </div>

        {/* Row 2: Dual Hierarchical Dropdowns (Kecamatan & Desa) + Tindakan Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* SELECTOR 1: KECAMATAN */}
          <div>
            <label className="block text-[11px] font-bold text-[#0F2A4A] mb-1">
              📍 1. Pilih Kecamatan (HST):
            </label>
            <select
              value={selectedKecamatan}
              onChange={(e) => handleSelectKecamatan(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
            >
              <option value="semua">Semua Kecamatan (11 HST)</option>
              {areaRanking.map(k => (
                <option key={k.id} value={k.nama}>
                  Kec. {k.nama} ({k.total} Titik {k.nama === topArea.nama ? '— Terbanyak #1' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR 2: DESA / KELURAHAN */}
          <div>
            <label className="block text-[11px] font-bold text-[#0F2A4A] mb-1 flex items-center justify-between">
              <span>🏘️ 2. Pilih Desa / Kelurahan:</span>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">
                {availableDesaList.length} Wilayah
              </span>
            </label>
            <select
              value={selectedDesa}
              onChange={(e) => handleSelectDesa(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50/30 text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
            >
              <option value="semua">
                {selectedKecamatan === 'semua' ? 'Semua Desa (169 Desa HST)' : `Semua Desa di Kec. ${selectedKecamatan}`}
              </option>
              {availableDesaList.map(d => (
                <option key={d.nama} value={d.nama}>
                  Desa/Kel. {d.nama} ({d.areaHa} Ha{selectedKecamatan === 'semua' ? ` - Kec. ${d.kecamatan}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR 3: JENIS TINDAKAN */}
          <div>
            <label className="block text-[11px] font-bold text-[#0F2A4A] mb-1">
              🛡️ 3. Jenis Tindakan:
            </label>
            <select
              value={selectedTindakan}
              onChange={(e) => setSelectedTindakan(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
            >
              <option value="semua">Semua Jenis Tindakan</option>
              <option value="Penertiban">Penertiban Lapangan</option>
              <option value="Pengawasan">Pengawasan Perizinan</option>
              <option value="Pengamanan">Pengamanan Wilayah</option>
              <option value="Peneguran">Peneguran / Klarifikasi</option>
            </select>
          </div>

          {/* SEARCH BOX & RESET */}
          <div>
            <label className="block text-[11px] font-bold text-[#0F2A4A] mb-1">
              🔍 4. Cari Lokasi / Pelanggar:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari desa, jalan, pasar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-4 h-4 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Filter Summary Badge / Clearer */}
        {(selectedKecamatan !== 'semua' || selectedDesa !== 'semua' || selectedTindakan !== 'semua' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Filter Aktif:</span>
            {selectedKecamatan !== 'semua' && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#0F2A4A] font-bold text-[11px] flex items-center gap-1">
                <span>Kec. {selectedKecamatan}</span>
                <button 
                  type="button" 
                  onClick={() => handleSelectKecamatan('semua')}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDesa !== 'semua' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 border border-amber-300">
                <span>Desa {selectedDesa}</span>
                <button 
                  type="button" 
                  onClick={() => handleSelectDesa('semua')}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTindakan !== 'semua' && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <span>Tindakan: {selectedTindakan}</span>
                <button 
                  type="button" 
                  onClick={() => setSelectedTindakan('semua')}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <span>Kata Kunci: "{searchQuery}"</span>
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleFocusHST}
              className="text-[11px] text-red-600 hover:text-red-800 font-bold underline ml-auto cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAP CONTAINER & SIDEBAR AREA RANKING */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Map Box */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative min-h-[540px]">
          {/* Loading Indicator */}
          {isLoadingGeo && (
            <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#0F2A4A] animate-spin" />
              <span className="text-xs font-bold text-[#0F2A4A]">Memuat Poligon Batas Hulu Sungai Tengah (169 Desa)...</span>
            </div>
          )}

          {/* Leaflet Map Target */}
          <div ref={mapContainerRef} className="w-full h-[600px]" />
          
          {/* Floating Map Legend Overlay */}
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2.5 max-w-[270px]">
            {/* GRADASI KEPADATAN SPASIAL SECTION */}
            {useGradasi && (
              <div className="space-y-1.5 pb-2 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F2A4A] flex items-center gap-1">
                    <Palette className="w-3 h-3 text-amber-600" />
                    <span>Gradasi Kepadatan Wilayah</span>
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-500 capitalize">
                    {gradasiPalette === 'trantibum' ? 'Trantibum' : 'Spektrum'}
                  </span>
                </div>

                {/* Color Ramp Bar */}
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  <div className="text-center">
                    <div 
                      className="h-3 rounded-xs border border-slate-300" 
                      style={{ backgroundColor: getGradasiColor(0, gradasiPalette).fill }}
                    />
                    <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5">0</span>
                    <span className="text-[7.5px] text-slate-400 block leading-none">Aman</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-3 rounded-xs border border-slate-300" 
                      style={{ backgroundColor: getGradasiColor(2, gradasiPalette).fill }}
                    />
                    <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5">1-2</span>
                    <span className="text-[7.5px] text-slate-400 block leading-none">Rendah</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-3 rounded-xs border border-slate-300" 
                      style={{ backgroundColor: getGradasiColor(4, gradasiPalette).fill }}
                    />
                    <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5">3-5</span>
                    <span className="text-[7.5px] text-slate-400 block leading-none">Sedang</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-3 rounded-xs border border-slate-300" 
                      style={{ backgroundColor: getGradasiColor(8, gradasiPalette).fill }}
                    />
                    <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5">6-9</span>
                    <span className="text-[7.5px] text-slate-400 block leading-none">Tinggi</span>
                  </div>
                  <div className="text-center">
                    <div 
                      className="h-3 rounded-xs border border-slate-300" 
                      style={{ backgroundColor: getGradasiColor(10, gradasiPalette).fill }}
                    />
                    <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5">10+</span>
                    <span className="text-[7.5px] text-rose-600 font-bold block leading-none">Prioritas</span>
                  </div>
                </div>
              </div>
            )}

            {/* LEGENDA TITIK KEJADIAN */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Simbol Pin Lapangan
              </span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
                  <span className="font-semibold text-slate-700">Penertiban</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0"></span>
                  <span className="font-semibold text-slate-700">Pengawasan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="font-semibold text-slate-700">Pengamanan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-700 shrink-0"></span>
                  <span className="font-semibold text-slate-700">BAP Perda</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 text-[9.5px] text-slate-500 leading-tight">
              💡 <i>Klik poligon batas desa/kecamatan untuk fokus wilayah.</i>
            </div>
          </div>

          {/* Floating Map Controls (Reset HST, Barabai, Zoom) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleFocusHST}
              className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F2A4A] text-xs font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Kembalikan zoom ke seluruh Kabupaten Hulu Sungai Tengah"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Seluruh HST</span>
            </button>
            <button
              type="button"
              onClick={handleFocusBarabai}
              className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F2A4A] text-xs font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Fokus ke Pusat Ibukota Barabai"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Pusat Barabai</span>
            </button>
          </div>

          {/* Floating Active Points Counter */}
          <div className="absolute bottom-4 left-4 z-20 bg-[#0F2A4A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-[#F0B429]" />
            <span>
              {filteredPoints.length} Titik Ditampilkan
              {selectedDesa !== 'semua' ? ` di Desa ${selectedDesa}` : selectedKecamatan !== 'semua' ? ` di Kec. ${selectedKecamatan}` : ' di Kab. HST'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SIDEBAR: AREA RANKING & DAFTAR TITIK PENINDAKAN */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            {/* Selected Desa Spotlight Card (jika sedang memilih desa tertentu) */}
            {selectedDesaInfo && (
              <div className="mb-3 p-3.5 bg-amber-50/80 border-2 border-[#F0B429] rounded-xl text-xs space-y-2 relative shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#F0B429] text-[#0F2A4A] uppercase tracking-wider">
                    Desa / Kelurahan Terpilih
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectDesa('semua')}
                    className="text-slate-500 hover:text-red-600 cursor-pointer"
                    title="Batal pilih desa"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-[#0F2A4A] text-sm">
                    Desa/Kel. {selectedDesaInfo.nama}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Kecamatan {selectedDesaInfo.kecamatan} &bull; Luas: <b>{selectedDesaInfo.luasHa} Ha</b>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/80">
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-slate-500 block">Penindakan:</span>
                    <span className="font-bold text-red-600 font-mono text-xs">
                      {selectedDesaInfo.penindakanCount} Kegiatan
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-slate-500 block">Pelanggaran Perda:</span>
                    <span className="font-bold text-amber-700 font-mono text-xs">
                      {selectedDesaInfo.pelanggaranCount} Berkas
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectDesa(selectedDesaInfo.nama)}
                  className="w-full mt-1 py-1.5 bg-[#0F2A4A] hover:bg-[#163e6e] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Fokus Poligon Desa di Peta</span>
                </button>
              </div>
            )}

            {/* Sidebar Tab Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('ranking')}
                  className={`text-xs font-bold pb-1 flex items-center gap-1 transition-colors cursor-pointer ${
                    activeSideTab === 'ranking'
                      ? 'text-[#0F2A4A] border-b-2 border-[#0F2A4A]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Kecamatan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('desa_rawan')}
                  className={`text-xs font-bold pb-1 flex items-center gap-1 transition-colors cursor-pointer ${
                    activeSideTab === 'desa_rawan'
                      ? 'text-[#0F2A4A] border-b-2 border-[#0F2A4A]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>Desa Rawan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('titik')}
                  className={`text-xs font-bold pb-1 flex items-center gap-1 transition-colors cursor-pointer ${
                    activeSideTab === 'titik'
                      ? 'text-[#0F2A4A] border-b-2 border-[#0F2A4A]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Titik ({filteredPoints.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PERINGKAT KECAMATAN */}
            {activeSideTab === 'ranking' && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Klik nama kecamatan untuk memfokuskan poligon batas wilayah:
                </p>

                {areaRanking.map((kec, idx) => {
                  const isTopOne = idx === 0 && kec.total > 0;
                  const isTopTwo = idx === 1 && kec.total > 0;
                  const isTopThree = idx === 2 && kec.total > 0;
                  const isSelected = selectedKecamatan.toLowerCase() === kec.nama.toLowerCase();
                  const gKec = getGradasiColor(kec.total, gradasiPalette);

                  return (
                    <div
                      key={kec.id}
                      onClick={() => handleSelectKecamatan(kec.nama)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#0F2A4A] bg-amber-50/70 shadow-xs ring-1 ring-[#0F2A4A]' 
                          : isTopOne 
                            ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400' 
                            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                            isTopOne ? 'bg-[#F0B429] text-[#0F2A4A]' :
                            isTopTwo ? 'bg-slate-300 text-slate-800' :
                            isTopThree ? 'bg-amber-700 text-white' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-[#0F2A4A] text-xs">
                            Kec. {kec.nama}
                          </span>
                          {useGradasi && (
                            <span 
                              className="px-1.5 py-0.2 rounded text-[9px] font-extrabold border"
                              style={{ 
                                backgroundColor: gKec.fill, 
                                borderColor: gKec.border, 
                                color: gKec.textColor 
                              }}
                            >
                              {gKec.tier.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-extrabold text-[#0F2A4A] text-xs">
                            {kec.total} Titik
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            {kec.percentage}% dari total
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Konsentrasi Kejadian */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, Math.max(5, kec.percentage))}%`,
                            backgroundColor: useGradasi ? gKec.border : (isTopOne ? '#DC2626' : '#0F2A4A')
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 mt-1 border-t border-slate-200/60 font-medium">
                        <span>Penindakan: <b>{kec.penindakanCount}</b> | Perkara: <b>{kec.pelanggaranCount}</b></span>
                        <span className="text-slate-600">Desa Rawan: <b>{kec.topDesa}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TOP DESA RAWAN */}
            {activeSideTab === 'desa_rawan' && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  10 Desa/Kelurahan dengan frekuensi pelanggaran & penindakan terbanyak:
                </p>

                {topDesaRanking.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Belum ada data desa tercatat
                  </div>
                ) : (
                  topDesaRanking.map((d, idx) => {
                    const isSelected = selectedDesa.toLowerCase() === d.desa.toLowerCase();
                    const gDesa = getGradasiColor(d.total, gradasiPalette);

                    return (
                      <div
                        key={`${d.desa}-${d.kecamatan}`}
                        onClick={() => {
                          setSelectedKecamatan(d.kecamatan);
                          handleSelectDesa(d.desa);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50 shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border"
                              style={{ 
                                backgroundColor: gDesa.fill, 
                                borderColor: gDesa.border, 
                                color: gDesa.textColor 
                              }}
                            >
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-[#0F2A4A] text-xs">
                                  Desa/Kel. {d.desa}
                                </p>
                                {useGradasi && (
                                  <span 
                                    className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold border"
                                    style={{ 
                                      backgroundColor: gDesa.fill, 
                                      borderColor: gDesa.border, 
                                      color: gDesa.textColor 
                                    }}
                                  >
                                    {gDesa.tier.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Kec. {d.kecamatan}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-extrabold text-red-600 text-xs block">
                              {d.total} Kejadian
                            </span>
                            <span className="text-[9.5px] text-slate-400">
                              🚨 {d.penindakan} | ⚖️ {d.pelanggaran}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: DAFTAR TITIK KEJADIAN */}
            {activeSideTab === 'titik' && (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredPoints.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="font-bold text-xs">Tidak ada titik yang sesuai filter</p>
                  </div>
                ) : (
                  filteredPoints.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([item.lat, item.lng], 15, { duration: 1 });
                        }
                        if (item.sourceType === 'pelanggaran' && onSelectPelanggaran) {
                          onSelectPelanggaran(item.raw);
                        }
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#0F2A4A] bg-slate-50/70 hover:bg-amber-50/50 cursor-pointer transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.sourceType === 'penindakan'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {item.sourceType === 'penindakan' ? `🚨 ${item.tindakLanjut}` : `⚖️ ${item.status}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.tanggal}</span>
                      </div>

                      <p className="font-bold text-[#0F2A4A] line-clamp-1">{item.title}</p>
                      <p className="text-slate-600 text-[11px] font-medium line-clamp-1">{item.lokasi || '-'}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                        <span>Kec. {item.kecamatan}{item.desa ? `, Desa ${item.desa}` : ''}</span>
                        <span className="font-mono">{item.lat.toFixed(3)}, {item.lng.toFixed(3)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Card PostGIS & GeoJSON Info */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 mt-2">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Info className="w-3.5 h-3.5 text-blue-700" />
              <span>Peta Vektor Spasial Hulu Sungai Tengah</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Memuat data spasial resmi <b>11 Kecamatan</b> & <b>169 Desa/Kelurahan</b> Kab. Hulu Sungai Tengah. Klik batas desa pada peta untuk langsung mengisolasi statistik pelanggaran wilayah bersangkutan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
