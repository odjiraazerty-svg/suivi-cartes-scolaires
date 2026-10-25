'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'orange' | 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose' | 'slate';
export type DesignStyle = 'glass' | 'contrast' | 'compact';

export type PresetId =
  | 'ivoire-officiel'
  | 'saphir-executif'
  | 'emeraude-prestige'
  | 'amethyste-luxe'
  | 'ambre-sahelien'
  | 'titane-futur'
  | 'lumiere-ivoire'
  | 'executive-white'
  | 'azur-boreale'
  | 'noir-oled'
  | 'custom';

export interface ThemePreset {
  id: PresetId;
  name: string;
  tagline: string;
  category: 'sombre' | 'clair' | 'special';
  badge: string;
  mode: 'dark' | 'light';
  accent: AccentColor;
  style: DesignStyle;
  colors: {
    bgPage: string;
    bgCard: string;
    border: string;
    primary: string;
    secondary: string;
    text: string;
    glow: string;
  };
  previewNuances: [string, string, string, string]; // [Fond, Carte, Accent 1, Accent 2]
}

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  style: DesignStyle;
  preset: PresetId;
}

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  accent: AccentColor;
  style: DesignStyle;
  preset: PresetId;
  isModalOpen: boolean;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setStyle: (style: DesignStyle) => void;
  applyPreset: (presetId: PresetId) => void;
  toggleMode: () => void;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  resetTheme: () => void;
}

