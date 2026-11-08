import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Shield, 
  Car, 
  MapPin, 
  Radio, 
  IdCard, 
  Users, 
  ArrowRight, 
  LogIn, 
  Menu, 
  X, 
  ChevronRight, 
  Building2, 
  PhoneCall, 
  Mail, 
  Clock, 
  FileText, 
  Compass, 
  Lock, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  BookOpen,
  Map as MapIcon,
  UserCheck,
  LayoutDashboard,
  Layers,
  Check
} from 'lucide-react';
import { KECAMATAN_HST } from '../../data/mockData';

// Fungsi penentuan warna gradasi aktivitas wilayah (poskamling, patroli, satlinmas)
const getWarnaAktivitasWilayah = (count) => {
  if (!count || count === 0) return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', fill: '#F8FAFC', opacity: 0.15 };
  if (count <= 2) return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', fill: '#D1FAE5', opacity: 0.35 };
  if (count <= 5) return { bg: '#6EE7B7', border: '#10B981', text: '#064E3B', fill: '#6EE7B7', opacity: 0.5 };
  if (count <= 9) return { bg: '#10B981', border: '#059669', text: '#FFFFFF', fill: '#10B981', opacity: 0.65 };
  return { bg: '#047857', border: '#065F46', text: '#FFFFFF', fill: '#047857', opacity: 0.8 };
};

// Bounding box & batas koordinat resmi Kabupaten Hulu Sungai Tengah (map.json & desa_hst.geojson)
const HST_EXACT_BOUNDS = [
  [-2.782556, 115.154723], // Southwest batas HST
  [-2.452358, 115.821807]  // Northeast batas HST
];
const HST_CENTER = [-2.617457, 115.488265];
const HST_MAX_BOUNDS = [
  [-2.8500, 115.0800], // Batas toleransi geser maksimal Barat Daya (dikunci)
  [-2.3800, 115.9000]  // Batas toleransi geser maksimal Timur Laut (dikunci)
];

