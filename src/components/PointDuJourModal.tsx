'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  RefreshCw,
  Calendar,
  Sparkles,
  Printer,
  FileImage,
} from 'lucide-react';

interface PointDuJourRow {
  categorie: string;
  recu_jour: number;
  livre_jour: number;
  total_recu: number;
  total_livre: number;
  total_restant: number;
}

interface PointDuJourData {
  success: boolean;
  date: string;
  dateFormatee: string;
  dateComplete: string;
  anneeScolaire: string;
  rows: PointDuJourRow[];
  total: PointDuJourRow;
}

interface PointDuJourModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  anneeScolaire?: string;
}

export default function PointDuJourModal({
  isOpen,
  onClose,
  initialDate,
  anneeScolaire = '2026-2027',
}: PointDuJourModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<PointDuJourData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [canShare, setCanShare] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync date when opened
  useEffect(() => {
    if (isOpen && initialDate) {
      setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  // Check if navigator.share with files is available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare) {
      setCanShare(true);
    }
  }, []);

  // Fetch Point du Jour data
  const fetchData = useCallback(async (dateToUse: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('date', dateToUse);
      if (anneeScolaire) params.set('annee_scolaire', anneeScolaire);

      const res = await fetch(`/api/point-du-jour?${params.toString()}`);
      if (res.ok) {
        const json: PointDuJourData = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur chargement point du jour:', err);
    } finally {
      setLoading(false);
    }
  }, [anneeScolaire]);

  useEffect(() => {
    if (isOpen) {
      fetchData(selectedDate);
    }
  }, [isOpen, selectedDate, fetchData]);

  // Helper number formatter
  const formatNum = (val: number | undefined): string => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('fr-FR');
  };

  // Draw the exact image onto Canvas matching IMAGE FORMAT POINT DU JOUR.jpg
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    // Retina / High-DPI scale (2x)
    const dpr = 2;
    const baseW = 1350;
    const baseH = 750;

    canvas.width = baseW * dpr;
    canvas.height = baseH * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Fond blanc pur
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, baseW, baseH);

    // 2. Titre supérieur
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleText = `POINT DES ACTIVITES DU : ${data.dateFormatee}`;
    ctx.fillText(titleText, baseW / 2, 95);

    // 3. Géométrie du tableau
    // Marges
    const tableX = 40;
    const tableY = 150;
    const tableW = 1270;
    const tableH = 450;

    // Colonnes (somme = 1270)
    // Col 0: STRUCTURES (230)
    // Col 1: JOUR RECUES (165)
    // Col 2: JOUR LIVREES (165)
    // Col 3: TOTAL RECUES (235)
    // Col 4: TOTAL LIVREES (235)
    // Col 5: TOTAL RESTANTES (240)
    const colWidths = [230, 165, 165, 235, 235, 240];
    const colX: number[] = [tableX];
    for (let i = 0; i < colWidths.length; i++) {
      colX.push(colX[i] + colWidths[i]);
    }

    // Lignes :
    // Header Row 1 (JOUR, etc.): 55px
    // Header Row 2 (STRUCTURES, RECUES, LIVREES): 55px
    // Data Row 1 (CPPE/CACE): 110px
    // Data Row 2 (IFEF): 110px
    // Data Row 3 (TOTAL): 120px
    const rowHeights = [55, 55, 110, 110, 120];
    const rowY: number[] = [tableY];
    for (let i = 0; i < rowHeights.length; i++) {
      rowY.push(rowY[i] + rowHeights[i]);
    }

    // Couleurs
    const headerBg = '#06251b'; // Vert foncé forêt (bouteille)
    const headerText = '#FFFFFF';
    const cppeBgLabel = '#f1f4f6';
    const cppeBgData = '#f8fafc';
    const ifefBg = '#edf6ef'; // Vert menthe très clair
    const totalBg = '#fffab8'; // Jaune pastel doux
    const borderColor = '#000000';
    const borderWidth = 2.5;

    // --- A. Remplissage des fonds ---
    // Header Cellule (0,0) coin blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(colX[0], rowY[0], colWidths[0], rowHeights[0]);

    // Header JOUR (Cols 1 et 2, Row 0)
    ctx.fillStyle = headerBg;
    ctx.fillRect(colX[1], rowY[0], colWidths[1] + colWidths[2], rowHeights[0]);

    // Header TOTAL RECUES (Col 3, Rows 0 & 1)
    ctx.fillRect(colX[3], rowY[0], colWidths[3], rowHeights[0] + rowHeights[1]);

    // Header TOTAL LIVREES (Col 4, Rows 0 & 1)
    ctx.fillRect(colX[4], rowY[0], colWidths[4], rowHeights[0] + rowHeights[1]);

    // Header TOTAL RESTANTES (Col 5, Rows 0 & 1)
    ctx.fillRect(colX[5], rowY[0], colWidths[5], rowHeights[0] + rowHeights[1]);

    // Header Row 1 : STRUTURES (Col 0)
    ctx.fillRect(colX[0], rowY[1], colWidths[0], rowHeights[1]);

    // Header Row 1 : RECUES (Col 1)
    ctx.fillRect(colX[1], rowY[1], colWidths[1], rowHeights[1]);

    // Header Row 1 : LIVREES (Col 2)
    ctx.fillRect(colX[2], rowY[1], colWidths[2], rowHeights[1]);

    // Data Row 1 (CPPE/CACE - Row Index 2)
    ctx.fillStyle = cppeBgLabel;
    ctx.fillRect(colX[0], rowY[2], colWidths[0], rowHeights[2]);
    ctx.fillStyle = cppeBgData;
    ctx.fillRect(colX[1], rowY[2], tableW - colWidths[0], rowHeights[2]);

    // Data Row 2 (IFEF - Row Index 3)
    ctx.fillStyle = ifefBg;
    ctx.fillRect(colX[0], rowY[3], tableW, rowHeights[3]);

    // Data Row 3 (TOTAL - Row Index 4)
    ctx.fillStyle = totalBg;
    ctx.fillRect(colX[0], rowY[4], tableW, rowHeights[4]);

    // --- B. Tracer les bordures noires ---
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    // Cadre extérieur
    ctx.strokeRect(tableX, tableY, tableW, tableH);

    // Lignes horizontales
    // Ligne sous JOUR (entre row 0 et row 1, uniquement sur col 1 & 2)
    ctx.beginPath();
    ctx.moveTo(colX[1], rowY[1]);
    ctx.lineTo(colX[3], rowY[1]);
    ctx.stroke();

    // Ligne sous le header (y = rowY[2], sur toute la largeur)
    ctx.beginPath();
    ctx.moveTo(tableX, rowY[2]);
    ctx.lineTo(tableX + tableW, rowY[2]);
    ctx.stroke();

    // Ligne sous CPPE/CACE (y = rowY[3])
    ctx.beginPath();
    ctx.moveTo(tableX, rowY[3]);
    ctx.lineTo(tableX + tableW, rowY[3]);
    ctx.stroke();

    // Ligne sous IFEF (y = rowY[4])
    ctx.beginPath();
    ctx.moveTo(tableX, rowY[4]);
    ctx.lineTo(tableX + tableW, rowY[4]);
    ctx.stroke();

    // Lignes verticales
    // Col 0 -> Col 1 : sur toute la hauteur
    ctx.beginPath();
    ctx.moveTo(colX[1], tableY);
    ctx.lineTo(colX[1], tableY + tableH);
    ctx.stroke();

    // Col 1 -> Col 2 : du bas du header 1 (rowY[1]) jusqu'en bas
    ctx.beginPath();
    ctx.moveTo(colX[2], rowY[1]);
    ctx.lineTo(colX[2], tableY + tableH);
    ctx.stroke();

    // Col 2 -> Col 3 : sur toute la hauteur
    ctx.beginPath();
    ctx.moveTo(colX[3], tableY);
    ctx.lineTo(colX[3], tableY + tableH);
    ctx.stroke();

    // Col 3 -> Col 4 : sur toute la hauteur
    ctx.beginPath();
    ctx.moveTo(colX[4], tableY);
    ctx.lineTo(colX[4], tableY + tableH);
    ctx.stroke();

    // Col 4 -> Col 5 : sur toute la hauteur
    ctx.beginPath();
    ctx.moveTo(colX[5], tableY);
    ctx.lineTo(colX[5], tableY + tableH);
    ctx.stroke();

    // --- C. Écriture des textes et des chiffres ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Textes Header
    ctx.fillStyle = headerText;
    ctx.font = 'bold 22px Arial, sans-serif';

    // JOUR
    const jourCenterX = colX[1] + (colWidths[1] + colWidths[2]) / 2;
    const jourCenterY = rowY[0] + rowHeights[0] / 2;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('JOUR', jourCenterX, jourCenterY);

    // TOTAL RECUES (2 lignes)
    ctx.font = 'bold 20px Arial, sans-serif';
    const totRecX = colX[3] + colWidths[3] / 2;
    const totHeaderY = rowY[0] + (rowHeights[0] + rowHeights[1]) / 2;
    ctx.fillText('TOTAL', totRecX, totHeaderY - 14);
    ctx.fillText('RECUES', totRecX, totHeaderY + 14);

    // TOTAL LIVREES (2 lignes)
    const totLivX = colX[4] + colWidths[4] / 2;
    ctx.fillText('TOTAL', totLivX, totHeaderY - 14);
    ctx.fillText('LIVREES', totLivX, totHeaderY + 14);

    // TOTAL RESTANTES (2 lignes)
    const totResX = colX[5] + colWidths[5] / 2;
    ctx.fillText('TOTAL', totResX, totHeaderY - 14);
    ctx.fillText('RESTANTES', totResX, totHeaderY + 14);

    // Row 1 : STRUTURES (Col 0)
    const strCenterX = colX[0] + colWidths[0] / 2;
    const row1CenterY = rowY[1] + rowHeights[1] / 2;
    ctx.fillText('STRUTURES', strCenterX, row1CenterY);

    // Row 1 : RECUES (Col 1)
    const recCenterX = colX[1] + colWidths[1] / 2;
    ctx.fillText('RECUES', recCenterX, row1CenterY);

    // Row 1 : LIVREES (Col 2)
    const livCenterX = colX[2] + colWidths[2] / 2;
    ctx.fillText('LIVREES', livCenterX, row1CenterY);

    // 2. Lignes de données
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 23px Arial, sans-serif';

    const cppeRow = data.rows.find((r) => r.categorie === 'CPPE/CACE') || {
      categorie: 'CPPE/CACE',
      recu_jour: 0,
      livre_jour: 0,
      total_recu: 0,
      total_livre: 0,
      total_restant: 0,
    };
    const ifefRow = data.rows.find((r) => r.categorie === 'IFEF') || {
      categorie: 'IFEF',
      recu_jour: 0,
      livre_jour: 0,
      total_recu: 0,
      total_livre: 0,
      total_restant: 0,
    };
    const totalRow = data.total;

    // Helper pour dessiner une ligne de données
    const drawDataRow = (
      label: string,
      rowValues: PointDuJourRow,
      rowIndex: number,
      fontOverride?: string
    ) => {
      const cy = rowY[rowIndex] + rowHeights[rowIndex] / 2;
      ctx.font = fontOverride || 'bold 23px Arial, sans-serif';

      // Col 0: Label
      ctx.fillText(label, strCenterX, cy);

      // Col 1: RECUES JOUR
      ctx.fillText(formatNum(rowValues.recu_jour), recCenterX, cy);

      // Col 2: LIVREES JOUR
      ctx.fillText(formatNum(rowValues.livre_jour), livCenterX, cy);

      // Col 3: TOTAL RECUES
      ctx.fillText(formatNum(rowValues.total_recu), totRecX, cy);

      // Col 4: TOTAL LIVREES
      ctx.fillText(formatNum(rowValues.total_livre), totLivX, cy);

      // Col 5: TOTAL RESTANTES
      ctx.fillText(formatNum(rowValues.total_restant), totResX, cy);
    };

    // Row 2 : CPPE/CACE
    drawDataRow('CPPE/CACE', cppeRow, 2);

    // Row 3 : IFEF
    drawDataRow('IFEF', ifefRow, 3);

    // Row 4 : TOTAL
    drawDataRow('TOTAL', totalRow, 4, 'bold 25px Arial, sans-serif');

    ctx.restore();
  }, [data]);

  // Re-render canvas when data is ready
  useEffect(() => {
    if (data) {
      renderCanvas();
    }
  }, [data, renderCanvas]);

  // Télécharger l'image en PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `POINT_DES_ACTIVITES_DU_${data.date.replace(/-/g, '')}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Copier l'image directement dans le presse-papier
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          // Utiliser l'API Clipboard avec format image/png
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (clipErr) {
          console.warn('Clipboard write image échoué, fallback téléchargement:', clipErr);
          handleDownloadImage();
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  // Partager via l'API Web Share native (Mobile / Tablette / WhatsApp)
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const filename = `POINT_DES_ACTIVITES_DU_${data.date.replace(/-/g, '')}.png`;
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Point des activités du ${data.dateFormatee}`,
            text: `Point des cartes scolaires du ${data.dateComplete} (MFFE)`,
            files: [file],
          });
        } else {
          // Fallback copie
          handleCopyImage();
        }
      }, 'image/png', 1.0);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erreur partage:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* En-tête Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Partager le Point du Jour
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Format Image
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Génération au format officiel pour diffusion (WhatsApp, Email, Rapports)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre d'outils et sélecteur de date */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Date du point :</span>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => fetchData(selectedDate)}
              disabled={loading}
              title="Actualiser les calculs"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Année scolaire :</span>
            <span className="font-bold text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              {anneeScolaire}
            </span>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/90 flex flex-col items-center justify-center">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm">Calcul du point du jour en cours...</p>
            </div>
          ) : data ? (
            <div className="w-full max-w-3xl flex flex-col items-center gap-3">
              {/* Info bulle de confirmation */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Aperçu en direct (1350 × 750 px - Haute Définition)</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Prêt à être partagé
                </span>
              </div>

              {/* Conteneur de l'image (Canvas avec bordure et ombre) */}
              <div className="w-full bg-white rounded-xl shadow-2xl p-1 overflow-hidden border border-slate-700 transition-all hover:shadow-emerald-500/10">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block rounded-lg select-none"
                  style={{ aspectRatio: '1350 / 750' }}
                />
              </div>

              {/* Raccourci d'information */}
              <p className="text-[11px] text-slate-400 text-center italic">
                * La ligne <strong className="text-slate-200">CPPE/CACE</strong> regroupe CPPE, CACE, Pouponnière, CES et Crèche/Garderie. La ligne <strong className="text-slate-200">IFEF</strong> regroupe uniquement les IFEF.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              Aucune donnée disponible pour cette date.
            </div>
          )}
        </div>

        {/* Pied de page avec boutons d'actions */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {copied && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" />
                Image copiée dans le presse-papier ! Collez-la directement dans WhatsApp (Ctrl+V).
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Bouton Copier l'image */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={!data || loading}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 active:scale-95'
              }`}
              title="Copier l'image pour la coller directement (Ctrl+V) dans WhatsApp ou Email"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : "Copier l'image (WhatsApp)"}</span>
            </button>

            {/* Bouton Partager (si supporté par le système/navigateur) */}
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={!data || loading}
                className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-2 active:scale-95"
                title="Partager directement via le menu de partage"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager</span>
              </button>
            )}

            {/* Bouton Télécharger PNG */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={!data || loading}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-orange-600/20 active:scale-95"
              title="Télécharger le fichier image PNG"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger l'image</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