// 9 COMBINAISONS THÉMATIQUES HARMONIEUSES & PRESTIGIEUSES
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ivoire-officiel',
    name: 'Ivoire Républicain',
    tagline: 'Orange MFFE & Or National sur Nuit Ébène profonde',
    category: 'sombre',
    badge: 'Officiel MFFE',
    mode: 'dark',
    accent: 'orange',
    style: 'glass',
    colors: {
      bgPage: '#070b14',
      bgCard: '#0f172a',
      border: '#1e293b',
      primary: '#f97316',
      secondary: '#f59e0b',
      text: '#fb923c',
      glow: 'rgba(249, 115, 22, 0.4)',
    },
    previewNuances: ['#070b14', '#0f172a', '#f97316', '#f59e0b'],
  },
  {
    id: 'saphir-executif',
    name: 'Saphir Exécutif',
    tagline: 'Bleu Roi & Cyan Boréal sur Nuit Océane Minérale',
    category: 'sombre',
    badge: 'Haute Administration',
    mode: 'dark',
    accent: 'blue',
    style: 'glass',
    colors: {
      bgPage: '#060d1f',
      bgCard: '#0c1a38',
      border: '#172d5c',
      primary: '#2563eb',
      secondary: '#06b6d4',
      text: '#60a5fa',
      glow: 'rgba(37, 99, 235, 0.4)',
    },
    previewNuances: ['#060d1f', '#0c1a38', '#2563eb', '#06b6d4'],
  },
  {
    id: 'emeraude-prestige',
    name: 'Émeraude & Espérance',
    tagline: 'Vert Jade & Menthe Givrée sur Canopée Nocturne',
    category: 'sombre',
    badge: 'Espérance & Progrès',
    mode: 'dark',
    accent: 'emerald',
    style: 'glass',
    colors: {
      bgPage: '#03140e',
      bgCard: '#08241b',
      border: '#0f4031',
      primary: '#059669',
      secondary: '#10b981',
      text: '#34d399',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    previewNuances: ['#03140e', '#08241b', '#059669', '#10b981'],
  },
  {
    id: 'amethyste-luxe',
    name: 'Améthyste & Nuit Stellaire',
    tagline: 'Violet Impérial & Rose Quartz sur Velours Sombre',
    category: 'sombre',
    badge: 'Distinction VIP',
    mode: 'dark',
    accent: 'purple',
    style: 'glass',
    colors: {
      bgPage: '#0d0818',
      bgCard: '#18102b',
      border: '#2b1d4c',
      primary: '#7c3aed',
      secondary: '#ec4899',
      text: '#c084fc',
      glow: 'rgba(124, 58, 237, 0.4)',
    },
    previewNuances: ['#0d0818', '#18102b', '#7c3aed', '#ec4899'],
  },
  {
    id: 'ambre-sahelien',
    name: 'Terre d’Ivoire & Cacao',
    tagline: 'Ambre Doré & Cuivre Flamboyant sur Brun Carbone',
    category: 'sombre',
    badge: 'Chaleur Territoriale',
    mode: 'dark',
    accent: 'amber',
    style: 'glass',
    colors: {
      bgPage: '#100b08',
      bgCard: '#1e140d',
      border: '#382416',
      primary: '#d97706',
      secondary: '#ea580c',
      text: '#fbbf24',
      glow: 'rgba(217, 119, 6, 0.4)',
    },
    previewNuances: ['#100b08', '#1e140d', '#d97706', '#ea580c'],
  },
  {
    id: 'titane-futur',
    name: 'Titane & Cyberspace',
    tagline: 'Anthracite Graphite & Cyan Électrique Haute Précision',
    category: 'sombre',
    badge: 'High-Tech & Data',
    mode: 'dark',
    accent: 'cyan',
    style: 'contrast',
    colors: {
      bgPage: '#0a0e16',
      bgCard: '#111824',
      border: '#1e293b',
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      text: '#38bdf8',
      glow: 'rgba(14, 165, 233, 0.4)',
    },
    previewNuances: ['#0a0e16', '#111824', '#0ea5e9', '#38bdf8'],
  },
  {
    id: 'lumiere-ivoire',
    name: 'Pure Clarté Ivoire',
    tagline: 'Blanc Albâtre Doux & Contrastes Orange & Bleu Marine',
    category: 'clair',
    badge: 'Clair Institutionnel',
    mode: 'light',
    accent: 'orange',
    style: 'glass',
    colors: {
      bgPage: '#f8fafc',
      bgCard: '#ffffff',
      border: '#e2e8f0',
      primary: '#ea580c',
      secondary: '#f59e0b',
      text: '#c2410c',
      glow: 'rgba(234, 88, 12, 0.3)',
    },
    previewNuances: ['#f8fafc', '#ffffff', '#ea580c', '#f59e0b'],
  },
  {
    id: 'executive-white',
    name: 'Executive White & Titane',
    tagline: '100% Blanc Pur Minimaliste, Bordures Gris Perle & Bleu Royal',
    category: 'clair',
    badge: '100% Blanc Pur',
    mode: 'light',
    accent: 'blue',
    style: 'contrast',
    colors: {
      bgPage: '#ffffff',
      bgCard: '#f8fafc',
      border: '#e2e8f0',
      primary: '#1d4ed8',
      secondary: '#0284c7',
      text: '#1e40af',
      glow: 'rgba(29, 78, 216, 0.25)',
    },
    previewNuances: ['#ffffff', '#f8fafc', '#1d4ed8', '#0284c7'],
  },
  {
    id: 'azur-boreale',
    name: 'Lagon Boréal Givré',
    tagline: 'Blanc Céleste Givré & Dégradé Saphir et Menthe d’Eau',
    category: 'clair',
    badge: 'Clair Fraîcheur',
    mode: 'light',
    accent: 'blue',
    style: 'contrast',
    colors: {
      bgPage: '#f0f7ff',
      bgCard: '#ffffff',
      border: '#dbeafe',
      primary: '#0284c7',
      secondary: '#0d9488',
      text: '#0369a1',
      glow: 'rgba(2, 132, 199, 0.3)',
    },
    previewNuances: ['#f0f7ff', '#ffffff', '#0284c7', '#0d9488'],
  },
  {
    id: 'noir-oled',
    name: 'OLED Noir Absolu',
    tagline: 'Noir Pur 100% sans reflet & Liserés Or & Orange Néon',
    category: 'special',
    badge: 'Écrans OLED',
    mode: 'dark',
    accent: 'amber',
    style: 'contrast',
    colors: {
      bgPage: '#000000',
      bgCard: '#0a0a0a',
      border: '#222222',
      primary: '#f59e0b',
      secondary: '#f97316',
      text: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.45)',
    },
    previewNuances: ['#000000', '#0a0a0a', '#f59e0b', '#f97316'],
  },
];

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
  blue: {
    name: 'Bleu Saphir Exécutif',
    description: 'Autorité publique, rigueur et souveraineté',
    primaryHex: '#2563eb',
    badgeBg: 'rgba(37, 99, 235, 0.15)',
    badgeBorder: 'rgba(37, 99, 235, 0.3)',
    badgeText: '#60a5fa',
    gradient: 'from-blue-600 to-cyan-600',
    glowColor: 'rgba(37, 99, 235, 0.4)',
  },
  emerald: {
    name: 'Vert Émeraude Espérance',
    description: 'Espérance républicaine et vitalité territoriale',
    primaryHex: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.15)',
    badgeBorder: 'rgba(5, 150, 105, 0.3)',
    badgeText: '#34d399',
    gradient: 'from-emerald-600 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  cyan: {
    name: 'Cyan Boréal High-Tech',
    description: 'Modernité numérique et clarté des données',
    primaryHex: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.15)',
    badgeBorder: 'rgba(14, 165, 233, 0.3)',
    badgeText: '#38bdf8',
    gradient: 'from-cyan-600 to-blue-600',
    glowColor: 'rgba(14, 165, 233, 0.4)',
  },
  purple: {
    name: 'Violet Améthyste Prestige',
    description: 'Élégance exécutive et distinction moderne',
    primaryHex: '#7c3aed',
    badgeBg: 'rgba(124, 58, 237, 0.15)',
    badgeBorder: 'rgba(124, 58, 237, 0.3)',
    badgeText: '#a78bfa',
    gradient: 'from-purple-600 to-pink-600',
    glowColor: 'rgba(124, 58, 237, 0.4)',
  },
  amber: {
    name: 'Or & Ambre Sahélien',
    description: 'Chaleur territoriale, miel et énergie vive',
    primaryHex: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.15)',
    badgeBorder: 'rgba(217, 119, 6, 0.3)',
    badgeText: '#fbbf24',
    gradient: 'from-amber-600 to-orange-600',
    glowColor: 'rgba(217, 119, 6, 0.4)',
  },
  rose: {
    name: 'Rubis & Dynamisme',
    description: 'Audace visuelle et contrastes marqués',
    primaryHex: '#e11d48',
    badgeBg: 'rgba(225, 29, 72, 0.15)',
    badgeBorder: 'rgba(225, 29, 72, 0.3)',
    badgeText: '#fb7185',
    gradient: 'from-rose-600 to-pink-600',
    glowColor: 'rgba(225, 29, 72, 0.4)',
  },
  slate: {
    name: 'Titane & Argent Neutre',
    description: 'Sobriété absolue et rendu monochrome pur',
    primaryHex: '#64748b',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    badgeBorder: 'rgba(100, 116, 139, 0.3)',
    badgeText: '#94a3b8',
    gradient: 'from-slate-600 to-zinc-500',
    glowColor: 'rgba(100, 116, 139, 0.3)',
  },
};

