'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, AlertTriangle, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

// 10 minutes d'inactivité au total (600 secondes)
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
// Déclenchement de l'alerte à la 8e minute (reste 2 minutes / 120 secondes)
const WARNING_THRESHOLD_MS = 8 * 60 * 1000;
// Clé de stockage partagée pour synchroniser tous les onglets ouverts
const STORAGE_KEY = 'mffe_last_active_timestamp';

export default function SessionIdleTracker() {
  const router = useRouter();
  const pathname = usePathname();

  // Ne pas surveiller si on est déjà sur la page de connexion
  const isLoginPage = pathname === '/login' || pathname === '/login/';

  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Met à jour le timestamp de dernière activité
  const recordActivity = useCallback(() => {
    // Si l'alerte est déjà affichée, un simple mouvement de souris fortuit ne doit pas
    // fermer la modale : l'utilisateur doit obligatoirement cliquer sur "Rester connecté".
    if (showWarning) return;

    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
  }, [showWarning]);

  // Déconnexion automatique effective
  const performLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowWarning(false);

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('mffe_selected_annee_scolaire');
      sessionStorage.removeItem('mffe_selected_annee_scolaire');
    } catch (e) {}

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}

    router.push('/login?reason=inactivity');
    setIsLoggingOut(false);
  }, [isLoggingOut, router]);

  // Action explicite de l'utilisateur pour prolonger sa session
  const handleStayConnected = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
    setShowWarning(false);
    setSecondsRemaining(120);

    // Rafraîchir la session côté serveur en arrière-plan
    fetch('/api/auth/me').catch(() => {});
  };

  useEffect(() => {
    if (isLoginPage) {
      setShowWarning(false);
      return;
    }

    // Initialiser le timestamp s'il n'existe pas encore
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch (e) {}

    // Événements surveillant l'activité humaine
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle à 2 secondes pour éviter d'écrire continuellement dans le localStorage
    let lastThrottled = 0;
    const onUserAction = () => {
      const now = Date.now();
      if (now - lastThrottled > 2000) {
        lastThrottled = now;
        recordActivity();
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, onUserAction, { passive: true });
    });

    // Synchronisation multi-onglets (si l'utilisateur est actif sur un autre onglet du site)
    const onStorageUpdate = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const lastActive = parseInt(e.newValue, 10);
        const elapsed = Date.now() - lastActive;
        if (elapsed < WARNING_THRESHOLD_MS) {
          setShowWarning(false);
          setSecondsRemaining(120);
        }
      }
    };
    window.addEventListener('storage', onStorageUpdate);

    // Vérification chaque seconde
    timerIntervalRef.current = setInterval(() => {
      let lastActive = Date.now();
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          lastActive = parseInt(stored, 10);
        }
      } catch (e) {}

      const elapsed = Date.now() - lastActive;

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        // 10 minutes d'inactivité atteintes -> Déconnexion
        performLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Dès la 8e minute -> Affichage du compte à rebours d'alerte (120 secondes restantes)
        setShowWarning(true);
        const remainingMs = INACTIVITY_LIMIT_MS - elapsed;
        setSecondsRemaining(Math.max(0, Math.ceil(remainingMs / 1000)));
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, onUserAction);
      });
      window.removeEventListener('storage', onStorageUpdate);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isLoginPage, recordActivity, performLogout, showWarning]);

  // Si on est sur le login ou pas en état d'alerte, on ne rend rien
  if (isLoginPage || !showWarning) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  // Pourcentage restant sur les 120 secondes (2 minutes)
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 120) * 100));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-950/50 p-6 sm:p-7 text-center overflow-hidden">
        {/* Lueur d'arrière-plan */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge & Icône animée */}
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20 animate-bounce">
            <Clock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sécurité MFFE • Inactivité Détectée</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Votre session va expirer
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Aucune activité n'a été détectée depuis <strong className="text-amber-400">8 minutes</strong>.
            Par mesure de sécurité pour protéger les données du Ministère, vous serez automatiquement déconnecté dans :
          </p>

          {/* Compte à rebours géant */}
          <div className="my-5 py-3 px-6 rounded-2xl bg-slate-950/80 border border-amber-500/30 w-full flex flex-col items-center">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-amber-400">
              {timeFormatted}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
              minute{minutes > 0 ? 's' : ''} et seconde{seconds > 1 ? 's' : ''} restantes
            </span>

            {/* Barre de progression du temps restant */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  secondsRemaining < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Actions : Rester connecté ou Se déconnecter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
            <button
              type="button"
              onClick={handleStayConnected}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Rester connecté</span>
            </button>

            <button
              type="button"
              onClick={performLogout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

