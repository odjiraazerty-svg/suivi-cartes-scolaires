import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getCurrentSchoolYear } from '@/lib/schoolYear';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const rawAnnee = searchParams.get('annee_scolaire')?.trim();
    // Par défaut : année scolaire en cours (2026-2027)
    const anneeParam = rawAnnee && rawAnnee.toUpperCase() === 'ALL'
      ? null
      : (rawAnnee || getCurrentSchoolYear());
    const cleanAnnee = anneeParam ? anneeParam.replace(/\s+/g, '') : null;

    // Déterminer la date cible (aujourd'hui par défaut)
    const todayRes = await query<{ today: string }>('SELECT CURRENT_DATE::text as today');
    const todayDate = todayRes[0]?.today || new Date().toISOString().split('T')[0];
    const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayDate;

    // Récupérer la dernière date ayant une activité enregistrée pour cette année scolaire
    const lastActiveRes = await query<{ derniere_date: string }>(
      `SELECT GREATEST(
        (SELECT MAX(date_reception) FROM reception_carte WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)),
        (SELECT MAX(date_livraison) FROM livraison_carte WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2))
      )::text as derniere_date`,
      [anneeParam, cleanAnnee]
    );
    const derniereDateActive = lastActiveRes[0]?.derniere_date || todayDate;

    // Récupérer dynamiquement les natures d'entités impactées par l'activité des cartes scolaires
    const naturesConcerneesRes = await query<{ id_nature: string }>(
      `SELECT DISTINCT e.id_nature 
       FROM entite e 
       WHERE e.id_entite IN (
         SELECT id_entite FROM reception_carte 
         UNION 
         SELECT id_entite FROM livraison_carte
       ) AND e.id_nature IS NOT NULL
       ORDER BY e.id_nature ASC`
    );
    const naturesConcerneesList = naturesConcerneesRes.map((r) => r.id_nature);
    const defaultNatures = ['CPPE', 'IFEF', 'CACE', 'CES', 'POUPONNIERE', 'CRECHE  GARDERIE'];
    const activeNatures = naturesConcerneesList.length > 0 ? naturesConcerneesList : defaultNatures;

    // 1. Total structures concernées par l'activité (natures scolaires et d'accueil impactées)
    const entitesCount = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count 
       FROM entite 
       WHERE (actif = true OR actif IS NULL)
         AND id_nature = ANY($1)`,
      [activeNatures]
    );
    const totalEntites = parseInt(entitesCount[0]?.count || '0', 10);

    // Total national brut (toutes les structures du ministère y compris directions centrales)
    const entitesNationalCount = await query<{ count: string }>(
      'SELECT COUNT(*)::text as count FROM entite WHERE (actif = true OR actif IS NULL)'
    );
    const totalEntitesNational = parseInt(entitesNationalCount[0]?.count || '0', 10);

    // 2. Structures ayant réceptionné des cartes au titre de l'année scolaire
    const structuresConcerneesRes = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT id_entite)::text as count 
       FROM reception_carte 
       WHERE quantite_recue > 0 
         AND ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)`,
      [anneeParam, cleanAnnee]
    );
    const structuresConcernees = parseInt(structuresConcerneesRes[0]?.count || '0', 10);
    const tauxStructures = totalEntites > 0 ? Number(((structuresConcernees / totalEntites) * 100).toFixed(1)) : 0;

    // 3. Total cartes produites pour l'année scolaire
    const prodStats = await query<{ total_produit: string }>(
      `SELECT COALESCE(SUM(quantite_produite), 0)::text as total_produit 
       FROM production_carte
       WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)`,
      [anneeParam, cleanAnnee]
    );
    const totalProduit = parseInt(prodStats[0]?.total_produit || '0', 10);

    // 4. Total cartes reçues pour l'année scolaire
    const recuStats = await query<{ total_recu: string; nb_ops: string }>(
      `SELECT COALESCE(SUM(quantite_recue), 0)::text as total_recu, COUNT(*)::text as nb_ops 
       FROM reception_carte
       WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)`,
      [anneeParam, cleanAnnee]
    );
    const totalRecu = parseInt(recuStats[0]?.total_recu || '0', 10);
    const nbReceptions = parseInt(recuStats[0]?.nb_ops || '0', 10);

    // 5. Total cartes livrées pour l'année scolaire
    const livreStats = await query<{ total_livre: string; nb_ops: string }>(
      `SELECT COALESCE(SUM(quantite_livree), 0)::text as total_livre, COUNT(*)::text as nb_ops 
       FROM livraison_carte
       WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)`,
      [anneeParam, cleanAnnee]
    );
    const totalLivre = parseInt(livreStats[0]?.total_livre || '0', 10);
    const nbLivraisons = parseInt(livreStats[0]?.nb_ops || '0', 10);

    const usersCount = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM public."user"');
    const totalUsers = parseInt(usersCount[0]?.count || '0', 10);

    const stockDisponible = Math.max(0, totalRecu - totalLivre);
    const tauxDistribution = totalRecu > 0 ? Number(((totalLivre / totalRecu) * 100).toFixed(1)) : 0;
    const tauxReception = totalProduit > 0 ? Number(((totalRecu / totalProduit) * 100).toFixed(1)) : 0;

    // --- ACTIVITÉ DU JOUR (filtrée sur targetDate et annee_scolaire) ---
    const recJourStats = await query<{ total_recu_jour: string; nb_ops: string }>(
      `SELECT COALESCE(SUM(quantite_recue), 0)::text as total_recu_jour, COUNT(*)::text as nb_ops 
       FROM reception_carte 
       WHERE date_reception = $1 
         AND ($2::text IS NULL OR annee_scolaire = $2 OR replace(annee_scolaire, ' ', '') = $3)`,
      [targetDate, anneeParam, cleanAnnee]
    );
    const totalRecuJour = parseInt(recJourStats[0]?.total_recu_jour || '0', 10);
    const nbReceptionsJour = parseInt(recJourStats[0]?.nb_ops || '0', 10);

    const livJourStats = await query<{ total_livre_jour: string; nb_ops: string }>(
      `SELECT COALESCE(SUM(quantite_livree), 0)::text as total_livre_jour, COUNT(*)::text as nb_ops 
       FROM livraison_carte 
       WHERE date_livraison = $1 
         AND ($2::text IS NULL OR annee_scolaire = $2 OR replace(annee_scolaire, ' ', '') = $3)`,
      [targetDate, anneeParam, cleanAnnee]
    );
    const totalLivreJour = parseInt(livJourStats[0]?.total_livre_jour || '0', 10);
    const nbLivraisonsJour = parseInt(livJourStats[0]?.nb_ops || '0', 10);

    const soldeJour = totalRecuJour - totalLivreJour;
    const tauxDistributionJour = totalRecuJour > 0 ? Number(((totalLivreJour / totalRecuJour) * 100).toFixed(1)) : 0;

    // Détail des réceptions du jour pour l'année scolaire (avec Direction Régionale de rattachement)
    const receptionsJour = await query(
      `SELECT r.id, r.id_entite, r.date_reception, r.quantite_recue, r.annee_scolaire, 
              r.reference_bordereau, r.receptionnaire_nom, r.observations, r.created_at, 
              e.nom as nom_entite, e.sigle, e.localisation, e.id_nature,
              u.name as auteur_nom,
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
       LEFT JOIN public."user" u ON r.id_user = u.id
       WHERE r.date_reception = $1
         AND ($2::text IS NULL OR r.annee_scolaire = $2 OR replace(r.annee_scolaire, ' ', '') = $3)
       ORDER BY region ASC, e.id_nature DESC, r.id_entite ASC`,
      [targetDate, anneeParam, cleanAnnee]
    );

    // Détail des livraisons du jour pour l'année scolaire (avec Direction Régionale de rattachement)
    const livraisonsJour = await query(
      `SELECT l.id, l.id_entite, l.date_livraison, l.quantite_livree, l.annee_scolaire, 
              l.destinataire_nom, l.reference_decharge, l.mode_livraison, l.observations, l.created_at,
              l.receptionne_par, l.contact_receptionnaire, l.cout_livraison,
              e.nom as nom_entite, e.sigle, e.localisation, e.id_nature,
              u.name as auteur_nom,
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
       LEFT JOIN public."user" u ON l.id_user = u.id
       WHERE l.date_livraison = $1
         AND ($2::text IS NULL OR l.annee_scolaire = $2 OR replace(l.annee_scolaire, ' ', '') = $3)
       ORDER BY region ASC, e.id_nature DESC, l.id_entite ASC`,
      [targetDate, anneeParam, cleanAnnee]
    );

    const activiteJour = {
      date: targetDate,
      isToday: targetDate === todayDate,
      derniereDateActive,
      totalRecu: totalRecuJour,
      nbReceptions: nbReceptionsJour,
      totalLivre: totalLivreJour,
      nbLivraisons: nbLivraisonsJour,
      soldeNet: soldeJour,
      tauxDistribution: tauxDistributionJour,
      receptions: receptionsJour,
      livraisons: livraisonsJour,
    };

    // 6. Dernières réceptions au titre de l'année scolaire
    const dernieresReceptions = await query(
      `SELECT r.id, r.date_reception, r.quantite_recue, r.annee_scolaire, r.reference_bordereau, e.nom as nom_entite, e.sigle
       FROM reception_carte r
       JOIN entite e ON r.id_entite = e.id_entite
       WHERE ($1::text IS NULL OR r.annee_scolaire = $1 OR replace(r.annee_scolaire, ' ', '') = $2)
       ORDER BY r.created_at DESC LIMIT 5`,
      [anneeParam, cleanAnnee]
    );

    // 7. Dernières livraisons au titre de l'année scolaire
    const dernieresLivraisons = await query(
      `SELECT l.id, l.date_livraison, l.quantite_livree, l.annee_scolaire, l.destinataire_nom, e.nom as nom_entite, e.sigle
       FROM livraison_carte l
       JOIN entite e ON l.id_entite = e.id_entite
       WHERE ($1::text IS NULL OR l.annee_scolaire = $1 OR replace(l.annee_scolaire, ' ', '') = $2)
       ORDER BY l.created_at DESC LIMIT 5`,
      [anneeParam, cleanAnnee]
    );

    // 8. Répartition par hiérarchie
    const repartitionHierarchie = await query(
      `SELECT id_hierarchisation, COUNT(*)::int as count 
       FROM entite 
       GROUP BY id_hierarchisation 
       ORDER BY count DESC LIMIT 6`
    );

    // 9. Récapitulatif exhaustif par nature d'entité filtré par l'année scolaire
    const recapParNatureRaw = await query(
      `WITH recu AS (
         SELECT id_entite, 
                COALESCE(SUM(quantite_recue), 0)::int as total_recu
         FROM reception_carte
         WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)
         GROUP BY id_entite
       ),
       livre AS (
         SELECT id_entite, 
                COALESCE(SUM(quantite_livree), 0)::int as total_livre
         FROM livraison_carte
         WHERE ($1::text IS NULL OR annee_scolaire = $1 OR replace(annee_scolaire, ' ', '') = $2)
         GROUP BY id_entite
       ),
       bilan AS (
         SELECT e.id_entite,
                COALESCE(r.total_recu, 0) as total_recu,
                COALESCE(l.total_livre, 0) as total_livre,
                GREATEST(0, COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) as solde_stock_disponible
         FROM entite e
         LEFT JOIN recu r ON e.id_entite = r.id_entite
         LEFT JOIN livre l ON e.id_entite = l.id_entite
       )
       SELECT 
         COALESCE(n.id_nature, e.id_nature, 'AUTRE') as code,
         COALESCE(n.libelle, e.id_nature, 'Autre Structure') as libelle,
         COUNT(e.id_entite)::int as total_structures,
         COUNT(CASE WHEN COALESCE(b.total_recu, 0) > 0 THEN e.id_entite END)::int as structures_avec_cartes,
         COALESCE(SUM(b.total_recu), 0)::int as total_recu,
         COALESCE(SUM(b.total_livre), 0)::int as total_livre,
         COALESCE(SUM(b.solde_stock_disponible), 0)::int as solde_stock,
         CASE 
           WHEN COALESCE(SUM(b.total_recu), 0) > 0 
           THEN ROUND((COALESCE(SUM(b.total_livre), 0)::numeric / SUM(b.total_recu)::numeric) * 100, 1)::float
           ELSE 0::float
         END as taux_distribution
       FROM entite e
       LEFT JOIN nature_entite n ON UPPER(TRIM(e.id_nature)) = UPPER(TRIM(n.id_nature))
       LEFT JOIN bilan b ON e.id_entite = b.id_entite
       WHERE (e.actif = true OR e.actif IS NULL)
         AND e.id_nature = ANY($3)
       GROUP BY COALESCE(n.id_nature, e.id_nature, 'AUTRE'), COALESCE(n.libelle, e.id_nature, 'Autre Structure')
       ORDER BY total_structures DESC, total_recu DESC`,
      [anneeParam, cleanAnnee, activeNatures]
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
        totalEntitesNational,
        structuresConcernees,
        tauxStructures,
        naturesConcernees: activeNatures,
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
      activiteJour,
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
