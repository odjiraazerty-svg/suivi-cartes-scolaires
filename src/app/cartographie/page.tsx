'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  School,
  Building2,
  TrendingUp,
  Download,
  Upload,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Check,
  Info,
  Sun,
  Moon,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';
import { COTE_D_IVOIRE_REGIONS, RegionVector } from '@/data/regionsCI';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { useTheme } from '@/context/ThemeContext';

interface RegionalEntityDetail {
  id: string;
  nom: string;
  sigle: string | null;
  nature: string | null;
  localisation: string | null;
  totalRecu: number;
  totalLivre: number;
  soldeStock: number;
}

interface RegionSummary {
  id: string;
  nom: string;
  sigle: string;
  chefLieu: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  zone: string;
  nbStructures: number;
  totalRecu: number;
  totalDistribue: number;
  soldeStock: number;
  tauxDistributionPct: number;
  statut: 'COUVERT' | 'EN_COURS' | 'EN_STOCK' | 'NON_DOTE';
  entites: RegionalEntityDetail[];
}

interface CartoData {
  summary: {
    totalRecu: number;
    totalDistribue: number;
    totalStock: number;
    tauxGlobal: number;
    regionsTotal: number;
    regionsDotees: number;
    tauxCouvertureTerritoriale: number;
  };
  regions: RegionSummary[];
}

