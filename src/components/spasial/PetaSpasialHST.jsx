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
  Radio,
  Car,
  ShieldCheck,
  Phone,
  Shield,
  Clock,
  FileText
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';
import { getWilayahList } from '../../data/storageService';

// ==============================================================================
// SKALA WARNA WILAYAH BERDASARKAN JUMLAH POSKAMLING, PATROLI & SATLINMAS
// Semakin banyak pos kamling, patroli, dan linmasnya, maka warna wilayah semakin pekat
// ==============================================================================
export const SKALA_SEBARAN_TIERS = [
  { min: 0, max: 0, label: '0 Data (Belum Ada Data)' },
  { min: 1, max: 2, label: '1 - 2 Data' },
  { min: 3, max: 5, label: '3 - 5 Data' },
  { min: 6, max: 9, label: '6 - 9 Data' },
  { min: 10, max: Infinity, label: '10+ Data (Banyak & Lengkap)' }
];

export const getWarnaAktivitasWilayah = (count) => {
  if (!count || count <= 0) {
    return {
      fill: '#F8FAFC',
      border: '#94A3B8',
      opacity: 0.18,
      label: '0 Data',
      textColor: '#64748B',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
    };
  }

  if (count <= 2) {
    return {
      fill: '#D1FAE5',
      border: '#10B981',
      opacity: 0.40,
      label: `${count} Data`,
      textColor: '#065F46',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    };
  }
  if (count <= 5) {
    return {
      fill: '#6EE7B7',
      border: '#059669',
      opacity: 0.55,
      label: `${count} Data`,
      textColor: '#064E3B',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    };
  }
  if (count <= 9) {
    return {
      fill: '#10B981',
      border: '#047857',
      opacity: 0.70,
      label: `${count} Data`,
      textColor: '#022C22',
      badgeClass: 'bg-emerald-200 text-emerald-950 border-emerald-400 font-semibold'
    };
  }
  return {
    fill: '#047857',
    border: '#064E3B',
    opacity: 0.85,
    label: `${count} Data (Lengkap & Aktif)`,
    textColor: '#FFFFFF',
    badgeClass: 'bg-emerald-700 text-white border-emerald-900 font-bold'
  };
};

export const getGradasiColor = getWarnaAktivitasWilayah;
export const GRADASI_TIERS = SKALA_SEBARAN_TIERS;

// Koordinat Bounding Box Kabupaten Hulu Sungai Tengah
const HST_BOUNDS = [
  [-2.782556, 115.154723], // South-West
  [-2.452358, 115.821807]  // North-East
];
const HST_CENTER = [-2.6175, 115.4883];
const BARABAI_CENTER = [-2.5833, 115.3811];

