import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { query } from './db';

export interface ActiviteJourExportItem {
  id_entite: string;
  nom_entite?: string;
  quantite: number;
  id_nature?: string;
  region: string;
  date_operation: string;
  annee_scolaire?: string;
}

export const NATURE_SORT_ORDER: Record<string, number> = {
  IFEF: 10,
  CPPE: 20,
  POUPONNIERE: 25,
  CACE: 30,
  CRECHE: 40,
  CES: 50,
  COMPLEXE: 60,
  AUTRE: 70,
};

function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Récupère les données d'activité du jour groupées pour l'export
 */
export async function getActiviteJourItems(
  type: 'receptions' | 'livraisons',
  targetDate: string,
  anneeScolaire?: string | null
): Promise<ActiviteJourExportItem[]> {
  const cleanAnnee = anneeScolaire ? anneeScolaire.replace(/\s+/g, '') : null;

  if (type === 'receptions') {
    const rows = await query<any>(
      `SELECT r.id_entite, r.quantite_recue as quantite, r.date_reception as date_op, r.annee_scolaire,
              e.nom as nom_entite, e.id_nature,
              e.id_entite_parent, dr.nom as nom_parent,
              COALESCE(
                dr.nom, 
                CASE 
                  WHEN e.localisation ILIKE '%ABIDJAN%' THEN 'Direction Régionale Abidjan'
                  ELSE 'Direction Régionale ' || COALESCE(e.localisation, 'Non précisée')
                END
              ) as region
       FROM reception_carte r
       JOIN entite e ON r.id_entite = e.id_entite
       LEFT JOIN entite dr ON e.id_entite_parent = dr.id_entite
       WHERE r.date_reception = $1
         AND ($2::text IS NULL OR r.annee_scolaire = $2 OR replace(r.annee_scolaire, ' ', '') = $3)
       ORDER BY region ASC, e.id_nature DESC, r.id_entite ASC`,
      [targetDate, anneeScolaire || null, cleanAnnee]
    );

    return rows.map((r) => ({
      id_entite: r.id_entite,
      nom_entite: r.nom_entite,
      quantite: parseInt(r.quantite || '0', 10),
      id_nature: (r.id_nature || '').toUpperCase().trim(),
      region: r.region,
      date_operation: r.date_op,
      annee_scolaire: r.annee_scolaire,
    }));
  } else {
    const rows = await query<any>(
      `SELECT l.id_entite, l.quantite_livree as quantite, l.date_livraison as date_op, l.annee_scolaire,
              e.nom as nom_entite, e.id_nature,
              e.id_entite_parent, dr.nom as nom_parent,
              COALESCE(
                dr.nom, 
                CASE 
                  WHEN e.localisation ILIKE '%ABIDJAN%' THEN 'Direction Régionale Abidjan'
                  ELSE 'Direction Régionale ' || COALESCE(e.localisation, 'Non précisée')
                END
              ) as region
       FROM livraison_carte l
       JOIN entite e ON l.id_entite = e.id_entite
       LEFT JOIN entite dr ON e.id_entite_parent = dr.id_entite
       WHERE l.date_livraison = $1
         AND ($2::text IS NULL OR l.annee_scolaire = $2 OR replace(l.annee_scolaire, ' ', '') = $3)
       ORDER BY region ASC, e.id_nature DESC, l.id_entite ASC`,
      [targetDate, anneeScolaire || null, cleanAnnee]
    );

    return rows.map((r) => ({
      id_entite: r.id_entite,
      nom_entite: r.nom_entite,
      quantite: parseInt(r.quantite || '0', 10),
      id_nature: (r.id_nature || '').toUpperCase().trim(),
      region: r.region,
      date_operation: r.date_op,
      annee_scolaire: r.annee_scolaire,
    }));
  }
}

/**
 * Regroupe les structures par Direction Régionale
 */
export function groupItemsByRegion(items: ActiviteJourExportItem[]): Map<string, ActiviteJourExportItem[]> {
  const map = new Map<string, ActiviteJourExportItem[]>();

  for (const item of items) {
    const reg = item.region || 'Direction Régionale Non Précisée';
    if (!map.has(reg)) {
      map.set(reg, []);
    }
    map.get(reg)!.push(item);
  }

  // Tri interne par Nature (IFEF en premier, puis CPPE, etc.) puis par ID STRUCTURE
  for (const [_, list] of map.entries()) {
    list.sort((a, b) => {
      const orderA = NATURE_SORT_ORDER[a.id_nature || 'AUTRE'] ?? 70;
      const orderB = NATURE_SORT_ORDER[b.id_nature || 'AUTRE'] ?? 70;
      if (orderA !== orderB) return orderA - orderB;
      return a.id_entite.localeCompare(b.id_entite, 'fr');
    });
  }

  return map;
}

