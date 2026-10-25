import * as xlsx from 'xlsx';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface RawImportEntry {
  source_category?: string; // 'CPPE/CACE', 'IFEF', etc.
  raw_name: string;
  quantite: number;
  date?: string;
  source_row_index?: number;
}

export interface MatchedEntityCandidate {
  id_entite: string;
  nom: string;
  sigle: string | null;
  id_nature: string | null;
  localisation: string | null;
  score: number;
}

export interface MatchedImportItem {
  id: string; // temporary unique key for UI
  source_category: string;
  raw_name: string;
  quantite: number;
  date?: string;
  matched_entite_id: string | null;
  matched_entite_nom: string | null;
  matched_nature: string | null;
  matched_localisation: string | null;
  match_status: 'EXACT' | 'PREFIX' | 'FUZZY' | 'AMBIGUOUS' | 'UNMATCHED';
  confidence: number;
  candidates: MatchedEntityCandidate[];
  selected: boolean;
  notes?: string;
}

export interface EntityRecord {
  id_entite: string;
  nom: string;
  sigle: string | null;
  id_nature: string | null;
  localisation: string | null;
  id_hierarchisation?: string | null;
}

// -------------------------------------------------------------
// TEXT NORMALIZATION
// -------------------------------------------------------------
export function normalizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/['’]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Strip typical prefix nature
export function stripNaturePrefix(str: string): string {
  return str.replace(/^(INSTITUTION DE FORMATION ET D EDUCATION FEMININE|CENTRE DE PROTECTION DE LA PETITE ENFANCE|CENTRE D ACTION COMMUNAUTAIRE POUR L ENFANCE|COMPLEXE SOCIO EDUCATIF|CENTRE SOCIAL|CENTRE D EDUCATION SPECIALISEE|DIRECTION REGIONALE|DIRECTION CENTRALE|DIRECTION POUPONNIERE|POUPONNIERE|ORPHELINAT|VILLAGE D ENFANTS SOS|SOS VILLAGE|CENTRE D ACCUEIL|CENTRE DE TRANSIT|CENTRE EDUCATIF|GARDERIE DU|GARDERIE DE|GARDERIE|CRECHE GARDERIE|CRECHE|IFEF|CPPE|CACE|CSE|CES|CS|CA|CT|DR)\s+(DE |D |DU |DES |D' )?/i, '').trim();
}

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

export function similarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshteinDistance(a, b);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

// -------------------------------------------------------------
// MATCHING ALGORITHM
// -------------------------------------------------------------
export function matchEntriesWithEntities(
  entries: RawImportEntry[],
  dbEntities: EntityRecord[]
): MatchedImportItem[] {
  // Precompute normalized database entities
  const preppedDb = dbEntities.map((e) => {
    const normNom = normalizeText(e.nom);
    const normId = normalizeText(e.id_entite);
    const normSigle = normalizeText(e.sigle || '');
    const normLoc = normalizeText(e.localisation || '');
    const strippedNom = normalizeText(stripNaturePrefix(normNom));
    const strippedId = normalizeText(stripNaturePrefix(normId));

    return {
      entity: e,
      normNom,
      normId,
      normSigle,
      normLoc,
      strippedNom,
      strippedId,
    };
  });

  return entries.map((item, index) => {
    const normRaw = normalizeText(item.raw_name);
    const strippedRaw = normalizeText(stripNaturePrefix(normRaw));
    const cat = (item.source_category || '').toUpperCase();

    // Nature filter priority
    const isIfeCategory = cat.includes('IFEF');
    const isCppeCaceCategory = cat.includes('CPPE') || cat.includes('CACE');

    let matchedEntity: EntityRecord | null = null;
    let matchStatus: MatchedImportItem['match_status'] = 'UNMATCHED';
    let confidence = 0;
    const candidates: MatchedEntityCandidate[] = [];

    // 1. EXACT MATCH on Name or ID or Sigle
    for (const d of preppedDb) {
      if (d.normNom === normRaw || d.normId === normRaw || (d.normSigle && d.normSigle === normRaw)) {
        matchedEntity = d.entity;
        matchStatus = 'EXACT';
        confidence = 100;
        break;
      }
    }

    // 2. PREFIX MATCH (Try prefixing with category e.g. "IFEF BONGOUANOU", "CPPE EBOINDA")
    if (!matchedEntity) {
      const possibleNatures = isIfeCategory
        ? ['IFEF']
        : isCppeCaceCategory
        ? ['CPPE', 'CACE', 'POUPONNIERE', 'GARDERIE']
        : ['CPPE', 'IFEF', 'CACE', 'POUPONNIERE', 'GARDERIE', 'CES'];

      for (const nat of possibleNatures) {
        const testWithPrefix = normalizeText(nat + ' ' + normRaw);
        const found = preppedDb.find((d) => d.normNom === testWithPrefix || d.normId === testWithPrefix);
        if (found) {
          matchedEntity = found.entity;
          matchStatus = 'PREFIX';
          confidence = 95;
          break;
        }
      }
    }

    // 3. STRIPPED NAME EQUALITY
    // Compare core city / name without prefix (e.g. "EBOINDA" === "EBOINDA" inside CPPE EBOINDA)
    if (!matchedEntity) {
      const targetList = preppedDb.filter((d) => {
        if (isIfeCategory) return d.entity.id_nature === 'IFEF';
        if (isCppeCaceCategory) return ['CPPE', 'CACE', 'POUPONNIERE', 'GARDERIE', 'CRECHE'].includes(d.entity.id_nature || '');
        return true;
      });

      const exactStrippedMatches = targetList.filter(
        (d) => d.strippedNom === strippedRaw || d.strippedId === strippedRaw || d.strippedNom === normRaw || d.strippedId === normRaw
      );

      if (exactStrippedMatches.length === 1) {
        matchedEntity = exactStrippedMatches[0].entity;
        matchStatus = 'FUZZY';
        confidence = 90;
      } else if (exactStrippedMatches.length > 1) {
        exactStrippedMatches.forEach((m) => {
          candidates.push({
            id_entite: m.entity.id_entite,
            nom: m.entity.nom,
            sigle: m.entity.sigle,
            id_nature: m.entity.id_nature,
            localisation: m.entity.localisation,
            score: 85,
          });
        });
        matchStatus = 'AMBIGUOUS';
        confidence = 65;
        matchedEntity = exactStrippedMatches[0].entity; // default pick first
      }
    }

    // 4. CONTAINS & SIMILARITY SEARCH
    if (!matchedEntity || matchStatus === 'AMBIGUOUS') {
      const poolToSearch = preppedDb.filter((d) => {
        if (isIfeCategory) return d.entity.id_nature === 'IFEF';
        if (isCppeCaceCategory) return ['CPPE', 'CACE', 'POUPONNIERE', 'GARDERIE', 'CRECHE'].includes(d.entity.id_nature || '');
        return true;
      });

      const scoredList = poolToSearch
        .map((d) => {
          // Compare both full normalized and stripped names
          const scoreFull = similarityScore(d.normNom, normRaw);
          const scoreStripped = similarityScore(d.strippedNom, strippedRaw);
          const scoreId = similarityScore(d.normId, normRaw);

          let bestScore = Math.max(scoreFull, scoreStripped, scoreId);

          // Bonus if one string contains the other
          if (
            (d.normNom.includes(normRaw) && normRaw.length > 3) ||
            (normRaw.includes(d.strippedNom) && d.strippedNom.length > 3)
          ) {
            bestScore = Math.max(bestScore, 80);
          }

          return {
            entity: d.entity,
            score: bestScore,
          };
        })
        .filter((s) => s.score >= 60)
        .sort((a, b) => b.score - a.score);

      if (scoredList.length > 0) {
        const top = scoredList[0];
        if (top.score >= 80 && (scoredList.length === 1 || top.score - scoredList[1].score >= 15)) {
          matchedEntity = top.entity;
          matchStatus = 'FUZZY';
          confidence = top.score;
        } else {
          matchStatus = 'AMBIGUOUS';
          confidence = top.score;
          matchedEntity = top.entity;
        }

        scoredList.slice(0, 5).forEach((itemScored) => {
          if (!candidates.some((c) => c.id_entite === itemScored.entity.id_entite)) {
            candidates.push({
              id_entite: itemScored.entity.id_entite,
              nom: itemScored.entity.nom,
              sigle: itemScored.entity.sigle,
              id_nature: itemScored.entity.id_nature,
              localisation: itemScored.entity.localisation,
              score: itemScored.score,
            });
          }
        });
      }
    }

    return {
      id: `item-${index}-${Date.now().toString(36)}`,
      source_category: item.source_category || (matchedEntity?.id_nature ?? 'STRUCTURE'),
      raw_name: item.raw_name,
      quantite: item.quantite,
      date: item.date,
      matched_entite_id: matchedEntity ? matchedEntity.id_entite : null,
      matched_entite_nom: matchedEntity ? matchedEntity.nom : null,
      matched_nature: matchedEntity ? matchedEntity.id_nature : null,
      matched_localisation: matchedEntity ? matchedEntity.localisation : null,
      match_status: matchStatus,
      confidence,
      candidates,
      selected: matchStatus !== 'UNMATCHED',
    };
  });
}

// -------------------------------------------------------------
// FILE PARSERS (Word, Excel, PDF)
// -------------------------------------------------------------

/**
 * 1. Parse Word (.docx) file
 */
export async function parseDocxBuffer(buffer: Buffer): Promise<RawImportEntry[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error("Le document Word ne contient pas de fichier word/document.xml valide.");
  }
  const xml = await docXmlFile.async('text');

  const tableMatches = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g) || [];
  if (tableMatches.length === 0) {
    throw new Error("Aucun tableau de données n'a été détecté dans ce document Word.");
  }

  const entries: RawImportEntry[] = [];

  tableMatches.forEach((tableXml) => {
    const rows = tableXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    rows.forEach((rowXml, rowIdx) => {
      const cells = (rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || []).map((c) =>
        c.replace(/<[^>]+>/g, '').trim()
      );

      // Skip header row if it contains keywords
      const fullText = cells.join(' ').toUpperCase();
      if (rowIdx === 0 && (fullText.includes('TOTAL') || fullText.includes('CPPE') || fullText.includes('STRUCTURE'))) {
        return;
      }

      // Check standard 4-column layout:
      // Col 0: CPPE/CACE Name, Col 1: Qty, Col 2: IFEF Name, Col 3: Qty
      if (cells.length >= 2) {
        const leftName = cells[0];
        const leftQty = parseInt(cells[1], 10);
        if (leftName && !leftName.toUpperCase().includes('TOTAL') && !isNaN(leftQty) && leftQty > 0) {
          entries.push({
            source_category: 'CPPE/CACE',
            raw_name: leftName,
            quantite: leftQty,
            source_row_index: rowIdx + 1,
          });
        }
      }

      if (cells.length >= 4) {
        const rightName = cells[2];
        const rightQty = parseInt(cells[3], 10);
        if (rightName && !rightName.toUpperCase().includes('TOTAL') && !isNaN(rightQty) && rightQty > 0) {
          entries.push({
            source_category: 'IFEF',
            raw_name: rightName,
            quantite: rightQty,
            source_row_index: rowIdx + 1,
          });
        }
      }

      // Or simple 2-column layout: Col 0: Name, Col 1: Qty
      if (cells.length === 2 || cells.length === 3) {
        const name = cells[0];
        const qty = parseInt(cells[1], 10);
        if (name && !name.toUpperCase().includes('TOTAL') && !isNaN(qty) && qty > 0) {
          // Check if already pushed
          if (!entries.some((e) => e.raw_name === name && e.quantite === qty)) {
            entries.push({
              source_category: 'STRUCTURE',
              raw_name: name,
              quantite: qty,
              source_row_index: rowIdx + 1,
            });
          }
        }
      }
    });
  });

  return entries;
}

/**
 * 2. Parse Excel (.xlsx, .xls, .csv) file
 */
export function parseExcelBuffer(buffer: Buffer, requestedType: 'RECEPTION' | 'LIVRAISON'): RawImportEntry[] {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Le fichier Excel ne contient aucune feuille de calcul.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (rawData.length === 0) {
    throw new Error("La feuille de calcul est vide.");
  }

  const entries: RawImportEntry[] = [];

  // Look for header row
  let headerIndex = -1;
  let colTypeIndex = -1;
  let colEntiteIndex = -1;
  let colDateIndex = -1;
  let colRecuIndex = -1;
  let colLivreIndex = -1;
  let colTotalIndex = -1;

  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i] || [];
    const rowStr = row.map((c) => (c ? c.toString().toUpperCase() : ''));

    rowStr.forEach((rawVal, colIdx) => {
      const val = normalizeText(rawVal);
      if (val.includes('TYPE') || val.includes('NATURE') || val.includes('CATEGORIE')) {
        colTypeIndex = colIdx;
      } else if (val.includes('ENTITE') || val.includes('STRUCTURE') || val.includes('NOM') || val.includes('ETABLISSEMENT') || val.includes('ECOLE')) {
        colEntiteIndex = colIdx;
      }

      if (val.includes('DATE')) colDateIndex = colIdx;
      if (val.includes('RECU') || val.includes('RECUE') || val.includes('RECEPTION')) colRecuIndex = colIdx;
      if (val.includes('DISTRIB') || val.includes('LIVR')) colLivreIndex = colIdx;
      if (val.includes('TOTAL') || val.includes('QTE') || val.includes('QUANTITE') || val.includes('NOMBRE')) colTotalIndex = colIdx;
    });

    if (colEntiteIndex !== -1 || (rowStr.length >= 2 && rowStr[0].includes('CPPE') && rowStr[1].includes('TOTAL'))) {
      headerIndex = i;
      break;
    }
  }

  // Case A: Bi-column format (CPPE/CACE Col 0-1, IFEF Col 2-3)
  const isBiColumn =
    rawData[0] &&
    rawData[0][0] &&
    rawData[0][0].toString().toUpperCase().includes('CPPE') &&
    rawData[0][2] &&
    rawData[0][2].toString().toUpperCase().includes('IFEF');

  if (isBiColumn) {
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r] || [];
      const leftName = row[0] ? row[0].toString().trim() : '';
      const leftQty = parseInt(row[1], 10);
      if (leftName && !leftName.toUpperCase().includes('TOTAL') && !isNaN(leftQty) && leftQty > 0) {
        entries.push({ source_category: 'CPPE/CACE', raw_name: leftName, quantite: leftQty, source_row_index: r + 1 });
      }

      const rightName = row[2] ? row[2].toString().trim() : '';
      const rightQty = parseInt(row[3], 10);
      if (rightName && !rightName.toUpperCase().includes('TOTAL') && !isNaN(rightQty) && rightQty > 0) {
        entries.push({ source_category: 'IFEF', raw_name: rightName, quantite: rightQty, source_row_index: r + 1 });
      }
    }
    return entries;
  }

  // Case B: Standard column table (e.g. Suivi_Enregistrements_CPPE_IFEF.xlsx)
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 1;
  const targetColQty =
    requestedType === 'RECEPTION'
      ? (colRecuIndex !== -1 ? colRecuIndex : colTotalIndex)
      : (colLivreIndex !== -1 ? colLivreIndex : colTotalIndex);

  for (let r = startRow; r < rawData.length; r++) {
    const row = rawData[r] || [];
    if (!row || row.length === 0) continue;

    const nameVal = colEntiteIndex !== -1 ? row[colEntiteIndex] : row[0];
    if (!nameVal) continue;
    const rawName = nameVal.toString().trim();
    if (!rawName || rawName.toUpperCase().includes('TOTAL')) continue;

    const categoryVal = colTypeIndex !== -1 && row[colTypeIndex] ? row[colTypeIndex].toString().trim() : '';
    const dateVal = colDateIndex !== -1 && row[colDateIndex] ? row[colDateIndex].toString().trim() : undefined;

    let qty = 0;
    if (targetColQty !== -1 && row[targetColQty] !== undefined) {
      qty = parseInt(row[targetColQty], 10);
    } else {
      // Find first numerical value in row
      for (let c = 1; c < row.length; c++) {
        const num = parseInt(row[c], 10);
        if (!isNaN(num) && num > 0) {
          qty = num;
          break;
        }
      }
    }

    if (!isNaN(qty) && qty > 0) {
      entries.push({
        source_category: categoryVal || 'STRUCTURE',
        raw_name: rawName,
        quantite: qty,
        date: dateVal,
        source_row_index: r + 1,
      });
    }
  }

  return entries;
}