export default function PetaSpasialHST({ 
  satlinmasList = [],
  poskamlingList = [],
  kegiatanPatroliList = [],
  pelanggaranList = [], 
  rekapTrantibumList = [], 
  wilayahList: propWilayahList,
  assignedKecamatan = null,
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
  const markersMapRef = useRef(new Map());

  // GeoJSON Data State
  const [geoKecamatanData, setGeoKecamatanData] = useState(null);
  const [geoDesaData, setGeoDesaData] = useState(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Filter States: 'semua' | 'poskamling' | 'patroli' | 'satlinmas' | 'penindakan'
  const [selectedSource, setSelectedSource] = useState('semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState(assignedKecamatan || 'semua');
  const [selectedDesa, setSelectedDesa] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSideTab, setActiveSideTab] = useState('ranking'); // 'ranking' | 'poskamling' | 'patroli' | 'satlinmas'

  // Layer Visibility
  const [showKecamatanBorders, setShowKecamatanBorders] = useState(true);
  const [showDesaBorders, setShowDesaBorders] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showMobileLegend, setShowMobileLegend] = useState(false);

  // Master wilayah list
  const wilayahList = useMemo(() => propWilayahList || getWilayahList() || KECAMATAN_HST, [propWilayahList]);

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

  // Map centroids of desa from geoDesaData for fallback coordinates
  const desaCentroids = useMemo(() => {
    const map = new Map();
    if (!geoDesaData || !geoDesaData.features) return map;

    geoDesaData.features.forEach(f => {
      const dName = f.properties?.NAMOBJ;
      const kName = f.properties?.WADMKC;
      if (!dName) return;

      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      const processCoords = (coords) => {
        coords.forEach(pt => {
          if (Array.isArray(pt[0])) {
            processCoords(pt);
          } else {
            const lng = pt[0];
            const lat = pt[1];
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          }
        });
      };

      if (f.geometry && f.geometry.coordinates) {
        processCoords(f.geometry.coordinates);
        if (minLat < 90) {
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          map.set(dName.toLowerCase().trim(), { lat: centerLat, lng: centerLng });
          if (kName) {
            map.set(`${kName.toLowerCase().trim()}_${dName.toLowerCase().trim()}`, { lat: centerLat, lng: centerLng });
          }
        }
      }
    });

    return map;
  }, [geoDesaData]);

  // =========================================================================
  // 2. GABUNGKAN & STANDARISASI TITIK SPASIAL (POSKAMLING, PATROLI, SATLINMAS)
  // =========================================================================
  const allMapPoints = useMemo(() => {
    const points = [];

    // A. DATA POSKAMLING
    (poskamlingList || []).forEach((item, idx) => {
      let lat = Number(item.lat);
      let lng = Number(item.lng);

      // Fallback coordinates if missing
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const foundDesa = desaCentroids.get((item.desaKelurahan || item.desa || '').toLowerCase().trim());
        if (foundDesa) {
          lat = foundDesa.lat + (idx % 3) * 0.001;
          lng = foundDesa.lng + (idx % 3) * 0.001;
        } else {
          const foundKec = wilayahList.find(k => k.nama.toLowerCase() === (item.kecamatan || '').toLowerCase());
          if (foundKec) {
            lat = foundKec.lat + (idx % 3) * 0.002;
            lng = foundKec.lng + (idx % 3) * 0.002;
          } else {
            lat = BARABAI_CENTER[0];
            lng = BARABAI_CENTER[1];
          }
        }
      }

      points.push({
        id: `pos-${item.id || idx}`,
        originalId: item.id,
        sourceType: 'poskamling',
        sourceLabel: 'Poskamling / Pos Ronda',
        title: item.namaPoskamling || 'Pos Ronda Linmas',
        subtitle: `Ketua Pos: ${item.namaKetuaPos || '-'} (${item.kontakWa || '-'})`,
        kecamatan: item.kecamatan || 'Barabai',
        desa: item.desaKelurahan || item.desa || '',
        alamat: item.alamatLengkap || item.alamat || '',
        rt: item.rt || '-',
        rw: item.rw || '-',
        status: item.statusOperasional || 'Aktif Terjadwal',
        kondisi: item.kondisiFisik || 'Baik (Siap Pakai)',
        personilCount: item.personelRonda || 0,
        fasilitas: item.fasilitas || [],
        namaKetua: item.namaKetuaPos || '-',
        kontakWa: item.kontakWa || '-',
        catatan: item.catatanTambahan || '',
        lat,
        lng,
        raw: item
      });
    });

    // B. KEGIATAN DAN PATROLI LAPANGAN
    (kegiatanPatroliList || []).forEach((item, idx) => {
      let lat = Number(item.lat);
      let lng = Number(item.lng);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const foundDesa = desaCentroids.get((item.desaKelurahan || item.desa || '').toLowerCase().trim());
        if (foundDesa) {
          lat = foundDesa.lat - 0.0015;
          lng = foundDesa.lng + 0.0015;
        } else {
          const foundKec = wilayahList.find(k => k.nama.toLowerCase() === (item.kecamatan || '').toLowerCase());
          if (foundKec) {
            lat = foundKec.lat - 0.002;
            lng = foundKec.lng + 0.002;
          } else {
            lat = BARABAI_CENTER[0];
            lng = BARABAI_CENTER[1];
          }
        }
      }

      points.push({
        id: `ptr-${item.id || idx}`,
        originalId: item.id,
        sourceType: 'patroli',
        sourceLabel: 'Kegiatan dan Patroli Lapangan',
        title: item.judulPatroli || item.judul || 'Patroli Trantibum',
        subtitle: `Petugas: ${item.petugasPelapor || 'Satpol PP / Linmas'}`,
        jenisKegiatan: item.jenisKegiatan || 'Patroli Trantibum',
        status: item.statusSituasi || 'Aman & Kondusif',
        kecamatan: item.kecamatan || 'Barabai',
        desa: item.desaKelurahan || item.desa || '',
        lokasi: item.lokasiSpesifik || item.lokasi || '',
        petugasPelapor: item.petugasPelapor || '-',
        personilCount: item.jumlahPersonel || 0,
        waktu: item.waktuLapor || item.waktu || 'Terkini',
        hasil: item.hasilPatroli || '',
        tindakan: item.tindakanDiambil || '',
        lat,
        lng,
        raw: item
      });
    });

    // C. DATA ANGGOTA SATLINMAS
    (satlinmasList || []).forEach((item, idx) => {
      // Find village or kecamatan center
      const dKey = (item.desaKelurahan || '').toLowerCase().trim();
      const kKey = (item.kecamatan || '').toLowerCase().trim();
      const foundDesa = desaCentroids.get(`${kKey}_${dKey}`) || desaCentroids.get(dKey);
      
      let baseLat = BARABAI_CENTER[0];
      let baseLng = BARABAI_CENTER[1];

      if (foundDesa) {
        baseLat = foundDesa.lat;
        baseLng = foundDesa.lng;
      } else {
        const foundKec = wilayahList.find(k => k.nama.toLowerCase() === kKey);
        if (foundKec) {
          baseLat = foundKec.lat;
          baseLng = foundKec.lng;
        }
      }

      // Golden spiral subtle offset to avoid exact stacking
      const angle = (idx * 137.5 * Math.PI) / 180;
      const radius = 0.0018 * Math.sqrt((idx % 8) + 1);
      const lat = baseLat + radius * Math.cos(angle);
      const lng = baseLng + radius * Math.sin(angle);

      points.push({
        id: `slm-${item.id || idx}`,
        originalId: item.id,
        sourceType: 'satlinmas',
        sourceLabel: 'Data Anggota Satlinmas',
        title: item.nama || 'Anggota Satlinmas',
        subtitle: `No. Reg: ${item.noRegistrasi || '-'}`,
        noRegistrasi: item.noRegistrasi || '-',
        nik: item.nik || '-',
        kecamatan: item.kecamatan || 'Barabai',
        desa: item.desaKelurahan || '',
        alamat: item.alamat || '',
        status: item.status === 'aktif' ? 'Aktif Bertugas' : 'Tidak Aktif',
        noHp: item.noHp || '-',
        email: item.email || '-',
        pasFoto: item.pasFoto || '',
        dokumenSk: item.dokumenSk || null,
        tahunPengangkatan: item.tahunPengangkatan || '-',
        lat,
        lng,
        raw: item
      });
    });

    // D. REKAP PENINDAKAN TRANTIBUM & PERDA (SUPPLEMENTARY)
    (rekapTrantibumList || []).forEach((item, idx) => {
      if (item.lat && item.lng) {
        points.push({
          id: `trb-${item.id || idx}`,
          originalId: item.id,
          sourceType: 'penindakan',
          sourceLabel: 'Penindakan Trantibum',
          title: item.jenisPengaduan || 'Penindakan Lapangan',
          subtitle: `Tindak Lanjut: ${item.tindakLanjut || 'Penertiban'}`,
          kecamatan: item.kecamatan || 'Barabai',
          desa: item.desa || '',
          lokasi: item.lokasi || '',
          status: item.statusPengaduan || 'Terlayani',
          waktu: item.tanggal || '-',
          lat: Number(item.lat),
          lng: Number(item.lng),
          raw: item
        });
      }
    });

    return points;
  }, [poskamlingList, kegiatanPatroliList, satlinmasList, rekapTrantibumList, desaCentroids, wilayahList]);

  // Counts of each category
  const totalPoskamling = useMemo(() => allMapPoints.filter(p => p.sourceType === 'poskamling').length, [allMapPoints]);
  const totalPatroli = useMemo(() => allMapPoints.filter(p => p.sourceType === 'patroli').length, [allMapPoints]);
  const totalSatlinmas = useMemo(() => allMapPoints.filter(p => p.sourceType === 'satlinmas').length, [allMapPoints]);
  const totalPenindakan = useMemo(() => allMapPoints.filter(p => p.sourceType === 'penindakan').length, [allMapPoints]);

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
    const posCount = desaPoints.filter(p => p.sourceType === 'poskamling').length;
    const patCount = desaPoints.filter(p => p.sourceType === 'patroli').length;
    const linCount = desaPoints.filter(p => p.sourceType === 'satlinmas').length;

    return {
      nama: props.NAMOBJ,
      kecamatan: props.WADMKC,
      luasHa: Math.round((props.SHAPE_Area || 0) / 10000).toLocaleString('id-ID'),
      posCount,
      patCount,
      linCount,
      totalTitik: desaPoints.length
    };
  }, [selectedDesa, selectedKecamatan, geoDesaData, allMapPoints]);

  // =========================================================================
  // 4. ANALISIS STATISTIK SEBARAN PER KECAMATAN
  // =========================================================================
  const areaRanking = useMemo(() => {
    const sourcePoints = allMapPoints.filter(p => {
      if (selectedSource === 'semua') return true;
      return p.sourceType === selectedSource;
    });

    const totalAll = sourcePoints.length;

    const stats = wilayahList.map(kec => {
      const kecPoints = sourcePoints.filter(p => p.kecamatan.toLowerCase() === kec.nama.toLowerCase());
      const posCount = kecPoints.filter(p => p.sourceType === 'poskamling').length;
      const patCount = kecPoints.filter(p => p.sourceType === 'patroli').length;
      const linCount = kecPoints.filter(p => p.sourceType === 'satlinmas').length;
      const total = kecPoints.length;

      return {
        id: kec.id,
        nama: kec.nama,
        lat: kec.lat,
        lng: kec.lng,
        total,
        posCount,
        patCount,
        linCount,
        percentage: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);

    return stats;
  }, [allMapPoints, selectedSource, wilayahList]);

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

      const curr = map.get(fullKey) || { total: 0, pos: 0, pat: 0, lin: 0, desa: p.desa, kecamatan: p.kecamatan };
      curr.total += 1;
      if (p.sourceType === 'poskamling') curr.pos += 1;
      else if (p.sourceType === 'patroli') curr.pat += 1;
      else if (p.sourceType === 'satlinmas') curr.lin += 1;
      map.set(fullKey, curr);

      const currD = map.get(dName) || { total: 0, pos: 0, pat: 0, lin: 0, desa: p.desa, kecamatan: p.kecamatan };
      currD.total += 1;
      if (p.sourceType === 'poskamling') currD.pos += 1;
      else if (p.sourceType === 'patroli') currD.pat += 1;
      else if (p.sourceType === 'satlinmas') currD.lin += 1;
      map.set(dName, currD);
    });
    return map;
  }, [allMapPoints]);

  const topArea = areaRanking[0] || { nama: 'Barabai', total: 0, percentage: 0 };

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
      const matchSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.lokasi && item.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.alamat && item.alamat.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.desa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kecamatan.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSource && matchKec && matchDesa && matchSearch;
    });
  }, [allMapPoints, selectedSource, selectedKecamatan, selectedDesa, searchQuery]);

  // =========================================================================
  // 6. INISIALISASI PETA LEAFLET (Fokus Hulu Sungai Tengah)
  // =========================================================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: HST_CENTER,
        zoom: 11,
        zoomControl: true,
        maxBounds: [
          [-2.8500, 115.0800],
          [-2.3800, 115.9000]
        ],
        maxBoundsViscosity: 1.0, // KUNCI KETAT wilayah Kabupaten Hulu Sungai Tengah
        minZoom: 10
      });

      map.fitBounds(HST_BOUNDS, { padding: [15, 15] });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Satpol PP & Linmas Pemkab HST',
        maxZoom: 18
      }).addTo(map);

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
  // 7. RENDER LAYER BATAS KECAMATAN DENGAN GRADASI
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
        const g = getWarnaAktivitasWilayah(count);

        if (isSelected) {
          return {
            color: '#0F2A4A',
            weight: 3.5,
            opacity: 1,
            fillColor: '#F0B429',
            fillOpacity: 0.70,
            dashArray: null
          };
        }

        return {
          color: g.border,
          weight: 2,
          opacity: 0.85,
          fillColor: g.fill,
          fillOpacity: g.opacity,
          dashArray: count === 0 ? '4, 4' : null
        };
      },
      onEachFeature: (feature, layer) => {
        const rawNama = feature.properties?.nama || '';
        const titleNama = rawNama
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        kecFeaturesMapRef.current.set(rawNama.toLowerCase(), layer);
        kecFeaturesMapRef.current.set(titleNama.toLowerCase(), layer);

        const stat = kecStatsMap.get(rawNama.toLowerCase());
        const count = stat ? stat.total : 0;
        const g = getWarnaAktivitasWilayah(count);

        layer.bindTooltip(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; padding: 4px; min-width: 150px;">
            <div style="font-weight: 800; color: #0F2A4A; font-size: 12px;">Kecamatan ${titleNama}</div>
            <div style="font-size: 10px; color: #475569; margin-top: 2px;">
              Poskamling: <b>${stat?.posCount || 0}</b> | Patroli: <b>${stat?.patCount || 0}</b> | Linmas: <b>${stat?.linCount || 0}</b>
            </div>
            <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background-color: ${g.fill}; border: 1px solid ${g.border};"></span>
              <span style="font-size: 10px; font-weight: 800; color: ${count > 0 ? '#065F46' : '#64748B'};">
                ${count > 0 ? `Total: ${count} Data (Pos, Patroli & Linmas)` : 'Belum Ada Data'}
              </span>
            </div>
            <div style="font-size: 9px; color: #2563EB; font-weight: 600; margin-top: 4px;">Klik untuk fokus wilayah</div>
          </div>
        `, {
          sticky: true,
          direction: 'top',
          className: 'custom-kec-tooltip'
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            const isSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === rawNama.toLowerCase();
            if (!isSelected) {
              l.setStyle({
                weight: 3,
                fillOpacity: Math.min(g.opacity + 0.25, 0.95),
                color: '#0F2A4A'
              });
            }
          },
          mouseout: (e) => {
            const l = e.target;
            const isSelected = selectedKecamatan !== 'semua' && selectedKecamatan.toLowerCase() === rawNama.toLowerCase();
            if (!isSelected) {
              kecGeoJsonLayer.resetStyle(l);
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            handleSelectKecamatan(titleNama);
          }
        });
      }
    });

    kecamatanLayerRef.current.addLayer(kecGeoJsonLayer);
  }, [geoKecamatanData, selectedKecamatan, showKecamatanBorders, kecStatsMap]);

  // =========================================================================
  // 8. RENDER LAYER BATAS DESA (169 DESA HST)
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !desaLayerRef.current || !geoDesaData) return;

    desaLayerRef.current.clearLayers();
    desaFeaturesMapRef.current.clear();

    if (!showDesaBorders) return;

    const desaGeoJsonLayer = L.geoJSON(geoDesaData, {
      filter: (feature) => {
        if (selectedKecamatan === 'semua') return true;
        const wadm = feature.properties?.WADMKC;
        return wadm && wadm.toLowerCase() === selectedKecamatan.toLowerCase();
      },
      style: (feature) => {
        const rawDesa = feature.properties?.NAMOBJ || '';
        const rawKec = feature.properties?.WADMKC || '';
        const key = `${rawKec.toLowerCase().trim()}_${rawDesa.toLowerCase().trim()}`;
        const dStat = desaStatsMap.get(key) || desaStatsMap.get(rawDesa.toLowerCase().trim());
        const count = dStat ? dStat.total : 0;
        const isSelected = selectedDesa !== 'semua' && selectedDesa.toLowerCase() === rawDesa.toLowerCase();
        const g = getWarnaAktivitasWilayah(count);

        if (isSelected) {
          return {
            color: '#0F2A4A',
            weight: 3,
            opacity: 1,
            fillColor: '#F0B429',
            fillOpacity: 0.75,
            dashArray: null
          };
        }

        return {
          color: g.border,
          weight: 1,
          opacity: 0.75,
          fillColor: g.fill,
          fillOpacity: g.opacity,
          dashArray: count === 0 ? '2, 3' : null
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const namaDesa = props.NAMOBJ || 'Desa';
        const namaKec = props.WADMKC || 'Kecamatan';
        const luasHa = Math.round((props.SHAPE_Area || 0) / 10000);

        const key = `${namaKec.toLowerCase().trim()}_${namaDesa.toLowerCase().trim()}`;
        desaFeaturesMapRef.current.set(key, layer);
        desaFeaturesMapRef.current.set(namaDesa.toLowerCase().trim(), layer);

        const dStat = desaStatsMap.get(key) || desaStatsMap.get(namaDesa.toLowerCase().trim());
        const dCount = dStat ? dStat.total : 0;
        const dGradasi = getWarnaAktivitasWilayah(dCount);

        layer.bindTooltip(`
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; text-align: left; padding: 4px; min-width: 150px;">
            <div style="font-weight: 800; color: #0F2A4A; font-size: 11.5px;">Desa/Kel. ${namaDesa}</div>
            <div style="font-size: 10px; color: #475569;">Kec. ${namaKec} &bull; Luas: ${luasHa.toLocaleString('id-ID')} Ha</div>
            <div style="font-size: 10px; color: #334155; margin-top: 2px;">
              Poskamling: <b>${dStat?.pos || 0}</b> | Patroli: <b>${dStat?.pat || 0}</b> | Linmas: <b>${dStat?.lin || 0}</b>
            </div>
            <div style="display: flex; align-items: center; gap: 5px; margin-top: 3px;">
              <span style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background-color: ${dGradasi.fill}; border: 1px solid ${dGradasi.border};"></span>
              <span style="font-size: 10px; font-weight: 800; color: ${dCount > 0 ? '#065F46' : '#64748B'};">
                ${dCount > 0 ? `Total: ${dCount} Data (Pos, Patroli & Linmas)` : 'Belum Ada Data'}
              </span>
            </div>
            <div style="font-size: 9px; color: #0284C7; font-weight: 600; margin-top: 3px;">Klik untuk fokus wilayah desa</div>
          </div>
        `, {
          sticky: true,
          direction: 'top',
          className: 'custom-desa-tooltip'
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            const isSelected = selectedDesa !== 'semua' && selectedDesa.toLowerCase() === namaDesa.toLowerCase();
            if (!isSelected) {
              l.setStyle({
                weight: 2.5,
                fillOpacity: Math.min(dGradasi.opacity + 0.25, 0.95),
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
  }, [geoDesaData, selectedKecamatan, selectedDesa, showDesaBorders, desaStatsMap]);

  // =========================================================================
  // 9. UPDATE MARKERS SPASIAL (POSKAMLING, PATROLI, SATLINMAS)
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    if (!showMarkers) return;

    filteredPoints.forEach((item) => {
      let colorHex = '#D97706';
      let iconEmoji = '📻';
      let pinBorder = 'white';

      if (item.sourceType === 'poskamling') {
        colorHex = '#D97706'; // Amber Oranye
        iconEmoji = '📻';
        pinBorder = '#FDE68A';
      } else if (item.sourceType === 'patroli') {
        colorHex = '#059669'; // Emerald Green
        iconEmoji = '🚓';
        pinBorder = '#A7F3D0';
      } else if (item.sourceType === 'satlinmas') {
        colorHex = '#0F2A4A'; // Navy Pemkab
        iconEmoji = '🛡️';
        pinBorder = '#F0B429'; // Emas
      } else {
        colorHex = '#DC2626'; // Penindakan
        iconEmoji = '🚨';
        pinBorder = '#FECACA';
      }

      // Marker kustom HTML Pin
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${colorHex};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid ${pinBorder};
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          ">
            <span style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold; line-height: 1;">${iconEmoji}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      // POPUP HTML SESUAI TIPE DATA
      let popupContent = '';

      if (item.sourceType === 'poskamling') {
        const fasChips = (item.fasilitas || []).slice(0, 4).map(f => 
          `<span style="background: #FEF3C7; color: #92400E; padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-right: 3px; margin-bottom: 2px; display: inline-block;">✓ ${f}</span>`
        ).join('');

        popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; width: 260px; line-height: 1.4; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;">
                📻 POSKAMLING / POS RONDA
              </span>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">RT ${item.rt} / RW ${item.rw}</span>
            </div>

            <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin-bottom: 2px;">${item.title}</div>
            
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 8px; margin: 6px 0; font-size: 11px;">
              <div style="color: #0F2A4A; font-weight: 700;">📍 Kec. ${item.kecamatan}, Desa ${item.desa}</div>
              <div style="color: #475569; font-size: 10px; margin-top: 2px;">${item.alamat || '-'}</div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px;">
              <span style="color: #64748B;">Operasional:</span>
              <span style="font-weight: 700; color: #D97706;">${item.status}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 6px;">
              <span style="color: #64748B;">Kondisi Fisik:</span>
              <span style="font-weight: 700; color: #0F2A4A;">${item.kondisi}</span>
            </div>

            <div style="border-top: 1px dashed #CBD5E1; padding-top: 4px; margin-bottom: 6px;">
              <div style="font-size: 10px; color: #475569;">Ketua: <b>${item.namaKetua}</b> (${item.kontakWa})</div>
              <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 2px;">👥 ${item.personilCount} Personel Ronda Warga</div>
            </div>

            ${fasChips ? `
              <div style="margin-bottom: 6px;">
                <div style="font-size: 9.5px; color: #64748B; font-weight: 700; margin-bottom: 2px;">Fasilitas Pos:</div>
                <div>${fasChips}</div>
              </div>
            ` : ''}

            <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; color: #64748B; font-family: monospace;">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
              <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-size: 10.5px; font-weight: 700; text-decoration: none;">
                Buka Maps ↗
              </a>
            </div>
          </div>
        `;
      } else if (item.sourceType === 'patroli') {
        popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; width: 260px; line-height: 1.4; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
                🚓 PATROLI LAPANGAN GPS LIVE
              </span>
              <span style="font-size: 10px; color: #64748B; font-weight: 600;">${item.waktu}</span>
            </div>

            <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin-bottom: 2px;">${item.title}</div>
            
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 8px; margin: 6px 0; font-size: 11px;">
              <div style="color: #0F2A4A; font-weight: 700;">📍 Kec. ${item.kecamatan}${item.desa ? ', Desa ' + item.desa : ''}</div>
              <div style="color: #475569; font-size: 10px; margin-top: 2px;">${item.lokasi || '-'}</div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px;">
              <span style="color: #64748B;">Situasi:</span>
              <span style="font-weight: 800; color: #059669;">${item.status}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 6px;">
              <span style="color: #64748B;">Petugas Pelapor:</span>
              <span style="font-weight: 700; color: #0F2A4A;">${item.petugasPelapor} (${item.personilCount} Org)</span>
            </div>

            ${item.hasil ? `
              <div style="background: #ECFDF5; border-left: 3px solid #059669; padding: 4px 6px; font-size: 10px; color: #064E3B; margin-bottom: 6px; border-radius: 0 4px 4px 0;">
                <b>Temuan:</b> ${item.hasil.length > 90 ? item.hasil.slice(0, 90) + '...' : item.hasil}
              </div>
            ` : ''}

            <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; color: #64748B; font-family: monospace;">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
              <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-size: 10.5px; font-weight: 700; text-decoration: none;">
                Buka Maps ↗
              </a>
            </div>
          </div>
        `;
      } else if (item.sourceType === 'satlinmas') {
        popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; width: 260px; line-height: 1.4; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #0F2A4A; color: #F0B429; border: 1px solid #F0B429;">
                🛡️ ANGGOTA SATLINMAS
              </span>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">${item.status}</span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin: 6px 0;">
              ${item.pasFoto ? `
                <img src="${item.pasFoto}" alt="${item.title}" style="width: 44px; height: 54px; object-fit: cover; border-radius: 6px; border: 2px solid #F0B429;" />
              ` : ''}
              <div>
                <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; line-height: 1.2;">${item.title}</div>
                <div style="font-size: 10px; color: #64748B; font-mono; margin-top: 2px;">Reg: ${item.noRegistrasi}</div>
                <div style="font-size: 9.5px; color: #475569; font-mono;">NIK: ${item.nik}</div>
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 8px; border-radius: 8px; margin: 6px 0; font-size: 11px;">
              <div style="color: #0F2A4A; font-weight: 700;">Penugasan: Kec. ${item.kecamatan}, Desa ${item.desa}</div>
              <div style="color: #475569; font-size: 10px; margin-top: 2px;">${item.alamat || '-'}</div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 6px;">
              <span style="color: #64748B;">No. Handphone:</span>
              <span style="font-weight: 700; color: #0F2A4A;">${item.noHp}</span>
            </div>

            <div style="border-top: 1px solid #E2E8F0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 10px; color: #64748B; font-family: monospace;">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
              <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-size: 10.5px; font-weight: 700; text-decoration: none;">
                Buka Maps ↗
              </a>
            </div>
          </div>
        `;
      } else {
        // Penindakan
        popupContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; width: 250px; line-height: 1.4; text-align: left;">
            <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin-bottom: 2px;">${item.title}</div>
            <div style="font-size: 11px; color: #475569;">📍 Kec. ${item.kecamatan}, Desa ${item.desa}</div>
            <div style="font-size: 10px; color: #DC2626; font-weight: 700; margin-top: 4px;">Status: ${item.status}</div>
          </div>
        `;
      }

      marker.bindPopup(popupContent);
      markersLayerRef.current.addLayer(marker);
      markersMapRef.current.set(item.id, marker);
    });
  }, [filteredPoints, showMarkers]);

  // =========================================================================
  // 10. HANDLERS NAVIGASI & ZOOMING PETA
  // =========================================================================

  const handleSelectKecamatan = (kecNama) => {
    setSelectedKecamatan(kecNama);
    setSelectedDesa('semua');

    if (!mapInstanceRef.current) return;

    if (kecNama === 'semua') {
      mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15], duration: 1 });
      return;
    }

    const targetLayer = kecFeaturesMapRef.current.get(kecNama.toLowerCase());
    if (targetLayer) {
      mapInstanceRef.current.fitBounds(targetLayer.getBounds(), { padding: [30, 30], maxZoom: 14, duration: 1.2 });
    } else {
      const selectedKecObj = wilayahList.find(k => k.nama.toLowerCase() === kecNama.toLowerCase());
      if (selectedKecObj && selectedKecObj.lat && selectedKecObj.lng) {
        mapInstanceRef.current.flyTo([selectedKecObj.lat, selectedKecObj.lng], 13, { duration: 1.2 });
      }
    }
  };

  useEffect(() => {
    if (assignedKecamatan) {
      setSelectedKecamatan(assignedKecamatan);
      if (mapInstanceRef.current) {
        handleSelectKecamatan(assignedKecamatan);
      }
    }
  }, [assignedKecamatan]);

  const handleSelectDesa = (desaNama) => {
    setSelectedDesa(desaNama);

    if (!mapInstanceRef.current) return;

    if (desaNama === 'semua') {
      if (selectedKecamatan !== 'semua') {
        handleSelectKecamatan(selectedKecamatan);
      } else {
        mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15] });
      }
      return;
    }

    const key = selectedKecamatan !== 'semua' ? `${selectedKecamatan.toLowerCase().trim()}_${desaNama.toLowerCase().trim()}` : desaNama.toLowerCase().trim();
    const targetLayer = desaFeaturesMapRef.current.get(key) || desaFeaturesMapRef.current.get(desaNama.toLowerCase().trim());
    if (targetLayer) {
      mapInstanceRef.current.fitBounds(targetLayer.getBounds(), { padding: [40, 40], maxZoom: 15, duration: 1 });
    }
  };

  const handleFocusHST = () => {
    setSelectedKecamatan('semua');
    setSelectedDesa('semua');
    setSearchQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(HST_BOUNDS, { padding: [15, 15], duration: 1 });
    }
  };

  const handleFocusBarabai = () => {
    setSelectedKecamatan('Barabai');
    setSelectedDesa('semua');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(BARABAI_CENTER, 14, { duration: 1.2 });
    }
  };

  const handleFlyToPoint = (item) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([item.lat, item.lng], 16, { duration: 1 });
    const marker = markersMapRef.current.get(item.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (PETA DIGITAL LINDUNGMAS HST) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#0A1A2E] rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F0B429] text-[#0F2A4A] flex items-center gap-1.5 shadow-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  PETA DIGITAL LINDUNGMAS HST
                </span>
                <span className="text-xs text-slate-300 font-medium">11 Kecamatan &bull; 169 Desa/Kelurahan</span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white mt-1.5 tracking-tight flex items-center gap-2">
                <span>Peta Digital Sebaran Poskamling, Satlinmas & Patroli</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Sistem Informasi Geospasial (GIS) terpadu Kabupaten Hulu Sungai Tengah. Memetakan lokasi fisik Poskamling (Pos Ronda), persebaran anggota Satlinmas penugasan desa, dan rekam patroli lapangan dengan koordinat GPS akurat.
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
                onClick={handleFocusBarabai}
                className="px-4 py-2.5 bg-[#F0B429] hover:bg-[#d99f1f] text-[#0F2A4A] text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Pusat Barabai</span>
              </button>
            </div>
          </div>

          {/* 4 Mini KPI Indicator Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/25 text-[#F0B429] flex items-center justify-center font-bold text-base shrink-0">
                📻
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Data Poskamling</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalPoskamling} Pos Ronda Aktif</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/25 text-emerald-300 flex items-center justify-center font-bold text-base shrink-0">
                🚓
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Kegiatan Patroli</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalPatroli} Laporan GPS</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/25 text-blue-300 flex items-center justify-center font-bold text-base shrink-0">
                🛡️
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Data Satlinmas</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{totalSatlinmas} Anggota Terdata</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/25 text-purple-300 flex items-center justify-center font-bold text-base shrink-0">
                🗺️
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">Total Titik Spasial</span>
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">{allMapPoints.length} Titik Terpetakan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP CONTROLLER: SOURCE TABS & FILTER BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Source Tabs + Layer Toggles */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Source Tabs: Satlinmas, Poskamling, Patroli */}
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
              onClick={() => setSelectedSource('poskamling')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === 'poskamling'
                  ? 'bg-[#D97706] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📻 Data Poskamling ({totalPoskamling})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('patroli')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === 'patroli'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚓 Kegiatan Patroli ({totalPatroli})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('satlinmas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === 'satlinmas'
                  ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛡️ Data Satlinmas ({totalSatlinmas})</span>
            </button>
          </div>

          {/* Layer Visibility Toggles */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Poligon:</span>
            
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
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showMarkers ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
              <span>Titik Pin</span>
            </button>
          </div>
        </div>

        {/* Row 2: Hierarchical Dropdowns (Kecamatan & Desa) + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* SELECTOR 1: KECAMATAN */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-[#0F2A4A]">
                📍 1. Filter Kecamatan (HST):
              </label>
              {assignedKecamatan && (
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  Terkunci (Operator)
                </span>
              )}
            </div>
            <select
              value={selectedKecamatan}
              disabled={!!assignedKecamatan}
              onChange={(e) => handleSelectKecamatan(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold rounded-xl border outline-hidden ${
                assignedKecamatan
                  ? 'bg-blue-50 border-blue-200 text-blue-900 cursor-not-allowed font-extrabold'
                  : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] cursor-pointer'
              }`}
            >
              {assignedKecamatan ? (
                <option value={assignedKecamatan}>Kec. {assignedKecamatan} (Wilayah Binaan Operator)</option>
              ) : (
                <>
                  <option value="semua">Semua Kecamatan (11 HST)</option>
                  {areaRanking.map(k => (
                    <option key={k.id} value={k.nama}>
                      Kec. {k.nama} ({k.total} Titik Terdata)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* SELECTOR 2: DESA / KELURAHAN */}
          <div>
            <label className="text-[11px] font-bold text-[#0F2A4A] mb-1 flex items-center justify-between">
              <span>🏘️ 2. Filter Desa / Kelurahan:</span>
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

          {/* SEARCH BOX */}
          <div>
            <label className="block text-[11px] font-bold text-[#0F2A4A] mb-1">
              🔍 3. Cari Pos / Anggota / Patroli:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama poskamling, anggota linmas, jalan..."
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

        {/* Selected Filter Summary Badge */}
        {(selectedKecamatan !== 'semua' || selectedDesa !== 'semua' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Filter Aktif:</span>
            {selectedKecamatan !== 'semua' && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#0F2A4A] font-bold text-[11px] flex items-center gap-1">
                <span>Kec. {selectedKecamatan}</span>
                <button type="button" onClick={() => handleSelectKecamatan('semua')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedDesa !== 'semua' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 border border-amber-300">
                <span>Desa {selectedDesa}</span>
                <button type="button" onClick={() => handleSelectDesa('semua')} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1">
                <span>Kata Kunci: "{searchQuery}"</span>
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-600">
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
      {/* 3. MAP CONTAINER & SIDEBAR DATA (POSKAMLING, PATROLI, SATLINMAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Map Box */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative min-h-[560px]">
          {isLoadingGeo && (
            <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#0F2A4A] animate-spin" />
              <span className="text-xs font-bold text-[#0F2A4A]">Memuat Poligon Batas Hulu Sungai Tengah (169 Desa)...</span>
            </div>
          )}

          {/* Leaflet Map Target */}
          <div ref={mapContainerRef} className="w-full h-[420px] sm:h-[500px] lg:h-[620px]" />
          
          {/* Mobile Legend Toggle Button */}
          <div className="absolute top-4 right-4 z-20 md:hidden">
            <button
              type="button"
              onClick={() => setShowMobileLegend(!showMobileLegend)}
              className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-bold text-[#0F2A4A] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>{showMobileLegend ? 'Tutup Legenda' : 'Legenda'}</span>
            </button>
          </div>

          {/* Floating Map Legend Overlay */}
          <div className={`absolute top-14 md:top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2.5 max-w-[280px] ${showMobileLegend ? 'block' : 'hidden md:block'}`}>
            {/* LEGENDA SIMBOL TITIK */}
            <div className="space-y-1.5 pb-2 border-b border-slate-200">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F2A4A] block">
                Simbol Pin Peta Digital
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#D97706] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                    📻
                  </span>
                  <span className="font-bold text-slate-800">Poskamling (Pos Ronda)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#059669] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                    🚓
                  </span>
                  <span className="font-bold text-slate-800">Kegiatan & Patroli GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center text-[10px] font-bold shadow-2xs border border-[#F0B429]/50">
                    🛡️
                  </span>
                  <span className="font-bold text-slate-800">Data Anggota Satlinmas</span>
                </div>
              </div>
            </div>

            {/* WARNA WILAYAH BERDASARKAN JUMLAH DATA */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Warna Wilayah (Pos, Patroli & Linmas)
              </span>
              <p className="text-[9px] text-slate-500 leading-tight">
                Semakin banyak data di wilayah, warnanya semakin pekat:
              </p>
              <div className="grid grid-cols-5 gap-1 pt-0.5">
                <div className="text-center">
                  <div className="h-2.5 rounded-xs border border-slate-300" style={{ backgroundColor: '#F8FAFC' }} />
                  <span className="text-[8px] text-slate-500 block mt-0.5">0 Data</span>
                </div>
                <div className="text-center">
                  <div className="h-2.5 rounded-xs border border-emerald-300" style={{ backgroundColor: '#D1FAE5' }} />
                  <span className="text-[8px] text-emerald-800 font-semibold block mt-0.5">1-2</span>
                </div>
                <div className="text-center">
                  <div className="h-2.5 rounded-xs border border-emerald-400" style={{ backgroundColor: '#6EE7B7' }} />
                  <span className="text-[8px] text-emerald-900 font-bold block mt-0.5">3-5</span>
                </div>
                <div className="text-center">
                  <div className="h-2.5 rounded-xs border border-emerald-600" style={{ backgroundColor: '#10B981' }} />
                  <span className="text-[8px] text-emerald-950 font-bold block mt-0.5">6-9</span>
                </div>
                <div className="text-center">
                  <div className="h-2.5 rounded-xs border border-emerald-800" style={{ backgroundColor: '#047857' }} />
                  <span className="text-[8px] text-emerald-950 font-extrabold block mt-0.5">10+</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 text-[9.5px] text-slate-500 leading-tight">
              💡 <i>Klik pin marker untuk membuka detail lengkap dan rute Google Maps.</i>
            </div>
          </div>

          {/* Floating Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleFocusHST}
              className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F2A4A] text-xs font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Seluruh HST</span>
            </button>
            <button
              type="button"
              onClick={handleFocusBarabai}
              className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F2A4A] text-xs font-bold rounded-xl shadow-md border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Pusat Barabai</span>
            </button>
          </div>

          {/* Floating Points Counter */}
          <div className="absolute bottom-4 left-4 z-20 bg-[#0F2A4A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-[#F0B429]" />
            <span>
              {filteredPoints.length} Titik Ditampilkan
              {selectedDesa !== 'semua' ? ` di Desa ${selectedDesa}` : selectedKecamatan !== 'semua' ? ` di Kec. ${selectedKecamatan}` : ' di Kab. HST'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SIDEBAR: DAFTAR DATA & SEBERAN WILAYAH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            {/* Selected Desa Spotlight Card */}
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

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/80 text-center">
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-[9.5px] text-slate-500 block">Poskamling</span>
                    <span className="font-bold text-[#D97706] font-mono text-xs">{selectedDesaInfo.posCount}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-[9.5px] text-slate-500 block">Patroli</span>
                    <span className="font-bold text-[#059669] font-mono text-xs">{selectedDesaInfo.patCount}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                    <span className="text-[9.5px] text-slate-500 block">Satlinmas</span>
                    <span className="font-bold text-[#0F2A4A] font-mono text-xs">{selectedDesaInfo.linCount}</span>
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
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('ranking')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSideTab === 'ranking'
                      ? 'bg-[#0F2A4A] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Wilayah
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('poskamling')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSideTab === 'poskamling'
                      ? 'bg-[#D97706] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Poskamling ({totalPoskamling})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('patroli')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSideTab === 'patroli'
                      ? 'bg-[#059669] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Patroli ({totalPatroli})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('satlinmas')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeSideTab === 'satlinmas'
                      ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Linmas ({totalSatlinmas})
                </button>
              </div>
            </div>

            {/* TAB 1: SEBARAN WILAYAH PER KECAMATAN */}
            {activeSideTab === 'ranking' && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Rincian sebaran per-kecamatan. Klik untuk memfokuskan wilayah di peta:
                </p>

                {areaRanking.map((kec, idx) => {
                  const isSelected = selectedKecamatan.toLowerCase() === kec.nama.toLowerCase();

                  return (
                    <div
                      key={kec.id}
                      onClick={() => handleSelectKecamatan(kec.nama)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#0F2A4A] bg-amber-50/70 shadow-xs ring-1 ring-[#0F2A4A]' 
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center text-[10px] font-extrabold">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-[#0F2A4A] text-xs">
                            Kec. {kec.nama}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-extrabold text-[#0F2A4A] text-xs">
                            {kec.total} Titik
                          </span>
                        </div>
                      </div>

                      {/* Distribution breakdown */}
                      <div className="grid grid-cols-3 gap-1 mt-2 pt-1.5 border-t border-slate-200/70 text-[10px]">
                        <span className="text-[#D97706] font-bold">📻 {kec.posCount} Pos</span>
                        <span className="text-[#059669] font-bold">🚓 {kec.patCount} Patroli</span>
                        <span className="text-[#0F2A4A] font-bold">🛡️ {kec.linCount} Linmas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: DAFTAR DATA POSKAMLING */}
            {activeSideTab === 'poskamling' && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Klik poskamling untuk terbang ke titik lokasi di peta:
                </p>

                {allMapPoints
                  .filter(p => p.sourceType === 'poskamling')
                  .map((pos) => (
                    <div
                      key={pos.id}
                      onClick={() => handleFlyToPoint(pos)}
                      className="p-3 bg-amber-50/40 hover:bg-amber-100/60 border border-amber-200 rounded-xl transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            📻
                          </div>
                          <div>
                            <h5 className="font-extrabold text-[#0F2A4A] text-xs group-hover:text-blue-600 transition-colors">
                              {pos.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 block">
                              Desa {pos.desa}, Kec. {pos.kecamatan}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                          {pos.kondisi}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-amber-200/60">
                        <span>Ketua: <b>{pos.namaKetua}</b></span>
                        <span className="text-[#D97706] font-bold">👥 {pos.personilCount} Ronda</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* TAB 3: DAFTAR KEGIATAN PATROLI */}
            {activeSideTab === 'patroli' && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Klik laporan patroli untuk melihat titik GPS kejadian:
                </p>

                {allMapPoints
                  .filter(p => p.sourceType === 'patroli')
                  .map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => handleFlyToPoint(pat)}
                      className="p-3 bg-emerald-50/40 hover:bg-emerald-100/60 border border-emerald-200 rounded-xl transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            🚓
                          </div>
                          <div>
                            <h5 className="font-extrabold text-[#0F2A4A] text-xs group-hover:text-emerald-700 transition-colors">
                              {pat.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 block">
                              {pat.waktu} &bull; Kec. {pat.kecamatan}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                          {pat.status}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-600 line-clamp-2">
                        {pat.hasil}
                      </p>

                      <div className="text-[10px] text-slate-500 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                        <span>Pelapor: <b>{pat.petugasPelapor}</b></span>
                        <span className="font-mono text-emerald-700 font-bold">{pat.personilCount} Org</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* TAB 4: DAFTAR DATA SATLINMAS */}
            {activeSideTab === 'satlinmas' && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">
                  Klik anggota Satlinmas untuk melihat titik penugasan wilayah:
                </p>

                {allMapPoints
                  .filter(p => p.sourceType === 'satlinmas')
                  .map((lin) => (
                    <div
                      key={lin.id}
                      onClick={() => handleFlyToPoint(lin)}
                      className="p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-[#F0B429] rounded-xl transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-center gap-2.5">
                        {lin.pasFoto ? (
                          <img src={lin.pasFoto} alt={lin.title} className="w-8 h-10 rounded-lg object-cover border border-[#F0B429] shrink-0" />
                        ) : (
                          <div className="w-8 h-10 rounded-lg bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center font-bold text-xs shrink-0">
                            🛡️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-extrabold text-[#0F2A4A] text-xs truncate group-hover:text-blue-600 transition-colors">
                            {lin.title}
                          </h5>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Reg: {lin.noRegistrasi}
                          </span>
                          <span className="text-[9.5px] text-emerald-700 font-bold block">
                            Desa {lin.desa}, Kec. {lin.kecamatan}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#0F2A4A] text-[#F0B429]">
                          Aktif
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Footer Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium text-[11px]">
              {filteredPoints.length} dari {allMapPoints.length} titik aktif
            </span>
            <button
              type="button"
              onClick={handleFocusHST}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Reset Posisi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}