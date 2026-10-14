'use client';

import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  RotateCcw,
  Sparkles,
  X,
  Palette,
  Sliders,
  Eye,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useTheme, ACCENT_PALETTES, ThemeMode, AccentColor, DesignStyle } from '@/context/ThemeContext';

export default function ThemeSelectorModal() {
  const {
    mode,
    resolvedMode,
    accent,
    style,
    isModalOpen,
    setMode,
    setAccent,
    setStyle,
    closeThemeModal,
    resetTheme,
  } = useTheme();

  if (!isModalOpen) return null;

  const activePalette = ACCENT_PALETTES[accent];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200 ${
          resolvedMode === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* En-tête du Modal */}
        <div
          className={`px-6 py-4.5 border-b flex items-center justify-between ${
            resolvedMode === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-colors"
              style={{ backgroundColor: activePalette.badgeBg, border: `1px solid ${activePalette.badgeBorder}` }}
            >
              <Palette className="w-4 h-4" style={{ color: activePalette.primaryHex }} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Personnalisation de l'Application</h3>
              <p className="text-xs text-slate-400">Adaptez les couleurs, contrastes et styles à vos préférences</p>
            </div>
          </div>

          <button
            onClick={closeThemeModal}
            className={`p-1.5 rounded-xl transition ${
              resolvedMode === 'dark'
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des réglages défilant */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* 1. Mode d'affichage */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              1. Mode d'Affichage & Luminosité
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'dark' as ThemeMode, label: 'Sombre', icon: Moon, desc: 'Repose les yeux' },
                { id: 'light' as ThemeMode, label: 'Clair', icon: Sun, desc: 'Bureaux éclairés' },
                { id: 'system' as ThemeMode, label: 'Système', icon: Laptop, desc: 'Auto OS' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col items-start justify-between gap-1.5 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                        : resolvedMode === 'dark'
                        ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: activePalette.primaryHex,
                            backgroundColor: activePalette.badgeBg,
                          }
                        : undefined
                    }
                  >
                    <div className="w-full flex items-center justify-between">
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isSelected ? activePalette.primaryHex : undefined }}
                      />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5" style={{ color: activePalette.primaryHex }} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Nuancier des Couleurs d'Accent */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Couleur Thématique Principale
              </label>
              <span className="text-[11px] font-semibold" style={{ color: activePalette.primaryHex }}>
                {activePalette.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((colKey) => {
                const pal = ACCENT_PALETTES[colKey];
                const isSelected = accent === colKey;
                return (
                  <button
                    key={colKey}
                    onClick={() => setAccent(colKey)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      isSelected
                        ? 'shadow-md ring-1 ring-offset-1'
                        : resolvedMode === 'dark'
                        ? 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    style={{
                      borderColor: isSelected ? pal.primaryHex : undefined,
                      boxShadow: isSelected ? `0 0 0 1px ${pal.primaryHex}` : undefined,
                      backgroundColor: isSelected ? pal.badgeBg : undefined,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: pal.primaryHex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{pal.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-tight">{pal.name.split(' ').slice(1).join(' ')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Style de Design & Ambiance */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              3. Ambiance Visuelle & Finitions
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'glass' as DesignStyle,
                  label: 'Glassmorphism',
                  desc: 'Reflets & flous dépolis',
                  icon: Sparkles,
                },
                {
                  id: 'contrast' as DesignStyle,
                  label: 'Haute Clarté',
                  desc: 'Contrastes francs',
                  icon: Layers,
                },
                {
                  id: 'compact' as DesignStyle,
                  label: 'Compact',
                  desc: 'Densité optimale',
                  icon: Sliders,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = style === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStyle(item.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                        : resolvedMode === 'dark'
                        ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: activePalette.primaryHex,
                            backgroundColor: activePalette.badgeBg,
                          }
                        : undefined
                    }
                  >
                    <div className="w-full flex items-center justify-between">
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isSelected ? activePalette.primaryHex : undefined }}
                      />
                      {isSelected && (
                        <Check className="w-3.5 h-3.5" style={{ color: activePalette.primaryHex }} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Aperçu en direct */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Aperçu en Direct</span>
            </label>
            <div
              className={`p-4 rounded-2xl border transition-all ${
                resolvedMode === 'dark'
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: activePalette.badgeBg,
                    border: `1px solid ${activePalette.badgeBorder}`,
                    color: activePalette.badgeText,
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MFFE Côte d'Ivoire
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: activePalette.primaryHex }}>
                  +1 500 cartes
                </span>
              </div>

              <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: '68%',
                    backgroundColor: activePalette.primaryHex,
                    boxShadow: `0 0 10px ${activePalette.glowColor}`,
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md transition"
                  style={{
                    backgroundColor: activePalette.primaryHex,
                    boxShadow: `0 2px 10px ${activePalette.glowColor}`,
                  }}
                >
                  Bouton Principal
                </button>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    resolvedMode === 'dark'
                      ? 'border-slate-700 text-slate-300'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Secondaire
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page du Modal */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${
            resolvedMode === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={resetTheme}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              resolvedMode === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Revenir au thème officiel par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            onClick={closeThemeModal}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95"
            style={{
              backgroundColor: activePalette.primaryHex,
              boxShadow: `0 4px 14px ${activePalette.glowColor}`,
            }}
          >
            Appliquer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
