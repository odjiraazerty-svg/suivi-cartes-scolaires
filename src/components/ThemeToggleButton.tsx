'use client';

import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { useTheme, ACCENT_PALETTES } from '@/context/ThemeContext';

interface ThemeToggleButtonProps {
  variant?: 'floating' | 'header' | 'button';
  className?: string;
}

export default function ThemeToggleButton({ variant = 'floating', className = '' }: ThemeToggleButtonProps) {
  const { openThemeModal, accent, resolvedMode } = useTheme();
  const pal = ACCENT_PALETTES[accent];

  if (variant === 'header') {
    return (
      <button
        onClick={openThemeModal}
        className={`p-2 rounded-xl transition flex items-center gap-1.5 active:scale-95 ${
          resolvedMode === 'dark'
            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
        } ${className}`}
        title="Personnaliser le thème et les couleurs"
      >
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-transform hover:scale-110"
          style={{ backgroundColor: pal.primaryHex, boxShadow: `0 0 6px ${pal.glowColor}` }}
        />
        <Palette className="w-4 h-4" />
      </button>
    );
  }

  // Bouton Flottant (par défaut en bas à droite au dessus de la barre de navigation mobile)
  return (
    <div className={`fixed bottom-5 right-5 z-40 ${className}`}>
      <button
        onClick={openThemeModal}
        className="group flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-200 active:scale-95 hover:scale-105"
        style={{
          backgroundColor: resolvedMode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: resolvedMode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: `0 8px 24px -4px ${pal.glowColor}, 0 2px 8px rgba(0,0,0,0.2)`,
        }}
        title="Personnaliser le thème de l'application"
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
          Thème
        </span>
      </button>
    </div>
  );
}