export default function CartographiePage() {
  const router = useRouter();
  const { resolvedMode } = useTheme();
  const [data, setData] = useState<CartoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation et sélection
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('DR ABIDJAN');
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('TOUTES');
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [viewMode, setViewMode] = useState<'carte' | 'tableau'>('carte');
  const [structureSearch, setStructureSearch] = useState('');

  // Options graphiques de la carte
  const [mapTheme, setMapTheme] = useState<'sombre' | 'clair'>('sombre');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showCardCounts, setShowCardCounts] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Synchronisation du thème de la carte avec le thème global actif
  useEffect(() => {
    setMapTheme(resolvedMode === 'light' ? 'clair' : 'sombre');
  }, [resolvedMode]);

  const fetchCartoData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/cartographie');
      if (!res.ok) throw new Error('Impossible de charger les données cartographiques');
      const json: CartoData = await res.json();
      setData(json);

      if (json.regions.length > 0) {
        // Vérifier si un filtre initial ou région est passé en URL
        let initialRegionId: string | null = null;
        if (typeof window !== 'undefined') {
          const sp = new URLSearchParams(window.location.search);
          const filterParam = sp.get('filter');
          const regParam = sp.get('region');
          if (filterParam === 'stock_only') {
            setSelectedStatus('EN_STOCK');
          }
          if (regParam) {
            const found = json.regions.find(
              (r) =>
                r.id.toLowerCase() === regParam.toLowerCase() ||
                r.nom.toLowerCase() === regParam.toLowerCase() ||
                r.chefLieu.toLowerCase() === regParam.toLowerCase()
            );
            if (found) initialRegionId = found.id;
          }
        }

        const defaultReg =
          (initialRegionId && json.regions.find((r) => r.id === initialRegionId)) ||
          json.regions.find((r) => r.soldeStock > 0) ||
          json.regions.find((r) => r.totalRecu > 0) ||
          json.regions[0];

        setSelectedRegionId((prev) => (initialRegionId ? initialRegionId : prev || defaultReg.id));
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartoData();
  }, []);

  const zonesDisponibles = useMemo(() => {
    if (!data?.regions) return [];
    const set = new Set<string>();
    data.regions.forEach((r) => set.add(r.zone));
    return Array.from(set).sort();
  }, [data]);

  const filteredRegions = useMemo(() => {
    if (!data?.regions) return [];
    return data.regions.filter((r) => {
      const matchSearch =
        r.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.chefLieu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sigle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchZone = selectedZone === 'TOUTES' || r.zone === selectedZone;

      const matchStatus =
        selectedStatus === 'TOUS' ||
        (selectedStatus === 'EN_STOCK' && r.soldeStock > 0) ||
        (selectedStatus === 'DOTEES' && r.totalRecu > 0) ||
        (selectedStatus === 'NON_DOTEES' && r.totalRecu === 0) ||
        (selectedStatus === 'DISTRIBUEES' && r.totalDistribue > 0) ||
        (selectedStatus === 'COUVERTES' && r.tauxDistributionPct >= 80);

      return matchSearch && matchZone && matchStatus;
    });
  }, [data, searchQuery, selectedZone, selectedStatus]);

  const activeRegion = useMemo(() => {
    if (!data?.regions || !selectedRegionId) return null;
    return data.regions.find((r) => r.id === selectedRegionId) || null;
  }, [data, selectedRegionId]);

  const hoveredRegion = useMemo(() => {
    if (!data?.regions || !hoveredRegionId) return null;
    return data.regions.find((r) => r.id === hoveredRegionId) || null;
  }, [data, hoveredRegionId]);

  const filteredStructures = useMemo(() => {
    if (!activeRegion) return [];
    if (!structureSearch.trim()) return activeRegion.entites;
    const q = structureSearch.toLowerCase();
    return activeRegion.entites.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        (e.sigle && e.sigle.toLowerCase().includes(q)) ||
        (e.localisation && e.localisation.toLowerCase().includes(q)) ||
        (e.nature && e.nature.toLowerCase().includes(q))
    );
  }, [activeRegion, structureSearch]);

  const handleExportCSV = () => {
    if (!data?.regions) return;
    const headers = [
      'Code',
      'Region',
      'Chef-lieu',
      'Zone',
      'Structures',
      'Total Recu',
      'Total Distribue',
      'En Stock',
      'Taux Distribution %',
      'Statut',
    ];
    const rows = filteredRegions.map((r) => [
      `"${r.sigle}"`,
      `"${r.nom.replace(/"/g, '""')}"`,
      `"${r.chefLieu}"`,
      `"${r.zone}"`,
      r.nbStructures,
      r.totalRecu,
      r.totalDistribue,
      r.soldeStock,
      `${r.tauxDistributionPct}%`,
      r.statut,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mffe_couverture_cartographique_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper pour trouver les statistiques d'une région géographique
  const getRegionStats = (vectorItem: RegionVector) => {
    if (!data?.regions) return null;
    return (
      data.regions.find(
        (r) => r.id === vectorItem.id || (vectorItem.linkedDrId && r.id === vectorItem.linkedDrId)
      ) || null
    );
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 selection:bg-orange-500/30 selection:text-orange-200 transition-colors duration-200">
      {/* 1. BARRE INSTITUTIONNELLE SUPÉRIEURE */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition active:scale-95"
              title="Retour au tableau de bord"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-orange-500/10 border border-orange-500/20 shrink-0">
              <img src="/logo-mffe.png" alt="Logo MFFE" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-500/15 border border-orange-500/30 text-orange-400">
                  République de Côte d'Ivoire
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">• Ministère MFFE / DRH</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Observatoire Cartographique des Cartes Scolaires</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Bascule Carte / Tableau */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                onClick={() => setViewMode('carte')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'carte'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Carte SIG</span>
              </button>
              <button
                onClick={() => setViewMode('tableau')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'tableau'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tableau Synthétique</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Exporter en CSV"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <ThemeToggleButton variant="header" />

            <button
              onClick={fetchCartoData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition active:scale-95"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* 2. BAROMÈTRE NATIONAL / KPI BANDEAU */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Cartes Reçues */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Total Reçu</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {data?.summary.totalRecu.toLocaleString('fr-FR') ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Entrées consolidées</p>
          </div>

          {/* Cartes Distribuées */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Distribuées</span>
              <ArrowUpRight className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-orange-300">
              {data?.summary.totalDistribue.toLocaleString('fr-FR') ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Remises aux élèves</p>
          </div>

          {/* Stock Disponible */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">En Stock</span>
              <Boxes className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-300">
              {data?.summary.totalStock.toLocaleString('fr-FR') ?? 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Solde dans les DR</p>
          </div>

          {/* Taux Distribution Global */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Taux Distrib.</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-300">
              {data?.summary.tauxGlobal ?? 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.summary.tauxGlobal || 0)}%` }}
              />
            </div>
          </div>

          {/* Régions Dotées */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Couverture CI</span>
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {data?.summary.regionsDotees ?? 0}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {data?.summary.regionsTotal ?? 33} DR</span>
            </div>
            <p className="text-[10px] text-cyan-400/90 mt-0.5">
              {data?.summary.tauxCouvertureTerritoriale ?? 0}% du territoire doté
            </p>
          </div>
        </section>

        {/* 3. RUBAN DE SÉLECTION RAPIDE DES 33 RÉGIONS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-xs font-semibold text-slate-400 shrink-0 px-1">Pôles régionaux :</span>
          {data?.regions.map((reg) => {
            const isSelected = selectedRegionId === reg.id;
            const hasStock = reg.totalRecu > 0;
            return (
              <button
                key={reg.id}
                onClick={() => setSelectedRegionId(reg.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-400 shadow-lg shadow-orange-500/30'
                    : hasStock
                    ? 'bg-slate-900/90 text-slate-200 border-purple-500/40 hover:border-purple-400'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    reg.tauxDistributionPct >= 80
                      ? 'bg-emerald-400'
                      : reg.totalDistribue > 0
                      ? 'bg-orange-400'
                      : hasStock
                      ? 'bg-purple-400'
                      : 'bg-slate-600'
                  }`}
                />
                <span>{reg.chefLieu}</span>
                {hasStock && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/40 font-mono text-purple-200">
                    {reg.totalRecu}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. FILTRES DE RECHERCHE */}
        <section className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par région ou ville (ex: Korhogo, Bouaké, Daloa, Man, Abidjan...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="TOUTES">Toutes les Zones ({zonesDisponibles.length})</option>
              {zonesDisponibles.map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="EN_STOCK">🟣 Régions avec cartes en stock</option>
              <option value="DOTEES">Dotées (Reçu &gt; 0)</option>
              <option value="COUVERTES">Fortement distribuées (&ge; 80%)</option>
              <option value="DISTRIBUEES">En cours de distribution</option>
              <option value="NON_DOTEES">En attente de dotation</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Affichage :</span>
            <strong className="text-orange-400 font-bold">{filteredRegions.length}</strong>
            <span>sur {data?.summary.regionsTotal ?? 33} pôles</span>
          </div>
        </section>

        {/* 5. VUE CARTE VECTORIELLE INTERACTIVE HAUTE PRÉCISION */}
        {viewMode === 'carte' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANNEAU DE LA CARTE (7 COLS) */}
            <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800/90 p-4 sm:p-5 shadow-2xl relative flex flex-col justify-between min-h-[660px]">
              {/* En-tête des contrôles de la carte */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Découpage Administratif Officiel de Côte d'Ivoire
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    31 Régions + 2 Districts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Bascule Affichage Étiquettes */}
                  <button
                    onClick={() => setShowLabels((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                      showLabels
                        ? 'bg-slate-800 text-white border-slate-600'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800'
                    }`}
                    title="Afficher/Masquer les noms des régions"
                  >
                    Noms
                  </button>

                  {/* Bascule Chiffres */}
                  <button
                    onClick={() => setShowCardCounts((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                      showCardCounts
                        ? 'bg-slate-800 text-white border-slate-600'
                        : 'bg-slate-950/60 text-slate-500 border-slate-800'
                    }`}
                    title="Afficher/Masquer les chiffres de cartes"
                  >
                    Stocks
                  </button>

                  {/* Bascule Thème Clair / Sombre de la carte */}
                  <button
                    onClick={() => setMapTheme((t) => (t === 'sombre' ? 'clair' : 'sombre'))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title={`Passer en mode ${mapTheme === 'sombre' ? 'Atlas Clair' : 'SIG Sombre'}`}
                  >
                    {mapTheme === 'sombre' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
                  </button>

                  {/* Zoom controls */}
                  <div className="flex items-center bg-slate-950/80 rounded-lg border border-slate-800 p-0.5">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(2.2, Number((z + 0.2).toFixed(1))))}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
                      title="Zoom avant"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
                      title="Zoom arrière"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="px-2 py-0.5 text-[11px] font-mono text-slate-400 hover:text-white"
                      title="Réinitialiser zoom"
                    >
                      {Math.round(zoomLevel * 100)}%
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENEUR DE CARTE VECTORIELLE INTERACTIVE */}
              <div
                className={`relative w-full aspect-[800/840] max-h-[650px] mx-auto overflow-hidden rounded-2xl flex items-center justify-center transition-colors duration-300 border shadow-inner ${
                  mapTheme === 'sombre'
                    ? 'bg-gradient-to-b from-[#0a1124] via-[#070b16] to-[#04060c] border-slate-800/80'
                    : 'bg-gradient-to-b from-slate-100 via-sky-50/50 to-slate-200 border-slate-300'
                }`}
              >
                {/* Repère boussole Nord */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-center pointer-events-none opacity-60">
                  <Compass className={`w-6 h-6 ${mapTheme === 'sombre' ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span className={`text-[9px] font-black tracking-widest ${mapTheme === 'sombre' ? 'text-slate-400' : 'text-slate-600'}`}>N</span>
                </div>

                {/* Live HUD Card (Région survolée ou active) */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  {hoveredRegion || activeRegion ? (
                    (() => {
                      const cur = hoveredRegion || activeRegion;
                      if (!cur) return null;
                      return (
                        <div
                          className={`p-2.5 px-3 rounded-xl backdrop-blur-md border shadow-xl transition-all duration-200 ${
                            mapTheme === 'sombre'
                              ? 'bg-slate-900/90 border-slate-700/80 text-white'
                              : 'bg-white/95 border-slate-300 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                cur.tauxDistributionPct >= 80
                                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                  : cur.totalDistribue > 0
                                  ? 'bg-orange-400 shadow-sm shadow-orange-400'
                                  : cur.totalRecu > 0
                                  ? 'bg-purple-400 shadow-sm shadow-purple-400'
                                  : 'bg-slate-500'
                              }`}
                            />
                            <h4 className="text-xs font-black uppercase tracking-tight">{cur.nom}</h4>
                            <span className="text-[10px] text-slate-400 font-normal">({cur.chefLieu})</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] mt-1 font-mono">
                            <span>
                              Reçu : <strong className="text-emerald-400">{cur.totalRecu.toLocaleString('fr-FR')}</strong>
                            </span>
                            <span>
                              Livré : <strong className="text-orange-400">{cur.totalDistribue.toLocaleString('fr-FR')}</strong>
                            </span>
                            <span>
                              Stock : <strong className="text-purple-400">{cur.soldeStock.toLocaleString('fr-FR')}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-2 px-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-md">
                      Survolez ou cliquez sur une région
                    </div>
                  )}
                </div>

                {/* SVG MAP ENGINE */}
                <div
                  className="w-full h-full transition-transform duration-200 flex items-center justify-center relative select-none"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg viewBox="0 0 800 840" className="w-full h-full max-h-[640px]">
                    <defs>
                      {/* Gradient actif sélectionné */}
                      <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.95" />
                      </linearGradient>

                      {/* Gradient fort taux distribué (>= 80%) */}
                      <linearGradient id="grad-delivered" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#059669" stopOpacity={mapTheme === 'sombre' ? '0.75' : '0.6'} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={mapTheme === 'sombre' ? '0.9' : '0.75'} />
                      </linearGradient>

                      {/* Gradient en cours de distribution */}
                      <linearGradient id="grad-distributing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={mapTheme === 'sombre' ? '0.75' : '0.6'} />
                        <stop offset="100%" stopColor="#b45309" stopOpacity={mapTheme === 'sombre' ? '0.9' : '0.75'} />
                      </linearGradient>

                      {/* Gradient en stock */}
                      <linearGradient id="grad-stock" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={mapTheme === 'sombre' ? '0.75' : '0.6'} />
                        <stop offset="100%" stopColor="#6d28d9" stopOpacity={mapTheme === 'sombre' ? '0.9' : '0.75'} />
                      </linearGradient>

                      {/* Gradient neutre / stock épuisé ou nul (Régions à stock = 0 en blanc) */}
                      <linearGradient id="grad-zero-stock" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={mapTheme === 'sombre' ? '0.92' : '0.98'} />
                        <stop offset="100%" stopColor="#f1f5f9" stopOpacity={mapTheme === 'sombre' ? '0.88' : '0.95'} />
                      </linearGradient>

                      {/* Gradient neutre en attente */}
                      <linearGradient id="grad-empty-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
                        <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.88" />
                      </linearGradient>

                      <linearGradient id="grad-empty-light" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.98" />
                      </linearGradient>

                      {/* Filtre de glow pour la région active */}
                      <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f97316" floodOpacity="0.7" />
                      </filter>

                      <filter id="glow-hover" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.6" />
                      </filter>

                      <filter id="pill-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
                      </filter>
                    </defs>

                    {/* Mentions cartographiques des pays voisins & océan */}
                    <g className="pointer-events-none select-none font-bold uppercase tracking-widest text-[11px]">
                      <text
                        x="130"
                        y="45"
                        fill={mapTheme === 'sombre' ? '#334155' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        MALI
                      </text>
                      <text
                        x="560"
                        y="50"
                        fill={mapTheme === 'sombre' ? '#334155' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        BURKINA FASO
                      </text>
                      <text
                        x="40"
                        y="230"
                        fill={mapTheme === 'sombre' ? '#334155' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        GUINÉE
                      </text>
                      <text
                        x="35"
                        y="520"
                        fill={mapTheme === 'sombre' ? '#334155' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        LIBÉRIA
                      </text>
                      <text
                        x="755"
                        y="380"
                        fill={mapTheme === 'sombre' ? '#334155' : '#94a3b8'}
                        textAnchor="middle"
                      >
                        GHANA
                      </text>
                      <text
                        x="460"
                        y="820"
                        fill={mapTheme === 'sombre' ? '#1e293b' : '#94a3b8'}
                        textAnchor="middle"
                        fontSize="12"
                        letterSpacing="3"
                      >
                        OCÉAN ATLANTIQUE (GOLFE DE GUINÉE)
                      </text>
                    </g>

                    {/* COUCHE DES 33 RÉGIONS & DISTRICTS VECTORIELS */}
                    <g id="regions-vector-layer">
                      {COTE_D_IVOIRE_REGIONS.map((vec) => {
                        const regData = getRegionStats(vec);
                        const isSelected =
                          selectedRegionId === vec.id || (vec.linkedDrId && selectedRegionId === vec.linkedDrId);
                        const isHovered =
                          hoveredRegionId === vec.id || (vec.linkedDrId && hoveredRegionId === vec.linkedDrId);

                        const soldeStock = regData ? regData.soldeStock : 0;
                        const hasRecu = regData ? regData.totalRecu > 0 : false;
                        const hasDistribue = regData ? regData.totalDistribue > 0 : false;
                        const taux = regData ? regData.tauxDistributionPct : 0;

                        // Attribution dynamique de couleur
                        // RÈGLE MÉTIER : Mettre en blanc les régions dont le stock est égal à 0
                        let fillStyle = 'url(#grad-zero-stock)';
                        let strokeColor = mapTheme === 'sombre' ? '#64748b' : '#94a3b8';
                        let strokeWidth = 1.2;

                        if (soldeStock > 0) {
                          // La région a des cartes en stock
                          if (hasDistribue && taux >= 80) {
                            fillStyle = 'url(#grad-delivered)';
                            strokeColor = '#10b981';
                          } else if (hasDistribue) {
                            fillStyle = 'url(#grad-distributing)';
                            strokeColor = '#f59e0b';
                          } else {
                            fillStyle = 'url(#grad-stock)';
                            strokeColor = '#8b5cf6';
                          }
                        } else {
                          // Stock = 0 (ou non dotée ou entièrement distribuée) => Blanc
                          fillStyle = 'url(#grad-zero-stock)';
                          strokeColor = mapTheme === 'sombre' ? '#94a3b8' : '#cbd5e1';
                        }

                        if (isSelected) {
                          fillStyle = 'url(#grad-active)';
                          strokeColor = '#f97316';
                          strokeWidth = 2.8;
                        } else if (isHovered) {
                          strokeColor = '#38bdf8';
                          strokeWidth = 2.2;
                        }

                        return (
                          <path
                            key={vec.id}
                            d={vec.path}
                            fill={fillStyle}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={isSelected ? 'url(#glow-selected)' : isHovered ? 'url(#glow-hover)' : undefined}
                            className="cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                            onClick={() => {
                              setSelectedRegionId(vec.linkedDrId || vec.id);
                            }}
                            onMouseEnter={() => {
                              setHoveredRegionId(vec.linkedDrId || vec.id);
                            }}
                            onMouseLeave={() => {
                              setHoveredRegionId(null);
                            }}
                          >
                            <title>
                              {`${vec.shapeName} (${vec.chefLieu})${regData ? ` - Reçu: ${regData.totalRecu} | Distribué: ${regData.totalDistribue}` : ''}`}
                            </title>
                          </path>
                        );
                      })}
                    </g>

                    {/* COUCHE DES ÉTIQUETTES & PAILLES DE STOCK */}
                    {showLabels && (
                      <g id="labels-layer" className="pointer-events-none select-none">
                        {COTE_D_IVOIRE_REGIONS.map((vec) => {
                          const regData = getRegionStats(vec);
                          const isSelected =
                            selectedRegionId === vec.id || (vec.linkedDrId && selectedRegionId === vec.linkedDrId);
                          const [cx, cy] = vec.centroid;
                          const soldeStock = regData ? regData.soldeStock : 0;
                          const hasRecu = regData ? regData.totalRecu > 0 : false;
                          const hasDistribue = regData ? regData.totalDistribue > 0 : false;
                          const isZeroStock = soldeStock === 0;

                          return (
                            <g key={`lbl-${vec.id}`}>
                              {/* Pastille de repère centroid */}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? 4.5 : soldeStock > 0 ? 3.5 : 2.5}
                                fill={isSelected ? '#ffffff' : soldeStock > 0 ? '#a855f7' : '#94a3b8'}
                                stroke={isSelected ? '#f97316' : '#0f172a'}
                                strokeWidth={isSelected ? 2 : 1}
                              />

                              {/* Nom de la région */}
                              <text
                                x={cx}
                                y={hasRecu && showCardCounts ? cy - 4 : cy + 11}
                                textAnchor="middle"
                                fontSize={isSelected ? '11' : '9.5'}
                                fontWeight={isSelected ? '900' : '700'}
                                fill={
                                  isSelected
                                    ? '#ffffff'
                                    : isZeroStock
                                    ? '#0f172a'
                                    : mapTheme === 'sombre'
                                    ? '#f8fafc'
                                    : '#0f172a'
                                }
                                style={{
                                  filter: isZeroStock
                                    ? 'drop-shadow(0 1px 2px rgba(255,255,255,0.95))'
                                    : mapTheme === 'sombre'
                                    ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.95))'
                                    : 'drop-shadow(0 1px 2px rgba(255,255,255,0.9))',
                                }}
                              >
                                {vec.nomCourt}
                              </text>

                              {/* Badge numérique de cartes (si dotée et activé) */}
                              {showCardCounts && hasRecu && regData && (
                                <g transform={`translate(${cx - 25}, ${cy + 3})`} filter="url(#pill-shadow)">
                                  <rect
                                    x="0"
                                    y="0"
                                    width="50"
                                    height="13"
                                    rx="6.5"
                                    fill={isSelected ? '#7c2d12' : isZeroStock ? '#ffffff' : '#070b14'}
                                    stroke={
                                      isSelected
                                        ? '#f97316'
                                        : isZeroStock
                                        ? '#cbd5e1'
                                        : regData.tauxDistributionPct >= 80
                                        ? '#10b981'
                                        : '#8b5cf6'
                                    }
                                    strokeWidth="1"
                                    opacity="0.95"
                                  />
                                  <text
                                    x="25"
                                    y="9"
                                    textAnchor="middle"
                                    fontSize="7.5"
                                    fontWeight="bold"
                                    fill={isSelected ? '#ffffff' : isZeroStock ? '#475569' : '#ffffff'}
                                    className="font-mono tracking-tight"
                                  >
                                    {isZeroStock ? 'Stock: 0' : `${regData.soldeStock} en stock`}
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </svg>
                </div>
              </div>

              {/* Légende interactive officielle en bas */}
              <div className="mt-3 pt-3 border-t border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400">
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    onClick={() => setSelectedStatus('COUVERTES')}
                    className="flex items-center gap-1.5 hover:text-white transition"
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span>Distribution avancée (&ge; 80%)</span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus('DISTRIBUEES')}
                    className="flex items-center gap-1.5 hover:text-white transition"
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                    <span>En cours de distribution</span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus((s) => (s === 'EN_STOCK' ? 'TOUS' : 'EN_STOCK'))}
                    className={`flex items-center gap-1.5 transition ${
                      selectedStatus === 'EN_STOCK' ? 'text-purple-300 font-bold' : 'hover:text-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                    <span>Cartes en stock</span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus('NON_DOTEES')}
                    className="flex items-center gap-1.5 hover:text-white transition"
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-300 shadow-sm" />
                    <span className="text-white font-medium">Stock = 0 (Blanc)</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  Cliquez sur n'importe quelle région pour ouvrir son bilan complet
                </span>
              </div>
            </div>

            {/* FICHE RÉGIONALE D'INSPECTION (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              {activeRegion ? (
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-5">
                  {/* Titre & Statut */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Zone {activeRegion.zone}
                        </span>
                        <span className="text-xs text-slate-400">
                          Chef-lieu : <strong className="text-white">{activeRegion.chefLieu}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">{activeRegion.nom}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{activeRegion.sigle}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          activeRegion.totalRecu === 0
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : activeRegion.tauxDistributionPct >= 80
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : activeRegion.totalDistribue > 0
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {activeRegion.totalRecu === 0
                          ? 'En attente'
                          : activeRegion.tauxDistributionPct >= 80
                          ? 'Couvert'
                          : activeRegion.totalDistribue > 0
                          ? 'En cours'
                          : 'Stock disponible'}
                      </span>
                    </div>
                  </div>

                  {/* 3 Blocs Métriques Régionales */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Reçu</span>
                      <div className="text-lg font-black text-emerald-300 mt-0.5">
                        {activeRegion.totalRecu.toLocaleString('fr-FR')}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-orange-400">Distribué</span>
                      <div className="text-lg font-black text-orange-300 mt-0.5">
                        {activeRegion.totalDistribue.toLocaleString('fr-FR')}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-purple-400">En Stock</span>
                      <div className="text-lg font-black text-purple-300 mt-0.5">
                        {activeRegion.soldeStock.toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {/* Jauge Taux de Progression */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Taux de distribution régionale :</span>
                      <strong className="text-cyan-400 font-bold">{activeRegion.tauxDistributionPct}%</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, activeRegion.tauxDistributionPct)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {activeRegion.nbStructures} structures/complexes scolaires sous cette Direction Régionale.
                    </p>
                  </div>

                  {/* Liste des structures rattachées */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-orange-400" />
                        <span>Structures de la Région ({activeRegion.entites.length})</span>
                      </h4>
                    </div>

                    {activeRegion.entites.length > 4 && (
                      <input
                        type="text"
                        placeholder="Filtrer une école, centre, IFEF..."
                        value={structureSearch}
                        onChange={(e) => setStructureSearch(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    )}

                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {filteredStructures.length > 0 ? (
                        filteredStructures.map((ent) => (
                          <div
                            key={ent.id}
                            className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 transition flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-200 truncate">{ent.nom}</p>
                              <p className="text-[10px] text-slate-500">
                                {ent.nature || 'Structure'} • {ent.localisation || activeRegion.chefLieu}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-400">
                                {ent.totalRecu > 0 ? `${ent.totalRecu} reçue(s)` : '0 reçue'}
                              </span>
                              {ent.soldeStock > 0 && (
                                <p className="text-[10px] text-purple-400 font-medium">
                                  {ent.soldeStock} en stock
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-xs text-slate-500">
                          Aucune structure trouvée.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Rapides */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/receptions?entite=${encodeURIComponent(activeRegion.id)}`)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Réceptionner</span>
                    </button>
                    <button
                      onClick={() => router.push(`/livraisons?entite=${encodeURIComponent(activeRegion.id)}`)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Livrer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Aucune région sélectionnée</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cliquez sur une région pour voir ses statistiques détaillées.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 6. VUE TABLEAU SYNTHÉTIQUE */
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800/90 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Tableau Synthétique Régional</h3>
                <p className="text-xs text-slate-400">Bilan consolidé des 33 Directions Régionales et Districts</p>
              </div>
              <div className="text-xs text-slate-400">
                Total réceptions enregistrées :{' '}
                <strong className="text-emerald-400">{data?.summary.totalRecu ?? 0} cartes</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Région / Direction</th>
                    <th className="py-3 px-3">Chef-lieu</th>
                    <th className="py-3 px-3">Zone</th>
                    <th className="py-3 px-3 text-center">Structures</th>
                    <th className="py-3 px-3 text-right text-emerald-400">Reçu</th>
                    <th className="py-3 px-3 text-right text-orange-400">Distribué</th>
                    <th className="py-3 px-3 text-right text-purple-400">En Stock</th>
                    <th className="py-3 px-4 text-center">Taux Distrib.</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredRegions.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedRegionId(r.id);
                        setViewMode('carte');
                      }}
                      className="hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-semibold text-white group-hover:text-orange-400 transition">
                        {r.nom}
                        <span className="block text-[10px] text-slate-500 font-mono">{r.sigle}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{r.chefLieu}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                          {r.zone}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-300">{r.nbStructures}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        {r.totalRecu.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-orange-400">
                        {r.totalDistribue.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-purple-400">
                        {r.soldeStock.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black ${
                            r.tauxDistributionPct >= 80
                              ? 'text-emerald-400'
                              : r.tauxDistributionPct > 0
                              ? 'text-orange-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {r.tauxDistributionPct}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.totalRecu === 0
                              ? 'bg-slate-800/80 text-slate-400 border border-slate-700'
                              : r.tauxDistributionPct >= 80
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : r.totalDistribue > 0
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {r.totalRecu === 0
                            ? 'Non doté'
                            : r.tauxDistributionPct >= 80
                            ? 'Couvert'
                            : r.totalDistribue > 0
                            ? 'En cours'
                            : 'En stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
