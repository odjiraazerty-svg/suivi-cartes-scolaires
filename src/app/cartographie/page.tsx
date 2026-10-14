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
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';

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
  const [data, setData] = useState<CartoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres et sélection
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('TOUTES');
  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [viewMode, setViewMode] = useState<'carte' | 'tableau'>('carte');
  const [mapTheme, setMapTheme] = useState<'officiel' | 'sombre'>('officiel');
  const [showStockBadges, setShowStockBadges] = useState(true);
  const [structureSearch, setStructureSearch] = useState('');

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const fetchCartoData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/cartographie');
      if (!res.ok) throw new Error('Impossible de charger les données cartographiques');
      const json: CartoData = await res.json();
      setData(json);

      // Présélectionner la 1ère région ayant du stock ou Abidjan
      if (!selectedRegionId && json.regions.length > 0) {
        const defaultReg = json.regions.find((r) => r.totalRecu > 0) || json.regions[0];
        setSelectedRegionId(defaultReg.id);
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
        (selectedStatus === 'DOTEES' && r.totalRecu > 0) ||
        (selectedStatus === 'NON_DOTEES' && r.totalRecu === 0) ||
        (selectedStatus === 'DISTRIBUEES' && r.totalDistribue > 0);

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
      'District/Zone',
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

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-20">
      {/* 1. Entête Institutionnel */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6">
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
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">• MFFE / DRH</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Couverture Cartographique des Cartes Scolaires</span>
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
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Carte CI</span>
              </button>
              <button
                onClick={() => setViewMode('tableau')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'tableau'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tableau</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Exporter en CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

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
        {/* 2. Baromètre National / KPI Bandeau */}
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
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-cyan-500/30 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Couverture CI</span>
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {data?.summary.regionsDotees ?? 0} <span className="text-xs text-slate-400 font-normal">/ {data?.summary.regionsTotal ?? 33} DR</span>
            </div>
            <p className="text-[10px] text-cyan-300/80 mt-0.5">
              {data?.summary.tauxCouvertureTerritoriale ?? 0}% du territoire doté
            </p>
          </div>
        </section>

        {/* 3. Filtres et Recherche */}
        <section className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une région (ex: Bouaké, Folon, Gbêkê, Daloa...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            {/* Filtre Zone / District */}
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

            {/* Filtre Statut de dotation */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="DOTEES">Dotées (Reçu &gt; 0)</option>
              <option value="DISTRIBUEES">En cours de distribution</option>
              <option value="NON_DOTEES">En attente de dotation</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            {/* Bascule Thème Visuel */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMapTheme('officiel')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  mapTheme === 'officiel' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Affichage fidèle au fichier 'carte de la cote d'ivoire'"
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Carte Officielle</span>
              </button>
              <button
                onClick={() => setMapTheme('sombre')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  mapTheme === 'sombre' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Affichage Thème Sombre Néon"
              >
                <Moon className="w-3 h-3 text-cyan-400" />
                <span>Sombre Néon</span>
              </button>
            </div>

            {/* Bascule Badges de stock */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showStockBadges}
                onChange={(e) => setShowStockBadges(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-0"
              />
              <span>Badges de stock</span>
            </label>
          </div>
        </section>

        {/* 4. Vue Principale : Carte Interactive ou Tableau */}
        {viewMode === 'carte' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLONNE GAUCHE (7 cols) : Carte Officielle de la Côte d'Ivoire */}
            <div
              className={`lg:col-span-7 rounded-3xl border shadow-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
                mapTheme === 'officiel'
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-gradient-to-b from-slate-900/95 to-[#080d19] border-slate-800 text-slate-100'
              }`}
            >
              {/* Barre de contrôle supérieure de la carte */}
              <div className="flex items-center justify-between mb-3 border-b pb-2.5 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Découpage Administratif des 31 Régions & Districts
                  </span>
                </div>

                {/* Commandes Zoom */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Zoomer (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Dézoomer (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-[11px] font-mono px-2"
                    title="Réinitialiser"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                </div>
              </div>

              {/* Conteneur SVG avec Carte Image Officielle 'carte de la cote d'ivoire.gif' + Couche Interactive */}
              <div className="relative w-full aspect-[713/746] max-h-[640px] overflow-hidden rounded-2xl flex items-center justify-center select-none bg-slate-50 dark:bg-slate-950/40">
                <div
                  className="w-full h-full transition-transform duration-200 flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg
                    viewBox="0 0 713 746"
                    className="w-full h-full max-h-[640px] drop-shadow-md select-none"
                  >
                    <defs>
                      <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
                      </filter>
                      <radialGradient id="highlight-pulse" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Image Officielle de Fond fidèle au fichier "carte de la cote d'ivoire.gif" */}
                    <image
                      href="/carte-cote-ivoire.png"
                      x="0"
                      y="0"
                      width="713"
                      height="746"
                      preserveAspectRatio="xMidYMid meet"
                      className={`transition-all duration-300 ${
                        mapTheme === 'sombre'
                          ? 'invert hue-rotate-180 brightness-90 contrast-125 opacity-80'
                          : 'opacity-100'
                      }`}
                    />

                    {/* Zone de surbrillance animée sous la région sélectionnée */}
                    {activeRegion && (
                      <circle
                        cx={activeRegion.x}
                        cy={activeRegion.y}
                        r="38"
                        fill="url(#highlight-pulse)"
                        className="animate-pulse pointer-events-none"
                      />
                    )}

                    {/* Calque des Régions Interactives et Badges de Cartes */}
                    {data?.regions.map((reg) => {
                      const isSelected = selectedRegionId === reg.id;
                      const isHovered = hoveredRegionId === reg.id;
                      const hasStock = reg.totalRecu > 0;
                      const hasDelivered = reg.totalDistribue > 0;

                      // Couleur thématique selon l'état de livraison
                      let color = '#64748b'; // gris neutre
                      if (hasDelivered && reg.tauxDistributionPct >= 80) {
                        color = '#10b981'; // Vert
                      } else if (hasDelivered) {
                        color = '#f97316'; // Orange
                      } else if (hasStock) {
                        color = '#8b5cf6'; // Violet
                      }

                      return (
                        <g
                          key={reg.id}
                          className="cursor-pointer transition-transform duration-150 active:scale-95"
                          onClick={() => setSelectedRegionId(reg.id)}
                          onMouseEnter={() => setHoveredRegionId(reg.id)}
                          onMouseLeave={() => setHoveredRegionId(null)}
                        >
                          {/* Zone cliquable étendue transparente autour du libellé de la région */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? 32 : isHovered ? 28 : 22}
                            fill={color}
                            fillOpacity={isSelected ? 0.35 : isHovered ? 0.25 : hasStock ? 0.15 : 0.05}
                            stroke={color}
                            strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
                            strokeDasharray={isSelected ? 'none' : '3 3'}
                            className="transition-all duration-200"
                          />

                          {/* Anneau de pulsation si la région est sélectionnée */}
                          {isSelected && (
                            <circle
                              cx={reg.x}
                              cy={reg.y}
                              r="28"
                              fill="none"
                              stroke={color}
                              strokeWidth="2"
                              opacity="0.8"
                              className="animate-ping"
                            />
                          )}

                          {/* Puce d'état centrale */}
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r={isSelected ? 6 : 4.5}
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? 2 : 1}
                          />

                          {/* Badge de Statistiques Dynamiques Flottant (si activé) */}
                          {showStockBadges && hasStock && (
                            <g
                              transform={`translate(${reg.x - 28}, ${reg.y + 10})`}
                              filter="url(#badge-shadow)"
                              className="transition-transform duration-200 hover:scale-110"
                            >
                              <rect
                                x="0"
                                y="0"
                                width="56"
                                height="18"
                                rx="9"
                                fill={isSelected ? '#0f172a' : '#1e293b'}
                                stroke={color}
                                strokeWidth="1.5"
                              />
                              <text
                                x="28"
                                y="12.5"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                className="font-mono"
                              >
                                {reg.totalRecu} {reg.totalDistribue > 0 ? `| ${reg.totalDistribue}✓` : ''}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Barre de légende officielle */}
              <div
                className={`mt-3 pt-3 border-t text-[11px] flex flex-wrap items-center justify-between gap-3 ${
                  mapTheme === 'officiel' ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span>Forte distribution (&ge; 80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                    <span>En cours de distribution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm" />
                    <span>En stock (Réceptionné)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span>En attente de dotation</span>
                  </div>
                </div>

                <div className="text-[10px] font-semibold text-slate-400">
                  Source : Carte Administrative Officielle CI (31 Régions + 2 Districts)
                </div>
              </div>
            </div>

            {/* COLONNE DROITE (5 cols) : Fiche de Détail Régionale Interactive */}
            <div className="lg:col-span-5 space-y-4">
              {activeRegion ? (
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800/90 p-5 shadow-xl space-y-5">
                  {/* En-tête Région */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
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

                  {/* Jauge Taux de Couverture de la Région */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Progression de distribution :</span>
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

                  {/* Liste des structures rattachées dans cette Région */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-orange-400" />
                        <span>Structures de la Région ({activeRegion.entites.length})</span>
                      </h4>
                    </div>

                    {/* Champ de recherche rapide interne */}
                    {activeRegion.entites.length > 5 && (
                      <input
                        type="text"
                        placeholder="Filtrer un centre, IFEF, CPPE..."
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
                          Aucune structure trouvée avec ce filtre.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Boutons d'Action Rapide pour cette région */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/receptions?entite=${encodeURIComponent(activeRegion.id)}`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Réceptionner</span>
                    </button>
                    <button
                      onClick={() => router.push(`/livraisons?entite=${encodeURIComponent(activeRegion.id)}`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
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
                    Cliquez sur une région sur la carte pour voir ses statistiques.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 5. VUE TABLEAU SYNTHÉTIQUE */
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800/90 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Tableau Synthétique Régional</h3>
                <p className="text-xs text-slate-400">Bilan consolidé des 33 Directions Régionales et Districts</p>
              </div>
              <div className="text-xs text-slate-400">
                Total réceptions enregistrées : <strong className="text-emerald-400">{data?.summary.totalRecu ?? 0} cartes</strong>
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
