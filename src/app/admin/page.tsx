'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  PackageCheck,
  Send,
  Boxes,
  TrendingUp,
  LogOut,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  ChevronRight,
  School,
  Clock,
  Layers,
  Search,
  Bell,
  Home,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';

interface StatsData {
  totalEntites: number;
  structuresConcernees?: number;
  tauxStructures?: number;
  totalProduit?: number;
  tauxReception?: number;
  totalRecu: number;
  nbReceptions: number;
  totalLivre: number;
  nbLivraisons: number;
  stockDisponible: number;
  tauxDistribution: number;
  totalUsers: number;
}

interface RecapNatureItem {
  code: string;
  libelle: string;
  total_structures: number;
  structures_avec_cartes: number;
  total_recu: number;
  total_livre: number;
  solde_stock: number;
  taux_distribution: number;
}

const NATURE_META: Record<string, { label: string; badge: string; border: string; bar: string }> = {
  IFEF: {
    label: "Institution de Formation et d'Éducation Féminine",
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/20',
    bar: 'bg-purple-500',
  },
  CACE: {
    label: "Centre d'Action Communautaire pour l'Enfance",
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    border: 'border-sky-500/20',
    bar: 'bg-sky-500',
  },
  CPPE: {
    label: "Centre de Protection de la Petite Enfance",
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  CES: {
    label: "Centre d'Éducation Spécialisée",
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
  },
  GARDERIE: {
    label: 'Garderie',
    badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    border: 'border-pink-500/20',
    bar: 'bg-pink-500',
  },
  CRECHE: {
    label: 'Crèche / Garderie',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/20',
    bar: 'bg-teal-500',
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recapParNature, setRecapParNature] = useState<RecapNatureItem[]>([]);
  const [dernieresReceptions, setDernieresReceptions] = useState<any[]>([]);
  const [dernieresLivraisons, setDernieresLivraisons] = useState<any[]>([]);
  const [repartitionHierarchie, setRepartitionHierarchie] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'receptions' | 'livraisons'>('receptions');
  const [loading, setLoading] = useState(true);

  // Modales KPI interactives
  const [activeKpiModal, setActiveKpiModal] = useState<'structures' | 'receptions' | 'livraisons' | 'stock' | null>(null);
  const [kpiModalLoading, setKpiModalLoading] = useState(false);
  const [kpiSearch, setKpiSearch] = useState('');
  const [receptionsList, setReceptionsList] = useState<any[]>([]);
  const [livraisonsList, setLivraisonsList] = useState<any[]>([]);
  const [structuresList, setStructuresList] = useState<any[]>([]);
  const [stockList, setStockList] = useState<any[]>([]);

  // Modification / Suppression Réception
  const [editingReception, setEditingReception] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: 0,
    id_entite: '',
    nom_entite: '',
    date_reception: '',
    quantite: 1,
    annee_scolaire: '2026-2027',
    reference_bordereau: '',
    receptionnaire_nom: '',
    observations: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Modification / Suppression Livraison
  const [editingLivraison, setEditingLivraison] = useState<any | null>(null);
  const [editLivraisonForm, setEditLivraisonForm] = useState({
    id: 0,
    id_entite: '',
    nom_entite: '',
    date_livraison: '',
    quantite: 1,
    annee_scolaire: '2026-2027',
    receptionne_par: '',
    contact: '',
    mode_livraison: 'Agent du MFFE',
    cout_livraison: 0,
    reference_decharge: '',
    observations: '',
  });
  const [editLivraisonSaving, setEditLivraisonSaving] = useState(false);
  const [deleteConfirmLivraisonId, setDeleteConfirmLivraisonId] = useState<number | null>(null);
  const [deleteLivraisonSaving, setDeleteLivraisonSaving] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openKpiModal = async (type: 'structures' | 'receptions' | 'livraisons' | 'stock') => {
    setActiveKpiModal(type);
    setKpiSearch('');
    setFeedbackMessage(null);
    setEditingReception(null);
    setDeleteConfirmId(null);
    setEditingLivraison(null);
    setDeleteConfirmLivraisonId(null);
    setKpiModalLoading(true);

    try {
      if (type === 'receptions') {
        const res = await fetch('/api/receptions?limit=500');
        if (res.ok) {
          const data = await res.json();
          setReceptionsList(data.receptions || []);
        }
      } else if (type === 'livraisons') {
        const res = await fetch('/api/livraisons?limit=500');
        if (res.ok) {
          const data = await res.json();
          setLivraisonsList(data.livraisons || []);
        }
      } else if (type === 'structures') {
        const res = await fetch('/api/entites?limit=582');
        if (res.ok) {
          const data = await res.json();
          setStructuresList(data.entites || []);
        }
      } else if (type === 'stock') {
        const res = await fetch('/api/entites?limit=600&stock_only=true');
        if (res.ok) {
          const data = await res.json();
          setStockList(data.entites || []);
        }
      }
    } catch (err) {
      console.error('Erreur chargement modal:', err);
    } finally {
      setKpiModalLoading(false);
    }
  };

  const handleStartEditReception = (rec: any) => {
    setEditingReception(rec);
    const dateFormatted = rec.date_reception
      ? new Date(rec.date_reception).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEditForm({
      id: rec.id,
      id_entite: rec.id_entite || '',
      nom_entite: rec.nom_entite || rec.id_entite || '',
      date_reception: dateFormatted,
      quantite: rec.quantite_recue || 1,
      annee_scolaire: rec.annee_scolaire || '2026-2027',
      reference_bordereau: rec.reference_bordereau || '',
      receptionnaire_nom: rec.receptionnaire_nom || '',
      observations: rec.observations || '',
    });
  };

  const handleSaveEditReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.quantite || editForm.quantite <= 0) {
      alert('La quantité doit être supérieure à 0.');
      return;
    }
    setEditSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/receptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour.');
      }

      setReceptionsList((prev) =>
        prev.map((r) =>
          r.id === editForm.id
            ? {
                ...r,
                quantite_recue: editForm.quantite,
                date_reception: editForm.date_reception,
                annee_scolaire: editForm.annee_scolaire,
                reference_bordereau: editForm.reference_bordereau,
                receptionnaire_nom: editForm.receptionnaire_nom,
                observations: editForm.observations,
              }
            : r
        )
      );
      setEditingReception(null);
      setFeedbackMessage({ type: 'success', text: 'Lot de réception mis à jour avec succès !' });
      fetchSessionAndStats();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteReception = async (id: number) => {
    setDeleteSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/receptions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      setReceptionsList((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      setFeedbackMessage({ type: 'success', text: 'Ligne de réception supprimée avec succès !' });
      fetchSessionAndStats();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleStartEditLivraison = (liv: any) => {
    setEditingLivraison(liv);
    const dateFormatted = liv.date_livraison
      ? new Date(liv.date_livraison).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEditLivraisonForm({
      id: liv.id,
      id_entite: liv.id_entite || '',
      nom_entite: liv.nom_entite || liv.id_entite || '',
      date_livraison: dateFormatted,
      quantite: liv.quantite_livree || 1,
      annee_scolaire: liv.annee_scolaire || '2026-2027',
      receptionne_par: liv.destinataire_nom || liv.receptionne_par || '',
      contact: liv.contact_receptionnaire || '',
      mode_livraison: liv.mode_livraison || 'Agent du MFFE',
      cout_livraison: liv.cout_livraison || 0,
      reference_decharge: liv.reference_decharge || '',
      observations: liv.observations || '',
    });
  };

  const handleSaveEditLivraison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLivraisonForm.quantite || editLivraisonForm.quantite <= 0) {
      alert('La quantité livrée doit être supérieure à 0.');
      return;
    }
    setEditLivraisonSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/livraisons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLivraisonForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour.');
      }

      setLivraisonsList((prev) =>
        prev.map((l) =>
          l.id === editLivraisonForm.id
            ? {
                ...l,
                quantite_livree: editLivraisonForm.quantite,
                date_livraison: editLivraisonForm.date_livraison,
                annee_scolaire: editLivraisonForm.annee_scolaire,
                receptionne_par: editLivraisonForm.receptionne_par,
                destinataire_nom: editLivraisonForm.receptionne_par,
                contact_receptionnaire: editLivraisonForm.contact,
                mode_livraison: editLivraisonForm.mode_livraison,
                cout_livraison: editLivraisonForm.cout_livraison,
                reference_decharge: editLivraisonForm.reference_decharge,
                observations: editLivraisonForm.observations,
              }
            : l
        )
      );
      setEditingLivraison(null);
      setFeedbackMessage({ type: 'success', text: 'Enregistrement de livraison mis à jour avec succès !' });
      fetchSessionAndStats();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setEditLivraisonSaving(false);
    }
  };

  const handleDeleteLivraison = async (id: number) => {
    setDeleteLivraisonSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`/api/livraisons?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      setLivraisonsList((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirmLivraisonId(null);
      setFeedbackMessage({ type: 'success', text: 'Ligne de livraison supprimée avec succès !' });
      fetchSessionAndStats();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setDeleteLivraisonSaving(false);
    }
  };

  const fetchSessionAndStats = async () => {
    try {
      setLoading(true);
      // Vérifier la session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'ADMIN') {
        router.push(meData.user.role === 'USER' ? '/user' : '/login');
        return;
      }
      setUser(meData.user);

      // Charger les stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setDernieresReceptions(data.dernieresReceptions || []);
        setDernieresLivraisons(data.dernieresLivraisons || []);
        setRepartitionHierarchie(data.repartitionHierarchie || []);
        setRecapParNature(data.recapParNature || []);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndStats();
  }, []);

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-24 sm:pb-12">
      {/* Barre Supérieure Fixe - Optimisée Smartphone */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-orange-600/20 border border-orange-500/30 shrink-0">
              <img
                src="/logo-mffe.png"
                alt="Logo MFFE"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Espace Admin</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30">
                  DRH MFFE
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {user?.name || 'Administrateur'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessionAndStats}
              title="Rafraîchir"
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="max-w-5xl mx-auto px-4 py-5 sm:px-6 space-y-6">
        {/* Bannière de Bienvenue Mobile avec Logo */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600/20 via-amber-600/15 to-transparent border border-orange-500/30 p-4 sm:p-6 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-orange-500/30 items-center justify-center shrink-0">
                <img
                  src="/logo-mffe.png"
                  alt="Logo MFFE"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Superviseur National DRH
                </span>
                <h2 className="text-lg sm:text-2xl font-extrabold text-white">
                  Pilotage des Cartes Scolaires
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Suivez en temps réel les réceptions, distributions et soldes disponibles sur les 582 structures scolaires du ministère.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 font-medium">
                Année 2025 - 2026
              </span>
            </div>
          </div>
        </div>

        {/* Grille / Carrousel des KPI Majeurs (4 Cartes tactiles interactives) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Structures */}
          <button
            type="button"
            onClick={() => openKpiModal('structures')}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-400 transition">Structures</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-blue-200 transition">
                {stats?.totalEntites ?? 582}
              </div>
              <div className="mt-1.5 flex flex-col gap-1">
                <div className="text-[11px] text-slate-300 font-medium flex items-center justify-between gap-1">
                  <span>Concernées :</span>
                  <strong className="text-blue-400">{stats?.structuresConcernees ?? 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Taux couverture :</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    {stats?.tauxStructures ?? 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-semibold group-hover:text-blue-300">
              <span>Voir annuaire & détails</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* 2. Cartes Reçues */}
          <button
            type="button"
            onClick={() => openKpiModal('receptions')}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition">Reçues</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 group-hover:text-emerald-300 transition">
                {stats?.totalRecu?.toLocaleString('fr-FR') ?? 0}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400">
                <p className="font-medium text-slate-300">{stats?.nbReceptions ?? 0} lot(s) enregistré(s)</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">Enregistré en stock</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:text-emerald-300">
              <span>Gérer & modifier les lots</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* 3. Cartes Livrées */}
          <button
            type="button"
            onClick={() => openKpiModal('livraisons')}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-orange-400 transition">Distribuées</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-orange-400 group-hover:text-orange-300 transition">
                {stats?.totalLivre?.toLocaleString('fr-FR') ?? 0}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400">
                <p className="font-medium text-slate-300">{stats?.nbLivraisons ?? 0} livraison(s)</p>
                <p className="text-[10px] text-orange-400/80 mt-0.5">Remises aux élèves</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-orange-400 font-semibold group-hover:text-orange-300">
              <span>Gérer & modifier les livraisons</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* 4. Stock Disponible */}
          <button
            type="button"
            onClick={() => openKpiModal('stock')}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-purple-400 transition">En Stock</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-400 group-hover:text-purple-300 transition">
                {stats?.stockDisponible?.toLocaleString('fr-FR') ?? 0}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Taux distrib. :</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                  {stats?.tauxDistribution ?? 0}%
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-semibold group-hover:text-purple-300">
              <span>Voir le solde en stock</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>
        </section>

        {/* Actions Rapides Smartphone (Touches Larges) */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Opérations Rapides
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => router.push('/receptions')}
              className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Enregistrer Réception</span>
            </button>

            <button
              onClick={() => router.push('/livraisons')}
              className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Enregistrer Livraison</span>
            </button>

            <button
              onClick={() => alert("La carte interactive des structures sera affichée à l'étape suivante")}
              className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <School className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">582 Structures MFFE</span>
            </button>

            <button
              onClick={() => alert("L'export et bilan des stocks complet seront intégrés à l'étape suivante")}
              className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Bilan des Stocks</span>
            </button>
          </div>
        </section>

        {/* Tableau Récapitulatif des Cartes par Nature d'Entité (IFEF, CACE, CPPE, CES, GARDERIE, CRECHE) */}
        <section className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Récapitulatif des Cartes par Nature d'Entité
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
                    6 Natures Cibles
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synthèse ciblée : <strong className="text-slate-300">IFEF, CACE, CPPE, CES, GARDERIE, CRÈCHE</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
                <span className="text-slate-400">Total Structures : </span>
                <span className="font-extrabold text-white">
                  {recapParNature.reduce((acc, i) => acc + (i.total_structures || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-2.5 px-3">Nature d'Entité</th>
                  <th className="py-2.5 px-3 text-center">Structures</th>
                  <th className="py-2.5 px-3 text-center">Structures Dotées</th>
                  <th className="py-2.5 px-3 text-right">Cartes Reçues</th>
                  <th className="py-2.5 px-3 text-right">Cartes Livrées</th>
                  <th className="py-2.5 px-3 text-right">Solde Stock</th>
                  <th className="py-2.5 px-3 text-center">Taux Distrib.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recapParNature.map((item) => {
                  const meta = NATURE_META[item.code] || {
                    label: item.libelle,
                    badge: 'bg-slate-800 text-slate-300 border-slate-700',
                    border: 'border-slate-800',
                    bar: 'bg-orange-500',
                  };
                  return (
                    <tr key={item.code} className="hover:bg-slate-800/30 transition">
                      {/* Nature d'entité & Libellé */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex items-center self-start px-2 py-0.5 rounded text-[11px] font-black border ${meta.badge}`}
                          >
                            {item.code}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1 truncate max-w-[240px]">
                            {item.libelle || meta.label}
                          </span>
                        </div>
                      </td>

                      {/* Nombre total de structures */}
                      <td className="py-3 px-3 text-center font-bold text-white text-sm">
                        {item.total_structures}
                      </td>

                      {/* Structures avec cartes reçues */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            item.structures_avec_cartes > 0
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-slate-800/40 text-slate-500 border-slate-800'
                          }`}
                        >
                          {item.structures_avec_cartes} / {item.total_structures}
                        </span>
                      </td>

                      {/* Cartes Reçues */}
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-400 text-sm">
                        {item.total_recu.toLocaleString('fr-FR')}
                      </td>

                      {/* Cartes Livrées */}
                      <td className="py-3 px-3 text-right font-extrabold text-orange-400 text-sm">
                        {item.total_livre.toLocaleString('fr-FR')}
                      </td>

                      {/* Solde en Stock */}
                      <td className="py-3 px-3 text-right font-extrabold text-purple-300 text-sm">
                        {item.solde_stock.toLocaleString('fr-FR')}
                      </td>

                      {/* Taux de Distribution */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[70px]">
                          <span className="text-[11px] font-bold text-slate-200">
                            {item.taux_distribution}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meta.bar}`}
                              style={{ width: `${Math.min(100, item.taux_distribution)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Ligne TOTAL */}
              <tfoot>
                {(() => {
                  const totStructures = recapParNature.reduce((acc, i) => acc + (i.total_structures || 0), 0);
                  const totDotees = recapParNature.reduce((acc, i) => acc + (i.structures_avec_cartes || 0), 0);
                  const totRecu = recapParNature.reduce((acc, i) => acc + (i.total_recu || 0), 0);
                  const totLivre = recapParNature.reduce((acc, i) => acc + (i.total_livre || 0), 0);
                  const totStock = recapParNature.reduce((acc, i) => acc + (i.solde_stock || 0), 0);
                  const totTaux = totRecu > 0 ? Number(((totLivre / totRecu) * 100).toFixed(1)) : 0;

                  return (
                    <tr className="border-t-2 border-slate-700 bg-slate-950/70 font-extrabold text-xs">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white uppercase tracking-wider font-extrabold">
                            Total Récapitulatif
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({recapParNature.length} natures)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-white text-sm">
                        {totStructures}
                      </td>
                      <td className="py-3.5 px-3 text-center text-blue-300">
                        {totDotees} / {totStructures}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-400 text-sm">
                        {totRecu.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-3 text-right text-orange-400 text-sm">
                        {totLivre.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-3 text-right text-purple-300 text-sm">
                        {totStock.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3.5 px-3 text-center text-white">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[70px]">
                          <span className="text-[11px] font-extrabold text-white">
                            {totTaux}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${Math.min(100, totTaux)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </section>

        {/* Section Flux Récents avec Onglets Tactiles */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Derniers Mouvements</span>
            </h3>

            {/* Onglets Tactiles */}
            <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('receptions')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'receptions'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Réceptions
              </button>
              <button
                onClick={() => setActiveTab('livraisons')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === 'livraisons'
                    ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Livraisons
              </button>
            </div>
          </div>

          {/* Liste des Opérations */}
          {activeTab === 'receptions' ? (
            dernieresReceptions.length > 0 ? (
              <div className="space-y-2.5">
                {dernieresReceptions.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{rec.nom_entite}</p>
                        <p className="text-[11px] text-slate-400">
                          {rec.sigle ? `[${rec.sigle}] ` : ''}Date: {new Date(rec.date_reception).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        +{rec.quantite_recue}
                      </span>
                      <p className="text-[10px] text-slate-500">cartes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>Aucune réception enregistrée pour le moment.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Utilisez le bouton "Enregistrer Réception" pour débuter.</p>
              </div>
            )
          ) : dernieresLivraisons.length > 0 ? (
            <div className="space-y-2.5">
              {dernieresLivraisons.map((liv) => (
                <div
                  key={liv.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{liv.nom_entite}</p>
                      <p className="text-[11px] text-slate-400">
                        Bénéficiaire: {liv.destinataire_nom || 'Non spécifié'} • {new Date(liv.date_livraison).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-orange-400 text-sm">
                      -{liv.quantite_livree}
                    </span>
                    <p className="text-[10px] text-slate-500">cartes</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>Aucune livraison enregistrée pour le moment.</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Utilisez le bouton "Enregistrer Livraison" pour débuter.</p>
            </div>
          )}
        </section>

        {/* Répartition par Grandes Catégories Hiérarchiques */}
        {repartitionHierarchie.length > 0 && (
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Structures Clés par Niveau</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {repartitionHierarchie.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="text-[11px] text-slate-400 truncate">{item.id_hierarchisation.replace(/_/g, ' ')}</div>
                  <div className="text-base font-bold text-white mt-0.5">{item.count} entités</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MODALE DETAILS & GESTION KPI CLIQUE */}
        {activeKpiModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              {/* En-tête de la modale */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      activeKpiModal === 'receptions'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : activeKpiModal === 'livraisons'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : activeKpiModal === 'structures'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}
                  >
                    {activeKpiModal === 'receptions' && <ArrowDownLeft className="w-5 h-5" />}
                    {activeKpiModal === 'livraisons' && <ArrowUpRight className="w-5 h-5" />}
                    {activeKpiModal === 'structures' && <School className="w-5 h-5" />}
                    {activeKpiModal === 'stock' && <Boxes className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      {activeKpiModal === 'receptions' && 'Enregistrements des Cartes Reçues'}
                      {activeKpiModal === 'livraisons' && 'Enregistrements des Cartes Livrées'}
                      {activeKpiModal === 'structures' && 'Annuaire des 582 Structures'}
                      {activeKpiModal === 'stock' && 'Entités ayant des Cartes en Stock'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeKpiModal === 'receptions' && 'Consultez, modifiez ou supprimez les lots de réceptions enregistrés'}
                      {activeKpiModal === 'livraisons' && 'Historique complet des distributions effectuées'}
                      {activeKpiModal === 'structures' && 'Visualisation des établissements scolaires'}
                      {activeKpiModal === 'stock' && 'Affichage exclusif des entités disposant d\'un solde de cartes en réserve'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveKpiModal(null);
                    setEditingReception(null);
                    setDeleteConfirmId(null);
                    setEditingLivraison(null);
                    setDeleteConfirmLivraisonId(null);
                    setFeedbackMessage(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message de notification / retour */}
              {feedbackMessage && (
                <div
                  className={`mx-5 mt-4 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedbackMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{feedbackMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setFeedbackMessage(null)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Barre de recherche & boutons rapides */}
              <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par structure, sigle, date, référence..."
                    value={kpiSearch}
                    onChange={(e) => setKpiSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                  {kpiSearch && (
                    <button
                      onClick={() => setKpiSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeKpiModal === 'receptions' && (
                  <button
                    onClick={() => router.push('/receptions')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle Réception</span>
                  </button>
                )}
                {activeKpiModal === 'livraisons' && (
                  <button
                    onClick={() => router.push('/livraisons')}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle Livraison</span>
                  </button>
                )}
                {activeKpiModal === 'stock' && (
                  <button
                    onClick={() => router.push('/livraisons')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Effectuer Livraison</span>
                  </button>
                )}
              </div>

              {/* Corps de la modale */}
              <div className="p-5 overflow-y-auto flex-1">
                {kpiModalLoading ? (
                  <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                    <span>Chargement des enregistrements...</span>
                  </div>
                ) : activeKpiModal === 'receptions' ? (
                  // VUE RECEPTIONS (AVEC MODIFIER ET SUPPRIMER)
                  (() => {
                    const filtered = receptionsList.filter(
                      (r) =>
                        (r.nom_entite || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (r.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (r.annee_scolaire || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (r.reference_bordereau || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (r.receptionnaire_nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (r.observations || '').toLowerCase().includes(kpiSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          <PackageCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                          <p>Aucun enregistrement de réception ne correspond à vos critères.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="text-[11px] text-slate-400 font-semibold px-1">
                          {filtered.length} enregistrement(s) trouvé(s)
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Structure Bénéficiaire</th>
                                <th className="py-2.5 px-3 text-right">Quantité Reçue</th>
                                <th className="py-2.5 px-3">Année & Réf.</th>
                                <th className="py-2.5 px-3">Observations</th>
                                <th className="py-2.5 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-800/30 transition group">
                                  <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                                    {rec.date_reception
                                      ? new Date(rec.date_reception).toLocaleDateString('fr-FR')
                                      : '-'}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white truncate max-w-[200px]">
                                      {rec.nom_entite}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      {rec.sigle && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                          {rec.sigle}
                                        </span>
                                      )}
                                      {rec.localisation && <span>{rec.localisation}</span>}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black text-sm">
                                      +{rec.quantite_recue}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                                      {rec.annee_scolaire || '2026-2027'}
                                    </span>
                                    {rec.reference_bordereau && (
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        Réf: {rec.reference_bordereau}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                                    {rec.observations || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEditReception(rec)}
                                        title="Modifier cet enregistrement"
                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Modifier</span>
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(rec.id)}
                                        title="Supprimer cet enregistrement"
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Supprimer</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                ) : activeKpiModal === 'livraisons' ? (
                  // VUE LIVRAISONS
                  (() => {
                    const filtered = livraisonsList.filter(
                      (l) =>
                        (l.nom_entite || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (l.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (l.destinataire_nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (l.observations || '').toLowerCase().includes(kpiSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                          <p>Aucun enregistrement de livraison trouvé.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="text-[11px] text-slate-400 font-semibold px-1">
                          {filtered.length} livraison(s) trouvée(s)
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Structure</th>
                                <th className="py-2.5 px-3 text-right">Quantité Livrée</th>
                                <th className="py-2.5 px-3">Bénéficiaire & Mode</th>
                                <th className="py-2.5 px-3">Observations</th>
                                <th className="py-2.5 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((liv) => (
                                <tr key={liv.id} className="hover:bg-slate-800/30 transition group">
                                  <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                                    {liv.date_livraison
                                      ? new Date(liv.date_livraison).toLocaleDateString('fr-FR')
                                      : '-'}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white truncate max-w-[200px]">
                                      {liv.nom_entite}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      {liv.sigle && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                          {liv.sigle}
                                        </span>
                                      )}
                                      {liv.localisation && <span>{liv.localisation}</span>}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 font-black text-sm">
                                      -{liv.quantite_livree}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="text-white font-medium">
                                      {liv.destinataire_nom || liv.receptionne_par || 'Non spécifié'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                      <span>Mode: {liv.mode_livraison || 'Agent DRH'}</span>
                                      {liv.contact_receptionnaire && <span>• Tél: {liv.contact_receptionnaire}</span>}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                                    {liv.observations || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEditLivraison(liv)}
                                        title="Modifier cette livraison"
                                        className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Modifier</span>
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmLivraisonId(liv.id)}
                                        title="Supprimer cette livraison"
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Supprimer</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                ) : activeKpiModal === 'stock' ? (
                  // VUE EN STOCK (UNIQUEMENT ENTITÉS AVEC QUANTITÉS DE CARTES EN STOCK)
                  (() => {
                    const filtered = stockList.filter(
                      (s) =>
                        (Number(s.solde_stock_disponible) || 0) > 0 &&
                        ((s.nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                          (s.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                          (s.id_nature || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                          (s.localisation || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                          (s.id_entite || '').toLowerCase().includes(kpiSearch.toLowerCase()))
                    );

                    const totalEnStock = filtered.reduce(
                      (acc, curr) => acc + (Number(curr.solde_stock_disponible) || 0),
                      0
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          <Boxes className="w-10 h-10 mx-auto mb-3 text-purple-400/50" />
                          <p className="font-semibold text-slate-200 text-sm">
                            {kpiSearch
                              ? 'Aucune entité avec du stock ne correspond à votre recherche.'
                              : 'Aucune entité ne dispose actuellement de cartes en stock (solde = 0).'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                            {kpiSearch
                              ? 'Veuillez modifier votre terme de recherche.'
                              : 'Toutes les cartes réceptionnées ont été distribuées ou aucun lot n\'a encore été enregistré.'}
                          </p>
                          {!kpiSearch && (
                            <button
                              onClick={() => router.push('/receptions')}
                              className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-purple-600/20"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Enregistrer une Réception</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
                          <div className="text-[11px] text-slate-400 font-semibold">
                            <span className="text-white font-bold">{filtered.length}</span> entité(s) ayant des cartes en stock
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-[11px]">
                              Total disponible : {totalEnStock.toLocaleString('fr-FR')} cartes
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Structure Bénéficiaire</th>
                                <th className="py-2.5 px-3">Nature</th>
                                <th className="py-2.5 px-3 text-right">Reçues</th>
                                <th className="py-2.5 px-3 text-right">Distribuées</th>
                                <th className="py-2.5 px-3 text-right">En Stock</th>
                                <th className="py-2.5 px-3 text-center">Taux Distrib.</th>
                                <th className="py-2.5 px-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((st) => (
                                <tr key={st.id_entite} className="hover:bg-slate-800/30 transition">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white truncate max-w-[220px]">
                                      {st.nom}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{st.localisation || '-'}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                      {st.id_nature || st.sigle || 'STRUCTURE'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right font-medium text-emerald-400">
                                    {st.total_recu ? Number(st.total_recu).toLocaleString('fr-FR') : 0}
                                  </td>
                                  <td className="py-3 px-3 text-right font-medium text-orange-400">
                                    {st.total_livre ? Number(st.total_livre).toLocaleString('fr-FR') : 0}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/40 font-black text-xs sm:text-sm">
                                      {Number(st.solde_stock_disponible || 0).toLocaleString('fr-FR')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="text-[11px] font-bold text-slate-200">
                                      {st.taux_distribution_pct || 0}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      onClick={() => router.push(`/livraisons?entite=${st.id_entite}`)}
                                      title="Effectuer une livraison pour cette structure"
                                      className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition active:scale-95 inline-flex items-center gap-1 text-[11px] font-semibold"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Livrer</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // VUE STRUCTURES (ANNUAIRE COMPLET DES 582 STRUCTURES)
                  (() => {
                    const filtered = structuresList.filter(
                      (s) =>
                        (s.nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (s.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (s.id_nature || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
                        (s.localisation || '').toLowerCase().includes(kpiSearch.toLowerCase())
                    );

                    return (
                      <div className="space-y-3">
                        <div className="text-[11px] text-slate-400 font-semibold px-1">
                          {filtered.length} structure(s) affichée(s)
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Structure</th>
                                <th className="py-2.5 px-3">Nature</th>
                                <th className="py-2.5 px-3 text-right">Reçues</th>
                                <th className="py-2.5 px-3 text-right">Distribuées</th>
                                <th className="py-2.5 px-3 text-right">Solde Stock</th>
                                <th className="py-2.5 px-3 text-center">Taux Distrib.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((st) => (
                                <tr key={st.id_entite} className="hover:bg-slate-800/30 transition">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white truncate max-w-[220px]">
                                      {st.nom}
                                    </div>
                                    <div className="text-[11px] text-slate-400">{st.localisation || '-'}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                      {st.id_nature || st.sigle || 'STRUCTURE'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                                    {st.total_recu ? Number(st.total_recu).toLocaleString('fr-FR') : 0}
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-orange-400">
                                    {st.total_livre ? Number(st.total_livre).toLocaleString('fr-FR') : 0}
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold text-purple-300">
                                    {st.solde_stock_disponible
                                      ? Number(st.solde_stock_disponible).toLocaleString('fr-FR')
                                      : 0}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="text-[11px] font-bold text-slate-200">
                                      {st.taux_distribution_pct || 0}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Pied de page modal */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Module Suivi des Cartes Scolaires DRH</span>
                <button
                  onClick={() => {
                    setActiveKpiModal(null);
                    setEditingReception(null);
                    setDeleteConfirmId(null);
                    setEditingLivraison(null);
                    setDeleteConfirmLivraisonId(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE D'ÉDITION D'UNE LIVRAISON */}
        {editingLivraison && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-orange-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      Modifier la Livraison #{editingLivraison.id}
                    </h4>
                    <p className="text-[11px] text-orange-400 truncate max-w-[260px]">
                      {editLivraisonForm.nom_entite}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingLivraison(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditLivraison} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Quantité de cartes livrées *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editLivraisonForm.quantite}
                    onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, quantite: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Date de livraison *
                    </label>
                    <input
                      type="date"
                      required
                      value={editLivraisonForm.date_livraison}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, date_livraison: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Année scolaire
                    </label>
                    <input
                      type="text"
                      value={editLivraisonForm.annee_scolaire}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, annee_scolaire: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nom du bénéficiaire / réceptionnaire
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: M. KOFFI Emmanuel"
                      value={editLivraisonForm.receptionne_par}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, receptionne_par: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Contact téléphonique
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: +225 07 00 00 00"
                      value={editLivraisonForm.contact}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, contact: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mode de livraison
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Agent du MFFE, Retrait sur place"
                      value={editLivraisonForm.mode_livraison}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, mode_livraison: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Réf. Décharge
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DCH-2026-001"
                      value={editLivraisonForm.reference_decharge}
                      onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, reference_decharge: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Commentaire éventuel sur la remise..."
                    value={editLivraisonForm.observations}
                    onChange={(e) => setEditLivraisonForm({ ...editLivraisonForm, observations: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingLivraison(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editLivraisonSaving}
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {editLivraisonSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sauvegarder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION LIVRAISON */}
        {deleteConfirmLivraisonId !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                Supprimer cette livraison ?
              </h4>
              <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement la livraison #{deleteConfirmLivraisonId} ? Les cartes seront réintégrées au stock disponible.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmLivraisonId(null)}
                  disabled={deleteLivraisonSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLivraison(deleteConfirmLivraisonId)}
                  disabled={deleteLivraisonSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {deleteLivraisonSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <span>Oui, Supprimer</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE D'ÉDITION D'UNE RÉCEPTION */}
        {editingReception && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-blue-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      Modifier la Réception #{editingReception.id}
                    </h4>
                    <p className="text-[11px] text-blue-400 truncate max-w-[260px]">
                      {editForm.nom_entite}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingReception(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditReception} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Quantité de cartes reçues *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.quantite}
                    onChange={(e) => setEditForm({ ...editForm, quantite: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Date de réception *
                    </label>
                    <input
                      type="date"
                      required
                      value={editForm.date_reception}
                      onChange={(e) => setEditForm({ ...editForm, date_reception: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Année scolaire
                    </label>
                    <input
                      type="text"
                      value={editForm.annee_scolaire}
                      onChange={(e) => setEditForm({ ...editForm, annee_scolaire: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Réf. Bordereau de décharge
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: BR-2026-001"
                      value={editForm.reference_bordereau}
                      onChange={(e) => setEditForm({ ...editForm, reference_bordereau: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nom du réceptionnaire
                    </label>
                    <input
                      type="text"
                      placeholder="Nom de l'agent"
                      value={editForm.receptionnaire_nom}
                      onChange={(e) => setEditForm({ ...editForm, receptionnaire_nom: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Commentaire éventuel..."
                    value={editForm.observations}
                    onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingReception(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {editSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sauvegarder</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                Supprimer cet enregistrement ?
              </h4>
              <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le lot de réception #{deleteConfirmId} ? Le stock disponible sera recalculé.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteReception(deleteConfirmId)}
                  disabled={deleteSaving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {deleteSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <span>Oui, Supprimer</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barre de Navigation Inférieure Mobile (Bottom Navigation Bar) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 sm:hidden flex justify-around items-center">
        <button className="flex flex-col items-center gap-1 text-orange-400 py-1">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>
        <button
          onClick={() => router.push('/receptions')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-[10px]">Réceptions</span>
        </button>
        <button
          onClick={() => router.push('/livraisons')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-[10px]">Livraisons</span>
        </button>
        <button
          onClick={() => alert("Annuaire des 582 structures")}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1"
        >
          <School className="w-5 h-5" />
          <span className="text-[10px]">Structures</span>
        </button>
      </nav>
    </div>
  );
}
