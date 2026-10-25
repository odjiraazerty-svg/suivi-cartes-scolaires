'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronDown,
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
  MapPin,
  Calendar,
  CalendarDays,
  Eye,
  Sparkles,
  Upload,
  Download,
  FileText,
  Printer,
} from 'lucide-react';
import * as xlsx from 'xlsx';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import ImportActiviteModal from '@/components/ImportActiviteModal';
import ExportDisponibiliteModal from '@/components/ExportDisponibiliteModal';
import {
  STRUCTURE_NATURES,
  OFFICIAL_REGIONAL_DIRECTIONS,
  generateIdEntiteFromNom,
  getDefaultHierarchieForNature,
} from '@/lib/entiteHelper';
import { getCurrentSchoolYear, getAvailableSchoolYears } from '@/lib/schoolYear';


interface ActiviteJourData {
  date: string;
  isToday: boolean;
  derniereDateActive: string;
  totalRecu: number;
  nbReceptions: number;
  totalLivre: number;
  nbLivraisons: number;
  soldeNet: number;
  tauxDistribution: number;
  receptions: any[];
  livraisons: any[];
}

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
  CSE: {
    label: "Complexe Socio-Éducatif",
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    border: 'border-blue-500/20',
    bar: 'bg-blue-500',
  },
  CES: {
    label: "Centre d'Éducation Spécialisée",
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/20',
    bar: 'bg-amber-500',
  },
  CS: {
    label: "Centre Social",
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    border: 'border-cyan-500/20',
    bar: 'bg-cyan-500',
  },
  DIRECTION: {
    label: "Direction",
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    border: 'border-indigo-500/20',
    bar: 'bg-indigo-500',
  },
  POUPONNIERE: {
    label: "Pouponnière",
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/20',
    bar: 'bg-rose-500',
  },
  CRECHE: {
    label: 'Crèche / Garderie',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/20',
    bar: 'bg-teal-500',
  },
  'CRECHE  GARDERIE': {
    label: 'Crèche / Garderie',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/20',
    bar: 'bg-teal-500',
  },
  GARDERIE: {
    label: 'Garderie',
    badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    border: 'border-pink-500/20',
    bar: 'bg-pink-500',
  },
  PROGRAMME: {
    label: 'Programme',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    border: 'border-red-500/20',
    bar: 'bg-red-500',
  },
  CA: {
    label: "Centre d'Accueil",
    badge: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    border: 'border-lime-500/20',
    bar: 'bg-lime-500',
  },
  'SOS VILLAGE': {
    label: "Village d'Enfants SOS",
    badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    border: 'border-yellow-500/20',
    bar: 'bg-yellow-500',
  },
  ORPHELINAT: {
    label: "Orphelinat",
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    border: 'border-orange-500/20',
    bar: 'bg-orange-500',
  },
  CT: {
    label: "Centre de Transit",
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    border: 'border-violet-500/20',
    bar: 'bg-violet-500',
  },
  'STRUCTURE SPECIALISEE': {
    label: "Structure Spécialisée",
    badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    border: 'border-fuchsia-500/20',
    bar: 'bg-fuchsia-500',
  },
  ONG: {
    label: "Organisation Non Gouvernementale",
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  CELLULE: {
    label: "Cellule",
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    border: 'border-slate-500/20',
    bar: 'bg-slate-500',
  },
  'CENTRE EDUCATIF': {
    label: "Centre Éducatif",
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/20',
    bar: 'bg-teal-500',
  },
  COMITE: {
    label: "Comité",
    badge: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    border: 'border-zinc-500/20',
    bar: 'bg-zinc-500',
  },
  INTERNAT: {
    label: "Internat",
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    border: 'border-blue-500/20',
    bar: 'bg-blue-500',
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recapParNature, setRecapParNature] = useState<RecapNatureItem[]>([]);
  // Filtre pour afficher uniquement les natures ayant des cartes en stock (> 0)
  const [onlyWithStock, setOnlyWithStock] = useState<boolean>(true);

  // Natures affichées (filtrées par stock disponible si onlyWithStock est actif)
  const displayedRecapParNature = useMemo(() => {
    if (onlyWithStock) {
      return recapParNature.filter((item) => (item.solde_stock || 0) > 0);
    }
    return recapParNature;
  }, [recapParNature, onlyWithStock]);

  // Export Disponibilité officiel (modèle 'DISPONIBILITE DES CARTES SCOLAIRES' avec saut de page par région)
  const [showDispoModal, setShowDispoModal] = useState<boolean>(false);
  const [dispoInitialNature, setDispoInitialNature] = useState<string>('ALL');
  const [isExportingDispo, setIsExportingDispo] = useState<boolean>(false);

  // Choix de l'année scolaire (Dynamique selon le calendrier officiel MFFE - 2026-2027 en cours)
  const anneesScolairesDisponibles = useMemo(() => getAvailableSchoolYears(), []);

  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mffe_selected_annee_scolaire');
      if (saved) {
        const cleaned = saved.replace(/\s+/g, '');
        if (cleaned.includes('-')) return cleaned;
      }
    }
    // Par défaut : Année scolaire en cours calculée dynamiquement (ex: 2026-2027)
    return getCurrentSchoolYear();
  });

  const handleAnneeScolaireChange = (newAnnee: string) => {
    setSelectedAnneeScolaire(newAnnee);
    try {
      sessionStorage.setItem('mffe_selected_annee_scolaire', newAnnee);
      localStorage.setItem('mffe_selected_annee_scolaire', newAnnee);
    } catch (e) {
      // ignore
    }
    fetchSessionAndStats(selectedDate, newAnnee);
    if (activeKpiModal) {
      openKpiModal(activeKpiModal, newAnnee);
    }
  };

  const [dernieresReceptions, setDernieresReceptions] = useState<any[]>([]);
  const [dernieresLivraisons, setDernieresLivraisons] = useState<any[]>([]);
  const [repartitionHierarchie, setRepartitionHierarchie] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'activite_jour' | 'receptions' | 'livraisons'>('activite_jour');
  const [loading, setLoading] = useState(true);

  // Activité du jour (carrousel et modales de détails interactifs)
  const [activiteJour, setActiviteJour] = useState<ActiviteJourData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loadingActiviteJour, setLoadingActiviteJour] = useState(false);
  const [activeDayModal, setActiveDayModal] = useState<'receptions_jour' | 'livraisons_jour' | 'journal_jour' | null>(null);
  const [daySearch, setDaySearch] = useState('');

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

  // État de sélection / modification de structure pour les modales d'édition
  const [allStructures, setAllStructures] = useState<any[]>([]);
  const [loadingAllStructures, setLoadingAllStructures] = useState(false);
  const [editStructureSearch, setEditStructureSearch] = useState('');
  const [isSelectingStructure, setIsSelectingStructure] = useState(false);

  const loadAllStructures = async () => {
    if (allStructures.length > 0) return allStructures;
    try {
      setLoadingAllStructures(true);
      const res = await fetch('/api/entites?all=true');
      if (res.ok) {
        const data = await res.json();
        const list = data.entites || [];
        setAllStructures(list);
        return list;
      }
    } catch (err) {
      console.error('Erreur chargement entites:', err);
    } finally {
      setLoadingAllStructures(false);
    }
    return [];
  };

  const filteredStructures = (allStructures || []).filter((s) => {
    if (!editStructureSearch.trim()) return true;
    const term = editStructureSearch.toLowerCase();
    return (
      (s.nom || '').toLowerCase().includes(term) ||
      (s.sigle || '').toLowerCase().includes(term) ||
      (s.id_entite || '').toLowerCase().includes(term) ||
      (s.localisation || '').toLowerCase().includes(term) ||
      (s.id_nature || '').toLowerCase().includes(term)
    );
  });

  // Création d'une structure (Opération Rapide Administrateur)
  const [showCreateStructureModal, setShowCreateStructureModal] = useState(false);
  const [newStructureForm, setNewStructureForm] = useState({
    id_entite: '',
    nom: '',
    id_nature: 'CPPE',
    id_hierarchisation: 'CPPE',
    localisation: '',
    sigle: 'CPPE',
    responsable_nom: '',
    id_entite_parent: '',
    isManualId: false,
  });
  const [parentEntitiesList, setParentEntitiesList] = useState<any[]>(OFFICIAL_REGIONAL_DIRECTIONS);
  const [loadingParents, setLoadingParents] = useState(false);
  const [createStructureSaving, setCreateStructureSaving] = useState(false);
  const [createStructureError, setCreateStructureError] = useState<string | null>(null);
  const [createStructureSuccess, setCreateStructureSuccess] = useState<string | null>(null);

  const loadParentEntities = async () => {
    try {
      setLoadingParents(true);
      const res = await fetch('/api/entites?parents_only=true');
      if (res.ok) {
        const data = await res.json();
        if (data.parents && data.parents.length > 0) {
          setParentEntitiesList(data.parents);
        }
      }
    } catch (err) {
      console.error('Erreur chargement entités parents:', err);
    } finally {
      setLoadingParents(false);
    }
  };

  const isIdEntiteDuplicate = useMemo(() => {
    const currentId = (newStructureForm.id_entite || '').trim().toUpperCase();
    if (!currentId) return false;
    return (allStructures || []).some(
      (s: any) => (s.id_entite || '').toUpperCase() === currentId
    );
  }, [newStructureForm.id_entite, allStructures]);

  const regionalDirections = useMemo(() => {
    const drs = (parentEntitiesList || []).filter(
      (p: any) =>
        p.id_hierarchisation === 'DIRECTION_REGIONALE' ||
        (p.id_entite && p.id_entite.startsWith('DR ')) ||
        (p.sigle && p.sigle.startsWith('DR'))
    );
    if (drs.length > 0) return drs;
    return OFFICIAL_REGIONAL_DIRECTIONS.map((d) => ({
      id_entite: d.id,
      nom: d.nom,
      sigle: d.sigle,
    }));
  }, [parentEntitiesList]);

  const centralDirections = useMemo(() => {
    return (parentEntitiesList || []).filter(
      (p: any) =>
        p.id_hierarchisation !== 'DIRECTION_REGIONALE' &&
        !(p.id_entite && p.id_entite.startsWith('DR ')) &&
        !(p.sigle && p.sigle.startsWith('DR'))
    );
  }, [parentEntitiesList]);


  // Modification / Suppression de Structure
  const [editingStructure, setEditingStructure] = useState<any | null>(null);
  const [editStructureForm, setEditStructureForm] = useState({
    original_id_entite: '',
    id_entite: '',
    nom: '',
    id_nature: 'CPPE',
    id_hierarchisation: 'CPPE',
    sigle: '',
    id_entite_parent: '',
    localisation: '',
    responsable_nom: '',
  });
  const [editStructureSaving, setEditStructureSaving] = useState(false);
  const [editStructureError, setEditStructureError] = useState<string | null>(null);
  const [deleteConfirmStructure, setDeleteConfirmStructure] = useState<any | null>(null);
  const [deleteStructureSaving, setDeleteStructureSaving] = useState(false);
  const [deleteStructureError, setDeleteStructureError] = useState<string | null>(null);

  // Modale d'importation automatique (Excel, Word, PDF)
  const [showImportModal, setShowImportModal] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openKpiModal = async (
    type: 'structures' | 'receptions' | 'livraisons' | 'stock',
    overrideAnnee?: string
  ) => {
    setActiveKpiModal(type);
    setKpiSearch('');
    setFeedbackMessage(null);
    setEditingReception(null);
    setDeleteConfirmId(null);
    setEditingLivraison(null);
    setDeleteConfirmLivraisonId(null);
    setEditingStructure(null);
    setDeleteConfirmStructure(null);
    setKpiModalLoading(true);

    const anneeToUse = (overrideAnnee || selectedAnneeScolaire || '2026-2027').replace(/\s+/g, '');

    try {
      if (type === 'receptions') {
        const res = await fetch(`/api/receptions?limit=500&annee_scolaire=${anneeToUse}`);
        if (res.ok) {
          const data = await res.json();
          setReceptionsList(data.receptions || []);
        }
      } else if (type === 'livraisons') {
        const res = await fetch(`/api/livraisons?limit=500&annee_scolaire=${anneeToUse}`);
        if (res.ok) {
          const data = await res.json();
          setLivraisonsList(data.livraisons || []);
        }
      } else if (type === 'structures') {
        const res = await fetch(`/api/entites?all=true&annee_scolaire=${anneeToUse}`);
        if (res.ok) {
          const data = await res.json();
          setStructuresList(data.entites || []);
        }
      } else if (type === 'stock') {
        const res = await fetch(`/api/entites?stock_only=true&all=true&annee_scolaire=${anneeToUse}`);
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

  const handleExportStockExcel = (listToExport?: any[]) => {
    try {
      const sourceList =
        listToExport ||
        stockList.filter(
          (s) =>
            (Number(s.solde_stock_disponible) || 0) > 0 &&
            ((s.nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
              (s.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
              (s.id_nature || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
              (s.localisation || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
              (s.id_entite || '').toLowerCase().includes(kpiSearch.toLowerCase()))
        );

      if (!sourceList || sourceList.length === 0) {
        setFeedbackMessage({
          type: 'error',
          text: 'Aucune entité avec du stock à exporter.',
        });
        return;
      }

      // Formatage des lignes pour le tableau Excel
      const rows: any[] = sourceList.map((st, idx) => {
        const recu = Number(st.total_recu) || 0;
        const livre = Number(st.total_livre) || 0;
        const stock = Number(st.solde_stock_disponible) || 0;
        const taux = recu > 0 ? `${((livre / recu) * 100).toFixed(1)}%` : '0%';

        return {
          'N°': idx + 1,
          'Code Entité': st.id_entite || '',
          'Structure Bénéficiaire': st.nom || '',
          'Sigle': st.sigle || '',
          'Nature': st.id_nature || st.sigle || 'STRUCTURE',
          'Localisation / Ville': st.localisation || '',
          'Total Reçu': recu,
          'Total Distribué': livre,
          'Solde en Stock': stock,
          'Taux de Distribution': taux,
        };
      });

      // Ligne de totalisation globale
      const totalRecuGlobal = sourceList.reduce(
        (acc, curr) => acc + (Number(curr.total_recu) || 0),
        0
      );
      const totalLivreGlobal = sourceList.reduce(
        (acc, curr) => acc + (Number(curr.total_livre) || 0),
        0
      );
      const totalStockGlobal = sourceList.reduce(
        (acc, curr) => acc + (Number(curr.solde_stock_disponible) || 0),
        0
      );
      const tauxGlobal =
        totalRecuGlobal > 0
          ? `${((totalLivreGlobal / totalRecuGlobal) * 100).toFixed(1)}%`
          : '0%';

      rows.push({
        'N°': '',
        'Code Entité': 'TOTAL',
        'Structure Bénéficiaire': `${sourceList.length} entités au total`,
        'Sigle': '',
        'Nature': '',
        'Localisation / Ville': '',
        'Total Reçu': totalRecuGlobal,
        'Total Distribué': totalLivreGlobal,
        'Solde en Stock': totalStockGlobal,
        'Taux de Distribution': tauxGlobal,
      });

      const ws = xlsx.utils.json_to_sheet(rows);

      // Largeurs optimales de colonnes pour une lecture directe dans Excel
      ws['!cols'] = [
        { wch: 6 },  // N°
        { wch: 16 }, // Code Entité
        { wch: 42 }, // Structure Bénéficiaire
        { wch: 14 }, // Sigle
        { wch: 12 }, // Nature
        { wch: 26 }, // Localisation
        { wch: 14 }, // Total Reçu
        { wch: 16 }, // Total Distribué
        { wch: 16 }, // Solde en Stock
        { wch: 22 }, // Taux de Distribution
      ];

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Entités en Stock');

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Stock_Cartes_Scolaires_MFFE_${dateStr}.xlsx`;

      xlsx.writeFile(wb, filename);

      setFeedbackMessage({
        type: 'success',
        text: `Export réussi : ${sourceList.length} entité(s) exportée(s) dans "${filename}".`,
      });
    } catch (err: any) {
      console.error('Erreur export stock:', err);
      setFeedbackMessage({
        type: 'error',
        text: `Erreur lors de l'export Excel: ${err?.message || err}`,
      });
    }
  };

  const handleDirectExportDispo = async (natureCode: string = 'ALL', format: 'docx' | 'xlsx' = 'docx') => {
    try {
      setIsExportingDispo(true);
      const cleanAnnee = (selectedAnneeScolaire || '2026-2027').replace(/\s+/g, '');
      const params = new URLSearchParams();
      if (natureCode && natureCode !== 'ALL') {
        params.set('nature', natureCode);
      }
      params.set('format', format);
      params.set('annee_scolaire', cleanAnnee);

      const res = await fetch(`/api/export-disponibilite?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur lors de la génération du fichier.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      const natureTag = natureCode !== 'ALL' ? natureCode.toUpperCase().replace(/\s+/g, '_') : 'CONSOLIDE';
      const anneeTag = cleanAnnee ? `_${cleanAnnee.replace(/\s+/g, '_')}` : '';
      a.download = `DISPONIBILITE_CARTES_SCOLAIRES_${natureTag}${anneeTag}_${timestamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setFeedbackMessage({
        type: 'success',
        text: `Document de disponibilité (${format.toUpperCase()}) pour ${natureCode === 'ALL' ? 'Toutes les Natures' : natureCode} (${cleanAnnee}) exporté avec succès !`,
      });
    } catch (err: any) {
      console.error('Erreur export disponibilité:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Échec de l\'exportation de la disponibilité.',
      });
    } finally {
      setIsExportingDispo(false);
    }
  };

  const handleExportStructuresExcel = (listToExport?: any[]) => {
    try {
      const sourceList =
        listToExport ||
        structuresList.filter(
          (s) =>
            (s.nom || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
            (s.sigle || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
            (s.id_nature || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
            (s.localisation || '').toLowerCase().includes(kpiSearch.toLowerCase()) ||
            (s.id_entite || '').toLowerCase().includes(kpiSearch.toLowerCase())
        );

      if (!sourceList || sourceList.length === 0) {
        setFeedbackMessage({
          type: 'error',
          text: 'Aucune structure à exporter.',
        });
        return;
      }

      const rows = sourceList.map((st, idx) => ({
        'N°': idx + 1,
        'Code Structure': st.id_entite || '',
        'Nom de la Structure': st.nom || '',
        'Sigle': st.sigle || '',
        'Nature': st.id_nature || st.sigle || 'STRUCTURE',
        'Niveau Hiérarchique': st.id_hierarchisation || '',
        'Localisation / Ville': st.localisation || '',
        'Total Cartes Reçues': Number(st.total_recu) || 0,
        'Total Cartes Distribuées': Number(st.total_livre) || 0,
        'Solde en Stock': Number(st.solde_stock_disponible) || 0,
        'Taux Distribution': `${st.taux_distribution_pct || 0}%`,
      }));

      const ws = xlsx.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },  // N°
        { wch: 16 }, // Code
        { wch: 45 }, // Nom
        { wch: 14 }, // Sigle
        { wch: 14 }, // Nature
        { wch: 24 }, // Hiérarchisation
        { wch: 24 }, // Localisation
        { wch: 18 }, // Reçu
        { wch: 20 }, // Distribué
        { wch: 16 }, // Stock
        { wch: 18 }, // Taux
      ];

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Structures MFFE');

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Annuaire_Structures_MFFE_${dateStr}.xlsx`;

      xlsx.writeFile(wb, filename);

      setFeedbackMessage({
        type: 'success',
        text: `Export réussi : ${sourceList.length} structure(s) exportée(s) dans "${filename}".`,
      });
    } catch (err: any) {
      console.error('Erreur export structures:', err);
      setFeedbackMessage({
        type: 'error',
        text: `Erreur lors de l'export Excel: ${err?.message || err}`,
      });
    }
  };

  const formatDateForInput = (d: any) => {
    if (!d) return new Date().toISOString().split('T')[0];
    if (typeof d === 'string') {
      if (d.includes('T')) return d.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    }
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartEditReception = (rec: any) => {
    setEditingReception(rec);
    setIsSelectingStructure(false);
    setEditStructureSearch('');
    loadAllStructures();
    const dateFormatted = formatDateForInput(rec.date_reception);
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
    if (!editForm.id_entite) {
      alert('Veuillez sélectionner une structure concernée.');
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

      const updatedNom = data.reception?.nom_entite || editForm.nom_entite;
      const updatedSigle = data.reception?.sigle || '';

      setReceptionsList((prev) =>
        prev.map((r) =>
          r.id === editForm.id
            ? {
                ...r,
                id_entite: editForm.id_entite,
                nom_entite: updatedNom,
                sigle: updatedSigle,
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

      setActiviteJour((prev) => {
        if (!prev) return null;
        const updatedRecs = (prev.receptions || []).map((r: any) =>
          r.id === editForm.id
            ? {
                ...r,
                id_entite: editForm.id_entite,
                nom_entite: updatedNom,
                sigle: updatedSigle,
                quantite_recue: editForm.quantite,
                date_reception: editForm.date_reception,
                annee_scolaire: editForm.annee_scolaire,
                reference_bordereau: editForm.reference_bordereau,
                receptionnaire_nom: editForm.receptionnaire_nom,
                observations: editForm.observations,
              }
            : r
        );
        const totalRecu = updatedRecs.reduce((acc: number, cur: any) => acc + (cur.quantite_recue || 0), 0);
        const soldeNet = totalRecu - (prev.totalLivre || 0);
        return {
          ...prev,
          receptions: updatedRecs,
          totalRecu,
          soldeNet,
        };
      });

      setEditingReception(null);
      setFeedbackMessage({ type: 'success', text: 'Lot de réception mis à jour avec succès !' });
      fetchSessionAndStats();
      if (selectedDate) {
        fetchActiviteJour(selectedDate);
      }
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

      setActiviteJour((prev) => {
        if (!prev) return null;
        const updatedRecs = (prev.receptions || []).filter((r: any) => r.id !== id);
        const totalRecu = updatedRecs.reduce((acc: number, cur: any) => acc + (cur.quantite_recue || 0), 0);
        const nbReceptions = updatedRecs.length;
        const soldeNet = totalRecu - (prev.totalLivre || 0);
        return {
          ...prev,
          receptions: updatedRecs,
          totalRecu,
          nbReceptions,
          soldeNet,
        };
      });

      setDeleteConfirmId(null);
      setFeedbackMessage({ type: 'success', text: 'Ligne de réception supprimée avec succès !' });
      fetchSessionAndStats();
      if (selectedDate) {
        fetchActiviteJour(selectedDate);
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleStartEditLivraison = (liv: any) => {
    setEditingLivraison(liv);
    setIsSelectingStructure(false);
    setEditStructureSearch('');
    loadAllStructures();
    const dateFormatted = formatDateForInput(liv.date_livraison);
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
    if (!editLivraisonForm.id_entite) {
      alert('Veuillez sélectionner une structure concernée.');
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

      const updatedNom = data.livraison?.nom_entite || editLivraisonForm.nom_entite;
      const updatedSigle = data.livraison?.sigle || '';

      setLivraisonsList((prev) =>
        prev.map((l) =>
          l.id === editLivraisonForm.id
            ? {
                ...l,
                id_entite: editLivraisonForm.id_entite,
                nom_entite: updatedNom,
                sigle: updatedSigle,
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

      setActiviteJour((prev) => {
        if (!prev) return null;
        const updatedLivs = (prev.livraisons || []).map((l: any) =>
          l.id === editLivraisonForm.id
            ? {
                ...l,
                id_entite: editLivraisonForm.id_entite,
                nom_entite: updatedNom,
                sigle: updatedSigle,
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
        );
        const totalLivre = updatedLivs.reduce((acc: number, cur: any) => acc + (cur.quantite_livree || 0), 0);
        const soldeNet = (prev.totalRecu || 0) - totalLivre;
        return {
          ...prev,
          livraisons: updatedLivs,
          totalLivre,
          soldeNet,
        };
      });

      setEditingLivraison(null);
      setFeedbackMessage({ type: 'success', text: 'Enregistrement de livraison mis à jour avec succès !' });
      fetchSessionAndStats();
      if (selectedDate) {
        fetchActiviteJour(selectedDate);
      }
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

      setActiviteJour((prev) => {
        if (!prev) return null;
        const updatedLivs = (prev.livraisons || []).filter((l: any) => l.id !== id);
        const totalLivre = updatedLivs.reduce((acc: number, cur: any) => acc + (cur.quantite_livree || 0), 0);
        const nbLivraisons = updatedLivs.length;
        const soldeNet = (prev.totalRecu || 0) - totalLivre;
        return {
          ...prev,
          livraisons: updatedLivs,
          totalLivre,
          nbLivraisons,
          soldeNet,
        };
      });

      setDeleteConfirmLivraisonId(null);
      setFeedbackMessage({ type: 'success', text: 'Ligne de livraison supprimée avec succès !' });
      fetchSessionAndStats();
      if (selectedDate) {
        fetchActiviteJour(selectedDate);
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setDeleteLivraisonSaving(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStructureError(null);
    setCreateStructureSuccess(null);

    if (!newStructureForm.nom || newStructureForm.nom.trim().length < 3) {
      setCreateStructureError('Le nom de la structure doit comporter au moins 3 caractères.');
      return;
    }

    const cleanId = (newStructureForm.id_entite || '').trim().toUpperCase();
    if (!cleanId) {
      setCreateStructureError("L'identifiant système (id_entite) est obligatoire.");
      return;
    }

    if (isIdEntiteDuplicate) {
      setCreateStructureError(
        `L'identifiant système "${cleanId}" existe déjà dans le référentiel MFFE. Veuillez choisir un code unique.`
      );
      return;
    }

    try {
      setCreateStructureSaving(true);
      const res = await fetch('/api/entites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStructureForm,
          id_entite: cleanId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'enregistrement de la structure.");
      }

      setCreateStructureSuccess(
        data.message || `Structure "${newStructureForm.nom}" (${cleanId}) enregistrée avec succès dans le référentiel.`
      );

      // Ajouter localement dans la liste des structures
      if (data.entite) {
        const newEntityItem = {
          id_entite: data.entite.id_entite,
          nom: data.entite.nom,
          sigle: data.entite.sigle,
          localisation: data.entite.localisation,
          id_nature: data.entite.id_nature,
          id_hierarchisation: data.entite.id_hierarchisation,
          id_entite_parent: data.entite.id_entite_parent,
          nom_parent: data.entite.nom_parent,
          responsable_nom: data.entite.responsable_nom,
          total_recu: 0,
          total_livre: 0,
          solde_stock_disponible: 0,
          taux_distribution_pct: 0,
        };
        setAllStructures((prev) => [newEntityItem, ...prev]);
        setStructuresList((prev) => [newEntityItem, ...prev]);
      }

      setNewStructureForm({
        id_entite: '',
        nom: '',
        id_nature: 'CPPE',
        id_hierarchisation: 'CPPE',
        localisation: '',
        sigle: 'CPPE',
        responsable_nom: '',
        id_entite_parent: '',
        isManualId: false,
      });

      // Actualiser les statistiques et le bilan du tableau de bord
      fetchSessionAndStats();

      setTimeout(() => {
        setShowCreateStructureModal(false);
        setCreateStructureSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCreateStructureError(err.message || 'Une erreur est survenue lors de la création.');
    } finally {
      setCreateStructureSaving(false);
    }
  };

  const handleStartEditStructure = (st: any) => {
    loadParentEntities();
    loadAllStructures();
    setEditStructureError(null);
    setEditingStructure(st);
    setEditStructureForm({
      original_id_entite: st.id_entite || '',
      id_entite: st.id_entite || '',
      nom: st.nom || '',
      id_nature: st.id_nature || 'CPPE',
      id_hierarchisation: st.id_hierarchisation || getDefaultHierarchieForNature(st.id_nature || 'CPPE'),
      sigle: st.sigle || st.id_nature || 'CPPE',
      id_entite_parent: st.id_entite_parent || '',
      localisation: st.localisation || '',
      responsable_nom: st.responsable_nom || '',
    });
  };

  const handleSaveEditStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStructureError(null);

    if (!editStructureForm.nom || editStructureForm.nom.trim().length < 3) {
      setEditStructureError('Le nom de la structure doit comporter au moins 3 caractères.');
      return;
    }

    const cleanId = (editStructureForm.id_entite || '').trim().toUpperCase();
    if (!cleanId) {
      setEditStructureError("L'identifiant système (id_entite) est obligatoire.");
      return;
    }

    // Si l'identifiant a changé, vérifier qu'il n'est pas déjà pris par une autre structure
    if (cleanId !== editStructureForm.original_id_entite) {
      const isTaken = (allStructures || []).some(
        (s: any) =>
          (s.id_entite || '').toUpperCase() === cleanId &&
          s.id_entite !== editStructureForm.original_id_entite
      );
      if (isTaken) {
        setEditStructureError(
          `L'identifiant système "${cleanId}" est déjà utilisé par une autre entité dans le référentiel.`
        );
        return;
      }
    }

    try {
      setEditStructureSaving(true);
      const res = await fetch('/api/entites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editStructureForm,
          id_entite: cleanId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour de la structure.');
      }

      const updated = data.entite;
      const oldId = editStructureForm.original_id_entite;

      setStructuresList((prev) =>
        prev.map((s) =>
          s.id_entite === oldId
            ? {
                ...s,
                id_entite: updated.id_entite,
                nom: updated.nom,
                sigle: updated.sigle,
                id_nature: updated.id_nature,
                id_hierarchisation: updated.id_hierarchisation,
                id_entite_parent: updated.id_entite_parent,
                nom_parent: updated.nom_parent,
                localisation: updated.localisation,
                responsable_nom: updated.responsable_nom,
              }
            : s
        )
      );

      setAllStructures((prev) =>
        prev.map((s) =>
          s.id_entite === oldId
            ? {
                ...s,
                id_entite: updated.id_entite,
                nom: updated.nom,
                sigle: updated.sigle,
                id_nature: updated.id_nature,
                id_hierarchisation: updated.id_hierarchisation,
                id_entite_parent: updated.id_entite_parent,
                nom_parent: updated.nom_parent,
                localisation: updated.localisation,
                responsable_nom: updated.responsable_nom,
              }
            : s
        )
      );

      setEditingStructure(null);
      setFeedbackMessage({
        type: 'success',
        text: `Structure "${updated.nom}" (${updated.id_entite}) mise à jour avec succès !`,
      });
      fetchSessionAndStats();
    } catch (err: any) {
      setEditStructureError(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEditStructureSaving(false);
    }
  };

  const handleDeleteStructure = async (st: any) => {
    setDeleteStructureSaving(true);
    setDeleteStructureError(null);

    try {
      const res = await fetch(`/api/entites?id=${encodeURIComponent(st.id_entite)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression de la structure.');
      }

      setStructuresList((prev) => prev.filter((s) => s.id_entite !== st.id_entite));
      setAllStructures((prev) => prev.filter((s) => s.id_entite !== st.id_entite));
      setDeleteConfirmStructure(null);
      setFeedbackMessage({
        type: 'success',
        text: data.message || `Structure "${st.nom}" supprimée avec succès du référentiel.`,
      });
      fetchSessionAndStats();
    } catch (err: any) {
      setDeleteStructureError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleteStructureSaving(false);
    }
  };


  const fetchSessionAndStats = async (targetDate?: string, targetAnnee?: string) => {
    try {
      setLoading(true);
      // Vérifier la session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        try {
          sessionStorage.removeItem('mffe_selected_annee_scolaire');
          localStorage.removeItem('mffe_selected_annee_scolaire');
        } catch (e) {}
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== 'ADMIN') {
        try {
          sessionStorage.removeItem('mffe_selected_annee_scolaire');
          localStorage.removeItem('mffe_selected_annee_scolaire');
        } catch (e) {}
        router.push(meData.user.role === 'USER' ? '/user' : '/login');
        return;
      }
      setUser(meData.user);

      // Charger les stats et l'activité du jour
      const dateToUse = typeof targetDate === 'string' ? targetDate : selectedDate;
      const anneeToUse = (typeof targetAnnee === 'string' ? targetAnnee : selectedAnneeScolaire).replace(/\s+/g, '');
      const params = new URLSearchParams();
      if (dateToUse) params.set('date', dateToUse);
      if (anneeToUse) params.set('annee_scolaire', anneeToUse);

      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const statsRes = await fetch(`/api/stats${queryParam}`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        if (data.activiteJour) {
          setActiviteJour(data.activiteJour);
          if (!selectedDate && data.activiteJour.date) {
            setSelectedDate(data.activiteJour.date);
          }
        }
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

  const fetchActiviteJour = async (targetDate?: string, targetAnnee?: string) => {
    try {
      setLoadingActiviteJour(true);
      const dateToUse = typeof targetDate === 'string' ? targetDate : selectedDate;
      const anneeToUse = (typeof targetAnnee === 'string' ? targetAnnee : selectedAnneeScolaire).replace(/\s+/g, '');
      const params = new URLSearchParams();
      if (dateToUse) params.set('date', dateToUse);
      if (anneeToUse) params.set('annee_scolaire', anneeToUse);

      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/stats${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.activiteJour) {
          setActiviteJour(data.activiteJour);
          if (!selectedDate || targetDate) {
            setSelectedDate(data.activiteJour.date);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement activité jour:', err);
    } finally {
      setLoadingActiviteJour(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    await fetchActiviteJour(newDate, selectedAnneeScolaire);
  };

  const openDayModal = (type: 'receptions_jour' | 'livraisons_jour' | 'journal_jour') => {
    setActiveDayModal(type);
    setDaySearch('');
  };

  const formatDateFr = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    fetchSessionAndStats();
  }, []);

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      try {
        sessionStorage.removeItem('mffe_selected_annee_scolaire');
        localStorage.removeItem('mffe_selected_annee_scolaire');
      } catch (e) {}
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-24 sm:pb-12 transition-colors duration-200">
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
            <ThemeToggleButton variant="header" />
            <button
              onClick={() => fetchSessionAndStats()}
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
                  Suivez en temps réel les réceptions, distributions et soldes disponibles sur l'ensemble des {stats?.totalEntites ?? 769} structures du ministère.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <div className="relative inline-flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute left-3 text-orange-400 pointer-events-none" />
                <select
                  value={selectedAnneeScolaire.replace(/\s+/g, '')}
                  onChange={(e) => handleAnneeScolaireChange(e.target.value)}
                  className="pl-8 pr-8 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 hover:border-orange-500/50 text-slate-200 hover:text-white text-xs font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer appearance-none transition"
                  title="Sélectionner l'année scolaire active (Actuellement 2026-2027)"
                >
                  {anneesScolairesDisponibles.map((item) => (
                    <option key={item.value} value={item.value} className="bg-slate-900 text-slate-200">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grille / Carrousel des KPI Majeurs (5 Cartes tactiles interactives) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
                {stats?.totalEntites ?? 769}
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
              <span>Voir l'annuaire ({stats?.totalEntites ?? 769} structures)</span>
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

          {/* 5. VUE CARTOGRAPHIQUE (Couverture par Région Côte d'Ivoire) */}
          <button
            type="button"
            onClick={() => router.push('/cartographie')}
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2 w-full">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-cyan-400 transition">
                Vue Cartographique
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 group-hover:text-cyan-300 transition">
                33 <span className="text-xs font-semibold text-slate-400">Pôles</span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Régions & Districts</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  Côte d'Ivoire
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-semibold group-hover:text-cyan-300">
              <span>Ouvrir la carte CI</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>
        </section>

        {/* Section Flux & Activité avec Onglets Tactiles */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Mouvements & Activité des Cartes</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Consultez l'activité du jour ou les derniers mouvements enregistrés
                </p>
              </div>
            </div>

            {/* Onglets Tactiles (Activité du Jour, Réceptions, Livraisons) */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('activite_jour')}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'activite_jour'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-orange-400" />
                <span>Activité du Jour</span>
                {activiteJour?.isToday && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('receptions')}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'receptions'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Réceptions</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  {stats?.nbReceptions ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('livraisons')}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'livraisons'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-orange-400" />
                <span>Livraisons</span>
                <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[10px]">
                  {stats?.nbLivraisons ?? 0}
                </span>
              </button>
            </div>
          </div>

          {/* Contenu de l'onglet actif */}
          {activeTab === 'activite_jour' ? (
            <div className="space-y-4 pt-1">
              {/* Header avec Sélecteur de date */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-slate-200 font-semibold capitalize">
                    {selectedDate ? formatDateFr(selectedDate) : "Aujourd'hui"}
                  </span>
                  {activiteJour?.isToday && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 shadow-xs inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                      En Direct
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>

                  {activiteJour && !activiteJour.isToday && (
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        handleDateChange(todayStr);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-semibold transition active:scale-95"
                    >
                      Aujourd'hui
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fetchActiviteJour(selectedDate)}
                    disabled={loadingActiviteJour}
                    title="Actualiser l'activité du jour"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingActiviteJour ? 'animate-spin text-orange-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Raccourci d'assistance si aujourd'hui n'a pas encore de saisie */}
              {activiteJour && activiteJour.isToday && activiteJour.totalRecu === 0 && activiteJour.totalLivre === 0 && activiteJour.derniereDateActive && activiteJour.derniereDateActive !== activiteJour.date && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-amber-950 dark:text-amber-100">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300/60 dark:border-amber-500/30">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="leading-relaxed">
                      Aucune opération enregistrée pour aujourd'hui. Vous pouvez consulter les données de la dernière journée active.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDateChange(activiteJour.derniereDateActive)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold border border-amber-700/30 shadow-md shadow-amber-600/20 dark:bg-amber-500/25 dark:hover:bg-amber-500/35 dark:text-amber-200 dark:border-amber-500/40 transition shrink-0 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Voir le {formatDateShort(activiteJour.derniereDateActive)}</span>
                  </button>
                </div>
              )}

              {/* Grille des Cartes Interactives du Jour (Reçu, Distribué, Solde, Taux) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* CARTE 1: TOTAL REÇU DU JOUR */}
                <button
                  type="button"
                  onClick={() => openDayModal('receptions_jour')}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      Reçu du Jour
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 group-hover:text-emerald-300 transition flex items-baseline gap-1">
                      {activiteJour?.totalRecu?.toLocaleString('fr-FR') ?? 0}
                      <span className="text-xs font-semibold text-emerald-300/70">cartes</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">
                      {activiteJour?.nbReceptions ?? 0} lot(s) réceptionné(s)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:text-emerald-300">
                    <span>Détails des réceptions</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>

                {/* CARTE 2: TOTAL DISTRIBUÉ DU JOUR */}
                <button
                  type="button"
                  onClick={() => openDayModal('livraisons_jour')}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-orange-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                      Distribué du Jour
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/25 transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-orange-400 group-hover:text-orange-300 transition flex items-baseline gap-1">
                      {activiteJour?.totalLivre?.toLocaleString('fr-FR') ?? 0}
                      <span className="text-xs font-semibold text-orange-300/70">cartes</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">
                      {activiteJour?.nbLivraisons ?? 0} livraison(s) effectuée(s)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-orange-400 font-semibold group-hover:text-orange-300">
                    <span>Détails des livraisons</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>

                {/* CARTE 3: SOLDE NET DU JOUR */}
                <button
                  type="button"
                  onClick={() => openDayModal('journal_jour')}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      Solde Net du Jour
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/25 transition">
                      <Boxes className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl sm:text-3xl font-black transition flex items-baseline gap-1 ${
                      (activiteJour?.soldeNet ?? 0) >= 0 ? 'text-blue-400 group-hover:text-blue-300' : 'text-amber-400 group-hover:text-amber-300'
                    }`}>
                      {(activiteJour?.soldeNet ?? 0) > 0 ? `+${activiteJour?.soldeNet?.toLocaleString('fr-FR')}` : (activiteJour?.soldeNet?.toLocaleString('fr-FR') ?? 0)}
                      <span className="text-xs font-semibold text-blue-300/70">cartes</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">
                      Variation nette du stock ce jour
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-semibold group-hover:text-blue-300">
                    <span>Journal des flux</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>

                {/* CARTE 4: TAUX DE DISTRIBUTION DU JOUR */}
                <button
                  type="button"
                  onClick={() => openDayModal('journal_jour')}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 shadow-lg relative overflow-hidden flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      Taux du Jour
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/25 transition">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-purple-400 group-hover:text-purple-300 transition flex items-baseline gap-1">
                      {activiteJour?.tauxDistribution ?? 0}%
                      <span className="text-xs font-semibold text-purple-300/70">distribué</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-medium">
                      Sur les cartes reçues ce jour
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-semibold group-hover:text-purple-300">
                    <span>Bilan du jour</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </button>
              </div>
            </div>
          ) : activeTab === 'receptions' ? (
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

        {/* Actions Rapides Smartphone (Touches Larges) */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Opérations Rapides
            </h3>
            <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Droits Administrateur</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <button
              onClick={() => router.push('/receptions')}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Enregistrer Réception</span>
            </button>

            <button
              onClick={() => router.push('/livraisons')}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">Enregistrer Livraison</span>
            </button>

            {/* Importer Bordereau (Action Rapide Administrateur MFFE) */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-md cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500/30 transition">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-200 group-hover:text-orange-400 transition">Importer Bordereau</span>
                <span className="text-[10px] text-slate-400 font-medium">Excel / Word / PDF</span>
              </div>
            </button>

            <button
              onClick={() => openKpiModal('structures')}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                <School className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-200">{stats?.totalEntites ?? 769} Structures MFFE</span>
            </button>

            <button
              onClick={() => openKpiModal('stock')}
              className="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 flex flex-col items-center justify-center text-center gap-2 transition active:scale-95 group shadow-md"
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
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {displayedRecapParNature.length} Natures {onlyWithStock ? 'en Stock' : 'Référencées'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {onlyWithStock
                    ? "Affichage exclusif des natures d'entité disposant de cartes scolaires en stock (solde stock > 0)"
                    : `Synthèse consolidée sur l'ensemble des ${stats?.totalEntites ?? 769} structures du ministère`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de filtre rapide : Natures avec Stock vs Toutes */}
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-inner">
                <button
                  type="button"
                  onClick={() => setOnlyWithStock(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition text-xs flex items-center gap-1.5 cursor-pointer ${
                    onlyWithStock
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Afficher uniquement les natures avec solde de stock positif"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>En Stock ({recapParNature.filter((i) => (i.solde_stock || 0) > 0).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyWithStock(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition text-xs flex items-center gap-1.5 cursor-pointer ${
                    !onlyWithStock
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Afficher toutes les natures d'entité du ministère"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Toutes ({recapParNature.length})</span>
                </button>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
                <span className="text-slate-400">Total Structures : </span>
                <span className="font-extrabold text-white">
                  {displayedRecapParNature.reduce((acc, i) => acc + (i.total_structures || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-2.5 px-3">Nature d'Entité</th>
                  <th className="py-2.5 px-3 text-center">Structures</th>
                  <th className="py-2.5 px-3 text-center">Structures Dotées</th>
                  <th className="py-2.5 px-3 text-right">Cartes Reçues</th>
                  <th className="py-2.5 px-3 text-right">Cartes Livrées</th>
                  <th className="py-2.5 px-3 text-right">Solde Stock</th>
                  <th className="py-2.5 px-3 text-center">Taux Distrib.</th>
                  <th className="py-2.5 px-3 text-center">Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {displayedRecapParNature.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Boxes className="w-8 h-8 text-slate-600" />
                        <p className="font-semibold">Aucune nature d'entité n'a de cartes en stock actuellement.</p>
                        <button
                          type="button"
                          onClick={() => setOnlyWithStock(false)}
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Afficher toutes les natures référencées
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRecapParNature.map((item) => {
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

                        {/* Export Disponibilité Word / Excel */}
                        <td className="py-3 px-3 text-center">
                          {item.solde_stock > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDirectExportDispo(item.code, 'docx')}
                                disabled={isExportingDispo}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] transition active:scale-95 cursor-pointer disabled:opacity-50"
                                title={`Exporter ${item.code} en Word (Modèle officiel DISPONIBILITE DES CARTES SCOLAIRES sans coupure de tableau)`}
                              >
                                <FileText className="w-3 h-3 text-emerald-400" />
                                <span>Word</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectExportDispo(item.code, 'xlsx')}
                                disabled={isExportingDispo}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-semibold text-[11px] transition active:scale-95 cursor-pointer disabled:opacity-50"
                                title={`Exporter ${item.code} en classeur Excel`}
                              >
                                <FileSpreadsheet className="w-3 h-3 text-teal-400" />
                                <span>Excel</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">0 en stock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Ligne TOTAL */}
              <tfoot>
                {(() => {
                  const totStructures = displayedRecapParNature.reduce((acc, i) => acc + (i.total_structures || 0), 0);
                  const totDotees = displayedRecapParNature.reduce((acc, i) => acc + (i.structures_avec_cartes || 0), 0);
                  const totRecu = displayedRecapParNature.reduce((acc, i) => acc + (i.total_recu || 0), 0);
                  const totLivre = displayedRecapParNature.reduce((acc, i) => acc + (i.total_livre || 0), 0);
                  const totStock = displayedRecapParNature.reduce((acc, i) => acc + (i.solde_stock || 0), 0);
                  const totTaux = totRecu > 0 ? Number(((totLivre / totRecu) * 100).toFixed(1)) : 0;

                  return (
                    <tr className="border-t-2 border-slate-700 bg-slate-950/70 font-extrabold text-xs">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white uppercase tracking-wider font-extrabold">
                            Total Récapitulatif
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({displayedRecapParNature.length} natures{onlyWithStock ? ' en stock' : ''})
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
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setDispoInitialNature('ALL');
                            setShowDispoModal(true);
                          }}
                          disabled={isExportingDispo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Exporter l'ensemble consolidé de toutes les structures avec cartes disponibles (Word / Excel)"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Exporter tout</span>
                        </button>
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
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
                      {activeKpiModal === 'structures' && `Annuaire des ${structuresList.length || stats?.totalEntites || 769} Structures MFFE`}
                      {activeKpiModal === 'stock' && 'Entités ayant des Cartes en Stock'}
                      <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        {selectedAnneeScolaire}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeKpiModal === 'receptions' && 'Consultez, modifiez ou supprimez les lots de réceptions enregistrés'}
                      {activeKpiModal === 'livraisons' && 'Historique complet des distributions effectuées'}
                      {activeKpiModal === 'structures' && "Visualisation et gestion de l'ensemble des structures et directions du ministère"}
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
                {activeKpiModal === 'structures' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportStructuresExcel()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95 shadow-sm shadow-indigo-600/20 cursor-pointer"
                      title="Exporter l'annuaire complet des structures au format Excel (.xlsx)"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Exporter l'Annuaire (Excel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateStructureError(null);
                        setCreateStructureSuccess(null);
                        loadParentEntities();
                        loadAllStructures();
                        setShowCreateStructureModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Ajouter Structure</span>
                    </button>
                  </div>
                )}
                {activeKpiModal === 'stock' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportStockExcel()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95 shadow-sm shadow-emerald-600/20 cursor-pointer"
                      title="Exporter la liste des entités ayant du stock au format Excel (.xlsx)"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Exporter le tableau (Excel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/livraisons')}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Effectuer Livraison</span>
                    </button>
                  </div>
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
                            <button
                              type="button"
                              onClick={() => handleExportStockExcel(filtered)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                              title="Télécharger ce tableau au format Excel (.xlsx)"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Exporter ({filtered.length})</span>
                            </button>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
                          <div className="text-[11px] text-slate-400 font-semibold">
                            <span className="text-white font-bold">{filtered.length}</span> structure(s) affichée(s) sur {structuresList.length || stats?.totalEntites || 769}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExportStructuresExcel(filtered)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-[11px] inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer self-start sm:self-auto"
                            title="Télécharger l'annuaire au format Excel (.xlsx)"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Exporter l'Annuaire ({filtered.length})</span>
                          </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Structure</th>
                                <th className="py-2.5 px-3">Nature</th>
                                <th className="py-2.5 px-3 text-right">Reçues</th>
                                <th className="py-2.5 px-3 text-right">Distribuées</th>
                                <th className="py-2.5 px-3 text-right">Solde Stock</th>
                                <th className="py-2.5 px-3 text-center">Taux Distrib.</th>
                                <th className="py-2.5 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((st) => (
                                <tr key={st.id_entite} className="hover:bg-slate-800/30 transition group">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white truncate max-w-[220px]">
                                      {st.nom}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                                      <span className="font-mono text-[9px] text-blue-400/80 bg-blue-950/40 px-1 rounded border border-blue-900/40">
                                        {st.id_entite}
                                      </span>
                                      <span>•</span>
                                      <span>{st.localisation || '-'}</span>
                                      {(st.nom_parent || st.id_entite_parent) && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 font-medium">
                                          {st.nom_parent || st.id_entite_parent}
                                        </span>
                                      )}
                                    </div>
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
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleStartEditStructure(st)}
                                        title="Modifier cette structure"
                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Modifier</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeleteStructureError(null);
                                          setDeleteConfirmStructure(st);
                                        }}
                                        title="Supprimer cette structure"
                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition active:scale-95 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
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

        {/* MODALE DETAILS ACTIVITÉ DU JOUR (Réceptions du jour, Livraisons du jour, Journal Complet) */}
        {activeDayModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              {/* En-tête de la modale */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      activeDayModal === 'receptions_jour'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : activeDayModal === 'livraisons_jour'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {activeDayModal === 'receptions_jour' && <ArrowDownLeft className="w-5 h-5" />}
                    {activeDayModal === 'livraisons_jour' && <ArrowUpRight className="w-5 h-5" />}
                    {activeDayModal === 'journal_jour' && <Boxes className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      {activeDayModal === 'receptions_jour' && 'Détail des Réceptions du Jour'}
                      {activeDayModal === 'livraisons_jour' && 'Détail des Distributions du Jour'}
                      {activeDayModal === 'journal_jour' && 'Journal Complet des Flux du Jour'}
                    </h3>
                    <p className="text-xs text-slate-400 capitalize">
                      {selectedDate ? formatDateFr(selectedDate) : "Aujourd'hui"} • {
                        activeDayModal === 'receptions_jour'
                          ? `${activiteJour?.totalRecu ?? 0} cartes reçues (${activiteJour?.nbReceptions ?? 0} lots)`
                          : activeDayModal === 'livraisons_jour'
                          ? `${activiteJour?.totalLivre ?? 0} cartes livrées (${activiteJour?.nbLivraisons ?? 0} livraisons)`
                          : `Solde net: ${(activiteJour?.soldeNet ?? 0) > 0 ? '+' : ''}${activiteJour?.soldeNet ?? 0} cartes`
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDayModal(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Onglets internes de navigation dans la modale */}
              <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveDayModal('receptions_jour')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeDayModal === 'receptions_jour'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Réceptions ({activiteJour?.nbReceptions ?? 0})</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                    {activiteJour?.totalRecu ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDayModal('livraisons_jour')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeDayModal === 'livraisons_jour'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Distributions ({activiteJour?.nbLivraisons ?? 0})</span>
                  <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[10px]">
                    {activiteJour?.totalLivre ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDayModal('journal_jour')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeDayModal === 'journal_jour'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Journal Global ({((activiteJour?.receptions?.length || 0) + (activiteJour?.livraisons?.length || 0))})</span>
                </button>
              </div>

              {/* Barre de recherche & boutons d'action rapide */}
              <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/20">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer par structure, sigle, bordereau, bénéficiaire, observations..."
                    value={daySearch}
                    onChange={(e) => setDaySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                  />
                  {daySearch && (
                    <button
                      type="button"
                      onClick={() => setDaySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeDayModal === 'receptions_jour' && (
                  <button
                    type="button"
                    onClick={() => router.push('/receptions')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle Réception</span>
                  </button>
                )}

                {activeDayModal === 'livraisons_jour' && (
                  <button
                    type="button"
                    onClick={() => router.push('/livraisons')}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle Livraison</span>
                  </button>
                )}
              </div>

              {/* Corps de la modale */}
              <div className="p-5 overflow-y-auto flex-1">
                {activeDayModal === 'receptions_jour' ? (
                  // CONTENU RÉCEPTIONS DU JOUR
                  (() => {
                    const list = activiteJour?.receptions || [];
                    const filtered = list.filter((r) =>
                      (r.nom_entite || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (r.sigle || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (r.reference_bordereau || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (r.receptionnaire_nom || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (r.localisation || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (r.observations || '').toLowerCase().includes(daySearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-14 text-slate-500 text-xs flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600">
                            <ArrowDownLeft className="w-6 h-6" />
                          </div>
                          <p className="font-medium text-slate-400">
                            {daySearch ? 'Aucun enregistrement ne correspond à votre recherche.' : 'Aucune réception enregistrée pour cette journée.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push('/receptions')}
                            className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Enregistrer une réception pour ce jour</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                          <span>{filtered.length} lot(s) de réception trouvé(s)</span>
                          <span className="text-emerald-400 font-bold">
                            Total : {filtered.reduce((acc, cur) => acc + (cur.quantite_recue || 0), 0).toLocaleString('fr-FR')} cartes
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Structure</th>
                                <th className="py-2.5 px-3 text-right">Quantité Reçue</th>
                                <th className="py-2.5 px-3">Bordereau & Réceptionnaire</th>
                                <th className="py-2.5 px-3">Observations</th>
                                <th className="py-2.5 px-3">Enregistré par</th>
                                <th className="py-2.5 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white max-w-[220px] truncate">
                                      {r.nom_entite}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      {r.sigle && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                          {r.sigle}
                                        </span>
                                      )}
                                      {r.localisation && <span>{r.localisation}</span>}
                                      {r.id_nature && (
                                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-semibold">
                                          {r.id_nature}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black text-sm">
                                      +{r.quantite_recue}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="text-white font-medium">
                                      {r.reference_bordereau || 'Sans bordereau'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {r.receptionnaire_nom ? `Reçu par : ${r.receptionnaire_nom}` : 'Réceptionnaire non précisé'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                                    {r.observations || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]">
                                      {r.auteur_nom || 'Système'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditReception(r)}
                                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                                        title="Modifier ce lot de réception"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Modifier</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmId(r.id)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition"
                                        title="Supprimer cette réception"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
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
                ) : activeDayModal === 'livraisons_jour' ? (
                  // CONTENU LIVRAISONS DU JOUR
                  (() => {
                    const list = activiteJour?.livraisons || [];
                    const filtered = list.filter((l) =>
                      (l.nom_entite || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.sigle || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.destinataire_nom || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.reference_decharge || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.mode_livraison || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.localisation || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (l.observations || '').toLowerCase().includes(daySearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-14 text-slate-500 text-xs flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-600">
                            <ArrowUpRight className="w-6 h-6" />
                          </div>
                          <p className="font-medium text-slate-400">
                            {daySearch ? 'Aucun enregistrement ne correspond à votre recherche.' : 'Aucune distribution enregistrée pour cette journée.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push('/livraisons')}
                            className="mt-1 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Enregistrer une livraison pour ce jour</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                          <span>{filtered.length} livraison(s) trouvée(s)</span>
                          <span className="text-orange-400 font-bold">
                            Total : {filtered.reduce((acc, cur) => acc + (cur.quantite_livree || 0), 0).toLocaleString('fr-FR')} cartes
                          </span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                            <thead>
                              <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="py-2.5 px-3">Structure</th>
                                <th className="py-2.5 px-3 text-right">Quantité Livrée</th>
                                <th className="py-2.5 px-3">Bénéficiaire & Mode</th>
                                <th className="py-2.5 px-3">Réf. Décharge</th>
                                <th className="py-2.5 px-3">Observations</th>
                                <th className="py-2.5 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filtered.map((l: any) => (
                                <tr key={l.id} className="hover:bg-slate-800/30 transition">
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-white max-w-[220px] truncate">
                                      {l.nom_entite}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      {l.sigle && (
                                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                          {l.sigle}
                                        </span>
                                      )}
                                      {l.localisation && <span>{l.localisation}</span>}
                                      {l.id_nature && (
                                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-semibold">
                                          {l.id_nature}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/30 font-black text-sm">
                                      -{l.quantite_livree}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="text-white font-medium">
                                      {l.destinataire_nom || 'Non spécifié'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Mode: {l.mode_livraison || 'Agent DRH'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                                    {l.reference_decharge || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                                    {l.observations || <span className="text-slate-600">-</span>}
                                  </td>
                                  <td className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditLivraison(l)}
                                        className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                                        title="Modifier cette livraison"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Modifier</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmLivraisonId(l.id)}
                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition"
                                        title="Supprimer cette livraison"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
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
                ) : (
                  // JOURNAL GLOBAL CHRONOLOGIQUE DU JOUR
                  (() => {
                    const recItems = (activiteJour?.receptions || []).map((r) => ({
                      ...r,
                      _type: 'reception',
                      _timestamp: new Date(r.created_at || r.date_reception).getTime(),
                    }));
                    const livItems = (activiteJour?.livraisons || []).map((l) => ({
                      ...l,
                      _type: 'livraison',
                      _timestamp: new Date(l.created_at || l.date_livraison).getTime(),
                    }));
                    const allEvents = [...recItems, ...livItems].sort((a, b) => b._timestamp - a._timestamp);

                    const filtered = allEvents.filter((item) =>
                      (item.nom_entite || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (item.sigle || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (item.reference_bordereau || item.reference_decharge || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (item.destinataire_nom || item.receptionnaire_nom || '').toLowerCase().includes(daySearch.toLowerCase()) ||
                      (item.observations || '').toLowerCase().includes(daySearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-14 text-slate-500 text-xs">
                          <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                          <p>Aucun flux enregistré pour cette journée.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Reçu</span>
                            <div className="text-lg font-bold text-emerald-400">+{activiteJour?.totalRecu ?? 0}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Distribué</span>
                            <div className="text-lg font-bold text-orange-400">-{activiteJour?.totalLivre ?? 0}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Solde Net</span>
                            <div className={`text-lg font-bold ${(activiteJour?.soldeNet ?? 0) >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                              {(activiteJour?.soldeNet ?? 0) > 0 ? `+${activiteJour?.soldeNet}` : activiteJour?.soldeNet}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Mouvements</span>
                            <div className="text-lg font-bold text-white">{filtered.length}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {filtered.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                                item._type === 'reception'
                                  ? 'bg-emerald-950/15 border-emerald-500/20 hover:border-emerald-500/40'
                                  : 'bg-orange-950/15 border-orange-500/20 hover:border-orange-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    item._type === 'reception'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-orange-500/20 text-orange-400'
                                  }`}
                                >
                                  {item._type === 'reception' ? (
                                    <ArrowDownLeft className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                                        item._type === 'reception'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                          : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                      }`}
                                    >
                                      {item._type === 'reception' ? 'Réception' : 'Livraison'}
                                    </span>
                                    <span className="font-bold text-white">{item.nom_entite}</span>
                                    {item.sigle && (
                                      <span className="text-[10px] text-slate-400">({item.sigle})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {item._type === 'reception'
                                      ? `Bordereau : ${item.reference_bordereau || 'N/A'}${item.receptionnaire_nom ? ` • Par ${item.receptionnaire_nom}` : ''}`
                                      : `Destinataire : ${item.destinataire_nom || 'N/A'}${item.reference_decharge ? ` • Décharge: ${item.reference_decharge}` : ''}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span
                                    className={`text-sm font-black ${
                                      item._type === 'reception' ? 'text-emerald-400' : 'text-orange-400'
                                    }`}
                                  >
                                    {item._type === 'reception' ? `+${item.quantite_recue}` : `-${item.quantite_livree}`}
                                  </span>
                                  <div className="text-[10px] text-slate-500">cartes</div>
                                </div>

                                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item._type === 'reception') {
                                        handleStartEditReception(item);
                                      } else {
                                        handleStartEditLivraison(item);
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition active:scale-95 ${
                                      item._type === 'reception'
                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                                        : 'bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 border-orange-500/30'
                                    }`}
                                    title="Modifier cet enregistrement"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Modifier</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item._type === 'reception') {
                                        setDeleteConfirmId(item.id);
                                      } else {
                                        setDeleteConfirmLivraisonId(item.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition active:scale-95"
                                    title="Supprimer cet enregistrement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Pied de page modal */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Activité du jour • Module DRH</span>
                <button
                  type="button"
                  onClick={() => setActiveDayModal(null)}
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
                {/* SÉLECTION / MODIFICATION DE LA STRUCTURE CONCERNÉE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-orange-400" />
                      <span>Structure concernée *</span>
                    </label>
                    {!isSelectingStructure && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectingStructure(true);
                          setEditStructureSearch('');
                        }}
                        className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 hover:underline transition"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Changer de structure</span>
                      </button>
                    )}
                  </div>

                  {!isSelectingStructure ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/40 transition flex items-center justify-between gap-3 group">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate">
                          {editLivraisonForm.nom_entite || editLivraisonForm.id_entite || 'Structure non définie'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500">{editLivraisonForm.id_entite}</span>
                          <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20 text-[9px] font-semibold">
                            Structure assignée
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectingStructure(true);
                          setEditStructureSearch('');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 group-hover:bg-orange-600/20 group-hover:text-orange-300 text-slate-300 text-[11px] font-semibold transition shrink-0 flex items-center gap-1 border border-slate-700/60"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Rechercher par nom (ex: Divo, Bouaké, IFEF...), sigle ou code..."
                          value={editStructureSearch}
                          onChange={(e) => setEditStructureSearch(e.target.value)}
                          className="w-full bg-slate-950 border border-orange-500/50 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsSelectingStructure(false)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          title="Fermer la recherche"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Liste déroulante des structures */}
                      <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 shadow-xl">
                        {loadingAllStructures ? (
                          <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                            <span>Chargement des structures...</span>
                          </div>
                        ) : filteredStructures.length > 0 ? (
                          filteredStructures.slice(0, 25).map((s: any) => {
                            const isSelected = s.id_entite === editLivraisonForm.id_entite;
                            return (
                              <button
                                key={s.id_entite}
                                type="button"
                                onClick={() => {
                                  setEditLivraisonForm({
                                    ...editLivraisonForm,
                                    id_entite: s.id_entite,
                                    nom_entite: s.nom,
                                  });
                                  setIsSelectingStructure(false);
                                }}
                                className={`w-full p-2.5 text-left flex items-start justify-between gap-2 transition ${
                                  isSelected
                                    ? 'bg-orange-500/20 text-white'
                                    : 'hover:bg-slate-800/60 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                    <span>{s.nom}</span>
                                    {s.sigle && (
                                      <span className="text-[10px] text-orange-400 font-semibold">
                                        ({s.sigle})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-[9px] text-slate-500">{s.id_entite}</span>
                                    {s.id_nature && (
                                      <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">
                                        {s.id_nature}
                                      </span>
                                    )}
                                    {s.localisation && <span>{s.localisation}</span>}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500">
                            Aucune structure trouvée pour "{editStructureSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                {/* SÉLECTION / MODIFICATION DE LA STRUCTURE CONCERNÉE */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-blue-400" />
                      <span>Structure concernée *</span>
                    </label>
                    {!isSelectingStructure && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectingStructure(true);
                          setEditStructureSearch('');
                        }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline transition"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Changer de structure</span>
                      </button>
                    )}
                  </div>

                  {!isSelectingStructure ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-3 group">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate">
                          {editForm.nom_entite || editForm.id_entite || 'Structure non définie'}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500">{editForm.id_entite}</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-semibold">
                            Structure assignée
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectingStructure(true);
                          setEditStructureSearch('');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 group-hover:bg-blue-600/20 group-hover:text-blue-300 text-slate-300 text-[11px] font-semibold transition shrink-0 flex items-center gap-1 border border-slate-700/60"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Rechercher par nom (ex: Divo, Bouaké, IFEF...), sigle ou code..."
                          value={editStructureSearch}
                          onChange={(e) => setEditStructureSearch(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-500/50 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setIsSelectingStructure(false)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          title="Fermer la recherche"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Liste déroulante des structures */}
                      <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60 shadow-xl">
                        {loadingAllStructures ? (
                          <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Chargement des structures...</span>
                          </div>
                        ) : filteredStructures.length > 0 ? (
                          filteredStructures.slice(0, 25).map((s: any) => {
                            const isSelected = s.id_entite === editForm.id_entite;
                            return (
                              <button
                                key={s.id_entite}
                                type="button"
                                onClick={() => {
                                  setEditForm({
                                    ...editForm,
                                    id_entite: s.id_entite,
                                    nom_entite: s.nom,
                                  });
                                  setIsSelectingStructure(false);
                                }}
                                className={`w-full p-2.5 text-left flex items-start justify-between gap-2 transition ${
                                  isSelected
                                    ? 'bg-blue-500/20 text-white'
                                    : 'hover:bg-slate-800/60 text-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                    <span>{s.nom}</span>
                                    {s.sigle && (
                                      <span className="text-[10px] text-blue-400 font-semibold">
                                        ({s.sigle})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-[9px] text-slate-500">{s.id_entite}</span>
                                    {s.id_nature && (
                                      <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">
                                        {s.id_nature}
                                      </span>
                                    )}
                                    {s.localisation && <span>{s.localisation}</span>}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-500">
                            Aucune structure trouvée pour "{editStructureSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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

        {/* MODALE DE CRÉATION D'UNE NOUVELLE STRUCTURE */}
        {showCreateStructureModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-blue-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Créer une Nouvelle Structure</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-semibold">
                        Table entite
                      </span>
                    </h4>
                    <p className="text-[11px] text-blue-400">
                      Ajout direct au référentiel officiel du Ministère (MFFE)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateStructureModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback Alerts */}
              {createStructureError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{createStructureError}</span>
                </div>
              )}

              {createStructureSuccess && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{createStructureSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStructure} className="mt-4 space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
                {/* 1. Nom Officiel de la Structure */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nom officiel de la structure <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Centre de Protection de la Petite Enfance (CPPE) 2 d'Adzope, CACE Abigui..."
                    value={newStructureForm.nom}
                    onChange={(e) => {
                      const val = e.target.value;
                      const autoId = !newStructureForm.isManualId
                        ? generateIdEntiteFromNom(val, newStructureForm.id_nature)
                        : newStructureForm.id_entite;
                      setNewStructureForm({
                        ...newStructureForm,
                        nom: val,
                        id_entite: autoId,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saisissez le nom complet tel qu'il figure sur les bordereaux et documents officiels.
                  </p>
                </div>

                {/* 2. RECONFIGURÉ : Identifiant Système (id_entite) */}
                <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                      <span>Identifiant système (id_entite)</span>
                      <span className="text-orange-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {newStructureForm.isManualId ? (
                        <button
                          type="button"
                          onClick={() => {
                            const autoId = generateIdEntiteFromNom(
                              newStructureForm.nom,
                              newStructureForm.id_nature
                            );
                            setNewStructureForm({
                              ...newStructureForm,
                              id_entite: autoId,
                              isManualId: false,
                            });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-semibold border border-blue-500/30 flex items-center gap-1 transition cursor-pointer"
                          title="Régénérer automatiquement selon le format standard MFFE"
                        >
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Régénérer Auto</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          Auto-synchronisé
                        </span>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Ex: CPPE 2 ADZOPE, CACE ABIGUI, IFEF BONOUA..."
                    value={newStructureForm.id_entite}
                    onChange={(e) => {
                      setNewStructureForm({
                        ...newStructureForm,
                        id_entite: e.target.value.toUpperCase(),
                        isManualId: true,
                      });
                    }}
                    className={`w-full bg-slate-950 border font-mono tracking-wide text-xs rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none transition ${
                      isIdEntiteDuplicate
                        ? 'border-red-500 focus:border-red-400 text-red-200'
                        : newStructureForm.id_entite.trim().length >= 2
                        ? 'border-emerald-500/60 focus:border-emerald-400 text-emerald-200'
                        : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />

                  {/* Indicateur de validation en temps réel */}
                  <div className="flex items-center justify-between text-[10px]">
                    {isIdEntiteDuplicate ? (
                      <span className="text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Identifiant déjà existant dans le référentiel MFFE !</span>
                      </span>
                    ) : newStructureForm.id_entite.trim().length >= 2 ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        <span>Identifiant unique valide pour la table entite</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Format conventionnel MFFE : [NATURE] [LOCALISATION / SUFFIXE UNIQUE]
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Nature de la Structure & Sigle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nature de la structure <span className="text-orange-400">*</span>
                    </label>
                    <select
                      value={newStructureForm.id_nature}
                      onChange={(e) => {
                        const newNat = e.target.value;
                        const hier = getDefaultHierarchieForNature(newNat);
                        const autoId = !newStructureForm.isManualId
                          ? generateIdEntiteFromNom(newStructureForm.nom, newNat)
                          : newStructureForm.id_entite;
                        setNewStructureForm({
                          ...newStructureForm,
                          id_nature: newNat,
                          id_hierarchisation: hier,
                          sigle:
                            newStructureForm.sigle === newStructureForm.id_nature ||
                            !newStructureForm.sigle
                              ? newNat
                              : newStructureForm.sigle,
                          id_entite: autoId,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                    >
                      {STRUCTURE_NATURES.map((nat) => (
                        <option key={nat.code} value={nat.code}>
                          {nat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Sigle / Abréviation
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CPPE, CACE-AB, IFEF..."
                      value={newStructureForm.sigle}
                      onChange={(e) =>
                        setNewStructureForm({ ...newStructureForm, sigle: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* 4. AJOUTÉ : Entité parent (Direction Régionale / Tutelle) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Entité parent (Direction Régionale / Tutelle)
                    </label>
                    <span className="text-[10px] text-blue-400 font-medium">
                      Rattachement administratif
                    </span>
                  </div>
                  <select
                    value={newStructureForm.id_entite_parent}
                    onChange={(e) =>
                      setNewStructureForm({
                        ...newStructureForm,
                        id_entite_parent: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="">-- Aucune (Structure autonome / Niveau central) --</option>
                    <optgroup label="Directions Régionales (DR - Tutelle Déconcentrée)">
                      {regionalDirections.map((dr: any) => (
                        <option key={dr.id_entite || dr.id} value={dr.id_entite || dr.id}>
                          {dr.id_entite || dr.id} — {dr.nom}
                        </option>
                      ))}
                    </optgroup>
                    {centralDirections.length > 0 && (
                      <optgroup label="Directions Centrales & Services MFFE">
                        {centralDirections.map((dir: any) => (
                          <option key={dir.id_entite || dir.id} value={dir.id_entite || dir.id}>
                            {dir.id_entite || dir.id} — {dir.nom}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sélectionnez la Direction Régionale (DR) de rattachement ou tutelle hiérarchique.
                  </p>
                </div>

                {/* 5. Localisation & Responsable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Localisation / Ville <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Adzopé, Alépé, Bouaké, Abidjan..."
                      value={newStructureForm.localisation}
                      onChange={(e) =>
                        setNewStructureForm({
                          ...newStructureForm,
                          localisation: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Responsable / Directeur
                    </label>
                    <input
                      type="text"
                      placeholder="Nom et prénoms (optionnel)"
                      value={newStructureForm.responsable_nom}
                      onChange={(e) =>
                        setNewStructureForm({
                          ...newStructureForm,
                          responsable_nom: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Fiche récapitulative dynamique avant enregistrement */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Identifiant système (id_entite) :</span>
                    <span className="font-mono font-bold text-blue-400 truncate max-w-[240px]">
                      {newStructureForm.id_entite || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nature & Hiérarchie :</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[240px]">
                      {newStructureForm.id_nature} ({newStructureForm.id_hierarchisation})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Entité parent (Tutelle) :</span>
                    <span className="text-amber-300 font-medium truncate max-w-[240px]">
                      {newStructureForm.id_entite_parent || 'Aucune (Niveau central / Autonome)'}
                    </span>
                  </div>
                </div>

                {/* Actions du formulaire */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateStructureModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createStructureSaving ||
                      !newStructureForm.nom ||
                      !newStructureForm.id_entite ||
                      isIdEntiteDuplicate
                    }
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    {createStructureSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Enregistrer la Structure</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE DE MODIFICATION D'UNE STRUCTURE EXISTANTE */}
        {editingStructure !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-blue-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>Modifier la Structure</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-semibold font-mono">
                        {editStructureForm.original_id_entite}
                      </span>
                    </h4>
                    <p className="text-[11px] text-blue-400">
                      Mise à jour des informations dans le référentiel officiel MFFE
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Erreur modification */}
              {editStructureError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{editStructureError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditStructure} className="mt-4 space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
                {/* 1. Nom Officiel */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nom officiel de la structure <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Centre de Protection de la Petite Enfance (CPPE) 2 d'Adzope..."
                    value={editStructureForm.nom}
                    onChange={(e) =>
                      setEditStructureForm({
                        ...editStructureForm,
                        nom: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs transition"
                  />
                </div>

                {/* 2. Identifiant Système (id_entite) */}
                <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                      <span>Identifiant système (id_entite)</span>
                      <span className="text-orange-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Clé unique du référentiel
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    value={editStructureForm.id_entite}
                    onChange={(e) =>
                      setEditStructureForm({
                        ...editStructureForm,
                        id_entite: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 font-mono tracking-wide text-xs rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  />
                  <p className="text-[10px] text-slate-400">
                    {editStructureForm.id_entite !== editStructureForm.original_id_entite ? (
                      <span className="text-amber-400 font-medium">
                        ⚠️ Modification de l'identifiant : toutes les opérations de cartes liées ({editingStructure.total_recu || 0} reçues, {editingStructure.total_livre || 0} livrées) seront automatiquement réaffectées à ce nouveau code.
                      </span>
                    ) : (
                      <span>Code unique de référence dans la table entite (majuscules).</span>
                    )}
                  </p>
                </div>

                {/* 3. Nature & Sigle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nature de la structure <span className="text-orange-400">*</span>
                    </label>
                    <select
                      value={editStructureForm.id_nature}
                      onChange={(e) => {
                        const newNat = e.target.value;
                        const hier = getDefaultHierarchieForNature(newNat);
                        setEditStructureForm({
                          ...editStructureForm,
                          id_nature: newNat,
                          id_hierarchisation: hier,
                          sigle: editStructureForm.sigle === editStructureForm.id_nature ? newNat : editStructureForm.sigle,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                    >
                      {STRUCTURE_NATURES.map((nat) => (
                        <option key={nat.code} value={nat.code}>
                          {nat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Sigle / Abréviation
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CPPE, CACE-AB, IFEF..."
                      value={editStructureForm.sigle}
                      onChange={(e) =>
                        setEditStructureForm({ ...editStructureForm, sigle: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* 4. Entité parent (Direction Régionale / Tutelle) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Entité parent (Direction Régionale / Tutelle)
                    </label>
                    <span className="text-[10px] text-blue-400 font-medium">
                      Rattachement administratif
                    </span>
                  </div>
                  <select
                    value={editStructureForm.id_entite_parent}
                    onChange={(e) =>
                      setEditStructureForm({
                        ...editStructureForm,
                        id_entite_parent: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="">-- Aucune (Structure autonome / Niveau central) --</option>
                    <optgroup label="Directions Régionales (DR - Tutelle Déconcentrée)">
                      {regionalDirections.map((dr: any) => (
                        <option key={dr.id_entite || dr.id} value={dr.id_entite || dr.id}>
                          {dr.id_entite || dr.id} — {dr.nom}
                        </option>
                      ))}
                    </optgroup>
                    {centralDirections.length > 0 && (
                      <optgroup label="Directions Centrales & Services MFFE">
                        {centralDirections.map((dir: any) => (
                          <option key={dir.id_entite || dir.id} value={dir.id_entite || dir.id}>
                            {dir.id_entite || dir.id} — {dir.nom}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* 5. Localisation & Responsable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Localisation / Ville <span className="text-orange-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Adzopé, Alépé, Bouaké, Abidjan..."
                      value={editStructureForm.localisation}
                      onChange={(e) =>
                        setEditStructureForm({
                          ...editStructureForm,
                          localisation: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Responsable / Directeur
                    </label>
                    <input
                      type="text"
                      placeholder="Nom et prénoms (optionnel)"
                      value={editStructureForm.responsable_nom}
                      onChange={(e) =>
                        setEditStructureForm({
                          ...editStructureForm,
                          responsable_nom: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Actions du formulaire */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingStructure(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editStructureSaving || !editStructureForm.nom || !editStructureForm.id_entite}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    {editStructureSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mise à jour...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sauvegarder les Modifications</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION DE STRUCTURE */}
        {deleteConfirmStructure !== null && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white text-center">
                Supprimer cette structure du référentiel ?
              </h4>
              <p className="text-xs text-slate-300 text-center mt-2 font-semibold">
                « {deleteConfirmStructure.nom} »
              </p>
              <p className="text-[11px] font-mono text-slate-400 text-center mt-0.5">
                Code : {deleteConfirmStructure.id_entite}
              </p>

              {deleteStructureError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{deleteStructureError}</span>
                </div>
              )}

              {Number(deleteConfirmStructure.total_recu) > 0 || Number(deleteConfirmStructure.total_livre) > 0 ? (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Mouvements de cartes détectés</span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    Cette structure possède <strong>{Number(deleteConfirmStructure.total_recu).toLocaleString('fr-FR')} cartes reçues</strong> et <strong>{Number(deleteConfirmStructure.total_livre).toLocaleString('fr-FR')} cartes distribuées</strong>.
                  </p>
                  <p className="text-[11px] text-amber-400 font-medium">
                    Pour préserver la rigueur du suivi et l'intégrité comptable, veuillez supprimer ou réassigner ses opérations associées avant de pouvoir supprimer la structure.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center mt-3 leading-relaxed">
                  Cette action retirera définitivement la structure du référentiel officiel du Ministère. Aucune carte n'est actuellement engagée sur cette structure.
                </p>
              )}

              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmStructure(null);
                    setDeleteStructureError(null);
                  }}
                  disabled={deleteStructureSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStructure(deleteConfirmStructure)}
                  disabled={
                    deleteStructureSaving ||
                    Number(deleteConfirmStructure.total_recu) > 0 ||
                    Number(deleteConfirmStructure.total_livre) > 0
                  }
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/20"
                >
                  {deleteStructureSaving ? (
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
          onClick={() => openKpiModal('structures')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1 cursor-pointer"
        >
          <School className="w-5 h-5" />
          <span className="text-[10px]">Structures</span>
        </button>
      </nav>

      {/* Modale d'importation d'activité automatique (Word, Excel, PDF) */}
      <ImportActiviteModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialAnneeScolaire={selectedAnneeScolaire.replace(/\s+/g, '')}
        onSuccess={() => {
          fetchSessionAndStats();
        }}
        currentUser={user ? { name: user.name, role: user.role } : undefined}
      />

      {/* Modale d'exportation officielle de la disponibilité des cartes */}
      <ExportDisponibiliteModal
        isOpen={showDispoModal}
        onClose={() => setShowDispoModal(false)}
        initialNature={dispoInitialNature}
        anneeScolaire={selectedAnneeScolaire.replace(/\s+/g, '')}
        naturesWithStock={recapParNature}
        onSuccess={(msg) => {
          setFeedbackMessage({ type: 'success', text: msg });
        }}
        onError={(err) => {
          setFeedbackMessage({ type: 'error', text: err });
        }}
      />
    </div>
  );
}
