import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface RegionalEntityDetail {
  id: string;
  nom: string;
  sigle: string | null;
  nature: string | null;
  localisation: string | null;
  totalRecu: number;
  totalLivre: number;
  soldeStock: number;
}

export interface RegionSummary {
  id: string;
  nom: string;
  sigle: string;
  chefLieu: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  zone: string;
  nbStructures: number;
  totalRecu: number;
  totalDistribue: number;
  soldeStock: number;
  tauxDistributionPct: number;
  statut: 'COUVERT' | 'EN_COURS' | 'EN_STOCK' | 'NON_DOTE';
  entites: RegionalEntityDetail[];
}

const REGIONS_METADATA: Record<string, { lat: number; lng: number; chefLieu: string; zone: string; nomCourt: string }> = {
  'DR ABIDJAN': { lat: 5.36, lng: -4.01, chefLieu: 'Abidjan', zone: 'District d\'Abidjan', nomCourt: 'Abidjan' },
  'DR-ABJ': { lat: 5.33, lng: -4.02, chefLieu: 'Abidjan Treichville', zone: 'District d\'Abidjan', nomCourt: 'Abidjan (DR-ABJ)' },
  'DR BELIER': { lat: 6.82, lng: -5.28, chefLieu: 'Yamoussoukro', zone: 'Lacs', nomCourt: 'Bélier / Yamoussoukro' },
  'DR GBEKE': { lat: 7.69, lng: -5.03, chefLieu: 'Bouaké', zone: 'Vallée du Bandama', nomCourt: 'Gbêkê (Bouaké)' },
  'DR PORO': { lat: 9.45, lng: -5.63, chefLieu: 'Korhogo', zone: 'Savanes', nomCourt: 'Poro (Korhogo)' },
  'DR HAUT SASSANDRA': { lat: 6.88, lng: -6.45, chefLieu: 'Daloa', zone: 'Sassandra-Marahoué', nomCourt: 'Haut-Sassandra (Daloa)' },
  'DR SAN PEDRO': { lat: 4.75, lng: -6.64, chefLieu: 'San-Pédro', zone: 'Bas-Sassandra', nomCourt: 'San-Pédro' },
  'DR TONKPI': { lat: 7.41, lng: -7.55, chefLieu: 'Man', zone: 'Montagnes', nomCourt: 'Tonkpi (Man)' },
  'DR GONTOUGO': { lat: 8.04, lng: -2.80, chefLieu: 'Bondoukou', zone: 'Zanzan', nomCourt: 'Gontougo (Bondoukou)' },
  'DR INDENIE-DJUABLIN': { lat: 6.73, lng: -3.50, chefLieu: 'Abengourou', zone: 'Comoé', nomCourt: 'Indénié-Djuablin' },
  'DR GOH': { lat: 6.13, lng: -5.95, chefLieu: 'Gagnoa', zone: 'Gôh-Djiboua', nomCourt: 'Gôh (Gagnoa)' },
  'DR LOH-DJIBOUA': { lat: 5.84, lng: -5.36, chefLieu: 'Divo', zone: 'Gôh-Djiboua', nomCourt: 'Lôh-Djiboua (Divo)' },
  'DR SUD-COMOE': { lat: 5.47, lng: -3.21, chefLieu: 'Aboisso', zone: 'Comoé', nomCourt: 'Sud-Comoé (Aboisso)' },
  'DR AGNEBY-TIASSA': { lat: 5.93, lng: -4.22, chefLieu: 'Agboville', zone: 'Lagunes', nomCourt: 'Agnéby-Tiassa (Agboville)' },
  'DR ME': { lat: 6.10, lng: -3.86, chefLieu: 'Adzopé', zone: 'Lagunes', nomCourt: 'La Mé (Adzopé)' },
  'DR GRAND PONT': { lat: 5.32, lng: -4.38, chefLieu: 'Dabou', zone: 'Lagunes', nomCourt: 'Grands-Ponts (Dabou)' },
  'DR NAWA': { lat: 5.78, lng: -6.60, chefLieu: 'Soubré', zone: 'Bas-Sassandra', nomCourt: 'Nawa (Soubré)' },
  'DR GBOKLE': { lat: 4.95, lng: -6.08, chefLieu: 'Sassandra', zone: 'Bas-Sassandra', nomCourt: 'Gboklê (Sassandra)' },
  'DR HAMBOL': { lat: 8.14, lng: -5.10, chefLieu: 'Katiola', zone: 'Vallée du Bandama', nomCourt: 'Hambol (Katiola)' },
  'DR BAGOUE': { lat: 9.52, lng: -6.49, chefLieu: 'Boundiali', zone: 'Savanes', nomCourt: 'Bagoué (Boundiali)' },
  'DR TCHOLOGO': { lat: 9.60, lng: -5.20, chefLieu: 'Ferkessédougou', zone: 'Savanes', nomCourt: 'Tchologo (Ferké)' },
  'DR BOUNKANI': { lat: 9.27, lng: -3.00, chefLieu: 'Bouna', zone: 'Zanzan', nomCourt: 'Bounkani (Bouna)' },
  'DR KABADOUGOU': { lat: 9.51, lng: -7.56, chefLieu: 'Odienné', zone: 'Denguélé', nomCourt: 'Kabadougou (Odienné)' },
  'DR FOLON': { lat: 10.00, lng: -7.83, chefLieu: 'Minignan', zone: 'Denguélé', nomCourt: 'Folon (Minignan)' },
  'DR BAFING': { lat: 8.28, lng: -7.68, chefLieu: 'Touba', zone: 'Woroba', nomCourt: 'Bafing (Touba)' },
  'DR WORODOUGOU': { lat: 7.96, lng: -6.67, chefLieu: 'Séguéla', zone: 'Woroba', nomCourt: 'Worodougou (Séguéla)' },
  'DR BERE': { lat: 8.06, lng: -6.19, chefLieu: 'Mankono', zone: 'Woroba', nomCourt: 'Béré (Mankono)' },
  'DR MARAHOUE': { lat: 6.99, lng: -5.74, chefLieu: 'Bouaflé', zone: 'Sassandra-Marahoué', nomCourt: 'Marahoué (Bouaflé)' },
  'DR N’ZI': { lat: 6.65, lng: -4.70, chefLieu: 'Dimbokro', zone: 'Lacs', nomCourt: 'N\'Zi (Dimbokro)' },
  'DR MORONOU': { lat: 6.65, lng: -4.20, chefLieu: 'Bongouanou', zone: 'Lacs', nomCourt: 'Moronou (Bongouanou)' },
  'DR IFFOU': { lat: 7.06, lng: -3.96, chefLieu: 'Daoukro', zone: 'Lacs', nomCourt: 'Iffou (Daoukro)' },
  'DR GUEMON': { lat: 6.74, lng: -7.35, chefLieu: 'Duékoué', zone: 'Montagnes', nomCourt: 'Guémon (Duékoué)' },
  'DR CAVALY': { lat: 6.55, lng: -7.49, chefLieu: 'Guiglo', zone: 'Montagnes', nomCourt: 'Cavally (Guiglo)' },
};

