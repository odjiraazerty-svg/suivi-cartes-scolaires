'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Send,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Search,
  School,
  X,
  History,
  Clock,
  Truck,
  Phone,
  UserCheck,
  Coins,
  ShieldCheck,
  PackageCheck,
  Sparkles,
} from 'lucide-react';

interface EntiteOption {
  id_entite: string;
  nom: string;
  sigle: string | null;
  localisation: string | null;
  id_hierarchisation: string;
  id_nature: string | null;
  total_recu?: number;
  total_livre?: number;
  solde_stock_disponible?: number;
}

export default function LivraisonCartesPage() {
  const router = useRouter();

  // Valeurs par défaut requises
  const todayDate = new Date().toISOString().split('T')[0];
  const [anneeAcademique, setAnneeAcademique] = useState('2026-2027');
  const [selectedEntite, setSelectedEntite] = useState<EntiteOption | null>(null);
  const [dateLivraison, setDateLivraison] = useState(todayDate);
  const [quantite, setQuantite] = useState<string>('');
  const [observation, setObservation] = useState('');

  // Cadre "Info livraison"
  const [modeLivraison, setModeLivraison] = useState('Agent du MFFE');
  const [customMode, setCustomMode] = useState('');
  const [coutLivraison, setCoutLivraison] = useState<string>('0');
  const [receptionnePar, setReceptionnePar] = useState('');
  const [contact, setContact] = useState('');

  // Recherche des structures
  const [entites, setEntites] = useState<EntiteOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentLivraisons, setRecentLivraisons] = useState<any[]>([]);

  useEffect(() => {
    fetchEntites('');
    fetchRecentLivraisons();
  }, []);

  const fetchEntites = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/entites?q=${encodeURIComponent(query)}&all=true&concernees_only=true`);
      if (res.ok) {
        const data = await res.json();
        setEntites(data.entites || []);
      }
    } catch (err) {
      console.error('Erreur chargement entités:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchRecentLivraisons = async () => {
    try {
      const res = await fetch('/api/livraisons?limit=5');
      if (res.ok) {
        const data = await res.json();
        setRecentLivraisons(data.livraisons || []);
      }
    } catch (err) {
      console.error('Erreur chargement livraisons récentes:', err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setShowDropdown(true);
    fetchEntites(val);
  };

  const selectEntite = (ent: EntiteOption) => {
    setSelectedEntite(ent);
    setSearchTerm('');
    setShowDropdown(false);
    setError(null);
  };

  const addQuickQuantity = (qty: number) => {
    const current = parseInt(quantite || '0', 10);
    setQuantite(String(current + qty));
  };

  const finalModeLivraison = modeLivraison === 'Autre' ? customMode || 'Autre' : modeLivraison;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedEntite) {
      setError('Veuillez sélectionner la structure.');
      return;
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      setError('Veuillez saisir une quantité valide supérieure à 0.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/livraisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annee_scolaire: anneeAcademique,
          id_entite: selectedEntite.id_entite,
          date_livraison: dateLivraison,
          quantite: qteNum,
          observations: observation,
          mode_livraison: finalModeLivraison,
          cout_livraison: parseFloat(coutLivraison) || 0,
          receptionne_par: receptionnePar,
          contact: contact,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'enregistrement de la livraison");
      }

      setSuccessMessage(
        `Livraison de ${qteNum} cartes pour "${selectedEntite.nom}" enregistrée avec succès !`
      );

      // Réinitialiser le formulaire
      setQuantite('');
      setObservation('');
      setSelectedEntite(null);
      setDateLivraison(todayDate);
      setCoutLivraison('0');
      setReceptionnePar('');
      setContact('');
      setModeLivraison('Agent du MFFE');

      // Recharger l'historique
      fetchRecentLivraisons();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 transition-colors duration-200">
      {/* Barre Supérieure Fixe */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 text-xs font-semibold"
          >
            <ArrowLeft className="w-5 h-5 text-orange-400" />
            <span>Retour</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center border border-orange-500/30">
              <img src="/logo-mffe.png" alt="Logo MFFE" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              MFFE • Livraison
            </span>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6 animate-fade-in">
        {/* Titre & Sous-titre */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-1">
              <Send className="w-3.5 h-3.5" />
              <span>Distribution & Sortie</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Livraison de Cartes Scolaires
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enregistrement des sorties et remises de cartes par structure
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Formulaire Principal */}
        <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          {/* 1. Année Académique* (Par défaut 2026-2027) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Année Académique *</span>
              </span>
              <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
            </label>
            <div className="relative">
              <select
                value={anneeAcademique}
                onChange={(e) => setAnneeAcademique(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition appearance-none cursor-pointer"
              >
                <option value="2026-2027">2026-2027 (Année en cours)</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2027-2028">2027-2028</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Structure* (Sélection parmi toutes les structures du référentiel) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Structure *</span>
              </span>
              <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
            </label>

            {selectedEntite ? (
              /* Structure sélectionnée : carte visuelle avec aperçu de stock */
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs sm:text-sm truncate">{selectedEntite.nom}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {selectedEntite.sigle && <span className="font-semibold text-orange-400">[{selectedEntite.sigle}]</span>}
                      <span>{selectedEntite.localisation || 'Côte d’Ivoire'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold">
                        Stock dispo: {selectedEntite.solde_stock_disponible ?? 0} cartes
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntite(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0 active:scale-95"
                  title="Changer de structure"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Champ de recherche pour sélectionner la structure */
              <div className="relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher une structure (école, IFEF, CACE, direction...)..."
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Liste déroulante des suggestions */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-20 divide-y divide-slate-800/60">
                    {entites.length > 0 ? (
                      entites.slice(0, 15).map((ent) => (
                        <button
                          key={ent.id_entite}
                          type="button"
                          onClick={() => selectEntite(ent)}
                          className="w-full p-3 text-left hover:bg-slate-800/80 flex items-start justify-between gap-2.5 transition active:bg-orange-500/20"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                              <School className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{ent.nom}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                {ent.id_nature && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {ent.id_nature}
                                  </span>
                                )}
                                {ent.sigle && <span className="font-semibold text-orange-400">[{ent.sigle}]</span>}
                                <span>{ent.localisation || 'Abidjan'}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-bold shrink-0">
                            {ent.solde_stock_disponible ?? 0} dispo
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Aucune structure trouvée pour "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Date de Livraison* (Par défaut date du jour) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Date de Livraison *</span>
              </span>
              <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
            </label>
            <input
              type="date"
              value={dateLivraison}
              onChange={(e) => setDateLivraison(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
            />
          </div>

          {/* 4. Quantité* (Nombre entier supérieur à 0 avec boutons d'ajout rapide) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-orange-400" />
                <span>Quantité de cartes livrées *</span>
              </span>
              <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                placeholder="Ex : 150"
                required
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-slate-400 font-semibold">
                cartes
              </span>
            </div>

            {/* Raccourcis tactiles d'ajout rapide */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-500">Ajout rapide :</span>
              {[25, 50, 100, 250].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => addQuickQuantity(qty)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs font-semibold text-orange-400 active:scale-95 transition"
                >
                  +{qty}
                </button>
              ))}
            </div>

            {/* Avertissement si quantité dépasse le stock disponible */}
            {selectedEntite &&
              selectedEntite.solde_stock_disponible !== undefined &&
              parseInt(quantite || '0', 10) > selectedEntite.solde_stock_disponible && (
                <p className="text-xs text-amber-400 font-medium mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Attention : la quantité saisie ({quantite}) dépasse le stock actuellement disponible ({selectedEntite.solde_stock_disponible}).
                  </span>
                </p>
              )}
          </div>

          {/* 5. CADRE DÉDIÉ : "INFO LIVRAISON" */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-orange-500/30 p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Info Livraison
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Logistique
              </span>
            </div>

            {/* A. Mode de livraison */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mode de livraison
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {['Agent du MFFE', 'Expédition', 'Retrait sur place', 'Transporteur', 'Autre'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setModeLivraison(mode)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center truncate ${
                      modeLivraison === mode
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {modeLivraison === 'Autre' && (
                <input
                  type="text"
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value)}
                  placeholder="Précisez le mode de livraison..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs mt-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* B. Coût de livraison */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-orange-400" />
                  <span>Coût de livraison</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    inputMode="numeric"
                    value={coutLivraison}
                    onChange={(e) => setCoutLivraison(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-semibold">
                    FCFA
                  </span>
                </div>
              </div>

              {/* C. Réceptionné par */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                  <span>Réceptionné par</span>
                </label>
                <input
                  type="text"
                  value={receptionnePar}
                  onChange={(e) => setReceptionnePar(e.target.value)}
                  placeholder="Nom & prénom du signataire"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* D. Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>Contact téléphonique</span>
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ex: +225 07 08 12 34 56"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 6. Observation (Optionnel) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observation (optionnel)</span>
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              placeholder="Remarques, N° de décharge, informations complémentaires..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none"
            />
          </div>

          {/* Bouton de Soumission Tactile */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-base active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Valider la Livraison</span>
              </>
            )}
          </button>
        </form>

        {/* Historique Récent des Livraisons */}
        {recentLivraisons.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-400" />
              <span>Dernières Livraisons Enregistrées</span>
            </h3>

            <div className="space-y-2">
              {recentLivraisons.map((l) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{l.nom_entite}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Date: {new Date(l.date_livraison).toLocaleDateString('fr-FR')} • Mode: {l.mode_livraison || 'Agent MFFE'}
                      {l.receptionne_par && <span> • Par: <strong className="text-slate-300">{l.receptionne_par}</strong></span>}
                      {l.contact_receptionnaire && <span> ({l.contact_receptionnaire})</span>}
                    </p>
                    {l.cout_livraison > 0 && (
                      <p className="text-[10px] text-amber-400 mt-0.5">
                        Coût livraison: {Number(l.cout_livraison).toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-orange-400 text-sm">-{l.quantite_livree}</span>
                    <p className="text-[10px] text-slate-500">cartes</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
