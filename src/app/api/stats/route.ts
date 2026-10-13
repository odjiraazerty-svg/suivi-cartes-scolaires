import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Total entités
    const entitesCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM entite WHERE actif = true');
    const totalEntites = parseInt(entitesCount[0]?.count || '0', 10);

    // 2. Structures concernées (ayant réceptionné des cartes)
    const structuresConcerneesRes = await query<{ count: string }>(
      'SELECT COUNT(DISTINCT id_entite)::text as count FROM reception_carte WHERE quantite_recue > 0'
    );
    const structuresConcernees = parseInt(structuresConcerneesRes[0]?.count || '0', 10);
    const tauxStructures = totalEntites > 0 ? Number(((structuresConcernees / totalEntites) * 100).toFixed(1)) : 0;

    // 3. Total cartes produites
    const prodStats = await query<{ total_produit: string }>(
      'SELECT COALESCE(SUM(quantite_produite), 0)::text as total_produit FROM production_carte'
    );
    const totalProduit = parseInt(prodStats[0]?.total_produit || '0', 10);

    // 4. Total cartes reçues
    const recuStats = await query<{ total_recu: string; nb_ops: string }>(
      'SELECT COALESCE(SUM(quantite_recue), 0)::text as total_recu, COUNT(*)::text as nb_ops FROM reception_carte'
    );
    const totalRecu = parseInt(recuStats[0]?.total_recu || '0', 10);
    const nbReceptions = parseInt(recuStats[0]?.nb_ops || '0', 10);

    // 5. Total cartes livrées
    const livreStats = await query<{ total_livre: string; nb_ops: string }>(
      'SELECT COALESCE(SUM(quantite_livree), 0)::text as total_livre, COUNT(*)::text as nb_ops FROM livraison_carte'
    );
    const totalLivre = parseInt(livreStats[0]?.total_livre || '0', 10);
    const nbLivraisons = parseInt(livreStats[0]?.nb_ops || '0', 10);

    const usersCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM public."user"');
    const totalUsers = parseInt(usersCount[0]?.count || '0', 10);

    const stockDisponible = Math.max(0, totalRecu - totalLivre);
    const tauxDistribution = totalRecu > 0 ? Number(((totalLivre / totalRecu) * 100).toFixed(1)) : 0;
    const tauxReception = totalProduit > 0 ? Number(((totalRecu / totalProduit) * 100).toFixed(1)) : 0;

    // 6. Dernières réceptions
    const dernieresReceptions = await query(
      `SELECT r.id, r.date_reception, r.quantite_recue, r.annee_scolaire, r.reference_bordereau, e.nom as nom_entite, e.sigle
       FROM reception_carte r
       JOIN entite e ON r.id_entite = e.id_entite
       ORDER BY r.created_at DESC LIMIT 5`
    );

    // 7. Dernières livraisons
    const dernieresLivraisons = await query(
      `SELECT l.id, l.date_livraison, l.quantite_livree, l.annee_scolaire, l.destinataire_nom, e.nom as nom_entite, e.sigle
       FROM livraison_carte l
       JOIN entite e ON l.id_entite = e.id_entite
       ORDER BY l.created_at DESC LIMIT 5`
    );

    // 8. Répartition par hiérarchie
    const repartitionHierarchie = await query(
      `SELECT id_hierarchisation, COUNT(*)::int as count 
       FROM entite 
       GROUP BY id_hierarchisation 
       ORDER BY count DESC LIMIT 6`
    );

    // 9. Récapitulatif par nature d'entité (IFEF, CACE, CPPE, CES, GARDERIE, CRECHE)
    const recapParNatureRaw = await query(
      `WITH target_natures AS (
        SELECT 'IFEF' as code, 'Institution de Formation et d''Éducation Féminine' as libelle, 1 as ordre
        UNION ALL SELECT 'CACE', 'Centre d''Action Communautaire pour l''Enfance', 2
        UNION ALL SELECT 'CPPE', 'Centre de Protection de la Petite Enfance', 3
        UNION ALL SELECT 'CES', 'Centre d''Éducation Spécialisée', 4
        UNION ALL SELECT 'GARDERIE', 'Garderie', 5
        UNION ALL SELECT 'CRECHE', 'Crèche / Garderie', 6
      ),
      entites_target AS (
        SELECT 
          e.id_entite,
          CASE 
            WHEN UPPER(TRIM(e.id_nature)) IN ('CRECHE', 'CRECHE  GARDERIE', 'CRECHE / GARDERIE') THEN 'CRECHE'
            ELSE UPPER(TRIM(e.id_nature))
          END as nature_code
        FROM entite e
        WHERE UPPER(TRIM(e.id_nature)) IN ('IFEF', 'CACE', 'CPPE', 'CES', 'GARDERIE', 'CRECHE', 'CRECHE  GARDERIE', 'CRECHE / GARDERIE')
      ),
      receptions_agg AS (
        SELECT id_entite, SUM(quantite_recue)::int as total_recu
        FROM reception_carte
        GROUP BY id_entite
      ),
      livraisons_agg AS (
        SELECT id_entite, SUM(quantite_livree)::int as total_livre
        FROM livraison_carte
        GROUP BY id_entite
      )
      SELECT 
        tn.code,
        tn.libelle,
        COUNT(et.id_entite)::int as total_structures,
        COUNT(CASE WHEN COALESCE(r.total_recu, 0) > 0 THEN et.id_entite END)::int as structures_avec_cartes,
        COALESCE(SUM(r.total_recu), 0)::int as total_recu,
        COALESCE(SUM(l.total_livre), 0)::int as total_livre,
        (COALESCE(SUM(r.total_recu), 0) - COALESCE(SUM(l.total_livre), 0))::int as solde_stock,
        CASE 
          WHEN COALESCE(SUM(r.total_recu), 0) > 0 
          THEN ROUND((COALESCE(SUM(l.total_livre), 0)::numeric / SUM(r.total_recu)::numeric) * 100, 1)::float
          ELSE 0::float
        END as taux_distribution
      FROM target_natures tn
      LEFT JOIN entites_target et ON tn.code = et.nature_code
      LEFT JOIN receptions_agg r ON et.id_entite = r.id_entite
      LEFT JOIN livraisons_agg l ON et.id_entite = l.id_entite
      GROUP BY tn.code, tn.libelle, tn.ordre
      ORDER BY tn.ordre`
    );

    const recapParNature = recapParNatureRaw.map((item: any) => ({
      code: item.code,
      libelle: item.libelle,
      total_structures: Number(item.total_structures || 0),
      structures_avec_cartes: Number(item.structures_avec_cartes || 0),
      total_recu: Number(item.total_recu || 0),
      total_livre: Number(item.total_livre || 0),
      solde_stock: Number(item.solde_stock || 0),
      taux_distribution: Number(item.taux_distribution || 0),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalEntites,
        structuresConcernees,
        tauxStructures,
        totalProduit,
        tauxReception,
        totalRecu,
        nbReceptions,
        totalLivre,
        nbLivraisons,
        stockDisponible,
        tauxDistribution,
        totalUsers,
      },
      dernieresReceptions,
      dernieresLivraisons,
      repartitionHierarchie,
      recapParNature,
    });
  } catch (error: any) {
    console.error('Erreur stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const body = await request.json();
    const { quantite_produite, annee_scolaire = '2026-2027', observations = '' } = body;

    const qteNum = parseInt(quantite_produite, 10);
    if (isNaN(qteNum) || qteNum < 0) {
      return NextResponse.json({ error: 'Quantité invalide.' }, { status: 400 });
    }

    await query(
      `INSERT INTO production_carte (annee_scolaire, quantite_produite, observations, id_user)
       VALUES ($1, $2, $3, $4)`,
      [annee_scolaire, qteNum, observations, session ? session.id : '1']
    );

    return NextResponse.json({ success: true, message: 'Production mise à jour avec succès.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