function projectCoords(lng: number, lat: number) {
  const minLng = -8.6, maxLng = -2.5;
  const minLat = 4.3, maxLat = 10.7;
  const paddingX = 60;
  const paddingY = 50;
  const width = 800 - 2 * paddingX;
  const height = 700 - 2 * paddingY;
  
  const x = Math.round(paddingX + ((lng - minLng) / (maxLng - minLng)) * width);
  const y = Math.round(paddingY + ((maxLat - lat) / (maxLat - minLat)) * height);
  return { x, y };
}

export async function GET() {
  try {
    // 1. Récupération des Directions Régionales avec cumul des cartes
    const drRows = await query<any>(`
      WITH drs AS (
        SELECT id_entite, nom, sigle, localisation 
        FROM entite 
        WHERE id_hierarchisation ILIKE '%REGIONAL%' OR nom ILIKE '%Direction Régionale%'
      )
      SELECT 
        dr.id_entite as id_region,
        dr.nom as nom_region,
        dr.sigle,
        dr.localisation as chef_lieu,
        COUNT(DISTINCT child.id_entite) as nb_structures,
        COALESCE(SUM(b.total_recu), 0)::int as total_recu,
        COALESCE(SUM(b.total_livre), 0)::int as total_distribue,
        COALESCE(SUM(b.solde_stock_disponible), 0)::int as solde_stock,
        CASE 
          WHEN COALESCE(SUM(b.total_recu), 0) > 0 
          THEN ROUND((COALESCE(SUM(b.total_livre), 0)::numeric / SUM(b.total_recu)::numeric) * 100, 1)
          ELSE 0 
        END as taux_distribution_pct
      FROM drs dr
      LEFT JOIN entite child ON child.id_entite_parent = dr.id_entite OR child.id_entite = dr.id_entite
      LEFT JOIN vue_bilan_cartes_par_entite b ON b.id_entite = child.id_entite
      GROUP BY dr.id_entite, dr.nom, dr.sigle, dr.localisation
      ORDER BY total_recu DESC, nb_structures DESC;
    `);

    // 2. Récupération des structures filles rattachées à chaque région
    const allChildEntities = await query<any>(`
      SELECT 
        e.id_entite,
        e.nom,
        e.sigle,
        e.id_nature,
        e.localisation,
        COALESCE(e.id_entite_parent, e.id_entite) as id_parent,
        COALESCE(b.total_recu, 0)::int as total_recu,
        COALESCE(b.total_livre, 0)::int as total_livre,
        COALESCE(b.solde_stock_disponible, 0)::int as solde_stock
      FROM entite e
      LEFT JOIN vue_bilan_cartes_par_entite b ON b.id_entite = e.id_entite
      WHERE e.id_entite_parent IN (SELECT id_entite FROM entite WHERE id_hierarchisation ILIKE '%REGIONAL%' OR nom ILIKE '%Direction Régionale%')
         OR e.id_hierarchisation ILIKE '%REGIONAL%' OR e.nom ILIKE '%Direction Régionale%'
      ORDER BY b.total_recu DESC, e.nom ASC;
    `);

    // Regrouper par parent
    const entitiesByParent = new Map<string, RegionalEntityDetail[]>();
    for (const row of allChildEntities) {
      const parentId = row.id_parent;
      if (!entitiesByParent.has(parentId)) {
        entitiesByParent.set(parentId, []);
      }
      entitiesByParent.get(parentId)!.push({
        id: row.id_entite,
        nom: row.nom,
        sigle: row.sigle,
        nature: row.id_nature,
        localisation: row.localisation,
        totalRecu: row.total_recu,
        totalLivre: row.total_livre,
        soldeStock: row.solde_stock,
      });
    }

    let nationalRecu = 0;
    let nationalDistribue = 0;
    let nationalStock = 0;
    let regionsDotees = 0;

    const regions: RegionSummary[] = drRows.map((r: any) => {
      const meta = REGIONS_METADATA[r.id_region] || {
        lat: 6.5,
        lng: -5.5,
        chefLieu: r.chef_lieu || 'Côte d\'Ivoire',
        zone: 'Région',
        nomCourt: r.nom_region,
      };

      const proj = projectCoords(meta.lng, meta.lat);
      const totalRecu = parseInt(r.total_recu || '0', 10);
      const totalDistribue = parseInt(r.total_distribue || '0', 10);
      const soldeStock = parseInt(r.solde_stock || '0', 10);
      const taux = parseFloat(r.taux_distribution_pct || '0');

      nationalRecu += totalRecu;
      nationalDistribue += totalDistribue;
      nationalStock += soldeStock;
      if (totalRecu > 0) regionsDotees++;

      let statut: RegionSummary['statut'] = 'NON_DOTE';
      if (totalRecu === 0) {
        statut = 'NON_DOTE';
      } else if (taux >= 80) {
        statut = 'COUVERT';
      } else if (totalDistribue > 0) {
        statut = 'EN_COURS';
      } else {
        statut = 'EN_STOCK';
      }

      return {
        id: r.id_region,
        nom: meta.nomCourt || r.nom_region,
        sigle: r.sigle || r.id_region,
        chefLieu: meta.chefLieu,
        lat: meta.lat,
        lng: meta.lng,
        x: proj.x,
        y: proj.y,
        zone: meta.zone,
        nbStructures: parseInt(r.nb_structures || '0', 10),
        totalRecu,
        totalDistribue,
        soldeStock,
        tauxDistributionPct: taux,
        statut,
        entites: entitiesByParent.get(r.id_region) || [],
      };
    });

    const tauxGlobal = nationalRecu > 0 ? Number(((nationalDistribue / nationalRecu) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      summary: {
        totalRecu: nationalRecu,
        totalDistribue: nationalDistribue,
        totalStock: nationalStock,
        tauxGlobal,
        regionsTotal: regions.length,
        regionsDotees,
        tauxCouvertureTerritoriale: Number(((regionsDotees / (regions.length || 1)) * 100).toFixed(1)),
      },
      regions,
    });
  } catch (error: any) {
    console.error('Erreur API Cartographie:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
