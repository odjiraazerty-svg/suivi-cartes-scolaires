import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { query } from '@/lib/db';

export interface StructureDispoRecord {
  code_nature: string;
  libelle_nature: string;
  id_entite: string;
  nom_entite: string;
  sigle: string | null;
  localisation: string | null;
  solde_stock_disponible: number;
  dr_nom: string;
  dr_sigle: string | null;
}

export const NATURE_SORT_ORDER: Record<string, number> = {
  'CACE': 10,
  'CPPE': 20,
  'CES': 30,
  'POUPONNIERE': 40,
  'CRECHE  GARDERIE': 50,
  'CRECHE GARDERIE': 50,
  'COMPLEXE': 60,
  'IFEF': 99,
};

function escapeXml(unsafe: string | number | null | undefined): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Récupère depuis la base de données toutes les structures ayant des cartes disponibles (solde_stock_disponible > 0)
 */
export async function getStructuresWithAvailableStock(
  filterNature?: string | null,
  anneeScolaire?: string | null
): Promise<StructureDispoRecord[]> {
  const cleanAnnee = anneeScolaire ? anneeScolaire.replace(/\s+/g, '') : null;
  let sql = `
    WITH recu AS (
      SELECT id_entite, COALESCE(SUM(quantite_recue), 0)::int as total_recu
      FROM reception_carte
      WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)
      GROUP BY id_entite
    ),
    livre AS (
      SELECT id_entite, COALESCE(SUM(quantite_livree), 0)::int as total_livre
      FROM livraison_carte
      WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)
      GROUP BY id_entite
    ),
    bilan AS (
      SELECT e.id_entite,
             GREATEST(0, COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) as solde_stock_disponible
      FROM entite e
      LEFT JOIN recu r ON e.id_entite = r.id_entite
      LEFT JOIN livre l ON e.id_entite = l.id_entite
    )
    SELECT 
      COALESCE(n.id_nature, e.id_nature) as code_nature,
      COALESCE(n.libelle, e.id_nature) as libelle_nature,
      e.id_entite,
      COALESCE(e.nom, e.id_entite) as nom_entite,
      e.sigle,
      e.localisation,
      b.solde_stock_disponible,
      COALESCE(
        dr.nom, 
        CASE 
          WHEN e.localisation ILIKE '%ABIDJAN%' THEN 'Direction Régionale Abidjan'
          ELSE 'Direction Régionale ' || COALESCE(e.localisation, 'Non spécifiée')
        END
      ) as dr_nom,
      dr.sigle as dr_sigle
    FROM bilan b
    JOIN entite e ON b.id_entite = e.id_entite
    LEFT JOIN nature_entite n ON UPPER(TRIM(e.id_nature)) = UPPER(TRIM(n.id_nature))
    LEFT JOIN entite dr ON e.id_entite_parent = dr.id_entite
    WHERE b.solde_stock_disponible > 0
  `;
  const params: any[] = [anneeScolaire || null, cleanAnnee];
  if (filterNature && filterNature !== 'ALL') {
    params.push(filterNature.toUpperCase().trim());
    sql += ` AND UPPER(TRIM(COALESCE(n.id_nature, e.id_nature))) = $3`;
  }
  sql += ` ORDER BY dr_nom ASC, code_nature ASC, nom_entite ASC`;

  const rows = await query<any>(sql, params);
  return rows.map((r) => ({
    code_nature: r.code_nature,
    libelle_nature: r.libelle_nature,
    id_entite: r.id_entite,
    nom_entite: r.nom_entite,
    sigle: r.sigle,
    localisation: r.localisation,
    solde_stock_disponible: Number(r.solde_stock_disponible || 0),
    dr_nom: r.dr_nom,
    dr_sigle: r.dr_sigle,
  }));
}

/**
 * Regroupe les structures par Direction Régionale avec tri groupé par Nature (CACE, CPPE, CES, POUPONNIERE, IFEF...)
 */
