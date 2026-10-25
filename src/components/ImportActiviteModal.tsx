'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  PackageCheck,
  Truck,
  Check,
  ChevronDown,
  Calendar,
  Building2,
  Sparkles,
  Layers,
  History,
  FileCheck,
} from 'lucide-react';
import * as xlsx from 'xlsx';

export interface MatchedImportItem {
  id: string;
  source_category: string;
  raw_name: string;
  quantite: number;
  date?: string;
  matched_entite_id: string | null;
  matched_entite_nom: string | null;
  matched_nature: string | null;
  matched_localisation: string | null;
  match_status: 'EXACT' | 'PREFIX' | 'FUZZY' | 'AMBIGUOUS' | 'UNMATCHED';
  confidence: number;
  candidates: Array<{
    id_entite: string;
    nom: string;
    sigle: string | null;
    id_nature: string | null;
    localisation: string | null;
    score: number;
  }>;
  selected: boolean;
}

interface EntiteOption {
  id_entite: string;
  nom: string;
  sigle: string | null;
  id_nature: string | null;
  localisation: string | null;
  solde_stock_disponible?: number;
}

interface ImportBatchHistory {
  batch_ref: string;
  type_activite: 'RECEPTION' | 'LIVRAISON';
  date_operation: string;
  total_lignes: number;
  total_cartes: number;
  created_at: string;
}

interface ImportActiviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: { name: string; role: string };
  initialAnneeScolaire?: string;
}

