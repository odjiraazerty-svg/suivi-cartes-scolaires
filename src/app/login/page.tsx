'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LogIn,
  Info,
  Briefcase,
  Clock,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Détecter si on est en développement local (localhost / 127.0.0.1)
  const [isLocalDev, setIsLocalDev] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  useEffect(() => {
    // Vérifier si la redirection provient d'une expiration d'inactivité
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'inactivity') {
        setInactivityNotice(true);
      }
    }

    // Réinitialiser le filtre sur l'année scolaire en cours par défaut après déconnexion ou retour sur login
    try {
      localStorage.removeItem('mffe_selected_annee_scolaire');
      sessionStorage.removeItem('mffe_selected_annee_scolaire');
    } catch (e) {}

    if (
      process.env.NODE_ENV === 'development' ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.')))
    ) {
      setIsLocalDev(true);
    }
  }, []);

  const setPresetUser = (presetEmail: string, presetPass: string, presetKey: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setSelectedPreset(presetKey);
    setError(null);
  };

  // État formulaire Connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Soumission Connexion
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identifiants incorrects');
      }

      try {
        localStorage.removeItem('mffe_selected_annee_scolaire');
        sessionStorage.removeItem('mffe_selected_annee_scolaire');
      } catch (e) {}

      setSuccess(`Bienvenue, ${data.user.name} ! Redirection en cours...`);
      setTimeout(() => {
        router.push(
          data.redirectTo ||
            (data.user.role === 'ADMIN'
              ? '/admin'
              : data.user.role === 'DRH' || data.user.role === 'ADMIN_DRH'
              ? '/drh'
              : '/user')
        );
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/20 via-[#0b1120] to-[#070b14] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Haut de page : Bannière Institutionnelle avec Logo */}
      <header className="w-full max-w-md mx-auto pt-2 pb-4 text-center flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-orange-500/20 border-2 border-orange-500/30 mb-3 flex items-center justify-center">
          <img
            src="/logo-mffe.png"
            alt="Logo officiel MFFE"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
          Rép. de Côte d'Ivoire
        </div>
        <h2 className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Ministère de la Femme, de la Famille et de l'Enfant
        </h2>
      </header>

      {/* Carte Principale : Authentification */}
      <main className="w-full max-w-md mx-auto my-auto animate-fade-in">
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-orange-950/20 p-5 sm:p-8">
          {/* Titre et Badge */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Module DRH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Suivi Cartes Scolaires
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Portail sécurisé d'authentification et de pilotage
            </p>
          </div>

          {/* Bandeau d'information sur la création de compte */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-white">Accès Réglementé :</span> La création et l'attribution des comptes sont réservées exclusivement à l'Administrateur du système.
            </div>
          </div>

          {/* Alerte d'inactivité de session (10 minutes) */}
          {inactivityNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in shadow-lg shadow-amber-500/10">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="leading-snug">
                <span className="font-bold text-amber-300">Session expirée :</span> Votre session a été automatiquement fermée suite à 10 minutes d'inactivité pour garantir la sécurité de vos données. Veuillez vous reconnecter.
              </div>
            </div>
          )}

          {/* Alertes d'erreur ou succès */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          {/* FORMULAIRE DE CONNEXION */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="nom@mffe.gouv.ci"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Mot de passe
                </label>
                <span className="text-xs text-orange-400/90 font-medium">
                  Connexion sécurisée
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Bouton de Soumission Connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Note d'assistance bas de carte */}
          <div className="mt-5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Besoin d'un accès ? Rapprochez-vous de la Direction RH / Administrateur.</span>
          </div>

          {/* Raccourcis de Test Rapide — UNIQUEMENT VISIBLES EN DÉVELOPPEMENT LOCAL */}
          {isLocalDev && (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comptes de test (Local) :</span>
                </p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                  Environnement Local
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Administrateur Principal */}
                <button
                  type="button"
                  onClick={() => setPresetUser('admin@mffe.gouv.ci', 'Password123!', 'admin_mffe')}
                  className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col gap-0.5 active:scale-95 cursor-pointer group ${
                    selectedPreset === 'admin_mffe'
                      ? 'bg-orange-500/15 border-orange-500 text-white shadow-md shadow-orange-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-orange-400 flex items-center gap-1 group-hover:text-orange-300">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin MFFE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/admin</span>
                  </div>
                  <span className="text-slate-400 text-[11px] truncate">admin@mffe.gouv.ci</span>
                </button>

                {/* 2. Direction RH */}
                <button
                  type="button"
                  onClick={() => setPresetUser('drh@mffe.gouv.ci', 'Password123!', 'drh')}
                  className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col gap-0.5 active:scale-95 cursor-pointer group ${
                    selectedPreset === 'drh'
                      ? 'bg-purple-500/15 border-purple-500 text-white shadow-md shadow-purple-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-400 flex items-center gap-1 group-hover:text-purple-300">
                      <Briefcase className="w-3.5 h-3.5" /> Direction DRH
                    </span>
                    <span className="text-[10px] text-purple-400/80 font-mono font-medium">/drh</span>
                  </div>
                  <span className="text-slate-400 text-[11px] truncate">drh@mffe.gouv.ci</span>
                </button>

                {/* 3. Agent Opérationnel / Terrain */}
                <button
                  type="button"
                  onClick={() => setPresetUser('agent.drabj@mffe.gouv.ci', 'Password123!', 'agent_terrain')}
                  className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col gap-0.5 active:scale-95 cursor-pointer group ${
                    selectedPreset === 'agent_terrain'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1 group-hover:text-emerald-300">
                      <Building2 className="w-3.5 h-3.5" /> Agent Terrain
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/user</span>
                  </div>
                  <span className="text-slate-400 text-[11px] truncate">agent.drabj@mffe...</span>
                </button>

                {/* 4. Admin Odjira */}
                <button
                  type="button"
                  onClick={() => setPresetUser('odjira@gmail.com', 'Password123!', 'admin_odjira')}
                  className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col gap-0.5 active:scale-95 cursor-pointer group ${
                    selectedPreset === 'admin_odjira'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400 flex items-center gap-1 group-hover:text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin ODJIRA
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/admin</span>
                  </div>
                  <span className="text-slate-400 text-[11px] truncate">odjira@gmail.com</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pied de page */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-400">Direction des Ressources Humaines - MFFE</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Système de gestion et traçabilité des cartes scolaires</p>
      </footer>
    </div>
  );
}
