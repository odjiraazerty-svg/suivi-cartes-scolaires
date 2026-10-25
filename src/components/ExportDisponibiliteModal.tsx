'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Layers,
  MapPin,
  Building2,
  Printer,
} from 'lucide-react';

interface NatureStockInfo {
  code: string;
  libelle: string;
  solde_stock: number;
  total_structures?: number;
}

interface ExportDisponibiliteModalProps {
  isOpen: boolean;
  onClose: () => void;
  naturesWithStock: NatureStockInfo[];
  initialNature?: string;
  anneeScolaire?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function ExportDisponibiliteModal({
  isOpen,
  onClose,
  naturesWithStock,
  initialNature = 'ALL',
  anneeScolaire,
  onSuccess,
  onError,
}: ExportDisponibiliteModalProps) {
  const [selectedNature, setSelectedNature] = useState<string>(initialNature);
  const [selectedFormat, setSelectedFormat] = useState<'docx' | 'xlsx'>('docx');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync initialNature if changed
  React.useEffect(() => {
    if (isOpen) {
      setSelectedNature(initialNature || 'ALL');
    }
  }, [isOpen, initialNature]);

  if (!isOpen) return null;

  const validNatures = naturesWithStock.filter((n) => (n.solde_stock || 0) > 0);
  const totalStockDispo = validNatures.reduce((acc, n) => acc + (n.solde_stock || 0), 0);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (selectedNature && selectedNature !== 'ALL') {
        params.set('nature', selectedNature);
      }
      if (anneeScolaire) {
        params.set('annee_scolaire', anneeScolaire);
      }
      params.set('format', selectedFormat);

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
      const natureTag =
        selectedNature !== 'ALL' ? selectedNature.toUpperCase().replace(/\s+/g, '_') : 'CONSOLIDE';
      a.download = `DISPONIBILITE_CARTES_SCOLAIRES_${natureTag}_${timestamp}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      onSuccess?.(
        `Le document ${selectedFormat.toUpperCase()} a été généré et téléchargé avec succès !`
      );
      onClose();
    } catch (err: any) {
      console.error('Erreur export disponibilité:', err);
      onError?.(err.message || 'Impossible de télécharger le document de disponibilité.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Export Disponibilité des Cartes Scolaires
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mise en forme officielle • Groupé par Direction Régionale • IFEF en orange &amp; autres natures en vert
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Note explicative mise en page et couleurs */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs flex items-start gap-2.5">
            <Printer className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300">
                Organisation groupée par Direction Régionale &amp; code couleur :
              </span>{' '}
              Les structures sont présentées par Direction Régionale (CACE, CPPE, CES, POUPONNIERE, IFEF...).
              Les lignes <span className="text-orange-400 font-bold">IFEF</span> sont surlignées en orange et les{' '}
              <span className="text-emerald-400 font-bold">autres natures</span> en vert.
              Les tableaux régionaux s'enchaînent avec fluidité et Word bascule automatiquement une région à la page suivante
              uniquement si l'espace restant ne suffit pas à l'accueillir en entier.
            </div>
          </div>

          {/* 1. Choix du Périmètre / Nature */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              1. Sélectionner le périmètre des structures
            </label>

            {/* Option TOUTES LES NATURES */}
            <button
              type="button"
              onClick={() => setSelectedNature('ALL')}
              className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedNature === 'ALL'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/40'
                  : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedNature === 'ALL'
                      ? 'border-emerald-400 bg-emerald-500'
                      : 'border-slate-500'
                  }`}
                >
                  {selectedNature === 'ALL' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm">
                    Toutes les Natures (Liste groupée par Direction Régionale)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Présentation consolidée par DR avec IFEF en orange et autres natures (CACE, CPPE, CES...) en vert
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {totalStockDispo.toLocaleString('fr-FR')} cartes dispo
              </span>
            </button>

            {/* Ou filtrer sur une nature spécifique */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-400">
                Ou exporter uniquement une nature d'entité :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {validNatures.map((n) => {
                  const isSelected = selectedNature === n.code;
                  return (
                    <button
                      key={n.code}
                      type="button"
                      onClick={() => setSelectedNature(n.code)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500/40'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{n.code}</span>
                        <span className="text-[10px] font-extrabold text-emerald-400">
                          {n.solde_stock} dispo
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">
                        {n.libelle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Format du fichier */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              2. Format d'exportation
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option Word DOCX */}
              <button
                type="button"
                onClick={() => setSelectedFormat('docx')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedFormat === 'docx'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/40'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm">Document Word (.docx)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Modèle officiel avec tableaux groupés par région et protection automatique contre la coupure des tableaux.
                  </p>
                </div>
              </button>

              {/* Option Excel XLSX */}
              <button
                type="button"
                onClick={() => setSelectedFormat('xlsx')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedFormat === 'xlsx'
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm ring-1 ring-teal-500/40'
                    : 'bg-slate-800/50 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm">Classeur Excel (.xlsx)</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Grille tabulaire stylisée avec totaux par région et sauts de page d'impression configurés.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Pied de la modale */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Génération du document en cours...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>
                  Télécharger{' '}
                  {selectedNature === 'ALL'
                    ? 'le Document Consolidé'
                    : `la Disponibilité (${selectedNature})`}
                  {' '}(.{selectedFormat})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