export default function ImportActiviteModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  initialAnneeScolaire,
}: ImportActiviteModalProps) {
  // Navigation entre les onglets de la modale
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : Paramètres du lot et fichier
  const [typeActivite, setTypeActivite] = useState<'RECEPTION' | 'LIVRAISON'>('RECEPTION');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dateOperation, setDateOperation] = useState<string>(new Date().toISOString().slice(0, 10));
  const [anneeScolaire, setAnneeScolaire] = useState<string>(() => {
    if (initialAnneeScolaire) return initialAnneeScolaire;
    const current = new Date().getFullYear();
    return `${current}-${current + 1}`;
  });
  const [referenceBordereau, setReferenceBordereau] = useState<string>('');
  const [agentNom, setAgentNom] = useState<string>(currentUser?.name || 'Superviseur DRH');
  const [observations, setObservations] = useState<string>('');

  useEffect(() => {
    if (initialAnneeScolaire) {
      setAnneeScolaire(initialAnneeScolaire);
    }
  }, [initialAnneeScolaire]);

  // États d'analyse et prévisualisation
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Données de prévisualisation (Étape 2)
  const [importItems, setImportItems] = useState<MatchedImportItem[]>([]);
  const [allDbEntities, setAllDbEntities] = useState<EntiteOption[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VERIF' | 'UNMATCHED' | 'VALID'>('ALL');
  const [searchTable, setSearchTable] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  // Résultat d'enregistrement (Étape 3)
  const [commitResult, setCommitResult] = useState<{
    insertedCount: number;
    totalCartes: number;
    referenceBordereau: string;
    typeActivite: string;
  } | null>(null);

  // Historique et Rollback
  const [historyList, setHistoryList] = useState<ImportBatchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Générer une référence de bordereau par défaut à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = typeActivite === 'RECEPTION' ? 'BORD-REC' : 'BORD-LIV';
      const randomSuffix = Math.floor(Math.random() * 900 + 100);
      setReferenceBordereau(`${prefix}-${today}-${randomSuffix}`);
      loadAllDbEntities();
    } else {
      // Réinitialiser les états
      setCurrentStep(1);
      setSelectedFile(null);
      setImportItems([]);
      setErrorMsg(null);
      setCommitResult(null);
    }
  }, [isOpen, typeActivite]);

  // Charger toutes les entités du référentiel pour le sélecteur rapide de correction
  const loadAllDbEntities = async () => {
    try {
      const res = await fetch('/api/entites?all=true');
      if (res.ok) {
        const data = await res.json();
        setAllDbEntities(data.entites || []);
      }
    } catch (e) {
      console.error('Erreur chargement entités:', e);
    }
  };

  // Charger l'historique des imports
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/activites/import');
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (e) {
      console.error('Erreur chargement historique:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Gestion du Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['xlsx', 'xls', 'docx', 'pdf', 'csv'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Format non supporté (.${ext}). Choisissez un fichier Word (.docx), Excel (.xlsx, .xls) ou PDF (.pdf).`);
      setSelectedFile(null);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  // 1. Analyse et Rapprochement (Étape 1 ➔ Étape 2)
  const handleAnalyzeFile = async () => {
    if (!selectedFile) {
      setErrorMsg('Veuillez sélectionner un fichier à importer.');
      return;
    }

    try {
      setAnalyzing(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type_activite', typeActivite);
      formData.append('date_operation', dateOperation);
      formData.append('annee_scolaire', anneeScolaire);
      formData.append('reference_bordereau', referenceBordereau);

      const res = await fetch('/api/activites/import?action=preview', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse du document.");
      }

      setImportItems(data.items || []);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Modifier manuellement l'entité attribuée à une ligne
  const handleAssignEntity = (itemId: string, entite: EntiteOption) => {
    setImportItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return {
            ...it,
            matched_entite_id: entite.id_entite,
            matched_entite_nom: entite.nom,
            matched_nature: entite.id_nature,
            matched_localisation: entite.localisation,
            match_status: 'EXACT',
            confidence: 100,
            selected: true,
          };
        }
        return it;
      })
    );
    setEditingItemId(null);
    setDropdownSearch('');
  };

  // Modifier la quantité d'une ligne
  const handleQuantityChange = (itemId: string, newQty: number) => {
    if (newQty < 0) return;
    setImportItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantite: newQty } : it))
    );
  };

  // Cocher / Décocher une ligne
  const handleToggleSelect = (itemId: string) => {
    setImportItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, selected: !it.selected } : it))
    );
  };

  // Tout cocher / Décocher
  const handleSelectAll = (select: boolean) => {
    setImportItems((prev) =>
      prev.map((it) => ({
        ...it,
        selected: select && !!it.matched_entite_id,
      }))
    );
  };

  // 2. Enregistrement effectif en base (Étape 2 ➔ Étape 3)
  const handleCommitImport = async () => {
    const validToImport = importItems.filter((i) => i.selected && i.matched_entite_id && i.quantite > 0);

    if (validToImport.length === 0) {
      alert('Aucune ligne valide sélectionnée pour importation.');
      return;
    }

    try {
      setCommitting(true);
      setErrorMsg(null);

      const payload = {
        typeActivite,
        dateOperation,
        anneeScolaire,
        referenceBordereau,
        agentNom,
        observations,
        items: validToImport,
      };

      const res = await fetch('/api/activites/import?action=commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement en base.");
      }

      setCommitResult({
        insertedCount: data.insertedCount,
        totalCartes: data.totalCartes,
        referenceBordereau: data.referenceBordereau,
        typeActivite,
      });

      setCurrentStep(3);
      onSuccess(); // Rafraîchit les KPI sur l'écran de pilotage en arrière-plan
    } catch (err: any) {
      setErrorMsg(err.message || "Échec de l'enregistrement.");
    } finally {
      setCommitting(false);
    }
  };

  // Exporter le rapport d'anomalies en Excel
  const handleExportAnomalies = () => {
    const anomalies = importItems.filter((i) => !i.matched_entite_id || i.match_status === 'UNMATCHED' || i.match_status === 'AMBIGUOUS');
    if (anomalies.length === 0) {
      alert('Toutes les structures sont parfaitement reconnues ! Aucun écart à exporter.');
      return;
    }

    const exportRows = anomalies.map((item, idx) => ({
      'N°': idx + 1,
      'Catégorie Document': item.source_category,
      'Nom Brut dans le Fichier': item.raw_name,
      'Quantité Cartes': item.quantite,
      'Statut Rapprochement': item.match_status,
      'Structure Proposée': item.matched_entite_nom || 'AUCUNE CORRESPONDANCE',
      'Code Entité Base': item.matched_entite_id || 'NON ATTRIBUÉ',
      'Observation DRH': item.match_status === 'UNMATCHED' ? 'Structure inexistante dans le référentiel des structures' : 'Correspondance à confirmer',
    }));

    const ws = xlsx.utils.json_to_sheet(exportRows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Anomalies & Ecarts');
    xlsx.writeFile(wb, `Ecarts_Import_${referenceBordereau || 'Bordereau'}.xlsx`);
  };

  // Annuler un lot importé (Rollback)
  const handleRollbackBatch = async (batchRef: string, type: 'RECEPTION' | 'LIVRAISON') => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir ANNULER le lot "${batchRef}" ?\nToutes les ${type === 'RECEPTION' ? 'réceptions' : 'distributions'} de ce lot seront définitivement supprimées.`
      )
    ) {
      return;
    }

    try {
      setRollbackLoading(batchRef);
      const res = await fetch(`/api/activites/import?batch_ref=${encodeURIComponent(batchRef)}&type=${type}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'annulation.");

      alert(data.message || 'Lot annulé avec succès.');
      loadHistory();
      onSuccess(); // Rafraîchit les KPI
    } catch (err: any) {
      alert(err.message || 'Erreur lors du rollback.');
    } finally {
      setRollbackLoading(null);
    }
  };

  if (!isOpen) return null;

  // Calculs statistiques de la prévisualisation
  const totalLignes = importItems.length;
  const countValides = importItems.filter((i) => i.match_status === 'EXACT' || i.match_status === 'PREFIX').length;
  const countVerif = importItems.filter((i) => i.match_status === 'AMBIGUOUS' || i.match_status === 'FUZZY').length;
  const countInconnus = importItems.filter((i) => i.match_status === 'UNMATCHED').length;
  const totalCartesRetenues = importItems
    .filter((i) => i.selected && i.matched_entite_id)
    .reduce((a, b) => a + (b.quantite || 0), 0);

  // Filtrage des lignes pour l'affichage
  const filteredItems = importItems.filter((item) => {
    // Filtre d'onglet statut
    if (filterStatus === 'VALID' && !(item.match_status === 'EXACT' || item.match_status === 'PREFIX')) return false;
    if (filterStatus === 'VERIF' && !(item.match_status === 'AMBIGUOUS' || item.match_status === 'FUZZY')) return false;
    if (filterStatus === 'UNMATCHED' && item.match_status !== 'UNMATCHED') return false;

    // Filtre de recherche texte
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase();
      const matchRaw = item.raw_name.toLowerCase().includes(q);
      const matchNom = item.matched_entite_nom?.toLowerCase().includes(q);
      const matchCat = item.source_category.toLowerCase().includes(q);
      if (!matchRaw && !matchNom && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête de la Modale */}
        <div className="px-5 sm:px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Importation d'Activité de Cartes
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Excel • Word • PDF
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rapprochement automatique et imputation par structure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bascule Onglet Import vs Historique */}
            <div className="bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 flex text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeTab === 'import'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nouvel Import
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-orange-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historique & Annulation</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-red-400 hover:text-white text-xs"
              >
                Fermer
              </button>
            </div>
          )}

          {activeTab === 'import' ? (
            <>
              {/* Stepper indicateur d'étapes */}
              <div className="mb-6 flex items-center justify-between max-w-xl mx-auto px-4">
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    currentStep >= 1 ? 'text-orange-400' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    1
                  </span>
                  <span>Fichier & Options</span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${currentStep >= 2 ? 'bg-orange-600' : 'bg-slate-800'}`} />
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    currentStep >= 2 ? 'text-orange-400' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    2
                  </span>
                  <span>Rapprochement</span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${currentStep >= 3 ? 'bg-orange-600' : 'bg-slate-800'}`} />
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    currentStep >= 3 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    3
                  </span>
                  <span>Validation</span>
                </div>
              </div>

              {/* ÉTAPE 1 : DÉPÔT ET PARAMÈTRES */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Sélecteur Activité : Réception vs Distribution */}
                  <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                    <button
                      type="button"
                      onClick={() => setTypeActivite('RECEPTION')}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                        typeActivite === 'RECEPTION'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500/40 shadow-lg'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <PackageCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-emerald-400">Réception de Cartes</div>
                        <div className="text-[11px] text-slate-400">Entrée en stock national</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTypeActivite('LIVRAISON')}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                        typeActivite === 'LIVRAISON'
                          ? 'bg-orange-500/15 border-orange-500/50 text-white ring-1 ring-orange-500/40 shadow-lg'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-orange-400">Distribution / Livraison</div>
                        <div className="text-[11px] text-slate-400">Attribution aux structures</div>
                      </div>
                    </button>
                  </div>

                  {/* Zone de Glisser-Déposer (Drag and Drop) */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition ${
                      selectedFile
                        ? 'border-emerald-500/60 bg-emerald-950/10'
                        : 'border-slate-700/80 hover:border-orange-500/60 bg-slate-950/40 hover:bg-slate-950/60'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.docx,.pdf,.csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          validateAndSetFile(e.target.files[0]);
                        }
                      }}
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div className="text-white font-bold text-sm sm:text-base">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Taille : {(selectedFile.size / 1024).toFixed(1)} Ko • Format prêt à analyser
                        </div>
                        <span className="mt-2 text-xs text-orange-400 hover:underline">
                          Cliquer pour changer de fichier
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                            <FileCode className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="text-white font-semibold text-sm">
                          Glissez-déposez votre fichier ici, ou{' '}
                          <span className="text-orange-400 underline">parcourir</span>
                        </div>
                        <div className="text-xs text-slate-400 max-w-md">
                          Formats acceptés : <strong>Excel (.xlsx, .xls)</strong>, <strong>Word (.docx)</strong>,{' '}
                          <strong>PDF (.pdf)</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Paramètres d'imputation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                        Date de l'opération
                      </label>
                      <input
                        type="date"
                        value={dateOperation}
                        onChange={(e) => setDateOperation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                        Année Scolaire
                      </label>
                      <input
                        type="text"
                        value={anneeScolaire}
                        onChange={(e) => setAnneeScolaire(e.target.value)}
                        placeholder="2026-2027"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                        Réf. Bordereau / Décharge
                      </label>
                      <input
                        type="text"
                        value={referenceBordereau}
                        onChange={(e) => setReferenceBordereau(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                        Responsable / Observations de lot
                      </label>
                      <input
                        type="text"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="ex: Bordereau de livraison du fournisseur / distribution régionale..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Bouton Lancer l'analyse */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!selectedFile || analyzing}
                      onClick={handleAnalyzeFile}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 flex items-center gap-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analyse et rapprochement des structures...</span>
                        </>
                      ) : (
                        <>
                          <span>Lancer l'analyse et le rapprochement</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 : REVUE INTERACTIVE DU RAPPROCHEMENT */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Cartes KPI de synthèse */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Lignes</div>
                      <div className="text-xl font-bold text-white mt-0.5">{totalLignes}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[11px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Reconnues
                      </div>
                      <div className="text-xl font-bold text-emerald-300 mt-0.5">{countValides}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="text-[11px] text-amber-400 uppercase font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> À Vérifier
                      </div>
                      <div className="text-xl font-bold text-amber-300 mt-0.5">{countVerif}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <div className="text-[11px] text-red-400 uppercase font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Inconnues
                      </div>
                      <div className="text-xl font-bold text-red-300 mt-0.5">{countInconnus}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/30 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-orange-400 uppercase font-bold">Total Cartes</div>
                      <div className="text-xl font-black text-white mt-0.5">
                        {totalCartesRetenues.toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>

                  {/* Barre d'outils : Filtres, Recherche, Actions globales */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                          filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Toutes ({totalLignes})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('VERIF')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                          filterStatus === 'VERIF' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        À vérifier ({countVerif})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterStatus('UNMATCHED')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                          filterStatus === 'UNMATCHED' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Inconnues ({countInconnus})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchTable}
                          onChange={(e) => setSearchTable(e.target.value)}
                          placeholder="Filtrer par structure..."
                          className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-orange-500 w-44 sm:w-56"
                        />
                      </div>

                      {countInconnus > 0 && (
                        <button
                          type="button"
                          onClick={handleExportAnomalies}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 border border-slate-700 transition"
                          title="Télécharger un tableau Excel des structures non répertoriées"
                        >
                          <Upload className="w-3.5 h-3.5 text-orange-400" />
                          <span className="hidden sm:inline">Rapport d'écarts Excel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tableau interactif des correspondances */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 sticky top-0 z-10 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={importItems.every((i) => i.selected)}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
                            />
                          </th>
                          <th className="py-2.5 px-3">Nom dans le Fichier</th>
                          <th className="py-2.5 px-3 w-24 text-center">Quantité</th>
                          <th className="py-2.5 px-3 w-28 text-center">Statut</th>
                          <th className="py-2.5 px-3">Structure Associée en Base</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredItems.map((item) => {
                          const isUnmatched = item.match_status === 'UNMATCHED';
                          const isAmbiguous = item.match_status === 'AMBIGUOUS' || item.match_status === 'FUZZY';
                          const isEditingThis = editingItemId === item.id;

                          return (
                            <tr
                              key={item.id}
                              className={`transition ${
                                !item.selected
                                  ? 'opacity-40 bg-slate-950/20'
                                  : isUnmatched
                                  ? 'bg-red-950/15'
                                  : isAmbiguous
                                  ? 'bg-amber-950/15'
                                  : 'hover:bg-slate-900/40'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  disabled={!item.matched_entite_id}
                                  onChange={() => handleToggleSelect(item.id)}
                                  className="rounded border-slate-700 text-orange-500 focus:ring-orange-500"
                                />
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-white">{item.raw_name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                    {item.source_category}
                                  </span>
                                  {item.date && <span>Date doc : {item.date}</span>}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantite}
                                  onChange={(e) =>
                                    handleQuantityChange(item.id, parseInt(e.target.value, 10) || 0)
                                  }
                                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {isUnmatched ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                    <X className="w-3 h-3" /> Inconnu
                                  </span>
                                ) : isAmbiguous ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <AlertTriangle className="w-3 h-3" /> À valider
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Check className="w-3 h-3" /> Conforme
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3">
                                {isEditingThis ? (
                                  <div className="space-y-1.5 bg-slate-900 p-2 rounded-xl border border-orange-500/40">
                                    <div className="flex items-center gap-1.5">
                                      <Search className="w-3.5 h-3.5 text-slate-400" />
                                      <input
                                        type="text"
                                        autoFocus
                                        value={dropdownSearch}
                                        onChange={(e) => setDropdownSearch(e.target.value)}
                                        placeholder="Taper un nom de structure..."
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingItemId(null);
                                          setDropdownSearch('');
                                        }}
                                        className="text-slate-400 hover:text-white text-xs px-1"
                                      >
                                        ✕
                                      </button>
                                    </div>

                                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                      {allDbEntities
                                        .filter(
                                          (e) =>
                                            !dropdownSearch.trim() ||
                                            e.nom.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
                                            e.id_entite.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
                                            (e.localisation && e.localisation.toLowerCase().includes(dropdownSearch.toLowerCase()))
                                        )
                                        .slice(0, 15)
                                        .map((cand) => (
                                          <button
                                            key={cand.id_entite}
                                            type="button"
                                            onClick={() => handleAssignEntity(item.id, cand)}
                                            className="w-full text-left p-1.5 rounded-lg bg-slate-800/80 hover:bg-orange-600 hover:text-white text-[11px] transition flex items-center justify-between"
                                          >
                                            <span className="font-semibold truncate">{cand.nom}</span>
                                            <span className="text-[10px] opacity-75 shrink-0 ml-2">
                                              {cand.id_nature} • {cand.localisation || ''}
                                            </span>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    {item.matched_entite_id ? (
                                      <div>
                                        <div className="font-medium text-slate-200">{item.matched_entite_nom}</div>
                                        <div className="text-[10px] text-slate-400">
                                          Code : <strong className="text-orange-400">{item.matched_entite_id}</strong>
                                          {item.matched_localisation && ` • ${item.matched_localisation}`}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-red-400 text-xs italic">
                                        Non répertorié dans le référentiel des structures
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setDropdownSearch('');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium shrink-0 transition"
                                    >
                                      {item.matched_entite_id ? 'Changer' : 'Associer'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions de validation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Modifier les paramètres / fichier</span>
                    </button>

                    <button
                      type="button"
                      disabled={committing || totalCartesRetenues === 0}
                      onClick={handleCommitImport}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {committing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enregistrement en base de données...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Confirmer et importer (
                            {importItems.filter((i) => i.selected && i.matched_entite_id).length} structures •{' '}
                            {totalCartesRetenues.toLocaleString('fr-FR')} cartes)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : CONFIRMATION ET SUCCÈS */}
              {currentStep === 3 && commitResult && (
                <div className="py-8 text-center space-y-5 animate-fade-in max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">Importation Réussie !</h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Les cartes ont été attribuées et enregistrées avec succès en base de données.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Activité</div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {commitResult.typeActivite === 'RECEPTION' ? 'Réception en Stock' : 'Distribution Terrain'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Cartes</div>
                      <div className="font-black text-sm text-emerald-400 mt-0.5">
                        {commitResult.totalCartes.toLocaleString('fr-FR')} cartes
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Structures Mises à Jour</div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {commitResult.insertedCount} structures
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Réf. Bordereau</div>
                      <div className="font-mono text-xs text-orange-400 mt-0.5 truncate">
                        {commitResult.referenceBordereau}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedFile(null);
                        setImportItems([]);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Importer un autre bordereau
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-lg shadow-orange-600/30"
                    >
                      Terminer & Fermer
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ONGLET : HISTORIQUE DES IMPORTS ET ROLLBACK */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-sm">Lots d'importation récents</h3>
                  <p className="text-xs text-slate-400">
                    Traçabilité de chaque bordereau avec possibilité d'annulation complète
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-400" />
                  Chargement de l'historique...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                  Aucun lot d'importation enregistré pour le moment.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Réf. Bordereau / Lot</th>
                        <th className="py-2.5 px-3">Activité</th>
                        <th className="py-2.5 px-3">Date Opération</th>
                        <th className="py-2.5 px-3 text-center">Structures</th>
                        <th className="py-2.5 px-3 text-center">Total Cartes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {historyList.map((batch) => (
                        <tr key={batch.batch_ref} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3 font-mono text-orange-400 font-semibold">
                            {batch.batch_ref}
                          </td>
                          <td className="py-2.5 px-3">
                            {batch.type_activite === 'RECEPTION' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Réception
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                                Distribution
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{batch.date_operation}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-white">
                            {batch.total_lignes}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                            {batch.total_cartes.toLocaleString('fr-FR')}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={rollbackLoading === batch.batch_ref}
                              onClick={() => handleRollbackBatch(batch.batch_ref, batch.type_activite)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition flex items-center gap-1 ml-auto disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Annuler le lot</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
