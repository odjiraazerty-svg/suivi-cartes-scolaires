'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  PlusCircle,
  Clock,
  Home,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Send,
} from 'lucide-react';
import ThemeToggleButton from '@/components/ThemeToggleButton';

export default function UserHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [dernieresReceptions, setDernieresReceptions] = useState<any[]>([]);
  const [dernieresLivraisons, setDernieresLivraisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/login');
        return;
      }
      setUser(meData.user);

      // Charger les derniers flux
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setDernieresReceptions(data.dernieresReceptions || []);
        setDernieresLivraisons(data.dernieresLivraisons || []);
      }
    } catch (err) {
      console.error('Erreur chargement utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
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
      {/* Barre Supérieure Fixe Mobile */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-600/20 border border-emerald-500/30 shrink-0">
              <img
                src="/logo-mffe.png"
                alt="Logo MFFE"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Espace Utilisateur</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Agent Terrain
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {user?.name || 'Agent MFFE'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton variant="header" />
            <button
              onClick={fetchUserData}
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
      <main className="max-w-3xl mx-auto px-4 py-5 sm:px-6 space-y-5">
        {/* Carte de Bienvenue Agent */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 sm:p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Bienvenue dans votre espace de gestion
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">
                Vous pouvez saisir vos réceptions de cartes scolaires et enregistrer les remises effectuées aux bénéficiaires depuis votre smartphone.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action Rapide Smartphone */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Actions Directes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Déclarer une Réception */}
            <button
              onClick={() => router.push('/receptions')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-emerald-500/30 flex items-center justify-between gap-3 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Déclarer une Réception</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enregistrer un lot de cartes reçu</p>
                </div>
              </div>
              <PlusCircle className="w-5 h-5 text-emerald-400" />
            </button>

            {/* Déclarer une Distribution */}
            <button
              onClick={() => router.push('/livraisons')}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-orange-500/30 flex items-center justify-between gap-3 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Déclarer une Distribution</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enregistrer la remise aux élèves</p>
                </div>
              </div>
              <Send className="w-5 h-5 text-orange-400" />
            </button>
          </div>
        </section>

        {/* Aide et Consignes Rapides */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Consignes de Saisie sur Smartphone</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li>Vérifiez toujours le nombre de cartes mentionné sur votre bon de livraison.</li>
            <li>Notez la référence du bordereau lors de chaque enregistrement.</li>
            <li>En cas d'anomalie ou de cartes manquantes, signalez-le dans les observations.</li>
          </ul>
        </section>

        {/* Historique Récent des Mouvements */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Activité Récente de la Campagne</span>
          </h3>

          {dernieresReceptions.length > 0 || dernieresLivraisons.length > 0 ? (
            <div className="space-y-2">
              {dernieresReceptions.slice(0, 3).map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{r.nom_entite}</p>
                    <p className="text-[11px] text-slate-400">Réception du {new Date(r.date_reception).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="font-extrabold text-emerald-400">+{r.quantite_recue} cartes</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              Aucune activité récente enregistrée pour le moment.
            </div>
          )}
        </section>
      </main>

      {/* Barre de Navigation Mobile Inférieure */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2 sm:hidden flex justify-around items-center">
        <button className="flex flex-col items-center gap-1 text-emerald-400 py-1">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Mon Espace</span>
        </button>
        <button
          onClick={() => router.push('/receptions')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1"
        >
          <ArrowDownLeft className="w-5 h-5" />
          <span className="text-[10px]">Réception</span>
        </button>
        <button
          onClick={() => router.push('/livraisons')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-[10px]">Distribution</span>
        </button>
      </nav>
    </div>
  );
}
