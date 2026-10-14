'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
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
  const [structureSearch, setStructureSearch] = useState('');

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

  // Extraire les zones uniques
  const zonesDisponibles = useMemo(() => {
    if (!data?.regions) return [];
    const set = new Set<string>();
    data.regions.forEach((r) => set.add(r.zone));
    return Array.from(set).sort();
  }, [data]);

  // Régions filtrées
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

  // Région active sélectionnée
  const activeRegion = useMemo(() => {
    if (!data?.regions || !selectedRegionId) return null;
    return data.regions.find((r) => r.id === selectedRegionId) || null;
  }, [data, selectedRegionId]);

  // Régions sous-structures filtrées
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

  // Export CSV
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
                placeholder="Rechercher une région, chef-lieu, ville..."
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
              <option value="NON_DOTEES">En attente de dotation (0 reçu)</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
            <span>Affichage :</span>
            <strong className="text-orange-400">{filteredRegions.length}</strong> / {data?.regions.length ?? 33} région(s)
          </div>
        </section>

        {/* 4. Vue Principale : Carte Interactive ou Tableau */}
        {viewMode === 'carte' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLONNE GAUCHE (7 cols) : Carte SVG Interactive de la Côte d'Ivoire */}
            <div className="lg:col-span-7 bg-gradient-to-b from-slate-900/90 to-[#0b1222] p-4 sm:p-6 rounded-3xl border border-slate-800/90 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[620px]">
              {/* En-tête de la carte */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Carte Interactive de la Côte d'Ivoire</span>
                  </h2>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
                  Cliquez sur un pôle régional pour inspecter
                </div>
              </div>

              {/* Canevas SVG de la Carte CI */}
              <div className="relative w-full aspect-[8/7] max-h-[560px] my-auto flex items-center justify-center">
                <svg
                  viewBox="0 0 800 700"
                  className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] select-none"
                >
                  {/* Dégradés et Filtres SVG */}
                  <defs>
                    <linearGradient id="ci-land-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="50%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#090d16" />
                    </linearGradient>

                    <linearGradient id="ci-coast-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.6" />
                    </linearGradient>

                    <radialGradient id="ocean-glow" cx="50%" cy="100%" r="80%">
                      <stop offset="0%" stopColor="#0369a1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
                    </radialGradient>

                    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Océan Atlantique / Golfe de Guinée (Sud) */}
                  <rect x="0" y="580" width="800" height="120" fill="url(#ocean-glow)" opacity="0.6" />
                  <text x="400" y="670" textAnchor="middle" fill="#0284c7" fontSize="13" letterSpacing="4" opacity="0.5" fontWeight="bold">
                    GOLFE DE GUINÉE • OCÉAN ATLANTIQUE
                  </text>

                  {/* Pays Frontaliers repères */}
                  <text x="320" y="45" fill="#475569" fontSize="12" letterSpacing="2" fontWeight="bold" opacity="0.4">
                    MALI
                  </text>
                  <text x="630" y="90" fill="#475569" fontSize="12" letterSpacing="2" fontWeight="bold" opacity="0.4">
                    BURKINA FASO
                  </text>
                  <text x="730" y="380" fill="#475569" fontSize="12" letterSpacing="2" fontWeight="bold" opacity="0.4">
                    GHANA
                  </text>
                  <text x="50" y="280" fill="#475569" fontSize="12" letterSpacing="2" fontWeight="bold" opacity="0.4">
                    GUINÉE
                  </text>
                  <text x="50" y="500" fill="#475569" fontSize="12" letterSpacing="2" fontWeight="bold" opacity="0.4">
                    LIBÉRIA
                  </text>

                  {/* Contour Réaliste Stylisé du Territoire Ivoirien */}
                  <path
                    d="M 120 180 
                       L 180 120 
                       L 270 95 
                       L 380 90 
                       L 520 80 
                       L 620 110 
                       L 650 170 
                       L 680 230 
                       L 680 340 
                       L 720 400 
                       L 700 500 
                       L 650 560 
                       L 580 575 
                       L 480 570 
                       L 360 565 
                       L 250 580 
                       L 190 540 
                       L 130 450 
                       L 100 370 
                       L 90 270 
                       Z"
                    fill="url(#ci-land-gradient)"
                    stroke="#334155"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="transition duration-300"
                  />

                  {/* Lignes de quadrillage territorial subtiles */}
                  <path
                    d="M 120 180 Q 400 350 680 340"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                  />
                  <path
                    d="M 380 90 Q 420 350 480 570"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                  />

                  {/* Rayonnement interactif sous la région sélectionnée */}
                  {activeRegion && (
                    <circle
                      cx={activeRegion.x}
                      cy={activeRegion.y}
                      r="36"
                      fill="#f97316"
                      opacity="0.15"
                      className="animate-pulse"
                    />
                  )}

                  {/* Hubs / Points Régionaux */}
                  {data?.regions.map((reg) => {
                    const isSelected = selectedRegionId === reg.id;
                    const isHovered = hoveredRegionId === reg.id;
                    const hasStock = reg.totalRecu > 0;
                    const hasDelivered = reg.totalDistribue > 0;

                    // Couleur du nœud selon état
                    let pinColor = '#475569'; // gris par défaut (non doté)
                    let strokeColor = '#334155';
                    if (hasDelivered && reg.tauxDistributionPct >= 80) {
                      pinColor = '#10b981'; // Vert vif
                      strokeColor = '#059669';
                    } else if (hasDelivered) {
                      pinColor = '#f97316'; // Orange distribution
                      strokeColor = '#ea580c';
                    } else if (hasStock) {
                      pinColor = '#a855f7'; // Violet stock reçu
                      strokeColor = '#9333ea';
                    }

                    const radius = isSelected ? 12 : isHovered ? 10 : hasStock ? 8 : 6;

                    return (
                      <g
                        key={reg.id}
                        className="cursor-pointer transition-all duration-200"
                        onClick={() => setSelectedRegionId(reg.id)}
                        onMouseEnter={() => setHoveredRegionId(reg.id)}
                        onMouseLeave={() => setHoveredRegionId(null)}
                      >
                        {/* Halo pulsant si sélectionné */}
                        {isSelected && (
                          <circle
                            cx={reg.x}
                            cy={reg.y}
                            r="22"
                            fill="none"
                            stroke={pinColor}
                            strokeWidth="2"
                            opacity="0.6"
                            className="animate-ping"
                          />
                        )}

                        {/* Cercle extérieur interactif */}
                        <circle
                          cx={reg.x}
                          cy={reg.y}
                          r={radius + 4}
                          fill={isSelected ? '#ffffff' : pinColor}
                          opacity={isSelected ? 0.3 : 0.15}
                        />

                        {/* Point central */}
                        <circle
                          cx={reg.x}
                          cy={reg.y}
                          r={radius}
                          fill={pinColor}
                          stroke={isSelected ? '#ffffff' : strokeColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all duration-200"
                        />

                        {/* Libellé de la ville / chef-lieu */}
                        <text
                          x={reg.x}
                          y={reg.y - (radius + 6)}
                          textAnchor="middle"
                          fill={isSelected ? '#38bdf8' : isHovered ? '#ffffff' : hasStock ? '#e2e8f0' : '#64748b'}
                          fontSize={isSelected ? 12 : isHovered ? 11 : 9.5}
                          fontWeight={isSelected ? 'bold' : '600'}
                          className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        >
                          {reg.chefLieu}
                        </text>

                        {/* Badge de stock sur les pôles actifs */}
                        {hasStock && (
                          <g transform={`translate(${reg.x + 8}, ${reg.y - 12})`}>
                            <rect
                              x="0"
                              y="0"
                              width={reg.totalRecu > 999 ? 34 : 26}
                              height="14"
                              rx="7"
                              fill="#0f172a"
                              stroke={pinColor}
                              strokeWidth="1.5"
                            />
                            <text
                              x={reg.totalRecu > 999 ? 17 : 13}
                              y="10.5"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {reg.totalRecu}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Légende en bas de la carte */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span>Forte distribution (&ge; 80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
                    <span>En cours de distribution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                    <span>En stock (Réceptionné)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    <span>Non doté (En attente)</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500">
                  Système d'Information DRH • MFFE
                </div>
              </div>
            </div>

            {/* COLONNE DROITE (5 cols) : Fiche de Détail de la Région Sélectionnée */}
            <div className="lg:col-span-5 space-y-4">
              {activeRegion ? (
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800/90 p-5 shadow-xl space-y-5">
                  {/* En-tête Région */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {activeRegion.zone}
                        </span>
                        <span className="text-xs text-slate-400">Chef-lieu : <strong className="text-white">{activeRegion.chefLieu}</strong></span>
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
                          ? 'Couverture Complète'
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
                      {activeRegion.nbStructures} structures/établissements rattachés à cette Direction Régionale.
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
                    Cliquez sur un pôle sur la carte pour voir ses statistiques régionales.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 5. VUE ALTERNATIVE : Tableau Synthétique National */
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800/90 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Tableau Synthétique Régional</h3>
                <p className="text-xs text-slate-400">Bilan des 33 Directions Régionales et Districts</p>
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