export default function LandingPage({ 
  onNavigateToLogin, 
  onExploreMap,
  satlinmasList = [],
  poskamlingList = [],
  kegiatanPatroliList = [],
  wilayahList = KECAMATAN_HST
}) {
  // Guaranteed non-null memoized data arrays to prevent any undefined/null length render crashes
  const safeSatlinmasList = useMemo(() => Array.isArray(satlinmasList) ? satlinmasList : [], [satlinmasList]);
  const safePoskamlingList = useMemo(() => Array.isArray(poskamlingList) ? poskamlingList : [], [poskamlingList]);
  const safePatroliList = useMemo(() => Array.isArray(kegiatanPatroliList) ? kegiatanPatroliList : [], [kegiatanPatroliList]);
  const safeWilayahList = useMemo(() => (Array.isArray(wilayahList) && wilayahList.length > 0) ? wilayahList : KECAMATAN_HST, [wilayahList]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Smooth scroll handler ke section tertentu & update active state
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Scroll listener untuk update header transparansi & aktif menu navigasi
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['beranda', 'peta-digital', 'fitur', 'wilayah', 'kontak'];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // States for Embedded Public Peta Digital Section
  const publicMapRef = useRef(null);
  const publicMapInstanceRef = useRef(null);
  const kecamatanLayerRef = useRef(null);
  const desaLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const kecFeaturesMapRef = useRef(new Map());
  const desaFeaturesMapRef = useRef(new Map());

  const [publicMapSource, setPublicMapSource] = useState('semua');
  const [publicMapKecamatan, setPublicMapKecamatan] = useState('semua');
  const [publicMapDesa, setPublicMapDesa] = useState('semua');
  const [geoKecamatanData, setGeoKecamatanData] = useState(null);
  const [geoDesaData, setGeoDesaData] = useState(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [showKecamatanBorders, setShowKecamatanBorders] = useState(true);
  const [showDesaBorders, setShowDesaBorders] = useState(true);

  // Fetch GeoJSON / JSON batas kecamatan (map.json) dan batas 169 desa (desa_hst.geojson)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGeo(true);

    Promise.all([
      fetch('/peta/map.json').then(r => {
        if (!r.ok) throw new Error('Gagal memuat map.json');
        return r.json();
      }),
      fetch('/peta/desa_hst.geojson').then(r => {
        if (!r.ok) throw new Error('Gagal memuat desa_hst.geojson');
        return r.json();
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
        console.warn('Info load GeoJSON batas spasial:', err);
        setIsLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Centroids desa untuk fallback koordinat presisi titik
  const desaCentroids = useMemo(() => {
    const map = new Map();
    if (!geoDesaData || !Array.isArray(geoDesaData.features)) return map;

    geoDesaData.features.forEach(f => {
      const dName = f?.properties?.NAMOBJ;
      const kName = f?.properties?.WADMKC;
      if (!dName || typeof dName !== 'string') return;

      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      const processCoords = (coords) => {
        if (!Array.isArray(coords)) return;
        coords.forEach(pt => {
          if (!pt) return;
          if (Array.isArray(pt[0])) {
            processCoords(pt);
          } else {
            const lng = Number(pt[0]);
            const lat = Number(pt[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
            }
          }
        });
      };

      if (f.geometry && f.geometry.coordinates) {
        processCoords(f.geometry.coordinates);
        if (minLat < 90) {
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          map.set(dName.toLowerCase().trim(), { lat: centerLat, lng: centerLng });
          if (kName && typeof kName === 'string') {
            map.set(`${kName.toLowerCase().trim()}_${dName.toLowerCase().trim()}`, { lat: centerLat, lng: centerLng });
          }
        }
      }
    });

    return map;
  }, [geoDesaData]);

  // Agregasi statistik titik per kecamatan (Defensif terhadap null/undefined)
  const kecStatsMap = useMemo(() => {
    const map = new Map();
    safeWilayahList.forEach(k => {
      if (!k) return;
      const rawName = k.nama || k.kecamatan || '';
      if (!rawName || typeof rawName !== 'string') return;
      const kName = rawName.toLowerCase().trim();
      const posCount = safePoskamlingList.filter(p => (p?.kecamatan || '').toLowerCase().trim() === kName).length;
      const patCount = safePatroliList.filter(p => (p?.kecamatan || '').toLowerCase().trim() === kName).length;
      const linCount = safeSatlinmasList.filter(p => (p?.kecamatan || '').toLowerCase().trim() === kName).length;
      map.set(kName, { posCount, patCount, linCount, total: posCount + patCount + linCount, nama: rawName });
    });
    return map;
  }, [safePoskamlingList, safePatroliList, safeSatlinmasList, safeWilayahList]);

  // Agregasi statistik titik per desa (Defensif terhadap null/undefined)
  const desaStatsMap = useMemo(() => {
    const map = new Map();
    const addStat = (dName, kName, type) => {
      if (!dName || typeof dName !== 'string') return;
      const d = dName.toLowerCase().trim();
      const k = (typeof kName === 'string' ? kName : '').toLowerCase().trim();
      const key = `${k}_${d}`;
      const entry = map.get(key) || { pos: 0, pat: 0, lin: 0, total: 0 };
      entry[type] = (entry[type] || 0) + 1;
      entry.total += 1;
      map.set(key, entry);
      map.set(d, entry);
    };

    safePoskamlingList.forEach(p => p && addStat(p.desaKelurahan || p.desa, p.kecamatan, 'pos'));
    safePatroliList.forEach(p => p && addStat(p.desaKelurahan || p.desa, p.kecamatan, 'pat'));
    safeSatlinmasList.forEach(p => p && addStat(p.desaKelurahan || p.desa, p.kecamatan, 'lin'));
    return map;
  }, [safePoskamlingList, safePatroliList, safeSatlinmasList]);

  // Daftar Desa Dinamis Berdasarkan Kecamatan yang Terpilih
  const availableDesaList = useMemo(() => {
    if (!geoDesaData || !Array.isArray(geoDesaData.features) || publicMapKecamatan === 'semua') return [];

    const features = geoDesaData.features.filter(
      f => f?.properties?.WADMKC && typeof f.properties.WADMKC === 'string' && f.properties.WADMKC.toLowerCase() === publicMapKecamatan.toLowerCase()
    );

    const map = new Map();
    features.forEach(f => {
      const nama = f?.properties?.NAMOBJ;
      const kec = f?.properties?.WADMKC;
      if (nama && !map.has(nama)) {
        map.set(nama, {
          nama: String(nama),
          kecamatan: String(kec || ''),
          areaHa: Math.round((f.properties?.SHAPE_Area || 0) / 10000),
          properties: f.properties || {}
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a?.nama || '').localeCompare(b?.nama || ''));
  }, [geoDesaData, publicMapKecamatan]);

  // Informasi Detail Desa yang Sedang Terpilih
  const selectedDesaInfo = useMemo(() => {
    if (publicMapDesa === 'semua' || !geoDesaData || !Array.isArray(geoDesaData.features)) return null;

    const feature = geoDesaData.features.find(f => {
      const matchDesa = f?.properties?.NAMOBJ && typeof f.properties.NAMOBJ === 'string' && f.properties.NAMOBJ.toLowerCase() === publicMapDesa.toLowerCase();
      if (publicMapKecamatan === 'semua') return matchDesa;
      return matchDesa && f?.properties?.WADMKC && typeof f.properties.WADMKC === 'string' && f.properties.WADMKC.toLowerCase() === publicMapKecamatan.toLowerCase();
    });

    if (!feature) return null;

    const props = feature.properties || {};
    const dName = (props.NAMOBJ || '').toLowerCase().trim();
    const kName = (props.WADMKC || '').toLowerCase().trim();
    const key = `${kName}_${dName}`;
    const dStat = desaStatsMap.get(key) || desaStatsMap.get(dName) || { pos: 0, pat: 0, lin: 0, total: 0 };

    return {
      nama: props.NAMOBJ || 'Desa',
      kecamatan: props.WADMKC || 'Kecamatan',
      luasHa: Math.round((props.SHAPE_Area || 0) / 10000).toLocaleString('id-ID'),
      posCount: dStat.pos,
      patCount: dStat.pat,
      linCount: dStat.lin,
      totalTitik: dStat.total
    };
  }, [publicMapDesa, publicMapKecamatan, geoDesaData, desaStatsMap]);

  // Inisialisasi Canvas Leaflet Map (Terkunci Ketat ke Kabupaten Hulu Sungai Tengah)
  useEffect(() => {
    if (!publicMapRef.current) return;

    try {
      // Bersihkan jika container pernah terikat ke instance Leaflet sebelumnya
      if (publicMapRef.current._leaflet_id) {
        publicMapRef.current._leaflet_id = null;
      }

      if (!publicMapInstanceRef.current) {
        const map = L.map(publicMapRef.current, {
          center: HST_CENTER,
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: false,
          maxBounds: HST_MAX_BOUNDS,
          maxBoundsViscosity: 1.0,
          minZoom: 10,
          maxZoom: 18
        });

        // Fit fokus langsung ke seluruh cakupan wilayah Kabupaten Hulu Sungai Tengah
        map.fitBounds(HST_EXACT_BOUNDS, { padding: [15, 15] });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors | LINDUNGMAS HST',
          maxZoom: 18
        }).addTo(map);

        // Urutan layer (Batas Kecamatan -> Batas Desa -> Titik Markers)
        kecamatanLayerRef.current = L.layerGroup().addTo(map);
        desaLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);

        publicMapInstanceRef.current = map;
      }
    } catch (err) {
      console.warn('Leaflet map init warning:', err);
    }

    return () => {
      try {
        if (publicMapInstanceRef.current) {
          publicMapInstanceRef.current.remove();
          publicMapInstanceRef.current = null;
        }
      } catch (err) {
        console.warn('Leaflet cleanup warning:', err);
      }
    };
  }, []);

  // 1. RENDER LAYER BATAS KECAMATAN (map.json)
  useEffect(() => {
    if (!publicMapInstanceRef.current || !kecamatanLayerRef.current || !geoKecamatanData) return;

    try {
      kecamatanLayerRef.current.clearLayers();
      kecFeaturesMapRef.current.clear();

      if (!showKecamatanBorders) return;

      const layer = L.geoJSON(geoKecamatanData, {
        style: (feature) => {
          const rawNama = feature?.properties?.nama || '';
          const kecNama = rawNama.toLowerCase();
          const stat = kecStatsMap.get(kecNama);
          const count = stat ? stat.total : 0;
          const isSelected = publicMapKecamatan !== 'semua' && publicMapKecamatan.toLowerCase() === kecNama;
          const isAnyKecSelected = publicMapKecamatan !== 'semua';
          const g = getWarnaAktivitasWilayah(count);

          if (isSelected) {
            return {
              color: '#0F2A4A',
              weight: 3.5,
              opacity: 1,
              fillColor: '#F0B429',
              fillOpacity: 0.65,
              dashArray: null
            };
          }

          return {
            color: isAnyKecSelected ? '#94A3B8' : g.border,
            weight: isAnyKecSelected ? 1.5 : 2,
            opacity: isAnyKecSelected ? 0.45 : 0.85,
            fillColor: g.fill,
            fillOpacity: isAnyKecSelected ? 0.05 : g.opacity,
            dashArray: count === 0 ? '4, 4' : null
          };
        },
        onEachFeature: (feature, layerItem) => {
          const rawNama = feature?.properties?.nama || '';
          const titleNama = rawNama
            .toLowerCase()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          kecFeaturesMapRef.current.set(rawNama.toLowerCase(), layerItem);
          kecFeaturesMapRef.current.set(titleNama.toLowerCase(), layerItem);

          const stat = kecStatsMap.get(rawNama.toLowerCase());
          const count = stat?.total || 0;
          const g = getWarnaAktivitasWilayah(count);

          layerItem.bindTooltip(`
            <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px; min-width: 160px;">
              <div style="font-weight: 800; color: #0F2A4A; font-size: 13px;">Kecamatan ${titleNama}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                Poskamling: <b>${stat?.posCount || 0}</b> | Patroli: <b>${stat?.patCount || 0}</b> | Linmas: <b>${stat?.linCount || 0}</b>
              </div>
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background-color: ${g.fill}; border: 1px solid ${g.border};"></span>
                <span style="font-size: 10px; font-weight: 800; color: ${count > 0 ? '#065F46' : '#64748B'};">
                  ${count > 0 ? `Total: ${count} Data (Pos, Patroli & Linmas)` : 'Belum Ada Data'}
                </span>
              </div>
              <div style="font-size: 10px; color: #2563EB; font-weight: 700; margin-top: 4px;">
                👉 Klik untuk masuk & lihat desa-desa
              </div>
            </div>
          `, { sticky: true, direction: 'top' });

          layerItem.on({
            mouseover: (e) => {
              const l = e.target;
              const isSelected = publicMapKecamatan !== 'semua' && publicMapKecamatan.toLowerCase() === rawNama.toLowerCase();
              if (!isSelected) {
                l.setStyle({ weight: 3, fillOpacity: 0.22, color: '#0F2A4A' });
              }
            },
            mouseout: (e) => {
              const l = e.target;
              const isSelected = publicMapKecamatan !== 'semua' && publicMapKecamatan.toLowerCase() === rawNama.toLowerCase();
              if (!isSelected) {
                layer.resetStyle(l);
              }
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setPublicMapKecamatan(titleNama);
              setPublicMapDesa('semua');
            }
          });
        }
      });

      kecamatanLayerRef.current.addLayer(layer);
    } catch (err) {
      console.warn('Gagal render layer batas kecamatan:', err);
    }
  }, [geoKecamatanData, publicMapKecamatan, showKecamatanBorders, kecStatsMap]);

  // 2. RENDER LAYER BATAS DESA (desa_hst.geojson - 169 DESA DENGAN FITUR KLIK LEVEL DESA)
  useEffect(() => {
    if (!publicMapInstanceRef.current || !desaLayerRef.current || !geoDesaData) return;

    try {
      desaLayerRef.current.clearLayers();
      desaFeaturesMapRef.current.clear();

      if (!showDesaBorders) return;

      const layer = L.geoJSON(geoDesaData, {
        filter: (feature) => {
          if (publicMapKecamatan === 'semua') return true;
          const wadm = feature?.properties?.WADMKC;
          return wadm && wadm.toLowerCase() === publicMapKecamatan.toLowerCase();
        },
        style: (feature) => {
          const props = feature?.properties || {};
          const namaDesa = (props.NAMOBJ || '').toLowerCase().trim();
          const namaKec = (props.WADMKC || '').toLowerCase().trim();
          const key = `${namaKec}_${namaDesa}`;
          const dStat = desaStatsMap.get(key) || desaStatsMap.get(namaDesa);
          const count = dStat ? dStat.total : 0;
          const isSelectedDesa = publicMapDesa !== 'semua' && publicMapDesa.toLowerCase().trim() === namaDesa;
          const g = getWarnaAktivitasWilayah(count);

          if (isSelectedDesa) {
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
            weight: 1.2,
            opacity: 0.75,
            fillColor: g.fill,
            fillOpacity: g.opacity,
            dashArray: count === 0 ? '2, 3' : null
          };
        },
        onEachFeature: (feature, layerItem) => {
          const props = feature?.properties || {};
          const namaDesa = props.NAMOBJ || 'Desa';
          const namaKec = props.WADMKC || 'Kecamatan';
          const luasHa = Math.round((props.SHAPE_Area || 0) / 10000);
          const key = `${namaKec.toLowerCase().trim()}_${namaDesa.toLowerCase().trim()}`;
          
          desaFeaturesMapRef.current.set(key, layerItem);
          desaFeaturesMapRef.current.set(namaDesa.toLowerCase().trim(), layerItem);

          const dStat = desaStatsMap.get(key) || desaStatsMap.get(namaDesa.toLowerCase().trim());
          const count = dStat ? dStat.total : 0;
          const g = getWarnaAktivitasWilayah(count);

          layerItem.bindTooltip(`
            <div style="font-family: inherit; font-size: 11.5px; line-height: 1.4; padding: 4px; min-width: 160px;">
              <div style="font-weight: 800; color: #0F2A4A; font-size: 12.5px;">Desa/Kel. ${namaDesa}</div>
              <div style="font-size: 10px; color: #475569;">Kec. ${namaKec} &bull; Luas: ${luasHa.toLocaleString('id-ID')} Ha</div>
              <div style="font-size: 10px; color: #334155; margin-top: 3px;">
                Poskamling: <b>${dStat?.pos || 0}</b> | Patroli: <b>${dStat?.pat || 0}</b> | Linmas: <b>${dStat?.lin || 0}</b>
              </div>
              <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                <span style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background-color: ${g.fill}; border: 1px solid ${g.border};"></span>
                <span style="font-size: 10px; font-weight: 800; color: ${count > 0 ? '#065F46' : '#64748B'};">
                  ${count > 0 ? `Total: ${count} Data (Pos, Patroli & Linmas)` : 'Belum Ada Data'}
                </span>
              </div>
              <div style="font-size: 9.5px; color: #0284C7; font-weight: 700; margin-top: 4px;">
                👉 Klik untuk fokus level desa ini
              </div>
            </div>
          `, { sticky: true, direction: 'top' });

          layerItem.on({
            mouseover: (e) => {
              const l = e.target;
              const isSelected = publicMapDesa !== 'semua' && publicMapDesa.toLowerCase().trim() === namaDesa.toLowerCase().trim();
              if (!isSelected) {
                l.setStyle({ weight: 3, fillOpacity: 0.35, color: '#0F2A4A' });
              }
            },
            mouseout: (e) => {
              const l = e.target;
              const isSelected = publicMapDesa !== 'semua' && publicMapDesa.toLowerCase().trim() === namaDesa.toLowerCase().trim();
              if (!isSelected) {
                layer.resetStyle(l);
              }
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setPublicMapKecamatan(namaKec);
              setPublicMapDesa(namaDesa);
            }
          });
        }
      });

      desaLayerRef.current.addLayer(layer);
    } catch (err) {
      console.warn('Gagal render layer batas desa:', err);
    }
  }, [geoDesaData, publicMapKecamatan, publicMapDesa, showDesaBorders, desaStatsMap]);

  // 3. AUTO FIT BOUNDS HIERARKI: KABUPATEN HST -> KECAMATAN -> DESA
  useEffect(() => {
    if (!publicMapInstanceRef.current) return;
    try {
      const map = publicMapInstanceRef.current;

      // A. LEVEL DESA: Jika desa spesifik dipilih, zoom & fokus langsung ke poligon desa tersebut
      if (publicMapDesa !== 'semua') {
        const key = `${(publicMapKecamatan || '').toLowerCase().trim()}_${publicMapDesa.toLowerCase().trim()}`;
        const targetDesaLayer = desaFeaturesMapRef.current.get(key) || desaFeaturesMapRef.current.get(publicMapDesa.toLowerCase().trim());
        if (targetDesaLayer && targetDesaLayer.getBounds) {
          map.fitBounds(targetDesaLayer.getBounds(), { padding: [35, 35], maxZoom: 16, animate: true });
          return;
        }
      }

      // B. LEVEL KECAMATAN: Jika kecamatan dipilih, zoom & fokus ke poligon kecamatan tersebut
      if (publicMapKecamatan !== 'semua') {
        const targetLayer = kecFeaturesMapRef.current.get((publicMapKecamatan || '').toLowerCase());
        if (targetLayer && targetLayer.getBounds) {
          map.fitBounds(targetLayer.getBounds(), { padding: [30, 30], maxZoom: 14, animate: true });
        } else {
          const foundKec = safeWilayahList.find(
            k => (k?.nama || k?.kecamatan || '').toLowerCase() === (publicMapKecamatan || '').toLowerCase()
          );
          if (foundKec && foundKec.lat && foundKec.lng) {
            map.setView([Number(foundKec.lat), Number(foundKec.lng)], 13, { animate: true });
          }
        }
        return;
      }

      // C. LEVEL AWAL: KABUPATEN HULU SUNGAI TENGAH LENGKAP
      map.fitBounds(HST_EXACT_BOUNDS, { padding: [15, 15], animate: true });
    } catch (err) {
      console.warn('Auto fit bounds error:', err);
    }
  }, [publicMapKecamatan, publicMapDesa, safeWilayahList]);

  // Handler tombol Kunci & Reset Fokus ke Seluruh Kabupaten Hulu Sungai Tengah
  const handleLockFocusHST = () => {
    setPublicMapKecamatan('semua');
    setPublicMapDesa('semua');
    try {
      if (publicMapInstanceRef.current) {
        publicMapInstanceRef.current.fitBounds(HST_EXACT_BOUNDS, { padding: [15, 15], animate: true });
      }
    } catch (err) {
      console.warn('Reset focus error:', err);
    }
  };

  // 4. RENDER TITIK SPASIAL (POSKAMLING, PATROLI, SATLINMAS)
  useEffect(() => {
    if (!publicMapInstanceRef.current || !markersLayerRef.current) return;

    try {
      markersLayerRef.current.clearLayers();

      // Filter berjenjang: Kecamatan & Desa
      const isMatchLoc = (kec, desa) => {
        if (publicMapKecamatan !== 'semua' && (kec || '').toLowerCase().trim() !== (publicMapKecamatan || '').toLowerCase().trim()) {
          return false;
        }
        if (publicMapDesa !== 'semua') {
          const d = (desa || '').toLowerCase().trim();
          return d === (publicMapDesa || '').toLowerCase().trim();
        }
        return true;
      };

      // A. Render Poskamling Markers
      if (publicMapSource === 'semua' || publicMapSource === 'poskamling') {
        safePoskamlingList.forEach((pos, idx) => {
          if (!pos) return;
          let lat = Number(pos.lat);
          let lng = Number(pos.lng);

          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const foundDesa = desaCentroids.get((pos.desaKelurahan || pos.desa || '').toLowerCase().trim());
            if (foundDesa) {
              lat = foundDesa.lat + (idx % 3) * 0.001;
              lng = foundDesa.lng + (idx % 3) * 0.001;
            } else {
              const foundKec = safeWilayahList.find(
                k => (k?.nama || k?.kecamatan || '').toLowerCase() === (pos.kecamatan || '').toLowerCase()
              );
              if (foundKec && foundKec.lat && foundKec.lng) {
                lat = Number(foundKec.lat) + (idx % 3) * 0.002;
                lng = Number(foundKec.lng) + (idx % 3) * 0.002;
              }
            }
          }

          if (lat && lng && isMatchLoc(pos.kecamatan, pos.desaKelurahan || pos.desa)) {
            const icon = L.divIcon({
              className: 'custom-pin',
              html: `
                <div style="background-color: #D97706; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                  <span style="transform: rotate(45deg); color: white; font-size: 13px;">📻</span>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            });

            const m = L.marker([lat, lng], { icon });
            m.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; width: 220px; line-height: 1.4;">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; background: #FEF3C7; color: #92400E;">
                  📻 POSKAMLING / POS RONDA
                </span>
                <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin: 4px 0 2px 0;">${pos.namaPoskamling || 'Pos Ronda'}</div>
                <div style="color: #475569; font-size: 11px;">📍 RT ${pos.rt || '-'} / RW ${pos.rw || '-'}, Desa ${pos.desaKelurahan || pos.desa || '-'}, Kec. ${pos.kecamatan || '-'}</div>
                <div style="color: #059669; font-weight: bold; margin-top: 4px; font-size: 11px;">Kondisi: ${pos.kondisiFisik || 'Baik'}</div>
                <div style="color: #D97706; font-weight: 700; font-size: 10.5px;">Ketua: ${pos.namaKetuaPos || '-'} (${pos.kontakWa || '-'})</div>
              </div>
            `);
            markersLayerRef.current.addLayer(m);
          }
        });
      }

      // B. Render Kegiatan Patroli Markers
      if (publicMapSource === 'semua' || publicMapSource === 'patroli') {
        safePatroliList.forEach((pat, idx) => {
          if (!pat) return;
          let lat = Number(pat.lat);
          let lng = Number(pat.lng);

          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const foundDesa = desaCentroids.get((pat.desaKelurahan || pat.desa || '').toLowerCase().trim());
            if (foundDesa) {
              lat = foundDesa.lat + (idx % 3) * 0.001;
              lng = foundDesa.lng + (idx % 3) * 0.001;
            } else {
              const foundKec = safeWilayahList.find(
                k => (k?.nama || k?.kecamatan || '').toLowerCase() === (pat.kecamatan || '').toLowerCase()
              );
              if (foundKec && foundKec.lat && foundKec.lng) {
                lat = Number(foundKec.lat) + (idx % 3) * 0.002;
                lng = Number(foundKec.lng) + (idx % 3) * 0.002;
              }
            }
          }

          if (lat && lng && isMatchLoc(pat.kecamatan, pat.desaKelurahan || pat.desa)) {
            const icon = L.divIcon({
              className: 'custom-pin',
              html: `
                <div style="background-color: #059669; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                  <span style="transform: rotate(45deg); color: white; font-size: 13px;">🚓</span>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            });

            const m = L.marker([lat, lng], { icon });
            m.bindPopup(`
              <div style="font-family: inherit; font-size: 12px; width: 220px; line-height: 1.4;">
                <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; background: #ECFDF5; color: #059669;">
                  🚓 PATROLI LAPANGAN GPS
                </span>
                <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin: 4px 0 2px 0;">${pat.judulPatroli || pat.judul || 'Patroli Trantibum'}</div>
                <div style="color: #475569; font-size: 11px;">📍 Kec. ${pat.kecamatan || '-'} &bull; ${pat.waktuLapor || pat.waktu || 'Tercatat'}</div>
                <div style="color: #059669; font-weight: bold; margin-top: 4px; font-size: 11px;">Situasi: ${pat.statusSituasi || 'Kondusif'}</div>
                <div style="color: #64748B; font-size: 10.5px; margin-top: 2px;">Petugas: ${pat.petugasPelapor || '-'}</div>
              </div>
            `);
            markersLayerRef.current.addLayer(m);
          }
        });
      }

      // C. Render Satlinmas Markers
      if (publicMapSource === 'semua' || publicMapSource === 'satlinmas') {
        safeSatlinmasList.forEach((lin, idx) => {
          if (!lin) return;
          if (!isMatchLoc(lin.kecamatan, lin.desaKelurahan || lin.desa)) return;
          const dKey = (lin.desaKelurahan || lin.desa || '').toLowerCase().trim();
          const kKey = (lin.kecamatan || '').toLowerCase().trim();
          const foundDesa = desaCentroids.get(`${kKey}_${dKey}`) || desaCentroids.get(dKey);

          let baseLat = -2.5833;
          let baseLng = 115.3811;

          if (foundDesa) {
            baseLat = foundDesa.lat;
            baseLng = foundDesa.lng;
          } else {
            const foundKec = safeWilayahList.find(
              k => (k?.nama || k?.kecamatan || '').toLowerCase() === kKey
            ) || KECAMATAN_HST[0];
            baseLat = Number(foundKec?.lat) || -2.5833;
            baseLng = Number(foundKec?.lng) || 115.3811;
          }

          const angle = (idx * 137.5 * Math.PI) / 180;
          const radius = 0.0022 * Math.sqrt((idx % 6) + 1);
          const lat = baseLat + radius * Math.cos(angle);
          const lng = baseLng + radius * Math.sin(angle);

          const icon = L.divIcon({
            className: 'custom-pin',
            html: `
              <div style="background-color: #0F2A4A; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #F0B429; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                <span style="transform: rotate(45deg); color: #F0B429; font-size: 13px;">🛡️</span>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });

          const m = L.marker([lat, lng], { icon });
          m.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; width: 210px; line-height: 1.4;">
              <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; background: #0F2A4A; color: #F0B429;">
                🛡️ ANGGOTA SATLINMAS
              </span>
              <div style="font-weight: 800; color: #0F2A4A; font-size: 13px; margin: 4px 0 2px 0;">${lin.nama || 'Anggota Linmas'}</div>
              <div style="color: #475569; font-size: 11px;">Penugasan: Desa ${lin.desaKelurahan || lin.desa || '-'}, Kec. ${lin.kecamatan || '-'}</div>
              <div style="color: #64748B; font-mono; font-size: 10px; margin-top: 3px;">Reg: ${lin.noRegistrasi || '-'}</div>
            </div>
          `);
          markersLayerRef.current.addLayer(m);
        });
      }
    } catch (err) {
      console.warn('Error rendering public map markers:', err);
    }
  }, [safePoskamlingList, safePatroliList, safeSatlinmasList, publicMapSource, publicMapKecamatan, publicMapDesa, safeWilayahList, desaCentroids]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-800 font-sans flex flex-col selection:bg-[#F0B429] selection:text-[#0F2A4A]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR / HEADER */}
      {/* ========================================================================= */}
      <header className={`sticky top-0 z-50 transition-all duration-300 text-white ${
        isScrolled 
          ? 'bg-[#0F2A4A]/95 backdrop-blur-xl shadow-xl shadow-slate-950/20 border-b border-slate-700/80' 
          : 'bg-[#0F2A4A]/90 backdrop-blur-md border-b border-slate-700/50'
      }`}>
        <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 transition-all duration-300 ${
          isScrolled ? 'h-16' : 'h-20'
        }`}>
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => scrollToSection('beranda')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
          >
            <div className={`rounded-2xl bg-gradient-to-br from-[#F0B429] to-[#d99f1f] p-0.5 shadow-md shadow-[#F0B429]/20 flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 ${
              isScrolled ? 'w-10 h-10' : 'w-11 h-11'
            }`}>
              <div className="w-full h-full bg-[#0F2A4A] rounded-[14px] flex items-center justify-center text-[#F0B429]">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                  LINDUNGMAS HST
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#F0B429] text-[#0F2A4A] rounded uppercase tracking-wider">
                  Resmi
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-1 leading-none whitespace-nowrap hidden sm:block">
                Layanan Informasi & Data Perlindungan Masyarakat Kab. HST
              </p>
            </div>
          </div>

          {/* Center Navigation Capsule - strictly aligned with admin features */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.07] backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-slate-200 shadow-inner">
            <button 
              type="button" 
              onClick={() => scrollToSection('beranda')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'beranda' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Beranda
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('peta-digital')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'peta-digital' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10 text-amber-300 font-bold'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta Digital</span>
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('fitur')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'fitur' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Fitur Layanan
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('wilayah')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'wilayah' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Cakupan Wilayah
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('kontak')} 
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeSection === 'kontak' 
                  ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold shadow-xs' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              Kontak
            </button>
          </nav>

          {/* Right Action: Masuk Portal Petugas */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] flex items-center gap-1.5 shadow-md shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-[#0F2A4A] shrink-0" />
              <span>Masuk Portal Petugas</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A1F36]/98 backdrop-blur-xl border-t border-slate-700/80 px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200 shadow-2xl space-y-3">
            <div className="flex flex-col gap-1 text-sm font-semibold text-slate-200">
              <button 
                type="button" 
                onClick={() => scrollToSection('beranda')} 
                className={`text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeSection === 'beranda' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Beranda
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('peta-digital')} 
                className={`text-left px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
                  activeSection === 'peta-digital' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10 text-amber-300 font-bold'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Peta Digital Spasial HST</span>
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('fitur')} 
                className={`text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeSection === 'fitur' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Fitur Layanan
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('wilayah')} 
                className={`text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeSection === 'wilayah' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Cakupan Wilayah
              </button>
              <button 
                type="button" 
                onClick={() => scrollToSection('kontak')} 
                className={`text-left px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                  activeSection === 'kontak' ? 'bg-[#F0B429] text-[#0F2A4A] font-extrabold' : 'hover:bg-white/10'
                }`}
              >
                Kontak
              </button>
            </div>

            <div className="pt-3 border-t border-slate-700/80 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToLogin();
                }}
                className="w-full py-3 rounded-xl text-xs font-extrabold bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Portal Petugas</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="beranda" className="relative bg-gradient-to-b from-[#0F2A4A] via-[#14365D] to-[#0F2A4A] text-white pt-16 pb-24 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F0B429]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-32 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Government Badges */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse"></span>
              <span>Pemerintah Kabupaten Hulu Sungai Tengah</span>
              <span className="text-slate-400">•</span>
              <span className="text-[#F0B429] font-bold">Satpol PP & Linmas HST</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Layanan Informasi & Data <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-[#F0B429] to-yellow-200">
                Perlindungan Masyarakat HST
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Platform operasional resmi Satpol PP & Linmas Pemkab Hulu Sungai Tengah untuk digitalisasi Satuan Perlindungan Masyarakat (Satlinmas), inventarisasi Poskamling berbasis GIS, dan monitoring kegiatan patroli lapangan berkoordinat GPS di 11 Kecamatan & 169 Desa/Kelurahan.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => scrollToSection('peta-digital')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-[#F0B429]/25 hover:shadow-[#F0B429]/40 transition-all cursor-pointer active:scale-95"
              >
                <MapPin className="w-4 h-4 text-[#0F2A4A]" />
                <span>Eksplorasi Peta Digital</span>
                <ArrowRight className="w-4 h-4 text-[#0F2A4A]" />
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/25 flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md active:scale-95"
              >
                <LogIn className="w-4 h-4 text-[#F0B429]" />
                <span>Masuk Portal Petugas / Admin</span>
              </button>
            </div>
          </div>

          {/* 4 Key Highlights matching Admin Menu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-lg">
                🛡️
              </div>
              <h3 className="font-bold text-white text-sm">Data Satlinmas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Formulir 17 Kolom Baku, Pas Foto, dan Arsip SK Satlinmas Bupati/Camat.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#F0B429]/20 text-[#F0B429] flex items-center justify-center font-bold text-lg">
                📻
              </div>
              <h3 className="font-bold text-white text-sm">Data Poskamling</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pemetaan titik koordinat GIS pos ronda, kelayakan fisik, dan 8 sarana wajib.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg">
                🚓
              </div>
              <h3 className="font-bold text-white text-sm">Kegiatan & Patroli</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monitoring patroli lapangan cepat dengan penguncian titik koordinat GPS Live.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-left space-y-2 hover:bg-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-lg">
                🪪
              </div>
              <h3 className="font-bold text-white text-sm">Cetak Kartu Anggota</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generator Kartu Tanda Anggota (KTA) standar CR80 ber-QR verifikasi resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PUBLIC TRANSPARENCY STATISTICS */}
      {/* ========================================================================= */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0F2A4A] font-mono block">
                {safeSatlinmasList.length || 12}
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Personel Satlinmas</span>
              <span className="text-[11px] text-slate-400">Terdata 17 Urutan Baku</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#D97706] font-mono block">
                {safePoskamlingList.length || 8}
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Poskamling Terpetakan</span>
              <span className="text-[11px] text-slate-400">Titik Koordinat GIS</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#059669] font-mono block">
                {safePatroliList.length || 5}
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Laporan Patroli GPS</span>
              <span className="text-[11px] text-slate-400">Kunci Koordinat Riil</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <span className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono block">
                11 / 169
              </span>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mt-1">Kecamatan & Desa</span>
              <span className="text-[11px] text-slate-400">Cakupan wilayah hukum HST</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE PETA DIGITAL SECTION */}
      {/* ========================================================================= */}
      <section id="peta-digital" className="py-20 bg-gradient-to-b from-white via-slate-50 to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-[#F0B429]/30 px-3.5 py-1 rounded-full border border-[#F0B429]/50">
              Sistem Informasi Geospasial (GIS) Terbuka
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F2A4A] tracking-tight">
              Peta Digital Perlindungan Masyarakat HST
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Visualisasi geospasial sebaran fisik Poskamling (📻), pergerakan kegiatan patroli lapangan ber-GPS (🚓), serta penugasan personel Satlinmas (🛡️) di 11 Kecamatan & 169 Desa/Kelurahan se-Kabupaten Hulu Sungai Tengah.
            </p>
          </div>

          {/* Map Container Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Filter Controls Row */}
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
              {/* Breadcrumb Navigasi Tingkat Wilayah: Kabupaten HST > Kecamatan > Desa */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[11px] mr-1">Tingkat Wilayah:</span>
                
                <button
                  type="button"
                  onClick={handleLockFocusHST}
                  className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    publicMapKecamatan === 'semua' && publicMapDesa === 'semua'
                      ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>🏛️ Seluruh Kab. HST</span>
                </button>

                {publicMapKecamatan !== 'semua' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setPublicMapDesa('semua')}
                      className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        publicMapDesa === 'semua'
                          ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>🏙️ Kec. {publicMapKecamatan}</span>
                    </button>
                  </>
                )}

                {publicMapDesa !== 'semua' && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-xl font-bold bg-[#F0B429] text-[#0F2A4A] shadow-xs flex items-center gap-1">
                      <span>📍 Desa/Kel. {publicMapDesa}</span>
                    </span>
                  </>
                )}

                {(publicMapKecamatan !== 'semua' || publicMapDesa !== 'semua') && (
                  <button
                    type="button"
                    onClick={handleLockFocusHST}
                    className="ml-auto text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kembali ke Seluruh HST</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPublicMapSource('semua')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      publicMapSource === 'semua'
                        ? 'bg-white text-[#0F2A4A] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Titik
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicMapSource('poskamling')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      publicMapSource === 'poskamling'
                        ? 'bg-[#D97706] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📻 Poskamling ({safePoskamlingList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicMapSource('patroli')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      publicMapSource === 'patroli'
                        ? 'bg-[#059669] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🚓 Patroli GPS ({safePatroliList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicMapSource('satlinmas')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      publicMapSource === 'satlinmas'
                        ? 'bg-[#0F2A4A] text-[#F0B429] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🛡️ Satlinmas ({safeSatlinmasList.length})</span>
                  </button>
                </div>

                {/* Filter Kecamatan, Filter Desa, Tombol Kunci Fokus HST & Button to Dashboard */}
                <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                  {/* Select Kecamatan */}
                  <select
                    value={publicMapKecamatan}
                    onChange={(e) => {
                      setPublicMapKecamatan(e.target.value);
                      setPublicMapDesa('semua');
                    }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#0F2A4A] outline-hidden cursor-pointer"
                  >
                    <option value="semua">Semua Kecamatan (11 HST)</option>
                    {KECAMATAN_HST.map(k => (
                      <option key={k.id} value={k.nama}>Kec. {k.nama}</option>
                    ))}
                  </select>

                  {/* Select Desa / Kelurahan Berjenjang */}
                  <select
                    value={publicMapDesa}
                    disabled={publicMapKecamatan === 'semua'}
                    onChange={(e) => setPublicMapDesa(e.target.value)}
                    className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-bold rounded-xl border outline-hidden cursor-pointer transition-colors ${
                      publicMapKecamatan === 'semua'
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-amber-300 text-slate-800 focus:ring-2 focus:ring-amber-500'
                    }`}
                  >
                    <option value="semua">
                      {publicMapKecamatan === 'semua' ? 'Pilih Kecamatan Dulu...' : `Semua Desa (${availableDesaList.length})`}
                    </option>
                    {availableDesaList.map(d => (
                      <option key={d.nama} value={d.nama}>Desa {d.nama}</option>
                    ))}
                  </select>

                  {/* Tombol Kunci & Fokus Kabupaten Hulu Sungai Tengah */}
                  <button
                    type="button"
                    onClick={handleLockFocusHST}
                    className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 bg-amber-500 hover:bg-amber-600 text-[#0F2A4A] rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    title="Kunci dan kembalikan fokus peta langsung ke seluruh batas wilayah Kabupaten Hulu Sungai Tengah"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#0F2A4A]" />
                    <span>Fokus Kab. HST</span>
                  </button>

                  <button
                    type="button"
                    onClick={onExploreMap || onNavigateToLogin}
                    className="w-full sm:w-auto justify-center px-4 py-2 sm:py-1.5 bg-[#0F2A4A] hover:bg-[#14365D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Peta Lengkap Petugas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#F0B429]" />
                  </button>
                </div>
              </div>

              {/* Layer GeoJSON Batas Desa & Kecamatan Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Layer Spasial Batas Wilayah:</span>
                  </span>

                  {/* Toggle Batas Kecamatan */}
                  <button
                    type="button"
                    onClick={() => setShowKecamatanBorders(prev => !prev)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border transition-all cursor-pointer ${
                      showKecamatanBorders
                        ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center ${showKecamatanBorders ? 'bg-blue-600 border-blue-600' : 'border-slate-400'}`}>
                      {showKecamatanBorders && <Check className="w-2 h-2 text-white" />}
                    </span>
                    <span>Batas 11 Kecamatan</span>
                  </button>

                  {/* Toggle Batas Desa */}
                  <button
                    type="button"
                    onClick={() => setShowDesaBorders(prev => !prev)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 border transition-all cursor-pointer ${
                      showDesaBorders
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-xs border flex items-center justify-center ${showDesaBorders ? 'bg-amber-600 border-amber-600' : 'border-slate-400'}`}>
                      {showDesaBorders && <Check className="w-2 h-2 text-white" />}
                    </span>
                    <span>Batas 169 Desa / Kelurahan</span>
                  </button>
                </div>

                {/* Status loading or success */}
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">
                    {isLoadingGeo ? 'Memuat Batas Wilayah...' : 'Batas Wilayah 11 Kecamatan & 169 Desa Aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Informasi Desa Aktif jika Desa Terpilih */}
            {selectedDesaInfo && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-[#0F2A4A] flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    📍
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[#0F2A4A] text-sm">
                        Desa/Kelurahan {selectedDesaInfo.nama}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F2A4A] text-[#F0B429]">
                        Kec. {selectedDesaInfo.kecamatan}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Luas Wilayah: <strong>{selectedDesaInfo.luasHa} Ha</strong> &bull; Terdata <strong>{selectedDesaInfo.totalTitik} Titik Operasional</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-slate-700 shadow-2xs">
                    📻 {selectedDesaInfo.posCount} Poskamling
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-slate-700 shadow-2xs">
                    🚓 {selectedDesaInfo.patCount} Patroli GPS
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-slate-700 shadow-2xs">
                    🛡️ {selectedDesaInfo.linCount} Satlinmas
                  </span>
                  <button
                    type="button"
                    onClick={() => setPublicMapDesa('semua')}
                    className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Tutup fokus desa dan kembali ke tingkat kecamatan"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tutup Fokus</span>
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Leaflet Map Canvas */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <div ref={publicMapRef} className="w-full h-[400px] sm:h-[480px] lg:h-[540px] z-10" />

              {/* Floating Quick Lock HST Button on Canvas */}
              <div className="absolute top-3 left-14 z-20">
                <button
                  type="button"
                  onClick={handleLockFocusHST}
                  className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-bold text-[#0F2A4A] flex items-center gap-1.5 hover:bg-amber-50 hover:border-amber-400 transition-all cursor-pointer active:scale-95"
                  title="Kembalikan dan kunci fokus ke seluruh batas Kabupaten Hulu Sungai Tengah"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kunci Fokus Kab. HST</span>
                </button>
              </div>

              {/* Floating Legend */}
              <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 text-xs space-y-2 max-w-[260px] hidden sm:block">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F2A4A] block">
                  Legenda Spasial & Titik GIS
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-2.5 rounded-xs border-2 border-[#1E3A8A] bg-blue-500/20" />
                    <span className="font-semibold text-slate-700">Batas 11 Kecamatan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-2.5 rounded-xs border border-dashed border-slate-500 bg-amber-500/20" />
                    <span className="font-semibold text-slate-700">Batas 169 Desa / Kelurahan</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                    <span className="font-semibold text-slate-700">Poskamling (Pos Ronda)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    <span className="font-semibold text-slate-700">Kegiatan Patroli GPS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F2A4A]" />
                    <span className="font-semibold text-slate-700">Personel Satlinmas</span>
                  </div>

                  {/* Skala Warna Sebaran Wilayah */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-700 block uppercase tracking-wider">
                      Warna Wilayah (Pos, Patroli & Linmas)
                    </span>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      Semakin banyak data di wilayah, warna semakin pekat:
                    </p>
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      <div className="text-center">
                        <div className="h-2 rounded-xs border border-slate-300" style={{ backgroundColor: '#F8FAFC' }} />
                        <span className="text-[8px] text-slate-500 block mt-0.5">0 Data</span>
                      </div>
                      <div className="text-center">
                        <div className="h-2 rounded-xs border border-emerald-300" style={{ backgroundColor: '#D1FAE5' }} />
                        <span className="text-[8px] text-emerald-800 font-semibold block mt-0.5">1-2</span>
                      </div>
                      <div className="text-center">
                        <div className="h-2 rounded-xs border border-emerald-400" style={{ backgroundColor: '#6EE7B7' }} />
                        <span className="text-[8px] text-emerald-900 font-bold block mt-0.5">3-5</span>
                      </div>
                      <div className="text-center">
                        <div className="h-2 rounded-xs border border-emerald-600" style={{ backgroundColor: '#10B981' }} />
                        <span className="text-[8px] text-emerald-950 font-bold block mt-0.5">6-9</span>
                      </div>
                      <div className="text-center">
                        <div className="h-2 rounded-xs border border-emerald-800" style={{ backgroundColor: '#047857' }} />
                        <span className="text-[8px] text-emerald-950 font-extrabold block mt-0.5">10+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="absolute bottom-3 left-3 z-20 bg-[#0F2A4A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 text-white text-[11px] font-bold shadow-md">
                🔒 Peta terkunci khusus Kabupaten Hulu Sungai Tengah. Klik bidang Kecamatan/Desa atau titik marker untuk melihat informasi detail.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FITUR LAYANAN (HANYA FITUR YANG SESUAI MENU ADMIN) */}
      {/* ========================================================================= */}
      <section id="fitur" className="py-20 bg-[#F5F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-[#F0B429]/30 px-3 py-1 rounded-full border border-[#F0B429]/50">
              Modul & Fitur Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              Sistem Operasional LINDUNGMAS HST
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Dirancang khusus sesuai modul operasional dan data master kedinasan Satpol PP & Linmas Kabupaten Hulu Sungai Tengah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Data Satlinmas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Data Satlinmas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pendataan 17 Urutan Kolom Baku (No. Reg, NIK, Tempat/Tgl Lahir, Alamat, Pendapatan, Th. Pengangkatan, Jml Keluarga, No. HP, Email, Status) + Pas Foto & Berkas SK Penetapan.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>17 Urutan Baku & Lampiran SK</span>
              </div>
            </div>

            {/* 2. Data Poskamling */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#D97706] text-white flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Data Poskamling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inventarisasi pos ronda RT/RW dengan titik koordinat GIS, status operasional tiap malam, kelayakan fisik bangunan, kontak ketua pos, dan pengecekan 8 sarana wajib siskamling.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Titik Koordinat Peta GIS & 8 Fasilitas</span>
              </div>
            </div>

            {/* 3. Kegiatan dan Patroli */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#059669] text-white flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Kegiatan dan Patroli</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan laporan patroli trantibum dan siskamling lapangan mode cepat HP dengan status situasi, hasil temuan lapangan, tindakan diambil, dan kunci GPS akurat.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>GPS Live Terkunci & Evaluasi Situasi</span>
              </div>
            </div>

            {/* 4. Cetak Kartu Anggota */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center">
                <IdCard className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Cetak Kartu Anggota (KTA)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generator Kartu Tanda Anggota format resmi ID Card CR80 tampak muka dan belakang, dilengkapi crop marks, QR Code verifikasi resmi, tanda tangan dinas, dan opsi cetak massal A4.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standar CR80 & Mode Massal A4</span>
              </div>
            </div>

            {/* 5. Peta Digital Geospasial */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0F2A4A] text-[#F0B429] flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Peta Digital Terpadu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pemetaan spasial geospasial berbasis batas poligon resmi 11 kecamatan dan 169 desa/kelurahan HST dengan visualisasi warna sebaran sarana poskamling, kegiatan patroli, dan anggota satlinmas.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>11 Kecamatan & 169 Poligon Desa</span>
              </div>
            </div>

            {/* 6. Data Master & Wilayah */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#0F2A4A] text-base">Data Master & Wilayah</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengelolaan Master Pegawai / Regu Linmas, Master Pelapor, dan struktur wilayah 11 Kecamatan & 169 Desa/Kelurahan Kabupaten Hulu Sungai Tengah.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Master Pegawai, Pelapor & Wilayah</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CAKUPAN WILAYAH (11 KECAMATAN HST) */}
      {/* ========================================================================= */}
      <section id="wilayah" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* 11 Kecamatan di HST */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2A4A] bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
              Cakupan Wilayah Kabupaten
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A4A] tracking-tight">
              11 Kecamatan Kabupaten Hulu Sungai Tengah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Wilayah kerja pembinaan perlindungan masyarakat dan pos siskamling
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {KECAMATAN_HST.map(k => (
              <div key={k.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1 hover:border-[#0F2A4A] transition-colors">
                <span className="text-xs font-extrabold text-[#0F2A4A] block">Kec. {k.nama}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{k.desa?.length || 0} Desa/Kel.</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CTA MASUK SISTEM */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#0F2A4A] via-[#14365D] to-[#0F2A4A] text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center mx-auto font-bold shadow-lg shadow-[#F0B429]/30">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Portal Administrasi & Operasional Petugas
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Halaman sistem ini dikelola oleh aparatur Satuan Polisi Pamong Praja & Damkar Bidang Perlindungan Masyarakat Pemerintah Kabupaten Hulu Sungai Tengah.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-2xl bg-[#F0B429] hover:bg-[#e2a820] text-[#0F2A4A] text-sm font-extrabold inline-flex items-center gap-2 shadow-xl shadow-[#F0B429]/20 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#0F2A4A]" />
              <span>Masuk ke Dashboard Sistem</span>
              <ArrowRight className="w-4 h-4 text-[#0F2A4A]" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER RESMI */}
      {/* ========================================================================= */}
      <footer id="kontak" className="bg-[#0A1F36] text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F0B429] text-[#0F2A4A] flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base">LINDUNGMAS HST</span>
                  <p className="text-[10px] text-slate-400">Layanan Informasi dan Data Perlindungan Masyarakat Kabupaten Hulu Sungai Tengah</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Sistem Informasi Terpadu Pengelolaan Data Satlinmas, Inventarisasi Poskamling GIS, dan Monitoring Kegiatan Patroli Lapangan Satpol PP & Linmas Pemkab Hulu Sungai Tengah, Kalimantan Selatan.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Alamat Kantor</h5>
              <p className="leading-relaxed">
                Mako Satuan Polisi Pamong Praja <br />
                Jl. Perwira No. 1, Barabai <br />
                Kab. Hulu Sungai Tengah <br />
                Kalimantan Selatan 71315
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider">Kontak Dinas</h5>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Call Center: (0517) 41234</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>satpolpp@hulusungaitengahkab.go.id</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>Senin - Jumat: 08.00 - 16.30 WITA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© 2026 Pemerintah Kabupaten Hulu Sungai Tengah. Seluruh Hak Cipta Dilindungi.</span>
            <span>LINDUNGMAS HST • Layanan Informasi & Data Perlindungan Masyarakat</span>
          </div>
        </div>
      </footer>
    </div>
  );
}