/**
 * Génère le fichier Word (.docx) avec :
 * - Uniquement 2 colonnes : "ID STRUCTURE" et "QUANTITE"
 * - Ordonné / groupé par Région
 * - Lignes IFEF en orange (fond #FCE4D6, texte #C65911)
 * - Lignes autres natures en vert (fond #E2EFD9, texte #274E13)
 * - Sous-totaux par région et total général
 */
export async function generateActiviteJourDocx(
  type: 'receptions' | 'livraisons',
  targetDate: string,
  anneeScolaire?: string | null
): Promise<Buffer> {
  const items = await getActiviteJourItems(type, targetDate, anneeScolaire);
  const regionMap = groupItemsByRegion(items);

  // Charger le modèle de base DOCX existant dans le projet
  const templatePath = path.join(process.cwd(), 'DISPONIBILITE DES CARTES SCOLAIRES.docx');
  let zip: JSZip;
  if (fs.existsSync(templatePath)) {
    const templateBuffer = fs.readFileSync(templatePath);
    zip = await JSZip.loadAsync(templateBuffer);
  } else {
    zip = new JSZip();
  }

  const isReceptions = type === 'receptions';
  const opTitle = isReceptions ? 'RÉCEPTIONS' : 'DISTRIBUTIONS';
  const grandTotal = items.reduce((s, x) => s + x.quantite, 0);

  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : targetDate;

  const docTitle = `DÉTAIL DES ${opTitle} DU JOUR (${formattedDate.toUpperCase()})`;
  const docSubtitle = `Année Scolaire : ${anneeScolaire || '2026-2027'} • ${items.length} structures • Total : ${grandTotal.toLocaleString('fr-FR')} cartes`;

  let bodyXml = `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Titre1"/>
        <w:jc w:val="center"/>
        <w:keepNext/>
        <w:keepLines/>
        <w:spacing w:before="120" w:after="100"/>
        <w:rPr>
          <w:b/>
          <w:color w:val="000000"/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:color w:val="000000"/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
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
        <w:spacing w:before="0" w:after="200"/>
        <w:rPr>
          <w:i/>
          <w:color w:val="595959"/>
          <w:sz w:val="20"/>
          <w:szCs w:val="20"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:color w:val="595959"/>
          <w:sz w:val="20"/>
          <w:szCs w:val="20"/>
          <w:lang w:eastAsia="fr-FR"/>
        </w:rPr>
        <w:t>${escapeXml(docSubtitle)}</w:t>
      </w:r>
    </w:p>
  `;

  for (const [regionName, regItems] of regionMap.entries()) {
    const regDisplayName = regionName
      .toUpperCase()
      .replace(/^DIRECTION\s+R[ÉE]GIONALE\s*(DE\s*|DU\s*|D'\s*|DES\s*)?/i, '')
      .trim();

    const regSubtotal = regItems.reduce((acc, x) => acc + x.quantite, 0);

    bodyXml += `
      <w:p>
        <w:pPr>
          <w:jc w:val="both"/>
          <w:keepNext/>
          <w:keepLines/>
          <w:spacing w:before="240" w:after="80"/>
          <w:rPr>
            <w:b/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
            <w:lang w:eastAsia="fr-FR"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:b/>
            <w:sz w:val="24"/>
            <w:szCs w:val="24"/>
            <w:lang w:eastAsia="fr-FR"/>
          </w:rPr>
          <w:t xml:space="preserve">DIRECTION REGIONALE : ${escapeXml(regDisplayName)} (Total : ${regSubtotal.toLocaleString('fr-FR')} cartes)</w:t>
        </w:r>
      </w:p>
    `;

    let tableRowsXml = `
      <w:tr>
        <w:trPr>
          <w:tblHeader/>
          <w:cantSplit/>
          <w:keepNext/>
          <w:trHeight w:val="420"/>
        </w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="4000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="203764"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="203764"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="left"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>ID STRUCTURE</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="203764"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="203764"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="203764"/>
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
              <w:t>QUANTITE</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    `;

    for (const item of regItems) {
      const isIfef = item.id_nature === 'IFEF' || item.id_entite.toUpperCase().includes('IFEF');
      const fillColor = isIfef ? 'FCE4D6' : 'E2EFD9';
      const textColor = isIfef ? 'C65911' : '274E13';
      const borderColor = isIfef ? 'F8CBAD' : 'C6E0B4';

      tableRowsXml += `
        <w:tr>
          <w:trPr>
            <w:cantSplit/>
            <w:keepNext/>
            <w:trHeight w:val="320"/>
          </w:trPr>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="4000" w:type="pct"/>
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
                <w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              </w:pPr>
              <w:r>
                <w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="${textColor}"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
                <w:t>${escapeXml(item.id_entite)}</w:t>
              </w:r>
            </w:p>
          </w:tc>
          <w:tc>
            <w:tcPr>
              <w:tcW w:w="1000" w:type="pct"/>
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
                <w:t>${item.quantite.toLocaleString('fr-FR')}</w:t>
              </w:r>
            </w:p>
          </w:tc>
        </w:tr>
      `;
    }

    // Sous-total régional
    tableRowsXml += `
      <w:tr>
        <w:trPr>
          <w:cantSplit/>
          <w:keepNext/>
          <w:trHeight w:val="340"/>
        </w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="4000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="right"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="595959"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="595959"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>Sous-total Direction Régionale :</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="D9D9D9"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
              <w:keepNext/>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>${regSubtotal.toLocaleString('fr-FR')}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    `;

    bodyXml += `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="5000" w:type="pct"/>
          <w:jc w:val="center"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="8000"/>
          <w:gridCol w:w="2000"/>
        </w:tblGrid>
        ${tableRowsXml}
      </w:tbl>
    `;
  }

  // Tableau Total Général National
  bodyXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:before="300" w:after="80"/>
        <w:keepNext/>
      </w:pPr>
    </w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:jc w:val="center"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="8000"/>
        <w:gridCol w:w="2000"/>
      </w:tblGrid>
      <w:tr>
        <w:trPr>
          <w:cantSplit/>
          <w:keepNext/>
          <w:trHeight w:val="450"/>
        </w:trPr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="4000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="0F172A"/>
            </w:tcBorders>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="right"/>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="FFFFFF"/><w:lang w:eastAsia="fr-FR"/></w:rPr>
              <w:t>TOTAL GÉNÉRAL DU JOUR (${regionMap.size} RÉGIONS) :</w:t>
            </w:r>
          </w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
            <w:tcBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>
              <w:bottom w:val="double" w:sz="12" w:space="0" w:color="0F172A"/>
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

  bodyXml += `
    <w:sectPr>
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
 * Génère le fichier Excel (.xlsx) avec :
 * - Uniquement 2 colonnes : "ID STRUCTURE" et "QUANTITE"
 * - Ordonné / groupé par Région
 * - Lignes IFEF en fond orange (#FFFCE4D6) et texte #FFC65911
 * - Lignes autres natures en fond vert (#FFE2EFD9) et texte #FF274E13
 * - Sous-totaux par région et total général
 */
export async function generateActiviteJourExcel(
  type: 'receptions' | 'livraisons',
  targetDate: string,
  anneeScolaire?: string | null
): Promise<Buffer> {
  const items = await getActiviteJourItems(type, targetDate, anneeScolaire);
  const regionMap = groupItemsByRegion(items);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MFFE - Suivi des Cartes Scolaires';
  workbook.lastModifiedBy = 'MFFE DRH';
  workbook.created = new Date();
  workbook.modified = new Date();

  const isReceptions = type === 'receptions';
  const opTitle = isReceptions ? 'Réceptions du Jour' : 'Distributions du Jour';
  const grandTotal = items.reduce((s, x) => s + x.quantite, 0);

  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : targetDate;

  const ws = workbook.addWorksheet(isReceptions ? 'Réceptions Jour' : 'Distributions Jour', {
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  });

  // Strictement 2 colonnes
  ws.columns = [
    { key: 'id_structure', width: 55 },
    { key: 'quantite', width: 22 },
  ];

  let currentRow = 1;

  // Titre principal
  const titleRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:B${currentRow}`);
  titleRow.getCell(1).value = `DÉTAIL DES ${isReceptions ? 'RÉCEPTIONS' : 'DISTRIBUTIONS'} DU JOUR — ${formattedDate.toUpperCase()}`;
  titleRow.getCell(1).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isReceptions ? 'FF065F46' : 'FF9A3412' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 28;
  currentRow++;

  // Sous-titre
  const subRow = ws.getRow(currentRow);
  ws.mergeCells(`A${currentRow}:B${currentRow}`);
  subRow.getCell(1).value = `Année Scolaire : ${anneeScolaire || '2026-2027'} • ${items.length} structure(s) concernée(s) • Total : ${grandTotal.toLocaleString('fr-FR')} cartes`;
  subRow.getCell(1).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  subRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  subRow.height = 20;
  currentRow++;

  currentRow++; // Ligne vide

  for (const [regionName, regItems] of regionMap.entries()) {
    const regDisplayName = regionName
      .toUpperCase()
      .replace(/^DIRECTION\s+R[ÉE]GIONALE\s*(DE\s*|DU\s*|D'\s*|DES\s*)?/i, '')
      .trim();

    const regSubtotal = regItems.reduce((acc, x) => acc + x.quantite, 0);

    // En-tête Région
    const drRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    drRow.getCell(1).value = `DIRECTION REGIONALE : ${regDisplayName}`;
    drRow.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    drRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    drRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    drRow.height = 22;
    currentRow++;

    // En-têtes colonnes (2 colonnes uniquement)
    const headerRow = ws.getRow(currentRow);
    headerRow.values = ['ID STRUCTURE', isReceptions ? 'QUANTITÉ REÇUE' : 'QUANTITÉ LIVRÉE'];
    headerRow.height = 22;
    headerRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: colNum === 2 ? 'center' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E293B' } },
        bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
        left: { style: 'thin', color: { argb: 'FF1E293B' } },
        right: { style: 'thin', color: { argb: 'FF1E293B' } },
      };
    });
    currentRow++;

    // Lignes de données
    for (const item of regItems) {
      const isIfef = item.id_nature === 'IFEF' || item.id_entite.toUpperCase().includes('IFEF');
      const dataRow = ws.getRow(currentRow);
      dataRow.values = [item.id_entite, item.quantite];
      dataRow.height = 20;

      const fillColor = isIfef ? 'FFFCE4D6' : 'FFE2EFD9';
      const textColor = isIfef ? 'FFC65911' : 'FF274E13';
      const borderColor = isIfef ? 'FFF8CBAD' : 'FFC6E0B4';

      dataRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: textColor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } },
        };
        if (colNum === 2) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        }
      });
      currentRow++;
    }

    // Sous-total régional
    const subtotalRow = ws.getRow(currentRow);
    subtotalRow.values = [`Sous-total ${regDisplayName} :`, regSubtotal];
    subtotalRow.height = 21;
    subtotalRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (colNum === 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '#,##0';
      }
    });
    currentRow++;

    currentRow++; // Espace entre régions
  }

  // Total Général
  const totalRow = ws.getRow(currentRow);
  totalRow.values = [`TOTAL GÉNÉRAL (${regionMap.size} DIRECTIONS RÉGIONALES) :`, grandTotal];
  totalRow.height = 25;
  totalRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
    if (colNum === 1) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '#,##0';
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Génère le code HTML complet pour l'impression ou l'exportation PDF direct
 */