/**
 * 3. Parse PDF (.pdf) file
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<RawImportEntry[]> {
  const tmpPath = path.join(os.tmpdir(), `import_pdf_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  const scriptPath = path.resolve(process.cwd(), 'scripts/extract_pdf.js');

  try {
    fs.writeFileSync(tmpPath, buffer);
    const { stdout } = await execFileAsync('node', [scriptPath, tmpPath]);

    // Find JSON in stdout (ignoring pdf.js warnings)
    const jsonMatch = stdout.match(/\{"success":[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Impossible d'extraire les données du fichier PDF.");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.success || !parsed.lines) {
      throw new Error(parsed.error || "Échec de lecture du PDF.");
    }

    const lines: string[] = parsed.lines;
    const entries: RawImportEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (
        line.toUpperCase().includes('MINISTERE') ||
        line.toUpperCase().includes('REPUBLIQUE') ||
        line.toUpperCase().includes('PAGE ') ||
        (line.toUpperCase().includes('TOTAL') && !line.match(/\d+/))
      ) {
        continue;
      }

      // Pattern 1: Double entry in single line (Bi-column in PDF text)
      // ex: "ODIENNE 2 SAN-PEDRO 10"
      const biColRegex = /^([A-ZÀ-ÿ0-9'\s\-]+?)\s+(\d+)\s+([A-ZÀ-ÿ0-9'\s\-]+?)\s+(\d+)$/i;
      const biColMatch = line.match(biColRegex);
      if (biColMatch) {
        const name1 = biColMatch[1].trim();
        const qty1 = parseInt(biColMatch[2], 10);
        const name2 = biColMatch[3].trim();
        const qty2 = parseInt(biColMatch[4], 10);

        if (name1 && !isNaN(qty1) && qty1 > 0 && !name1.toUpperCase().includes('TOTAL')) {
          let cat1 = 'CPPE/CACE';
          if (name1.toUpperCase().includes('IFEF')) cat1 = 'IFEF';
          entries.push({ source_category: cat1, raw_name: name1, quantite: qty1, source_row_index: i + 1 });
        }
        if (name2 && !isNaN(qty2) && qty2 > 0 && !name2.toUpperCase().includes('TOTAL')) {
          let cat2 = 'IFEF';
          if (name2.toUpperCase().includes('CPPE') || name2.toUpperCase().includes('CACE')) cat2 = 'CPPE/CACE';
          entries.push({ source_category: cat2, raw_name: name2, quantite: qty2, source_row_index: i + 1 });
        }
        continue;
      }

      // Pattern 2: Single structure and quantity
      // ex: "CPPE EBOINDA 6" or "IFEF BONGOUANOU 46"
      const singleRegex = /^([A-ZÀ-ÿ0-9'\s\-]+?)\s+(\d+)$/i;
      const singleMatch = line.match(singleRegex);
      if (singleMatch) {
        const name = singleMatch[1].trim();
        const qty = parseInt(singleMatch[2], 10);
        if (name && !isNaN(qty) && qty > 0 && !name.toUpperCase().includes('TOTAL')) {
          let cat = 'STRUCTURE';
          if (name.toUpperCase().includes('IFEF')) cat = 'IFEF';
          else if (name.toUpperCase().includes('CPPE') || name.toUpperCase().includes('CACE')) cat = 'CPPE/CACE';
          entries.push({ source_category: cat, raw_name: name, quantite: qty, source_row_index: i + 1 });
        }
      }
    }

    if (entries.length === 0) {
      throw new Error(
        "Le document PDF a été lu mais aucune ligne au format [Structure / Quantité] n'a pu être identifiée. Vérifiez que le PDF contient un tableau texte."
      );
    }

    return entries;
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (e) {
      // ignore
    }
  }
}
