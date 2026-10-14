'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'orange' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
export type DesignStyle = 'glass' | 'contrast' | 'compact';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  style: DesignStyle;
}

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  accent: AccentColor;
  style: DesignStyle;
  isModalOpen: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setStyle: (style: DesignStyle) => void;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  resetTheme: () => void;
}

const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accent: 'orange',
  style: 'glass',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ACCENT_PALETTES: Record<
  AccentColor,
  {
    name: string;
    description: string;
    primaryHex: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    gradient: string;
    glowColor: string;
  }
> = {
  orange: {
    name: 'Orange MFFE (Officiel)',
    description: 'Identité nationale de Côte d’Ivoire & Ministère',
    primaryHex: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: 'rgba(249, 115, 22, 0.3)',
    badgeText: '#fb923c',
    gradient: 'from-orange-600 to-amber-600',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  emerald: {
    name: 'Vert Émeraude République',
    description: 'Espérance, validation et développement national',
    primaryHex: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.3)',
    badgeText: '#34d399',
    gradient: 'from-emerald-600 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  blue: {
    name: 'Bleu Océan Institutionnel',
    description: 'Autorité publique, rigueur et sérénité',
    primaryHex: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeBorder: 'rgba(59, 130, 246, 0.3)',
    badgeText: '#60a5fa',
    gradient: 'from-blue-600 to-cyan-600',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  purple: {
    name: 'Violet Prestige & Excellence',
    description: 'Élégance exécutive et distinction moderne',
    primaryHex: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    badgeBorder: 'rgba(139, 92, 246, 0.3)',
    badgeText: '#a78bfa',
    gradient: 'from-purple-600 to-indigo-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  amber: {
    name: 'Or & Ambre Sahélien',
    description: 'Chaleur territoriale et énergie vive',
    primaryHex: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.3)',
    badgeText: '#fbbf24',
    gradient: 'from-amber-600 to-yellow-600',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  rose: {
    name: 'Rubis & Dynamisme',
    description: 'Audace visuelle et contrastes marqués',
    primaryHex: '#f43f5e',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.3)',
    badgeText: '#fb7185',
    gradient: 'from-rose-600 to-pink-600',
    glowColor: 'rgba(244, 63, 94, 0.4)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>('dark');
  const [accent, setAccentState] = useState<AccentColor>('orange');
  const [style, setStyleState] = useState<DesignStyle>('glass');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Charger les préférences au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mffe_theme_preferences');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ThemeConfig>;
        if (parsed.mode) setModeState(parsed.mode);
        if (parsed.accent && ACCENT_PALETTES[parsed.accent]) setAccentState(parsed.accent);
        if (parsed.style) setStyleState(parsed.style);
      }
    } catch (e) {
      console.warn('Impossible de lire les préférences de thème', e);
    }
    setMounted(true);
  }, []);

  // Détection du mode système et application des classes sur <html>
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateResolved = () => {
      let active: 'dark' | 'light' = 'dark';
      if (mode === 'system') {
        active = mediaQuery.matches ? 'dark' : 'light';
      } else {
        active = mode;
      }
      setResolvedMode(active);

      const root = document.documentElement;
      // Nettoyer les classes existantes
      root.classList.remove('dark', 'light', 'theme-dark', 'theme-light');
      root.classList.add(active, `theme-${active}`);

      // Attributs pour les sélecteurs CSS
      root.setAttribute('data-theme-mode', active);
      root.setAttribute('data-theme-accent', accent);
      root.setAttribute('data-theme-style', style);

      // Couleurs CSS dynamiques
      const pal = ACCENT_PALETTES[accent];
      root.style.setProperty('--primary-accent', pal.primaryHex);
      root.style.setProperty('--primary-glow', pal.glowColor);
    };

    updateResolved();

    // Écouter les changements système si mode === 'system'
    const listener = () => {
      if (mode === 'system') updateResolved();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [mode, accent, style, mounted]);

  const savePreferences = (newConf: ThemeConfig) => {
    try {
      localStorage.setItem('mffe_theme_preferences', JSON.stringify(newConf));
    } catch (e) {
      console.warn('Erreur sauvegarde thème', e);
    }
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    savePreferences({ mode: newMode, accent, style });
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    savePreferences({ mode, accent: newAccent, style });
  };

  const setStyle = (newStyle: DesignStyle) => {
    setStyleState(newStyle);
    savePreferences({ mode, accent, style: newStyle });
  };

  const resetTheme = () => {
    setModeState(DEFAULT_THEME.mode);
    setAccentState(DEFAULT_THEME.accent);
    setStyleState(DEFAULT_THEME.style);
    savePreferences(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        accent,
        style,
        isModalOpen,
        setMode,
        setAccent,
        setStyle,
        openThemeModal: () => setIsModalOpen(true),
        closeThemeModal: () => setIsModalOpen(false),
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l’intérieur d’un ThemeProvider');
  }
  return context;
}
