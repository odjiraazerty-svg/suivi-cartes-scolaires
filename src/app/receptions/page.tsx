'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Building2,
  PackagePlus,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Search,
  School,
  X,
  History,
  Clock,
  Sparkles,
} from 'lucide-react';

interface EntiteOption {
  id_entite: string;
  nom: string;
  sigle: string | null;
  localisation: string | null;
  id_hierarchisation: string;
  id_nature: string | null;
}

export default function ReceptionCartesPage() {
  const router = useRouter();

  // Valeurs par défaut requises (Date fixée par défaut au 20/10/2026)
  const defaultDateReception = '2026-10-20';
  const todayDate = new Date().toISOString().split('T')[0];
  const [anneeAcademique, setAnneeAcademique] = useState('2026-2027');
  const [selectedEntite, setSelectedEntite] = useState<EntiteOption | null>(null);
  const [dateReception, setDateReception] = useState(defaultDateReception);
  const [quantite, setQuantite] = useState<string>('');
  const [observation, setObservation] = useState('');

  // États de recherche d'entités
  const [entites, setEntites] = useState<EntiteOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentReceptions, setRecentReceptions] = useState<any[]>([]);

  // Charger les entités par défaut
  useEffect(() => {
    fetchEntites('');
    fetchRecentReceptions();
  }, []);

  const fetchEntites = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/entites?q=${encodeURIComponent(query)}&all=true`);
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

  const fetchRecentReceptions = async () => {
    try {
      const res = await fetch('/api/receptions?limit=5');
      if (res.ok) {
        const data = await res.json();
        setRecentReceptions(data.receptions || []);
      }
    } catch (err) {
      console.error('Erreur chargement réceptions récentes:', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedEntite) {
      setError("Veuillez sélectionner la structure.");
      return;
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      setError('Veuillez saisir une quantité valide supérieure à 0.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/receptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annee_scolaire: anneeAcademique,
          id_entite: selectedEntite.id_entite,
          date_reception: dateReception,
          quantite: qteNum,
          observations: observation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'enregistrement de la réception");
      }

      setSuccessMessage(
        `Réception de ${qteNum} cartes pour "${selectedEntite.nom}" enregistrée avec succès !`
      );

      // Réinitialiser le formulaire
      setQuantite('');
      setObservation('');
      setSelectedEntite(null);
      setDateReception(defaultDateReception);

      // Mettre à jour la liste des dernières réceptions
      fetchRecentReceptions();
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
              MFFE • Réception
            </span>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6 animate-fade-in">
        {/* Titre & Sous-titre */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Entrée en Stock</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Réception de Cartes Scolaires
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enregistrement des lots de cartes scolaires reçus par entité
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

        {/* Formulaire Mobile */}
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

          {/* 2. Structure* (Sélection parmi toutes les structures avec recherche tactile) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Structure *</span>
              </span>
              <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
            </label>

            {selectedEntite ? (
              /* Entité sélectionnée : carte récapitulative avec bouton de changement */
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs sm:text-sm truncate">{selectedEntite.nom}</p>
                    <p className="text-[11px] text-slate-400">
                      {selectedEntite.sigle ? `[${selectedEntite.sigle}] ` : ''}
                      {selectedEntite.localisation || 'Côte d’Ivoire'} • Niveau: {selectedEntite.id_hierarchisation}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntite(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0 active:scale-95"
                  title="Changer d'entité"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Champ de recherche pour sélectionner l'entité */
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

                {/* Liste déroulante des suggestions tactiles */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-20 divide-y divide-slate-800/60">
                    {entites.length > 0 ? (
                      entites.slice(0, 15).map((ent) => (
                        <button
                          key={ent.id_entite}
                          type="button"
                          onClick={() => selectEntite(ent)}
                          className="w-full p-3 text-left hover:bg-slate-800/80 flex items-start gap-2.5 transition active:bg-orange-500/20"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                            <School className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate">{ent.nom}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {ent.sigle && <span className="font-semibold text-orange-400">[{ent.sigle}]</span>}
                              <span>{ent.localisation || 'Abidjan'}</span>
                              <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">{ent.id_hierarchisation}</span>
                            </div>
                          </div>
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

          {/* 3. Date de Réception* (Par défaut 20/10/2026) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Date de Réception *</span>
              </span>
              <div className="flex items-center gap-2">
                {dateReception !== defaultDateReception && (
                  <button
                    type="button"
                    onClick={() => setDateReception(defaultDateReception)}
                    className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold underline active:scale-95 transition"
                  >
                    Remettre au 20/10/2026
                  </button>
                )}
                <span className="text-[11px] text-orange-400 font-semibold lowercase">requis</span>
              </div>
            </label>
            <input
              type="date"
              value={dateReception}
              onChange={(e) => setDateReception(e.target.value)}
              required
              className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
            />
          </div>

          {/* 4. Quantité* (Nombre entier supérieur à 0 avec touches rapides d'incrément) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-orange-400" />
                <span>Quantité de cartes reçues *</span>
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
                placeholder="Ex : 250"
                required
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-slate-400 font-semibold">
                cartes
              </span>
            </div>

            {/* Raccourcis tactiles pour smartphone */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-500">Ajout rapide :</span>
              {[50, 100, 250, 500].map((qty) => (
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
          </div>

          {/* 5. Observation (Optionnel) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observation (optionnel)</span>
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              placeholder="Remarques, N° de bordereau de livraison, état des cartes, etc."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition resize-none"
            />
          </div>

          {/* Bouton de Soumission Tactile */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-base active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <PackagePlus className="w-5 h-5" />
                <span>Valider la Réception</span>
              </>
            )}
          </button>
        </form>

        {/* Historique Récent des Réceptions */}
        {recentReceptions.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Dernières Réceptions Enregistrées</span>
            </h3>

            <div className="space-y-2">
              {recentReceptions.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{r.nom_entite}</p>
                    <p className="text-[11px] text-slate-400">
                      Session {r.annee_scolaire} • Date: {new Date(r.date_reception).toLocaleDateString('fr-FR')}
                      {r.observations && <span className="block text-slate-500 truncate italic">« {r.observations} »</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-emerald-400 text-sm">+{r.quantite_recue}</span>
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
