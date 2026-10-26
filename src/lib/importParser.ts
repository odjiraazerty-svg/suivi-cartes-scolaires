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

// Dictionnaire certifié des rapprochements historiques et variantes orthographiques MFFE
export const CERTIFIED_ENTITY_ALIASES: Record<string, string> = {
  // CPPE & CACE & Pouponnières
  'TIAPOUM': 'CPPE TIAPOUM',
  'CPPE_TIAPOUM': 'CPPE TIAPOUM',
  'BOKALA': 'CACE BOKALA',
  'CACE_BOKALA': 'CACE BOKALA',
  'ESPOIR DES MAMANS': 'CPPE ESPOIR DES MAMANS',
  'CPPE_ESPOIR DES MAMANS': 'CPPE ESPOIR DES MAMANS',
  'OLIENOU': 'CACE OLIENOU',
  'CACE_OLIENOU': 'CACE OLIENOU',
  'GRAND BASSAM': 'CPPE GRAND-BASSAM',
  'CPPE_GRAND BASSAM': 'CPPE GRAND-BASSAM',
  'GRAND-BASSAM': 'CPPE GRAND-BASSAM',
  'NOE': 'CPPE NOE',
  'CPPE_NOE': 'CPPE NOE',
  'DIVO': 'CPPE DIVO',
  'CPPE_DIVO': 'CPPE DIVO',
  'GRAND MOUTCHO': 'CPPE GRAND MOUTCHO',
  'CPPE_GRAND MOUTCHO': 'CPPE GRAND MOUTCHO',
  'BODOKRO': 'CACE BODOKRO',
  'CACE_BODOKRO': 'CACE BODOKRO',
  'BONIEREDOUGOU': 'CPPE DU CSE DE BONIEREDOUGOU',
  'CPPE_BONIEREDOUGOU': 'CPPE DU CSE DE BONIEREDOUGOU',
  'POUPOUNIERE DE BOUAKE': 'POUPONNIERE BOUAKE',
  'POUPOUNIERE DE BKE': 'POUPONNIERE BOUAKE',
  'POUPONNIERE BOUAKE': 'POUPONNIERE BOUAKE',
  'DJOROBITE 2': 'CPPE DJOROGOBITE 2',
  'CPPE_DJOROBITE 2': 'CPPE DJOROGOBITE 2',
  'DJOROBITE': 'CPPE DJOROGOBITE 2',
  'TAZIBOUO': 'CPPE TAZIBOUO (DALOA',
  'CPPE_TAZIBOUO': 'CPPE TAZIBOUO (DALOA',
  'ZOUKOUGBE': 'CPPE ZOUKOUGBEU',
  'CPPE_ZOUKOUGBE': 'CPPE ZOUKOUGBEU',
  'ODIENNE': 'CPPE ODIENNE',
  'CPPE_ODIENNE': 'CPPE ODIENNE',
  'OUEDALA': 'CPPE OUEDALLAH',
  'CPPE_OUEDALA': 'CPPE OUEDALLAH',
  'ADAOU': 'CPPE ADAOU',
  'CPPE_ADAOU': 'CPPE ADAOU',
  'KANANGO KPLI': 'CACE KANANGOPLI',
  'CACE_KANANGO KPLI': 'CACE KANANGOPLI',
  'LES PRINCES DE MONTEZO': 'CACE MONTEZO',
  'CACE_LES PRINCES DE MONTEZO': 'CACE MONTEZO',
  'COCODY NORD': 'CPPE COCODY-NORD',
  'CPPE_COCODY NORD': 'CPPE COCODY-NORD',
  'GAN EDEN': 'CPPE GAN EDEN',
  'GAN EDEN D AGBOVILLE': 'CPPE GAN EDEN',
  'GAN EDEN D’AGBOVILLE': 'CPPE GAN EDEN',
  'CPPE_GAN EDEN D AGBOVILLE': 'CPPE GAN EDEN',
  'ABADJAN KOUTE': 'CPPE ABADJIN-KOUTE',
  'CPPE_ABADJAN KOUTE': 'CPPE ABADJIN-KOUTE',
  'ABADJIN KOUTE': 'CPPE ABADJIN-KOUTE',
  'CPPE_ABADJIN KOUTE': 'CPPE ABADJIN-KOUTE',
  'LES OLIVIERS DE GAGORE': 'CACE GAGORE',
  'CACE_LES OLIVIERS DE GAGORE': 'CACE GAGORE',
  'MEMNI': 'CPPE MEMNI',
  'CPPE_MEMNI': 'CPPE MEMNI',
  'QUARTIER BAOULE': 'CPPE QUARTIER BAOULE (DALOA)',
  'CPPE_QUARTIER BAOULE': 'CPPE QUARTIER BAOULE (DALOA)',
  'FLORENCE ACHI': 'CPPE ACHI FLORENCE',
  'FLORENCE ACHI D ALEPE': 'CPPE ACHI FLORENCE',
  'FLORENCE ACHI D’ALEPE': 'CPPE ACHI FLORENCE',
  'CPPE_FLORENCE ACHI D ALEPE': 'CPPE ACHI FLORENCE',
  'FERKE': 'CPPE FERKESSEDOUGOU',
  'CPPE_FERKE': 'CPPE FERKESSEDOUGOU',
  'MAN': 'CPPE MAN',
  'CPPE_MAN': 'CPPE MAN',
  'TOUBA': 'CPPE TOUBA',
  'CPPE_TOUBA': 'CPPE TOUBA',
  'YAPOPO': 'CPPE YAPOPO',
  'CPPE_YAPOPO': 'CPPE YAPOPO',
  'EBOINDA': 'CPPE EBOINDA',
  'CPPE_EBOINDA': 'CPPE EBOINDA',
  'BONGOUANOU': 'CPPE BONGOUANOU',
  'CPPE_BONGOUANOU': 'CPPE BONGOUANOU',
  'ASSALE TIEMOKO': 'CPPE ASSALE TIEMOKO DE TIASSALE',
  'CPPE_TIASSALE': 'CPPE ASSALE TIEMOKO DE TIASSALE',
  'CPPE_BOUAKE KOKO': 'CPPE BOUAKE KOKO',
  'CPPE_BOUAKE-KOKO': 'CPPE BOUAKE KOKO',

  // IFEF
  'TIASALE': 'IFEF TIASSALE',
  'IFEF_TIASALE': 'IFEF TIASSALE',
  'TIASSALE': 'IFEF TIASSALE',
  'IFEF_TIASSALE': 'IFEF TIASSALE',
  'BONOUA': 'IFEF BONOUA',
  'IFEF_BONOUA': 'IFEF BONOUA',
  'SIKENSI': 'IFEF SIKENSI',
  'IFEF_SIKENSI': 'IFEF SIKENSI',
  'BINGERVILLE': 'IFEF BINGERVILLE',
  'IFEF_BINGERVILLE': 'IFEF BINGERVILLE',
  'BONDOUKOU': 'IFEF BONDOUKOU',
  'IFEF_BONDOUKOU': 'IFEF BONDOUKOU',
  'BOTRO': 'IFEF BOTRO',
  'IFEF_BOTRO': 'IFEF BOTRO',
  'BEOUMI': 'IFEF BEOUMI',
  'IFEF_BEOUMI': 'IFEF BEOUMI',
  'CAMP GALIENI': 'IFEF CAMP GALLIENI PLATEAU',
  'CAMP GALIENI PLATEAU': 'IFEF CAMP GALLIENI PLATEAU',
  'IFEF_CAMP GALIENI PLATEAU': 'IFEF CAMP GALLIENI PLATEAU',
  'CAMP GALLIENI PLATEAU': 'IFEF CAMP GALLIENI PLATEAU',
  'IFEF_CAMP GALLIENI PLATEAU': 'IFEF CAMP GALLIENI PLATEAU',
  'CAMP GALLIENI': 'IFEF CAMP GALLIENI PLATEAU',
  'DANANE': 'IFEF DANANE',
  'IFEF_DANANE': 'IFEF DANANE',
  'DIEGONEFLA': 'IFEF DIEGONEFLA',
  'IFEF_DIEGONEFLA': 'IFEF DIEGONEFLA',
  'TABOU': 'IFEF TABOU',
  'IFEF_TABOU': 'IFEF TABOU',
  'BLOLEQUIN': 'IFEF BLOLEQUIN',
  'IFEF_BLOLEQUIN': 'IFEF BLOLEQUIN',
  'BOUAKE KOKO': 'IFEF BOUAKE KOKO',
  'IFEF_BOUAKE KOKO': 'IFEF BOUAKE KOKO',
  'IFEF_BOUAKE-KOKO': 'IFEF BOUAKE KOKO',
  'AGBOVILLE CNKF': 'IFEF CENTRE KIMOU',
  'IFEF_AGBOVILLE CNKF': 'IFEF CENTRE KIMOU',
  'CNKF': 'IFEF CENTRE KIMOU',
  'IFEF_CNKF': 'IFEF CENTRE KIMOU',
  'CENTRE KIMOU': 'IFEF CENTRE KIMOU',
  'CAMP AGBAN': 'IFEF CAMP AGBAN',
  'IFEF_CAMP AGBAN': 'IFEF CAMP AGBAN',
  'CENTRE ANTONINO CELONA': 'IFEF CENTRE ANTONINO CELONA',
  'IFEF_CENTRE ANTONINO CELONA': 'IFEF CENTRE ANTONINO CELONA',
  'ANTONINO CELONA': 'IFEF CENTRE ANTONINO CELONA',
  'SAN PEDRO': 'IFEF SAN PEDRO',
  'SAN-PEDRO': 'IFEF SAN PEDRO',
  'IFEF_SAN PEDRO': 'IFEF SAN PEDRO',
  'TREICHVILLE ARRAS': 'IFEF TREICHVILLE ARRAS',
  'IFEF_TREICHVILLE ARRAS': 'IFEF TREICHVILLE ARRAS',
  'TREICHVILLE BELLEVILLE': 'IFEF TREICHVILLE BELLEVILLE',
  'IFEF_TREICHVILLE BELLEVILLE': 'IFEF TREICHVILLE BELLEVILLE',
  'YACOLIDABOUO': 'IFEF YACOLIDABOUO',
  'IFEF_YACOLIDABOUO': 'IFEF YACOLIDABOUO',
  'AIR FRANCE BOUAKE': 'IFEF AIR FRANCE BOUAKE',
  'IFEF_AIR FRANCE BOUAKE': 'IFEF AIR FRANCE BOUAKE',

  // CACE (Bordereau 23/10)
  'KOUNDANOU': 'CACE KOUNDANOU',
  'CACE_KOUNDANOU': 'CACE KOUNDANOU',
  'ZUENOULA': 'CACE ZUENOULA',
  'CACE_ZUENOULA': 'CACE ZUENOULA',
  'KANANGO PKLI': 'CACE KANANGOPLI',
  'CACE_KANANGO PKLI': 'CACE KANANGOPLI',
  'ADONKOI': 'CACE ADONKOI 1',
  'CACE_ADONKOI': 'CACE ADONKOI 1',
  'GBAGBA BERLIN': 'CACE GBAGBA BERLIN',
  'CACE_GBAGBA BERLIN': 'CACE GBAGBA BERLIN',

  // CES (Bordereau 23/10)
  'TREICHEVILLE': 'CES TREICHVILLE AVENUE I',
  'CES_TREICHEVILLE': 'CES TREICHVILLE AVENUE I',
  'CES_TREICHVILLE': 'CES TREICHVILLE AVENUE I',

  // IFEF (Bordereau 23/10)
  'ABOBODOUME': 'IFEF ABOBODOUME',
  'IFEF_ABOBODOUME': 'IFEF ABOBODOUME',
  'DALOA COMMUNE': 'IFEF DALOA COMMUNE',
  'IFEF_DALOA COMMUNE': 'IFEF DALOA COMMUNE',
  'GUIGLO': 'IFEF GUIGLO',
  'IFEF_GUIGLO': 'IFEF GUIGLO',
  'KORHOGO': 'IFEF KORHOGO',
  'IFEF_KORHOGO': 'IFEF KORHOGO',
  'ADZOPE': 'IFEF ADZOPE',
  'IFEF_ADZOPE': 'IFEF ADZOPE',
  'PORT BOUE': 'IFEF PORT-BOUET',
  'IFEF_PORT BOUE': 'IFEF PORT-BOUET',
  'PORT-BOUE': 'IFEF PORT-BOUET',
  'IFEF_PORT-BOUE': 'IFEF PORT-BOUET',
  'PORT BOUET': 'IFEF PORT-BOUET',
  'ADIAKE': 'IFEF ADIAKE',
  'IFEF_ADIAKE': 'IFEF ADIAKE',
  'BOUAKE-AIR-FRANCE': 'IFEF AIR FRANCE BOUAKE',
  'IFEF_BOUAKE-AIR-FRANCE': 'IFEF AIR FRANCE BOUAKE',
  'BOUAKE AIR FRANCE': 'IFEF AIR FRANCE BOUAKE',
  'IFEF_BOUAKE AIR FRANCE': 'IFEF AIR FRANCE BOUAKE',
  'INSTITUT MARIE THERESE': 'IFEF MARIE THERESE HOUPHOUET BOIGNY',
  'IFEF_INSTITUT MARIE THERESE': 'IFEF MARIE THERESE HOUPHOUET BOIGNY',
  'MONTEZO': 'IFEF MONTEZO',
  'IFEF_MONTEZO': 'IFEF MONTEZO',

  // CPPE compléments (Bordereau 23/10)
  'SOUBRE': 'CPPE SOUBRE',
  'CPPE_SOUBRE': 'CPPE SOUBRE',
};

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
    const isCaceCategory = cat.includes('CACE');
    const isCesCategory = cat.includes('CES');
    const isCppeCategory = cat.includes('CPPE') && !isCaceCategory;
    const isCppeCaceCategory = isCppeCategory || isCaceCategory;

    let matchedEntity: EntityRecord | null = null;
    let matchStatus: MatchedImportItem['match_status'] = 'UNMATCHED';
    let confidence = 0;
    const candidates: MatchedEntityCandidate[] = [];

    // 0. CERTIFIED ALIAS MATCH (Bordereaux MFFE certifiés)
    const categoryPrefix = isIfeCategory
      ? 'IFEF_'
      : isCaceCategory
      ? 'CACE_'
      : isCesCategory
      ? 'CES_'
      : isCppeCategory
      ? 'CPPE_'
      : cat
      ? `${cat}_`
      : '';
    const keyWithCategory = `${categoryPrefix}${normRaw}`;
    const aliasTargetId =
      CERTIFIED_ENTITY_ALIASES[keyWithCategory] ||
      CERTIFIED_ENTITY_ALIASES[normRaw] ||
      CERTIFIED_ENTITY_ALIASES[strippedRaw];

    if (aliasTargetId) {
      const found = preppedDb.find((d) => d.entity.id_entite === aliasTargetId);
      if (found) {
        matchedEntity = found.entity;
        matchStatus = 'EXACT';
        confidence = 100;
      }
    }

    // 1. EXACT MATCH on Name or ID or Sigle
    if (!matchedEntity) {
      for (const d of preppedDb) {
        if (d.normNom === normRaw || d.normId === normRaw || (d.normSigle && d.normSigle === normRaw)) {
          matchedEntity = d.entity;
          matchStatus = 'EXACT';
          confidence = 100;
          break;
        }
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
    if (rows.length === 0) return;
    const firstRow = rows[0];
    if (!firstRow) return;

    // Detect header row categories
    const headerRowCells = (firstRow.match(/<w:tc[\s\S]*?<\/w:tc>/g) || []).map((c) =>
      c.replace(/<[^>]+>/g, '').trim()
    );

    // Build category map by column pairs (e.g. Col 0: CPPE, Col 2: CACE, Col 4: CES, Col 6: IFEF)
    const colCategoryMap: Record<number, string> = {};
    for (let c = 0; c < headerRowCells.length; c += 2) {
      const colText = (headerRowCells[c] || '').toUpperCase();
      if (colText.includes('CPPE')) colCategoryMap[c] = 'CPPE';
      else if (colText.includes('CACE')) colCategoryMap[c] = 'CACE';
      else if (colText.includes('CES')) colCategoryMap[c] = 'CES';
      else if (colText.includes('IFEF')) colCategoryMap[c] = 'IFEF';
      else if (colText.includes('CRECHE') || colText.includes('GARDERIE')) colCategoryMap[c] = 'CRECHE';
      else colCategoryMap[c] = headerRowCells[c] || (c === 0 ? 'CPPE' : 'STRUCTURE');
    }

    rows.forEach((rowXml, rowIdx) => {
      if (rowIdx === 0) return; // Skip header row

      const cells = (rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || []).map((c) =>
        c.replace(/<[^>]+>/g, '').trim()
      );

      // Skip summary or total rows
      const firstCell = (cells[0] || '').toUpperCase();
      if (firstCell.startsWith('TOTAL') || firstCell.startsWith('=SUM') || firstCell.startsWith('=')) {
        return;
      }

      // Check all paired columns: (0, 1), (2, 3), (4, 5), (6, 7)...
      for (let c = 0; c < cells.length; c += 2) {
        const rawName = cells[c];
        const qtyStr = cells[c + 1];
        if (!rawName || !qtyStr) continue;

        const upperName = rawName.toUpperCase();
        if (upperName === 'TOTAL' || upperName.startsWith('=') || upperName === '-' || upperName === '') {
          continue;
        }

        const qty = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(qty) && qty > 0) {
          const category = colCategoryMap[c] || (c === 0 ? 'CPPE' : c === 2 ? 'CACE' : c === 4 ? 'CES' : 'IFEF');
          entries.push({
            source_category: category,
            raw_name: rawName,
            quantite: qty,
            source_row_index: rowIdx + 1,
          });
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

  // Case A: Paired multi-column format (e.g. CPPE/TOTAL, CACE/TOTAL, CES/TOTAL, IFEF/TOTAL)
  const headerCells = (rawData[0] || []).map((c) => (c ? c.toString().trim() : ''));
  const headerUpper = headerCells.map((c) => c.toUpperCase());
  const hasPairedCategories =
    headerUpper.some((c) => c.includes('CPPE')) ||
    headerUpper.some((c) => c.includes('CACE')) ||
    headerUpper.some((c) => c.includes('CES')) ||
    headerUpper.some((c) => c.includes('IFEF'));

  if (hasPairedCategories && headerCells.length >= 2) {
    const colCategoryMap: Record<number, string> = {};
    for (let c = 0; c < headerCells.length; c += 2) {
      const colText = headerUpper[c] || '';
      if (colText.includes('CPPE')) colCategoryMap[c] = 'CPPE';
      else if (colText.includes('CACE')) colCategoryMap[c] = 'CACE';
      else if (colText.includes('CES')) colCategoryMap[c] = 'CES';
      else if (colText.includes('IFEF')) colCategoryMap[c] = 'IFEF';
      else if (colText.includes('CRECHE') || colText.includes('GARDERIE')) colCategoryMap[c] = 'CRECHE';
      else colCategoryMap[c] = headerCells[c] || 'STRUCTURE';
    }

    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r] || [];
      const firstVal = (row[0] || '').toString().trim().toUpperCase();
      if (firstVal.startsWith('TOTAL') || firstVal.startsWith('=SUM') || firstVal.startsWith('=')) continue;

      for (let c = 0; c < row.length; c += 2) {
        const rawName = row[c] ? row[c].toString().trim() : '';
        const qtyStr = row[c + 1] !== undefined ? row[c + 1].toString() : '';
        if (!rawName || !qtyStr) continue;

        const upperName = rawName.toUpperCase();
        if (upperName === 'TOTAL' || upperName.startsWith('=') || upperName === '-') continue;

        const qty = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(qty) && qty > 0) {
          const category = colCategoryMap[c] || (c === 0 ? 'CPPE' : c === 2 ? 'CACE' : c === 4 ? 'CES' : 'IFEF');
          entries.push({
            source_category: category,
            raw_name: rawName,
            quantite: qty,
            source_row_index: r + 1,
          });
        }
      }
    }

    if (entries.length > 0) {
      return entries;
    }
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
