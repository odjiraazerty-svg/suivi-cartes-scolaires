'use client';

import React from 'react';
import { Palette, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme, ACCENT_PALETTES } from '@/context/ThemeContext';

interface ThemeToggleButtonProps {
  variant?: 'floating' | 'header' | 'button';
  className?: string;
}

export default function ThemeToggleButton({ variant = 'floating', className = '' }: ThemeToggleButtonProps) {
  const { openThemeModal, toggleMode, accent, resolvedMode } = useTheme();
  const pal = ACCENT_PALETTES[accent] || ACCENT_PALETTES.orange;

  if (variant === 'header') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {/* Bascule Rapide 1-Clic : Fond Blanc (Jour) / Fond Sombre (Nuit) */}
        <button
          type="button"
          onClick={toggleMode}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm border ${
            resolvedMode === 'dark'
              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
          }`}
          title={
            resolvedMode === 'dark'
              ? 'Basculer immédiatement sur le Fond Blanc Épuré (Mode Jour)'
              : 'Basculer immédiatement sur le Fond Sombre (Mode Nuit)'
          }
        >
          {resolvedMode === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Fond Blanc</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Fond Sombre</span>
            </>
          )}
        </button>

        {/* Bouton Nuancier & Thèmes Complets */}
        <button
          type="button"
          onClick={openThemeModal}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border ${
            resolvedMode === 'dark'
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-sm'
          }`}
          title="Ouvrir le configurateur de thèmes et d'ambiances visuelles"
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: pal.primaryHex, boxShadow: `0 0 6px ${pal.glowColor}` }}
          />
          <Palette className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold hidden xl:inline">Thèmes</span>
        </button>
      </div>
    );
  }

  // Bouton Flottant (en bas à droite de l'écran) avec accès direct Fond Blanc / Fond Sombre & Thème
  return (
    <div className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 ${className}`}>
      {/* Bouton rapide d'inversion Blanc / Sombre */}
      <button
        type="button"
        onClick={toggleMode}
        className="p-2.5 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: resolvedMode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: resolvedMode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: `0 4px 16px rgba(0,0,0,0.15)`,
        }}
        title={
          resolvedMode === 'dark'
            ? 'Basculer en 1 clic sur le Fond Blanc Épuré'
            : 'Basculer en 1 clic sur le Fond Sombre'
        }
      >
        {resolvedMode === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-180 duration-200" />
        )}
      </button>

      {/* Bouton Modal Thèmes */}
      <button
        type="button"
        onClick={openThemeModal}
        className="group flex items-center gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: resolvedMode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: resolvedMode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: `0 8px 24px -4px ${pal.glowColor}, 0 2px 8px rgba(0,0,0,0.15)`,
        }}
        title="Personnaliser les thèmes et couleurs de l'application"
      >
        <div
          className="w-4 h-4 rounded-full shrink-0 shadow-sm flex items-center justify-center transition-transform group-hover:rotate-45"
          style={{ backgroundColor: pal.primaryHex }}
        >
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <span
          className={`text-xs font-bold hidden sm:inline transition-colors ${
            resolvedMode === 'dark' ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-black'
          }`}
        >
          {resolvedMode === 'dark' ? 'Thèmes' : 'Design'}
        </span>
      </button>
    </div>
  );
}
