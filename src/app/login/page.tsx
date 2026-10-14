'use client';

import React, { useState } from 'react';
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
  User,
  UserPlus,
  LogIn,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // État formulaire Connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // État formulaire Inscription
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'USER' | 'ADMIN'>('USER');

  // Visibilité des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      setSuccess(`Bienvenue, ${data.user.name} ! Redirection en cours...`);
      setTimeout(() => {
        router.push(data.redirectTo || (data.user.role === 'ADMIN' ? '/admin' : '/user'));
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Soumission Inscription
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regName.trim()) {
      setError('Veuillez renseigner votre nom et prénoms.');
      return;
    }

    if (!regEmail.trim()) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Les mots de passe saisis ne sont pas identiques.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du compte.");
      }

      setSuccess(`Compte créé avec succès ! Bienvenue, ${data.user.name}. Redirection...`);
      setTimeout(() => {
        router.push(data.redirectTo || (data.user.role === 'ADMIN' ? '/admin' : '/user'));
      }, 900);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
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

      {/* Carte Principale : Connexion & Inscription */}
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
              {mode === 'login'
                ? 'Portail sécurisé de gestion des flux de cartes'
                : 'Créez votre compte agent ou administrateur'}
            </p>
          </div>

          {/* Sélecteur d'Onglets Connexion / Inscription */}
          <div className="grid grid-cols-2 p-1 mb-5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Inscription</span>
            </button>
          </div>

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

          {/* 1. FORMULAIRE DE CONNEXION */}
          {mode === 'login' ? (
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
                    onChange={(e) => setEmail(e.target.value)}
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
                  <span className="text-xs text-orange-400/90 hover:underline cursor-pointer">
                    Aide connexion ?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2. FORMULAIRE D'INSCRIPTION */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Nom & Prénoms complets
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ex: KOUADIO Marc"
                    required
                    autoComplete="name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Adresse Email Professionnelle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nom.prenom@mffe.gouv.ci"
                    required
                    autoComplete="email"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Profil d'accès souhaité
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('USER')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      regRole === 'USER'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Agent / Terrain</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Saisies & distribution</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('ADMIN')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition ${
                      regRole === 'ADMIN'
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 ring-1 ring-orange-500/40'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                      <span>Administrateur</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Pilotage DRH</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 caractères"
                      required
                      minLength={6}
                      className="w-full pl-8 pr-8 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Confirmer
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirmer"
                      required
                      minLength={6}
                      className="w-full pl-8 pr-8 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton de Soumission Inscription */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Création du compte...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Créer mon compte</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Lien de bascule sous le formulaire */}
          <div className="text-center pt-4">
            {mode === 'login' ? (
              <p className="text-xs text-slate-400">
                Vous n'avez pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 transition"
                >
                  Créer un compte
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Vous possédez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 transition"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
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