export function groupStructuresByDr(records: StructureDispoRecord[]): Map<string, StructureDispoRecord[]> {
  const drMap = new Map<string, StructureDispoRecord[]>();
  for (const r of records) {
    const dr = r.dr_nom;
    if (!drMap.has(dr)) {
      drMap.set(dr, []);
    }
    drMap.get(dr)!.push(r);
  }

  // Tri au sein de chaque Direction Régionale : par nature (CACE, CPPE, CES, POUPONNIERE, IFEF...) puis par nom
  for (const [_, structures] of drMap.entries()) {
    structures.sort((a, b) => {
      const natA = (a.code_nature || '').toUpperCase().trim();
      const natB = (b.code_nature || '').toUpperCase().trim();
      const orderA = NATURE_SORT_ORDER[natA] ?? 70;
      const orderB = NATURE_SORT_ORDER[natB] ?? 70;
      if (orderA !== orderB) return orderA - orderB;
      return a.nom_entite.localeCompare(b.nom_entite, 'fr');
    });
  }

  return drMap;
}

/**
 * Génère le document Word (.docx) reprenant exactement la mise en forme du fichier 'DISPONIBILITE DES CARTES SCOLAIRES.docx' :
 * - Liste groupée par Direction Régionale (CACE, CPPE, CES, POUPONNIERE, IFEF...)
 * - Lignes IFEF en fond orange (#FCE4D6) et texte accentué orange (#C65911)
 * - Lignes autres natures en fond vert (#E2EFD9) et texte accentué vert (#274E13)
 * - Aucun saut de page forcé entre régions : keepNext et cantSplit permettent à Word de ne passer à la page suivante que si la feuille ne suffit pas pour accueillir une région entière.
 */