export async function generateActiviteJourHtml(
  type: 'receptions' | 'livraisons',
  targetDate: string,
  anneeScolaire?: string | null
): Promise<string> {
  const items = await getActiviteJourItems(type, targetDate, anneeScolaire);
  const regionMap = groupItemsByRegion(items);

  const isReceptions = type === 'receptions';
  const opTitle = isReceptions ? 'RÉCEPTIONS' : 'DISTRIBUTIONS';
  const grandTotal = items.reduce((s, x) => s + x.quantite, 0);

  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : targetDate;

  let tablesHtml = '';

  for (const [regionName, regItems] of regionMap.entries()) {
    const regDisplayName = regionName
      .toUpperCase()
      .replace(/^DIRECTION\s+R[ÉE]GIONALE\s*(DE\s*|DU\s*|D'\s*|DES\s*)?/i, '')
      .trim();

    const regSubtotal = regItems.reduce((acc, x) => acc + x.quantite, 0);

    let rowsHtml = '';
    for (const item of regItems) {
      const isIfef = item.id_nature === 'IFEF' || item.id_entite.toUpperCase().includes('IFEF');
      const bgClass = isIfef ? 'bg-[#FCE4D6] text-[#C65911]' : 'bg-[#E2EFD9] text-[#274E13]';
      const borderClass = isIfef ? 'border-[#F8CBAD]' : 'border-[#C6E0B4]';

      rowsHtml += `
        <tr style="background-color: ${isIfef ? '#FCE4D6' : '#E2EFD9'}; color: ${isIfef ? '#C65911' : '#274E13'}; border-bottom: 1px solid ${isIfef ? '#F8CBAD' : '#C6E0B4'};">
          <td style="padding: 7px 12px; font-weight: bold; text-align: left;">${escapeXml(item.id_entite)}</td>
          <td style="padding: 7px 12px; font-weight: bold; text-align: center;">${item.quantite.toLocaleString('fr-FR')}</td>
        </tr>
      `;
    }

    tablesHtml += `
      <div style="margin-top: 20px; page-break-inside: avoid;">
        <div style="background-color: #F1F5F9; border-left: 4px solid #203764; padding: 6px 12px; font-weight: bold; font-size: 13px; color: #0F172A; text-transform: uppercase;">
          DIRECTION RÉGIONALE : ${escapeXml(regDisplayName)} 
          <span style="float: right; color: #475569; font-weight: 600;">Total : ${regSubtotal.toLocaleString('fr-FR')} cartes</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; font-family: 'Segoe UI', Calibri, Arial, sans-serif;">
          <thead>
            <tr style="background-color: #203764; color: #FFFFFF;">
              <th style="padding: 8px 12px; text-align: left; width: 80%;">ID STRUCTURE</th>
              <th style="padding: 8px 12px; text-align: center; width: 20%;">QUANTITÉ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="background-color: #F8FAFC; border-top: 1px solid #CBD5E1; font-weight: bold; color: #475569;">
              <td style="padding: 7px 12px; text-align: right;">Sous-total ${escapeXml(regDisplayName)} :</td>
              <td style="padding: 7px 12px; text-align: center;">${regSubtotal.toLocaleString('fr-FR')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Détail des ${opTitle} du Jour - ${escapeXml(formattedDate)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    body {
      font-family: 'Segoe UI', Calibri, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #0F172A;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #203764;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .mffe-title {
      font-size: 11px;
      font-weight: bold;
      color: #334155;
      text-transform: uppercase;
      line-height: 1.4;
    }
    .republique {
      text-align: right;
      font-size: 11px;
      font-weight: bold;
      color: #0F172A;
    }
    .devise {
      font-size: 10px;
      font-style: italic;
      color: #64748B;
    }
    .title-banner {
      background-color: ${isReceptions ? '#065F46' : '#9A3412'};
      color: #FFFFFF;
      text-align: center;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .title-banner h1 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .subtitle {
      text-align: center;
      font-size: 11px;
      color: #475569;
      margin-bottom: 16px;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 16px;
      font-size: 11px;
      font-weight: 600;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legend-box {
      width: 16px;
      height: 12px;
      border-radius: 2px;
    }
    .total-general-card {
      margin-top: 24px;
      background-color: #0F172A;
      color: #FFFFFF;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 14px;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background-color: #2563EB; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">
      🖨️ Imprimer / Enregistrer en PDF
    </button>
  </div>

  <div class="header-block">
    <div class="mffe-title">
      MINISTÈRE DE LA FEMME, DE LA FAMILLE ET DE L'ENFANT<br/>
      DIRECTION DES RESSOURCES HUMAINES (DRH)<br/>
      MODULE SUIVI DES CARTES SCOLAIRES
    </div>
    <div class="republique">
      RÉPUBLIQUE DE CÔTE D'IVOIRE<br/>
      <span class="devise">Union - Discipline - Travail</span>
    </div>
  </div>

  <div class="title-banner">
    <h1>Détail des ${opTitle} du Jour</h1>
  </div>

  <div class="subtitle">
    Date : <strong>${escapeXml(formattedDate)}</strong> • Année Scolaire : <strong>${escapeXml(anneeScolaire || '2026-2027')}</strong> • <strong>${items.length} structure(s)</strong> • Total : <strong>${grandTotal.toLocaleString('fr-FR')} cartes</strong>
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-box" style="background-color: #FCE4D6; border: 1px solid #F8CBAD;"></div>
      <span style="color: #C65911;">IFEF (Orange)</span>
    </div>
    <div class="legend-item">
      <div class="legend-box" style="background-color: #E2EFD9; border: 1px solid #C6E0B4;"></div>
      <span style="color: #274E13;">Autres Natures : CPPE, CACE, CES, etc. (Vert)</span>
    </div>
  </div>

  ${tablesHtml}

  <div class="total-general-card">
    <span>TOTAL GÉNÉRAL DU JOUR (${regionMap.size} RÉGIONS) :</span>
    <span style="font-size: 16px;">${grandTotal.toLocaleString('fr-FR')} CARTES</span>
  </div>

  <div style="margin-top: 24px; font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 8px;">
    Document officiel généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} • Système MFFE DRH Suivi des Cartes Scolaires
  </div>
</body>
</html>
  `;
}

