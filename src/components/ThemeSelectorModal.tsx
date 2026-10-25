'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Boxes,
  Zap,
} from 'lucide-react';
import {
  useTheme,
  THEME_PRESETS,
  ACCENT_PALETTES,
  ThemeMode,
  AccentColor,
  DesignStyle,
  PresetId,
} from '@/context/ThemeContext';

export default function ThemeSelectorModal() {
  const {
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
    closeThemeModal,
    resetTheme,
  } = useTheme();

  const [activeFilter, setActiveFilter] = useState<'all' | 'sombre' | 'clair' | 'special'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isModalOpen) return null;

  const activePalette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.orange;
  const currentPreset = THEME_PRESETS.find((p) => p.id === preset);

  const filteredPresets = THEME_PRESETS.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.category === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-200 ${
          resolvedMode === 'dark'
            ? 'bg-slate-900 border-slate-700/80 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* En-tête du Modal */}
        <div
          className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            resolvedMode === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              style={{
                backgroundColor: activePalette.badgeBg,
                border: `1px solid ${activePalette.badgeBorder}`,
                boxShadow: `0 4px 12px ${activePalette.glowColor}`,
              }}
            >
              <Palette className="w-5 h-5" style={{ color: activePalette.primaryHex }} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Thèmes & Ambiance Visuelle</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:inline"
                  style={{
                    backgroundColor: activePalette.badgeBg,
                    border: `1px solid ${activePalette.badgeBorder}`,
                    color: activePalette.badgeText,
                  }}
                >
                  {currentPreset?.name || activePalette.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Combinaisons de couleurs soignées, contrastes et finitions d'affichage
              </p>
            </div>
          </div>

          <button
            onClick={closeThemeModal}
            className={`p-2 rounded-xl transition cursor-pointer active:scale-95 ${
              resolvedMode === 'dark'
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps des réglages avec défilement */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* SÉLECTEUR RAPIDE : FOND BLANC ÉPURÉ (JOUR) VS FOND SOMBRE (NUIT) */}
          <div className="p-4 rounded-2xl border bg-gradient-to-r from-slate-500/5 to-slate-500/10 border-slate-700/40">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Choix du Fond d'Écran : Blanc ou Sombre</span>
              </label>
              <span className="text-[11px] font-bold" style={{ color: activePalette.primaryHex }}>
                {resolvedMode === 'light' ? '☀️ Mode Fond Blanc Actif' : '🌙 Mode Fond Sombre Actif'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: FOND BLANC ÉPURÉ */}
              <div
                onClick={() => {
                  setMode('light');
                  if (preset !== 'lumiere-ivoire' && preset !== 'executive-white' && preset !== 'azur-boreale') {
                    applyPreset('lumiere-ivoire');
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative ${
                  resolvedMode === 'light'
                    ? 'bg-white border-orange-500 shadow-lg ring-2 ring-orange-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
                style={
                  resolvedMode === 'light'
                    ? {
                        borderColor: activePalette.primaryHex,
                        boxShadow: `0 8px 20px -4px ${activePalette.glowColor}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center border border-orange-500/30 shadow-sm shrink-0">
                    <Sun className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>Fond Blanc Épuré (Jour)</span>
                      <span className="px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 text-[9px] font-bold">
                        Recommandé
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      Bureaux éclairés, forte luminosité et grand confort de lecture
                    </div>
                  </div>
                </div>
                {resolvedMode === 'light' && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow"
                    style={{ backgroundColor: activePalette.primaryHex }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Option 2: FOND SOMBRE */}
              <div
                onClick={() => {
                  setMode('dark');
                  if (preset === 'lumiere-ivoire' || preset === 'executive-white' || preset === 'azur-boreale') {
                    applyPreset('ivoire-officiel');
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative ${
                  resolvedMode === 'dark'
                    ? 'bg-slate-950 border-orange-500 shadow-lg ring-2 ring-orange-500/30'
                    : 'bg-slate-100 border-slate-200 hover:border-slate-300'
                }`}
                style={
                  resolvedMode === 'dark'
                    ? {
                        borderColor: activePalette.primaryHex,
                        boxShadow: `0 8px 20px -4px ${activePalette.glowColor}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-sm shrink-0">
                    <Moon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Fond Sombre & Nuit</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-bold">
                        Repose les yeux
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      Contraste feutré, travail prolongé et environnements sombres
                    </div>
                  </div>
                </div>
                {resolvedMode === 'dark' && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 shadow"
                    style={{ backgroundColor: activePalette.primaryHex }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 1. SECTION COMBINAISONS THÉMATIQUES RECOMMANDÉES */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Combinaisons Thématiques Clés en Main</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Palettes complètes harmonisées (fonds, cartes, dégradés et contrastes)
                </p>
              </div>

              {/* Filtres par ambiance */}
              <div
                className={`inline-flex items-center p-0.5 rounded-xl border text-[11px] font-semibold self-start sm:self-auto ${
                  resolvedMode === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                {[
                  { id: 'all' as const, label: 'Tous (10)' },
                  { id: 'clair' as const, label: '☀️ Fond Blanc (3)' },
                  { id: 'sombre' as const, label: '🌙 Sombre (6)' },
                  { id: 'special' as const, label: 'OLED (1)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      activeFilter === f.id
                        ? 'bg-gradient-to-r text-white font-bold shadow-sm'
                        : resolvedMode === 'dark'
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={
                      activeFilter === f.id
                        ? {
                            backgroundColor: activePalette.primaryHex,
                          }
                        : undefined
                    }
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des thèmes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPresets.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'shadow-xl ring-2 scale-[1.01]'
                        : resolvedMode === 'dark'
                        ? 'bg-slate-950/40 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/70'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                    }`}
                    style={{
                      borderColor: isSelected ? p.colors.primary : undefined,
                      boxShadow: isSelected ? `0 8px 24px -4px ${p.colors.glow}` : undefined,
                      outlineColor: isSelected ? p.colors.primary : undefined,
                    }}
                  >
                    {/* En-tête de la carte thème */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-black truncate text-white">{p.name}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0"
                          style={{
                            backgroundColor: `${p.colors.primary}20`,
                            color: p.colors.primary,
                            border: `1px solid ${p.colors.primary}40`,
                          }}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{p.tagline}</p>
                    </div>

                    {/* Nuancier Visuel de la Combinaison (4 teintes) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/40">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Palette Harmonie</span>
                        <span className="font-mono text-[9px] uppercase">{p.mode === 'dark' ? 'Sombre' : 'Clair'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {p.previewNuances.map((hex, idx) => (
                          <div
                            key={idx}
                            className="flex-1 h-5 rounded-md border shadow-sm transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: hex,
                              borderColor: idx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
                            }}
                            title={`Couleur: ${hex}`}
                          />
                        ))}
                      </div>

                      {/* Liseré de dégradé d'accent */}
                      <div
                        className="w-full h-1 rounded-full overflow-hidden"
                        style={{
                          background: `linear-gradient(to right, ${p.colors.primary}, ${p.colors.secondary})`,
                        }}
                      />
                    </div>

                    {/* Badge de sélection active */}
                    {isSelected && (
                      <div
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md animate-in zoom-in-75 duration-150"
                        style={{ backgroundColor: p.colors.primary }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. SECTION APERÇU EN DIRECT */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Aperçu en Direct sur les Composants</span>
            </label>

            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                resolvedMode === 'dark'
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              {/* Entête mini-carte */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  style={{
                    backgroundColor: activePalette.badgeBg,
                    border: `1px solid ${activePalette.badgeBorder}`,
                    color: activePalette.badgeText,
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ministère MFFE • Côte d'Ivoire</span>
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: activePalette.primaryHex }}>
                  Bilan Cartes 2026
                </span>
              </div>

              {/* Jauge de progression avec dégradé */}
              <div className="space-y-1 mb-3.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Distribution des Cartes Scolaires</span>
                  <span className="font-extrabold" style={{ color: activePalette.primaryHex }}>
                    84.2% atteint
                  </span>
                </div>
                <div className="w-full bg-slate-800/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: '84.2%',
                      backgroundColor: activePalette.primaryHex,
                      boxShadow: `0 0 12px ${activePalette.glowColor}`,
                    }}
                  />
                </div>
              </div>

              {/* Boutons d'action aperçu */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95 flex items-center gap-1.5"
                  style={{
                    backgroundColor: activePalette.primaryHex,
                    boxShadow: `0 4px 14px ${activePalette.glowColor}`,
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Bouton Principal Dégradé</span>
                </button>
                <button
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    resolvedMode === 'dark'
                      ? 'border-slate-700/80 text-slate-300 hover:text-white bg-slate-800/40'
                      : 'border-slate-300 text-slate-700 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Bouton Secondaire
                </button>
              </div>
            </div>
          </div>

          {/* 3. SECTION PERSONNALISATION AVANCÉE (ACCORDÉON) */}
          <div className="pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/30 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personnalisation Manuelle Avancée
                </span>
                {preset === 'custom' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Configuration sur mesure
                  </span>
                )}
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-5 pl-1 animate-in fade-in duration-200">
                {/* Mode d'affichage */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-2">
                    Luminosité du Fond d'Écran
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'dark' as ThemeMode, label: 'Sombre', icon: Moon, desc: 'Repose les yeux' },
                      { id: 'light' as ThemeMode, label: 'Clair', icon: Sun, desc: 'Bureaux éclairés' },
                      { id: 'system' as ThemeMode, label: 'Système', icon: Laptop, desc: 'Selon l’OS' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = mode === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setMode(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-orange-500 shadow-sm'
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
                          <div className="flex items-center gap-2">
                            <Icon
                              className="w-4 h-4"
                              style={{ color: isSelected ? activePalette.primaryHex : undefined }}
                            />
                            <div>
                              <div className="text-xs font-bold">{item.label}</div>
                              <div className="text-[9px] text-slate-400">{item.desc}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5" style={{ color: activePalette.primaryHex }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nuancier d'accents nobles */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-400">
                      Nuancier des Couleurs d'Accent (8 teintes)
                    </label>
                    <span className="text-[11px] font-bold" style={{ color: activePalette.primaryHex }}>
                      {activePalette.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((colKey) => {
                      const pal = ACCENT_PALETTES[colKey];
                      const isSelected = accent === colKey;
                      return (
                        <button
                          key={colKey}
                          onClick={() => setAccent(colKey)}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'shadow-md ring-1'
                              : resolvedMode === 'dark'
                              ? 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                          style={{
                            borderColor: isSelected ? pal.primaryHex : undefined,
                            backgroundColor: isSelected ? pal.badgeBg : undefined,
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: pal.primaryHex }}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate leading-tight">{pal.name.split(' ')[0]}</p>
                            <p className="text-[9px] text-slate-400 truncate leading-tight">
                              {pal.name.split(' ').slice(1, 3).join(' ')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ambiance et finitions */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-2">
                    Finition des Panneaux & Flous
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'glass' as DesignStyle, label: 'Glassmorphism', desc: 'Reflets & flous dépolis', icon: Sparkles },
                      { id: 'contrast' as DesignStyle, label: 'Haute Clarté', desc: 'Contrastes francs', icon: Layers },
                      { id: 'compact' as DesignStyle, label: 'Compact Pro', desc: 'Densité optimale', icon: Sliders },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = style === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setStyle(item.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-orange-500 shadow-sm'
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
                          <Icon
                            className="w-4 h-4 shrink-0"
                            style={{ color: isSelected ? activePalette.primaryHex : undefined }}
                          />
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[9px] text-slate-400 leading-tight">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page du Modal */}
        <div
          className={`px-5 sm:px-6 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
            resolvedMode === 'dark' ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={resetTheme}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              resolvedMode === 'dark'
                ? 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200'
            }`}
            title="Revenir au thème officiel par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thème Officiel Initial</span>
          </button>

          <button
            type="button"
            onClick={closeThemeModal}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: activePalette.primaryHex,
              boxShadow: `0 4px 14px ${activePalette.glowColor}`,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Appliquer & Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
