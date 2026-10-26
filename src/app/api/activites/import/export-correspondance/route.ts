import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items = [],
      dateOperation = new Date().toISOString().slice(0, 10),
      typeActivite = 'RECEPTION',
      referenceBordereau = 'BORDEREAU-MFFE',
      anneeScolaire = '2026-2027',
      filename = 'Correspondance_Bordereau',
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à exporter.' }, { status: 400 });
    }

    // Récupérer les stocks actuels depuis la base de données
    const dbStocksRes = await query<{
      id_entite: string;
      stock_recu_existant: number;
      stock_livre_existant: number;
      stock_dispo_existant: number;
    }>(`
      SELECT 
        e.id_entite,
        COALESCE(b.total_recu, 0) as stock_recu_existant,
        COALESCE(b.total_livre, 0) as stock_livre_existant,
        COALESCE(b.solde_stock_disponible, 0) as stock_dispo_existant
      FROM entite e
      LEFT JOIN vue_bilan_cartes_par_entite b ON e.id_entite = b.id_entite
    `);

    const stockMap = new Map<string, { stock_recu_existant: number; stock_livre_existant: number; stock_dispo_existant: number }>();
    dbStocksRes.forEach((r) => {
      stockMap.set(r.id_entite, {
        stock_recu_existant: Number(r.stock_recu_existant),
        stock_livre_existant: Number(r.stock_livre_existant),
        stock_dispo_existant: Number(r.stock_dispo_existant),
      });
    });

    // Création du classeur Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ministère de la Femme, de la Famille et de l\'Enfant - DRH';
    workbook.lastModifiedBy = 'Module Suivi des Cartes Scolaires';
    workbook.created = new Date();
    workbook.modified = new Date();

    const headerBlueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    const headerGreenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065F46' } };
    const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
    const fontHeader: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    const fontBold: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true };
    const fontRegular: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11 };

    // -------------------------------------------------------------
    // FEUILLE 1 : SYNTHÈSE EXÉCUTIVE
    // -------------------------------------------------------------
    const wsSynthese = workbook.addWorksheet('Synthèse Exécutive', {
      views: [{ showGridLines: true }],
    });

    wsSynthese.mergeCells('B2:H2');
    wsSynthese.getCell('B2').value = "RÉPUBLIQUE DE CÔTE D'IVOIRE • MINISTÈRE DE LA FEMME, DE LA FAMILLE ET DE L'ENFANT";
    wsSynthese.getCell('B2').font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1E3A8A' } };
    wsSynthese.getCell('B2').alignment = { horizontal: 'center' };

    wsSynthese.mergeCells('B3:H3');
    wsSynthese.getCell('B3').value = "DIRECTION DES RESSOURCES HUMAINES • MODULE SUIVI DES CARTES SCOLAIRES";
    wsSynthese.getCell('B3').font = { name: 'Calibri', size: 11, bold: true, color: { argb: '475569' } };
    wsSynthese.getCell('B3').alignment = { horizontal: 'center' };

    wsSynthese.mergeCells('B4:H4');
    wsSynthese.getCell('B4').value = `RAPPORT DE CORRESPONDANCE ET D'APPROVISIONNEMENT DU ${dateOperation}`;
    wsSynthese.getCell('B4').font = { name: 'Calibri', size: 14, bold: true, color: { argb: '0F172A' } };
    wsSynthese.getCell('B4').alignment = { horizontal: 'center' };

    const cppeItems = items.filter((i: any) => {
      const cat = (i.source_category || '').toUpperCase();
      return cat.startsWith('CPPE') || cat.includes('POUPONNIERE');
    });
    const caceItems = items.filter((i: any) => (i.source_category || '').toUpperCase().startsWith('CACE'));
    const cesItems = items.filter((i: any) => (i.source_category || '').toUpperCase().startsWith('CES'));
    const ifefItems = items.filter((i: any) => (i.source_category || '').toUpperCase().startsWith('IFEF'));
    const otherItems = items.filter(
      (i: any) =>
        !cppeItems.includes(i) &&
        !caceItems.includes(i) &&
        !cesItems.includes(i) &&
        !ifefItems.includes(i)
    );

    const sumCPPE = cppeItems.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);
    const sumCACE = caceItems.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);
    const sumCES = cesItems.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);
    const sumIFEF = ifefItems.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);
    const sumOthers = otherItems.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);
    const sumTotal = items.reduce((acc: number, curr: any) => acc + (curr.quantite || 0), 0);

    const matchedCount = items.filter((i: any) => !!i.matched_entite_id).length;
    const conformityRate = ((matchedCount / items.length) * 100).toFixed(1);

    const catSummaryParts: string[] = [];
    if (cppeItems.length > 0) catSummaryParts.push(`${cppeItems.length} CPPE`);
    if (caceItems.length > 0) catSummaryParts.push(`${caceItems.length} CACE`);
    if (cesItems.length > 0) catSummaryParts.push(`${cesItems.length} CES`);
    if (ifefItems.length > 0) catSummaryParts.push(`${ifefItems.length} IFEF`);
    if (otherItems.length > 0) catSummaryParts.push(`${otherItems.length} Autres`);

    const kpis: [string, any, string][] = [
      ['Date du Bordereau', dateOperation, 'Date de traitement du bordereau officiel'],
      ['Référence du Bordereau', referenceBordereau, "Identifiant unique de la pièce d'imputation"],
      ['Année Scolaire', anneeScolaire, 'Exercice scolaire de rattachement'],
      ['Nombre Total de Structures', items.length, catSummaryParts.join(', ')],
      ['Total Cartes Scolaires Traitées', sumTotal, `Volume total du bordereau (${sumTotal} cartes)`],
      ['Structures Rapprochées avec la Base', `${matchedCount} / ${items.length} (${conformityRate} %)`, `${conformityRate}% des structures répertoriées avec succès en base entite`],
    ];

    if (cppeItems.length > 0) {
      kpis.push([
        'Centres de Protection Petite Enfance (CPPE)',
        `${cppeItems.length} structures`,
        `${sumCPPE} cartes (${sumTotal > 0 ? ((sumCPPE / sumTotal) * 100).toFixed(1) : 0} %)`,
      ]);
    }
    if (caceItems.length > 0) {
      kpis.push([
        "Centres d'Action Communautaire Enfance (CACE)",
        `${caceItems.length} structures`,
        `${sumCACE} cartes (${sumTotal > 0 ? ((sumCACE / sumTotal) * 100).toFixed(1) : 0} %)`,
      ]);
    }
    if (cesItems.length > 0) {
      kpis.push([
        "Complexes d'Éducation Sociale (CES)",
        `${cesItems.length} structures`,
        `${sumCES} cartes (${sumTotal > 0 ? ((sumCES / sumTotal) * 100).toFixed(1) : 0} %)`,
      ]);
    }
    if (ifefItems.length > 0) {
      kpis.push([
        'Institutions Féminines (IFEF)',
        `${ifefItems.length} structures`,
        `${sumIFEF} cartes (${sumTotal > 0 ? ((sumIFEF / sumTotal) * 100).toFixed(1) : 0} %)`,
      ]);
    }
    if (otherItems.length > 0) {
      kpis.push([
        'Autres Structures',
        `${otherItems.length} structures`,
        `${sumOthers} cartes (${sumTotal > 0 ? ((sumOthers / sumTotal) * 100).toFixed(1) : 0} %)`,
      ]);
    }

    wsSynthese.getCell('B6').value = "INDICATEURS CLÉS DU BORDEREAU";
    wsSynthese.getCell('B6').font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1E3A8A' } };

    wsSynthese.getRow(7).values = ['', 'Indicateur', 'Valeur', 'Description / Détail'];
    ['B7', 'C7', 'D7'].forEach((c) => {
      wsSynthese.getCell(c).fill = headerBlueFill;
      wsSynthese.getCell(c).font = fontHeader;
      wsSynthese.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    let kpiRowIdx = 8;
    kpis.forEach((k) => {
      const r = wsSynthese.getRow(kpiRowIdx);
      r.values = ['', k[0], k[1], k[2]];
      r.font = fontRegular;
      wsSynthese.getCell(`B${kpiRowIdx}`).font = fontBold;
      wsSynthese.getCell(`C${kpiRowIdx}`).font = { name: 'Calibri', size: 12, bold: true, color: { argb: '065F46' } };
      wsSynthese.getCell(`C${kpiRowIdx}`).alignment = { horizontal: 'center' };
      ['B', 'C', 'D'].forEach((col) => {
        wsSynthese.getCell(`${col}${kpiRowIdx}`).border = thinBorder;
      });
      kpiRowIdx++;
    });

    // Ventilation par catégorie
    kpiRowIdx += 2;
    wsSynthese.getCell(`B${kpiRowIdx}`).value = "VENTILATION PAR CATÉGORIE D'ÉTABLISSEMENT";
    wsSynthese.getCell(`B${kpiRowIdx}`).font = { name: 'Calibri', size: 12, bold: true, color: { argb: '1E3A8A' } };
    kpiRowIdx++;

    wsSynthese.getRow(kpiRowIdx).values = ['', 'Catégorie', 'Nb Structures', 'Cartes (Bordereau)', 'Part Relative'];
    ['B', 'C', 'D', 'E'].forEach((col) => {
      wsSynthese.getCell(`${col}${kpiRowIdx}`).fill = headerGreenFill;
      wsSynthese.getCell(`${col}${kpiRowIdx}`).font = fontHeader;
      wsSynthese.getCell(`${col}${kpiRowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };
    });
    kpiRowIdx++;

    const categoriesList: { name: string; count: number; total: number }[] = [];
    if (cppeItems.length > 0) categoriesList.push({ name: 'CPPE & Pouponnières', count: cppeItems.length, total: sumCPPE });
    if (caceItems.length > 0) categoriesList.push({ name: "CACE - Centres d'Action Communautaire", count: caceItems.length, total: sumCACE });
    if (cesItems.length > 0) categoriesList.push({ name: "CES - Complexes d'Éducation Sociale", count: cesItems.length, total: sumCES });
    if (ifefItems.length > 0) categoriesList.push({ name: 'IFEF - Institutions Féminines', count: ifefItems.length, total: sumIFEF });
    if (otherItems.length > 0) categoriesList.push({ name: 'Autres Structures', count: otherItems.length, total: sumOthers });

    categoriesList.forEach((cat) => {
      const r = wsSynthese.getRow(kpiRowIdx);
      const pct = sumTotal > 0 ? ((cat.total / sumTotal) * 100).toFixed(1) + ' %' : '0 %';
      r.values = ['', cat.name, cat.count, cat.total, pct];
      ['B', 'C', 'D', 'E'].forEach((col) => {
        wsSynthese.getCell(`${col}${kpiRowIdx}`).border = thinBorder;
        wsSynthese.getCell(`${col}${kpiRowIdx}`).alignment = { horizontal: col === 'B' ? 'left' : 'center' };
      });
      kpiRowIdx++;
    });

    // Ligne Total Catégorie
    const rTotKpi = wsSynthese.getRow(kpiRowIdx);
    rTotKpi.values = ['', 'TOTAL GÉNÉRAL', items.length, sumTotal, '100.0 %'];
    rTotKpi.font = fontBold;
    ['B', 'C', 'D', 'E'].forEach((col) => {
      wsSynthese.getCell(`${col}${kpiRowIdx}`).fill = totalFill;
      wsSynthese.getCell(`${col}${kpiRowIdx}`).border = { top: { style: 'medium' }, bottom: { style: 'double' } };
      wsSynthese.getCell(`${col}${kpiRowIdx}`).alignment = { horizontal: col === 'B' ? 'left' : 'center' };
    });

    wsSynthese.getColumn('B').width = 44;
    wsSynthese.getColumn('C').width = 24;
    wsSynthese.getColumn('D').width = 32;
    wsSynthese.getColumn('E').width = 20;

    // -------------------------------------------------------------
    // FEUILLE 2 : TABLE DE CORRESPONDANCE & MOUVEMENTS
    // -------------------------------------------------------------
    const wsCorr = workbook.addWorksheet('Correspondance & Mouvements', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2, showGridLines: true }],
    });

    const corrHeaders = [
      'N°',
      'Catégorie Source',
      'Nom Structure dans le Fichier',
      'Cartes Bordereau',
      'Stock Existant BD',
      'Nouveau Stock Projeté',
      'Cumul Reçu Projeté',
      'Statut Rapprochement',
      'Code Entité BD (id_entite)',
      'Nom Officiel en Base Locale',
      'Nature Entité',
      'Localisation BD',
      'Observation DRH',
    ];

    wsCorr.getRow(1).values = [`CORRESPONDANCE DES STRUCTURES DU BORDEREAU DU ${dateOperation} (${referenceBordereau})`];
    wsCorr.mergeCells('A1:M1');
    wsCorr.getCell('A1').font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFF' } };
    wsCorr.getCell('A1').fill = headerBlueFill;
    wsCorr.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    wsCorr.getRow(1).height = 28;

    wsCorr.getRow(2).values = corrHeaders;
    wsCorr.getRow(2).height = 26;
    wsCorr.getRow(2).font = fontHeader;
    for (let c = 1; c <= corrHeaders.length; c++) {
      const cell = wsCorr.getRow(2).getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    }

    let corrRowIdx = 3;
    let totStockExistant = 0;
    let totNouveauStock = 0;
    let totCumulRecu = 0;

    items.forEach((item: any, idx: number) => {
      const targetId = item.matched_entite_id;
      const stockInfo = targetId ? stockMap.get(targetId) : null;
      const stockAnt = stockInfo ? stockInfo.stock_dispo_existant : 0;
      const qte = item.quantite || 0;
      const nouveauStock = stockAnt + qte;
      const cumulRecu = (stockInfo ? stockInfo.stock_recu_existant : 0) + qte;

      totStockExistant += stockAnt;
      totNouveauStock += nouveauStock;
      totCumulRecu += cumulRecu;

      const isUnmatched = !targetId || item.match_status === 'UNMATCHED';
      const statusText = isUnmatched ? '❌ NON RECONNU' : '✅ RAPPROCHÉ';

      const rowValues = [
        idx + 1,
        item.source_category || '-',
        item.raw_name,
        qte,
        stockAnt,
        nouveauStock,
        cumulRecu,
        statusText,
        targetId || '-',
        item.matched_entite_nom || '-',
        item.matched_nature || '-',
        item.matched_localisation || '-',
        item.match_status === 'EXACT' ? 'Rapprochement certifié DRH' : 'Rapprochement validé',
      ];

      const r = wsCorr.getRow(corrRowIdx);
      r.values = rowValues;
      r.font = fontRegular;

      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(2).alignment = { horizontal: 'center' };
      r.getCell(4).alignment = { horizontal: 'right' };
      r.getCell(5).alignment = { horizontal: 'right' };
      r.getCell(6).alignment = { horizontal: 'right' };
      r.getCell(7).alignment = { horizontal: 'right' };
      r.getCell(8).alignment = { horizontal: 'center' };
      r.getCell(11).alignment = { horizontal: 'center' };

      r.getCell(4).numFmt = '#,##0';
      r.getCell(5).numFmt = '#,##0';
      r.getCell(6).numFmt = '#,##0';
      r.getCell(7).numFmt = '#,##0';

      r.getCell(4).font = { bold: true, color: { argb: '065F46' } };
      r.getCell(6).font = { bold: true, color: { argb: '1E3A8A' } };
      r.getCell(8).font = { bold: true, color: { argb: isUnmatched ? 'DC2626' : '059669' } };
      r.getCell(9).font = { bold: true, color: { argb: '1E3A8A' } };

      for (let c = 1; c <= corrHeaders.length; c++) {
        r.getCell(c).border = thinBorder;
      }

      corrRowIdx++;
    });

    // Ligne Total
    const rTotCorr = wsCorr.getRow(corrRowIdx);
    rTotCorr.values = [
      'TOTAL',
      `${items.length} structures`,
      'Ensemble des réceptions du bordereau',
      sumTotal,
      totStockExistant,
      totNouveauStock,
      totCumulRecu,
      `${matchedCount} / ${items.length} Rapprochés (${conformityRate}%)`,
      '',
      '',
      '',
      '',
      '',
    ];
    rTotCorr.font = fontBold;
    for (let c = 1; c <= corrHeaders.length; c++) {
      rTotCorr.getCell(c).fill = totalFill;
      rTotCorr.getCell(c).border = { top: { style: 'medium' }, bottom: { style: 'double' } };
    }
    rTotCorr.getCell(1).alignment = { horizontal: 'center' };
    rTotCorr.getCell(4).alignment = { horizontal: 'right' };
    rTotCorr.getCell(4).numFmt = '#,##0';
    rTotCorr.getCell(4).font = { bold: true, color: { argb: '065F46' } };
    rTotCorr.getCell(5).alignment = { horizontal: 'right' };
    rTotCorr.getCell(5).numFmt = '#,##0';
    rTotCorr.getCell(6).alignment = { horizontal: 'right' };
    rTotCorr.getCell(6).numFmt = '#,##0';
    rTotCorr.getCell(6).font = { bold: true, color: { argb: '1E3A8A' } };
    rTotCorr.getCell(7).alignment = { horizontal: 'right' };
    rTotCorr.getCell(7).numFmt = '#,##0';
    rTotCorr.getCell(8).alignment = { horizontal: 'center' };

    wsCorr.getColumn(1).width = 7;
    wsCorr.getColumn(2).width = 16;
    wsCorr.getColumn(3).width = 34;
    wsCorr.getColumn(4).width = 18;
    wsCorr.getColumn(5).width = 18;
    wsCorr.getColumn(6).width = 20;
    wsCorr.getColumn(7).width = 20;
    wsCorr.getColumn(8).width = 22;
    wsCorr.getColumn(9).width = 36;
    wsCorr.getColumn(10).width = 54;
    wsCorr.getColumn(11).width = 14;
    wsCorr.getColumn(12).width = 22;
    wsCorr.getColumn(13).width = 30;

    // Buffer output
    const buffer = await workbook.xlsx.writeBuffer();
    const finalFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Erreur export correspondance:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du fichier Excel de correspondance.' },
      { status: 500 }
    );
  }
}