export async function generateDisponibiliteDocx(
  filterNature?: string | null,
  anneeScolaire?: string | null
): Promise<Buffer> {
  const records = await getStructuresWithAvailableStock(filterNature, anneeScolaire);
  const drMap = groupStructuresByDr(records);

  // Charger le modèle original DISPONIBILITE DES CARTES SCOLAIRES.docx
  const templatePath = path.join(process.cwd(), 'DISPONIBILITE DES CARTES SCOLAIRES.docx');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Modèle introuvable: ${templatePath}`);
  }
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  const grandTotal = records.reduce((s, x) => s + Number(x.solde_stock_disponible), 0);
  const isFiltered = Boolean(filterNature && filterNature !== 'ALL');
  const docTitle = isFiltered
    ? `LISTE DES ${escapeXml(filterNature!.toUpperCase())} AYANT DES CARTES PRESCOLAIRES / SCOLAIRES DISPONIBLES`
    : `LISTE DES STRUCTURES AYANT DES CARTES PRESCOLAIRES / SCOLAIRES DISPONIBLES`;

  const docSubtitle = isFiltered
    ? `Récapitulatif par Direction Régionale • ${records.length} structures • Total disponible : ${grandTotal.toLocaleString('fr-FR')} cartes`
    : `Récapitulatif groupé par Direction Régionale (CACE, CPPE, CES, POUPONNIERE, COMPLEXE, IFEF...) • Lignes IFEF en orange et autres natures en vert`;

  let bodyXml = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Titre1"/>
        <w:jc w:val="center"/>
        <w:keepNext/>
        <w:keepLines/>
        <w:spacing w:before="120" w:after="140"/>
        <w:rPr>
          <w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorHAnsi"/>
          <w:b/>
          <w:noProof/>
          <w:color w:val="000000" w:themeColor="text1"/>
          <w:sz w:val="26"/>
          <w:szCs w:val="26"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorHAnsi"/>
          <w:b/>
          <w:noProof/>
          <w:color w:val="000000" w:themeColor="text1"/>
          <w:sz w:val="26"/>
          <w:szCs w:val="26"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
        <w:t>${escapeXml(docTitle)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:keepNext/>
        <w:keepLines/>
        <w:spacing w:before="0" w:after="220"/>
        <w:rPr>
          <w:i/>
          <w:color w:val="595959"/>
          <w:sz w:val="18"/>
          <w:szCs w:val="18"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="595959"/>
          <w:sz w:val="18"/>
          <w:szCs w:val="18"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
        <w:t>${escapeXml(docSubtitle)}</w:t>
      </w:r>
    </w:p>
  `;

  for (const [drName, structures] of drMap.entries()) {
    const drDisplayName = drName
      .toUpperCase()
      .replace(/^DIRECTION\s+R[ÉE]GIONALE\s*(DE\s*|DU\s*|D'\s*|DES\s*)?/i, '')
      .trim();

    // En-tête Direction Régionale avec keepNext (ne jamais séparer la DR de son tableau)
    bodyXml += `
      <w:p>
        <w:pPr>
          <w:jc w:val="both"/>
          <w:keepNext/>
          <w:keepLines/>
          <w:spacing w:before="240" w:after="100"/>
          <w:rPr>
            <w:b/>
            <w:noProof/>
            <w:sz w:val="22"/>
            <w:szCs w:val="22"/>
            <w:lang w:eastAsia="fr-FR"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:noProof/>
            <w:sz w:val="22"/>
            <w:szCs w:val="22"/>
            <w:lang w:eastAsia="fr-FR"/>
          </w:rPr>
          <w:t xml:space="preserve">DIRECTION REGIONALE : ${escapeXml(drDisplayName)}</w:t>
        </w:r>
      </w:p>
    `;

    // Ligne d'en-tête du tableau (Vert thème Accent 6 #70AD47, texte blanc centré)
    let tableRowsXml = `
      <w:tr>
        <w:trPr>
          <w:cnfStyle w:val="100000000000" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:oddVBand="0" w:evenVBand="0" w:oddHBand="0" w:evenHBand="0" w:firstRowFirstColumn="0" w:firstRowLastColumn="0" w:lastRowFirstColumn="0" w:lastRowLastColumn="0"/>
          <w:tblHeader/>
          <w:cantSplit/>
          <w:keepNext/>
          <w:trHeight w:val="489"/>
        </w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="400" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>N°</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="850" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>NATURE</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3300" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>STRUCTURES</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="901" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>CARTES DISPONIBLES</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    `;

    let totalDrCartes = 0;
    structures.forEach((st, sIdx) => {
      const qte = Number(st.solde_stock_disponible);
      totalDrCartes += qte;
      const isIfeF = (st.code_nature || '').toUpperCase().trim() === 'IFEF';

      // Couleur des lignes : IFEF en orange (#FCE4D6), les autres natures en vert (#E2EFD9)
      const fillColor = isIfeF ? 'FCE4D6' : 'E2EFD9';
      const borderColor = isIfeF ? 'F4B084' : 'A8D08D';
      const textColor = isIfeF ? 'C65911' : '274E13';

      tableRowsXml += `
        <w:tr>
          <w:trPr>
            <w:cantSplit/>
            <w:keepNext/>
            <w:trHeight w:val="320"/>
          </w:trPr>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="400" w:type="pct"/>
              <w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
              </w:tcBorders>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:keepNext/>
                <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
                <w:t>${sIdx + 1}</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="850" w:type="pct"/>
              <w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
              </w:tcBorders>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:keepNext/>
                <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
                <w:t>${escapeXml(st.code_nature)}</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="3300" w:type="pct"/>
              <w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
              </w:tcBorders>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="left"/>
                <w:keepNext/>
                <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
                <w:t>${escapeXml(st.nom_entite)}</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="901" w:type="pct"/>
              <w:shd w:val="clear" w:color="auto" w:fill="${fillColor}"/>
              <w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="${borderColor}"/>
              </w:tcBorders>
            </w:tcPr>
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:keepNext/>
                <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
                <w:t>${qte.toLocaleString('fr-FR')}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
      `;
    });

    // Ligne Récapitulative / Total de la Direction Régionale (cantSplit, sans keepNext)
    tableRowsXml += `
      <w:tr>
        <w:trPr>
          <w:cantSplit/>
          <w:trHeight w:val="380"/>
        </w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="400" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
            <w:tcBorders>
              <w:top w:val="double" w:sz="8" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>—</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:gridSpan w:val="2"/>
            <w:tcW w:w="4150" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
            <w:tcBorders>
              <w:top w:val="double" w:sz="8" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="right"/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>TOTAL CARTES DISPONIBLES (${escapeXml(drDisplayName)}) :</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="901" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
            <w:tcBorders>
              <w:top w:val="double" w:sz="8" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="274E13"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="274E13"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>${totalDrCartes.toLocaleString('fr-FR')}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    `;

    // Tableau de la région
    bodyXml += `
      <w:tbl>
        <w:tblPr>
          <w:tblStyle w:val="TableauGrille4-Accentuation6"/>
          <w:tblW w:w="5451" w:type="pct"/>
          <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="1" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="700"/>
          <w:gridCol w:w="1600"/>
          <w:gridCol w:w="6500"/>
          <w:gridCol w:w="1900"/>
        </w:tblGrid>
        ${tableRowsXml}
      </w:tbl>
      <w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>
    `;
  }

  // Tableau Récapitulatif Global National à la fin
  bodyXml += `
    <w:p><w:pPr><w:spacing w:before="240" w:after="120"/><w:keepNext/><w:keepLines/></w:pPr></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5451" w:type="pct"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8800"/>
        <w:gridCol w:w="1900"/>
      </w:tblGrid>
      <w:tr>
        <w:trPr><w:cantSplit/><w:trHeight w:val="420"/></w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="4550" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="right"/>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>TOTAL GÉNÉRAL NATIONAL (${drMap.size} DIRECTIONS RÉGIONALES) :</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="901" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="70AD47"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="70AD47"/>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="70AD47"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>${grandTotal.toLocaleString('fr-FR')}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  `;

  // Propriétés globales de la section (Page A4 portrait, marges conformes)
  bodyXml += `
    <w:sectPr w:rsidR="00CE0CE9" w:rsidSect="009712CE">
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="709" w:right="1417" w:bottom="1417" w:left="567" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  `;

  const fullDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 wp14">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', fullDocumentXml);
  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * Génère le classeur Excel (.xlsx) avec la même présentation :
 * - Liste groupée par Direction Régionale (CACE, CPPE, CES, POUPONNIERE, IFEF...)
 * - Lignes IFEF en fond orange (#FFFCE4D6) et texte accentué orange (#FFC65911)
 * - Lignes autres natures en fond vert (#FFE2EFD9) et texte accentué vert (#FF274E13)
 * - Grille tabulaire stylisée avec totaux par région et total général
 */
export async function generateDisponibiliteExcel(
  filterNature?: string | null,
  anneeScolaire?: string | null
): Promise<Buffer> {
  const records = await getStructuresWithAvailableStock(filterNature, anneeScolaire);
  const drMap = groupStructuresByDr(records);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MFFE - Suivi des Cartes Scolaires';
  workbook.lastModifiedBy = 'MFFE DRH';
  workbook.created = new Date();
  workbook.modified = new Date();

  const ws = workbook.addWorksheet('Disponibilité Cartes', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.6,
        bottom: 0.6,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // Définition des largeurs de colonnes
  ws.columns = [
    { key: 'num', width: 8 },
    { key: 'nature', width: 16 },
    { key: 'structure', width: 62 },
    { key: 'cartes', width: 22 },
  ];

  let currentRow = 1;

  const isFiltered = Boolean(filterNature && filterNature !== 'ALL');
  const grandTotal = records.reduce((s, x) => s + Number(x.solde_stock_disponible), 0);

  const excelTitle = isFiltered
    ? `LISTE DES ${filterNature!.toUpperCase()} AYANT DES CARTES PRESCOLAIRES / SCOLAIRES DISPONIBLES`
    : `LISTE DES STRUCTURES AYANT DES CARTES PRESCOLAIRES / SCOLAIRES DISPONIBLES`;

  const excelSubtitle = isFiltered
    ? `Récapitulatif par Direction Régionale • ${records.length} structures • Total disponible : ${grandTotal.toLocaleString('fr-FR')} cartes`
    : `Récapitulatif groupé par Direction Régionale (CACE, CPPE, CES, POUPONNIERE, COMPLEXE, IFEF...) • Lignes IFEF en orange et autres natures en vert`;

  // Titre général
  const titleRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:D${currentRow}`);
  titleRow.getCell(1).value = excelTitle;
  titleRow.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;
  currentRow++;

  // Sous-titre
  const subRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:D${currentRow}`);
  subRow.getCell(1).value = excelSubtitle;
  subRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };
  subRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  subRow.height = 20;
  currentRow++;

  // Espace après le sous-titre
  currentRow++;

  for (const [drName, structures] of drMap.entries()) {
    const drDisplayName = drName
      .toUpperCase()
      .replace(/^DIRECTION\s+R[ÉE]GIONALE\s*(DE\s*|DU\s*|D'\s*|DES\s*)?/i, '')
      .trim();

    // Direction Régionale
    const drRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    drRow.getCell(1).value = `DIRECTION REGIONALE : ${drDisplayName}`;
    drRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    drRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };
    drRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    drRow.height = 22;
    currentRow++;

    // En-têtes du tableau (Vert thème Word #70AD47)
    const headerRow = ws.getRow(currentRow);
    headerRow.values = ['N°', 'NATURE', 'STRUCTURES', 'CARTES DISPONIBLES'];
    headerRow.height = 24;
    for (let col = 1; col <= 4; col++) {
      const cell = headerRow.getCell(col);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' },
      };
      cell.alignment = {
        horizontal: col === 3 ? 'left' : 'center',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF70AD47' } },
        bottom: { style: 'thin', color: { argb: 'FF70AD47' } },
        left: { style: 'thin', color: { argb: 'FF70AD47' } },
        right: { style: 'thin', color: { argb: 'FF70AD47' } },
      };
    }
    currentRow++;

    // Lignes de données
    let totalDrCartes = 0;
    structures.forEach((st, sIdx) => {
      const qte = Number(st.solde_stock_disponible);
      totalDrCartes += qte;
      const isIfeF = (st.code_nature || '').toUpperCase().trim() === 'IFEF';

      const row = ws.getRow(currentRow);
      row.values = [sIdx + 1, st.code_nature, st.nom_entite, qte];
      row.height = 20;

      // IFEF en orange clair / autres en vert clair
      const fillColor = isIfeF ? 'FFFCE4D6' : 'FFE2EFD9';
      const borderColor = isIfeF ? 'FFF4B084' : 'FFA8D08D';
      const textColor = isIfeF ? 'FFC65911' : 'FF274E13';

      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: col === 2 || col === 4,
          color: { argb: col === 3 ? 'FF000000' : textColor },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        cell.alignment = {
          horizontal: col === 1 ? 'center' : col === 2 ? 'center' : col === 3 ? 'left' : 'center',
          vertical: 'middle',
        };
        cell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } },
        };
        if (col === 4) {
          cell.numFmt = '#,##0';
        }
      }
      currentRow++;
    });

    // Ligne Total Région
    const totalRow = ws.getRow(currentRow);
    ws.mergeCells(`B${currentRow}:C${currentRow}`);
    totalRow.getCell(1).value = '—';
    totalRow.getCell(2).value = `TOTAL CARTES DISPONIBLES (${drDisplayName}) :`;
    totalRow.getCell(4).value = totalDrCartes;
    totalRow.height = 24;

    for (let col = 1; col <= 4; col++) {
      const cell = totalRow.getCell(col);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF274E13' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
      cell.alignment = {
        horizontal: col === 1 ? 'center' : col === 2 || col === 3 ? 'right' : 'center',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'double', color: { argb: 'FF70AD47' } },
        bottom: { style: 'thin', color: { argb: 'FF70AD47' } },
        left: { style: 'thin', color: { argb: 'FF70AD47' } },
        right: { style: 'thin', color: { argb: 'FF70AD47' } },
      };
      if (col === 4) {
        cell.numFmt = '#,##0';
      }
    }
    currentRow++;

    // Espace de 2 lignes entre les régions
    currentRow += 2;
  }

  // Grand Total Récapitulatif
  const grandTotalRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:C${currentRow}`);
  grandTotalRow.getCell(1).value = `TOTAL GÉNÉRAL NATIONAL (${drMap.size} DIRECTIONS RÉGIONALES) :`;
  grandTotalRow.getCell(4).value = grandTotal;
  grandTotalRow.height = 26;

  for (let col = 1; col <= 4; col++) {
    const cell = grandTotalRow.getCell(col);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    cell.alignment = {
      horizontal: col === 4 ? 'center' : 'right',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF70AD47' } },
      bottom: { style: 'double', color: { argb: 'FF70AD47' } },
      left: { style: 'thin', color: { argb: 'FF70AD47' } },
      right: { style: 'thin', color: { argb: 'FF70AD47' } },
    };
    if (col === 4) {
      cell.numFmt = '#,##0';
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