const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accent: 'orange',
  style: 'glass',
  preset: 'ivoire-officiel',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedMode, setResolvedMode] = useState<'dark' | 'light'>('dark');
  const [accent, setAccentState] = useState<AccentColor>('orange');
  const [style, setStyleState] = useState<DesignStyle>('glass');
  const [preset, setPresetState] = useState<PresetId>('ivoire-officiel');
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
        if (parsed.preset) setPresetState(parsed.preset);
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
      root.setAttribute('data-theme-preset', preset);

      // Couleurs CSS dynamiques
      const pal = ACCENT_PALETTES[accent] || ACCENT_PALETTES.orange;
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
  }, [mode, accent, style, preset, mounted]);

  const savePreferences = (newConf: ThemeConfig) => {
    try {
      localStorage.setItem('mffe_theme_preferences', JSON.stringify(newConf));
    } catch (e) {
      console.warn('Erreur sauvegarde thème', e);
    }
  };

  const applyPreset = (presetId: PresetId) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    setPresetState(found.id);
    setModeState(found.mode);
    setAccentState(found.accent);
    setStyleState(found.style);

    savePreferences({
      mode: found.mode,
      accent: found.accent,
      style: found.style,
      preset: found.id,
    });
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    setPresetState('custom');
    savePreferences({ mode: newMode, accent, style, preset: 'custom' });
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    setPresetState('custom');
    savePreferences({ mode, accent: newAccent, style, preset: 'custom' });
  };

  const setStyle = (newStyle: DesignStyle) => {
    setStyleState(newStyle);
    setPresetState('custom');
    savePreferences({ mode, accent, style: newStyle, preset: 'custom' });
  };

  const toggleMode = () => {
    if (resolvedMode === 'dark') {
      // Basculer sur le design Fond Blanc officiel
      applyPreset('lumiere-ivoire');
    } else {
      // Revenir sur le design Fond Sombre officiel
      applyPreset('ivoire-officiel');
    }
  };

  const resetTheme = () => {
    setModeState(DEFAULT_THEME.mode);
    setAccentState(DEFAULT_THEME.accent);
    setStyleState(DEFAULT_THEME.style);
    setPresetState(DEFAULT_THEME.preset);
    savePreferences(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        accent,
        style,
        preset,
        isModalOpen,
        setMode,
        setAccent,
        setStyle,
        applyPreset,
        toggleMode,
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
