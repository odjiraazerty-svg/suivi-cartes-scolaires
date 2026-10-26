import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { generateIdEntiteFromNom, getDefaultHierarchieForNature } from '@/lib/entiteHelper';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const stockOnly = searchParams.get('stock_only') === 'true';
    const all = searchParams.get('all') === 'true';
    const parentsOnly = searchParams.get('parents_only') === 'true';
    const limitParam = searchParams.get('limit');
    const concerneesOnly = searchParams.get('concernees_only') === 'true' || searchParams.get('concernees') === 'true';
    const naturesParam = searchParams.get('natures') || searchParams.get('nature') || '';

    // Récupérer la liste des entités pouvant être parents (Directions Régionales et Centrales)
    if (parentsOnly) {
      const parents = await query(`
        SELECT id_entite, nom, sigle, id_hierarchisation, id_nature, localisation
        FROM entite
        WHERE id_hierarchisation IN ('DIRECTION_REGIONALE', 'DIRECTION_CENTRALE', 'DIRECTIONS_SERVICES_RATTACHES', 'CABINET', 'AUTORITE_INSTITUTION')
           OR id_entite LIKE 'DR %'
           OR id_entite IN (SELECT DISTINCT id_entite_parent FROM entite WHERE id_entite_parent IS NOT NULL)
        ORDER BY 
          CASE WHEN id_hierarchisation = 'DIRECTION_REGIONALE' OR id_entite LIKE 'DR %' THEN 1 ELSE 2 END,
          nom ASC
      `);
      return NextResponse.json({ success: true, count: parents.length, parents });
    }

    const anneeParam = searchParams.get('annee_scolaire')?.trim() || null;
    const cleanAnnee = anneeParam ? anneeParam.replace(/\s+/g, '') : null;

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
      )
      SELECT e.id_entite, e.nom, e.sigle, e.localisation, e.id_hierarchisation, e.id_nature,
             e.id_entite_parent, dr.nom as nom_parent, e.responsable_nom,
             COALESCE(r.total_recu, 0) as total_recu,
             COALESCE(l.total_livre, 0) as total_livre,
             GREATEST(0, COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) as solde_stock_disponible,
             CASE 
               WHEN COALESCE(r.total_recu, 0) > 0 
               THEN ROUND((COALESCE(l.total_livre, 0)::numeric / COALESCE(r.total_recu, 0)::numeric) * 100, 2)::float 
               ELSE 0::float 
             END as taux_distribution_pct
      FROM entite e
      LEFT JOIN recu r ON e.id_entite = r.id_entite
      LEFT JOIN livre l ON e.id_entite = l.id_entite
      LEFT JOIN entite dr ON e.id_entite_parent = dr.id_entite
      WHERE (e.actif = true OR e.actif IS NULL)
    `;
    const params: any[] = [anneeParam, cleanAnnee];

    if (concerneesOnly) {
      sql += ` AND e.id_nature IN (
        SELECT DISTINCT e2.id_nature 
        FROM entite e2 
        WHERE e2.id_entite IN (
          SELECT id_entite FROM reception_carte 
          UNION 
          SELECT id_entite FROM livraison_carte
        ) AND e2.id_nature IS NOT NULL
      )`;
    }

    if (naturesParam) {
      const nList = naturesParam.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
      if (nList.length > 0) {
        params.push(nList);
        sql += ` AND UPPER(TRIM(e.id_nature)) = ANY($${params.length})`;
      }
    }

    if (stockOnly) {
      sql += ` AND (COALESCE(r.total_recu, 0) - COALESCE(l.total_livre, 0)) > 0`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (e.nom ILIKE $${params.length} OR e.sigle ILIKE $${params.length} OR e.localisation ILIKE $${params.length} OR e.id_entite ILIKE $${params.length} OR e.id_nature ILIKE $${params.length} OR dr.nom ILIKE $${params.length})`;
    }

    if (stockOnly) {
      sql += ` ORDER BY solde_stock_disponible DESC, e.nom ASC`;
    } else {
      sql += ` ORDER BY e.nom ASC`;
    }

    // Appliquer une limite UNIQUEMENT si explicitement demandée et non nulle
    if (limitParam && limitParam !== '0' && limitParam !== 'all' && !all) {
      const parsedLimit = parseInt(limitParam, 10);
      if (parsedLimit > 0) {
        params.push(parsedLimit);
        sql += ` LIMIT $${params.length}`;
      }
    }

    const entites = await query(sql, params);
    return NextResponse.json({ success: true, count: entites.length, entites });
  } catch (error: any) {
    console.error('Erreur récupération entités:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id_entite,
      nom,
      id_nature,
      localisation,
      sigle,
      responsable_nom,
      id_hierarchisation,
      id_entite_parent,
    } = body;

    if (!nom || typeof nom !== 'string' || nom.trim().length < 3) {
      return NextResponse.json(
        { error: 'Le nom de la structure est requis (au moins 3 caractères).' },
        { status: 400 }
      );
    }

    if (!id_nature || typeof id_nature !== 'string' || id_nature.trim().length === 0) {
      return NextResponse.json(
        { error: 'La nature de la structure (CPPE, CACE, IFEF, CS, etc.) est requise.' },
        { status: 400 }
      );
    }

    const cleanNom = nom.trim();
    const cleanNature = id_nature.trim().toUpperCase();
    const cleanLoc = (localisation || 'Abidjan').trim();
    const cleanSigle = sigle?.trim() || cleanNature;
    const cleanResp = responsable_nom?.trim() || null;
    const cleanParent =
      id_entite_parent &&
      typeof id_entite_parent === 'string' &&
      id_entite_parent.trim() !== '' &&
      id_entite_parent.trim().toUpperCase() !== 'NONE'
        ? id_entite_parent.trim()
        : null;

    const cleanHierarchie =
      id_hierarchisation?.trim() || getDefaultHierarchieForNature(cleanNature);

    // Déterminer ou valider l'identifiant système unique (id_entite)
    let finalId = (id_entite || '').trim().toUpperCase();

    if (!finalId) {
      finalId = generateIdEntiteFromNom(cleanNom, cleanNature);
    }

    if (!finalId) {
      return NextResponse.json(
        { error: "Impossible de déterminer un identifiant système (id_entite) valide." },
        { status: 400 }
      );
    }

    // Vérifier si cet identifiant existe déjà dans la table entite
    const existing = await query('SELECT id_entite, nom FROM entite WHERE id_entite = $1', [finalId]);
    if (existing.length > 0) {
      // Si l'utilisateur a explicitement saisi un id_entite qui existe déjà, renvoyer une erreur explicite
      if (id_entite && id_entite.trim()) {
        return NextResponse.json(
          {
            error: `L'identifiant système "${finalId}" est déjà utilisé par la structure "${existing[0].nom}". Veuillez choisir un identifiant unique.`,
          },
          { status: 400 }
        );
      }

      // Si l'identifiant a été auto-généré, suffixer avec un incrément
      let suffix = 2;
      let candidateId = `${finalId} ${suffix}`;
      while ((await query('SELECT id_entite FROM entite WHERE id_entite = $1', [candidateId])).length > 0) {
        suffix++;
        candidateId = `${finalId} ${suffix}`;
      }
      finalId = candidateId;
    }

    const insertSql = `
      INSERT INTO entite (
        id_entite, nom, sigle, id_hierarchisation, id_nature,
        localisation, responsable_nom, id_entite_parent, actif, id_user, dh_creation
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, true, '1', NOW()
      )
      RETURNING *;
    `;

    const result = await query(insertSql, [
      finalId,
      cleanNom,
      cleanSigle,
      cleanHierarchie,
      cleanNature,
      cleanLoc,
      cleanResp,
      cleanParent,
    ]);

    // Récupérer le nom de l'entité parent si existant
    let parentNom = null;
    if (cleanParent) {
      const pInfo = await query('SELECT nom FROM entite WHERE id_entite = $1 LIMIT 1', [cleanParent]);
      if (pInfo.length > 0) {
        parentNom = pInfo[0].nom;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Structure "${cleanNom}" (${finalId}) enregistrée avec succès dans le référentiel officiel.`,
      entite: {
        ...result[0],
        nom_parent: parentNom,
      },
    });
  } catch (error: any) {
    console.error('Erreur création structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      original_id_entite,
      old_id_entite,
      id_entite,
      nom,
      id_nature,
      id_hierarchisation,
      id_entite_parent,
      localisation,
      sigle,
      responsable_nom,
    } = body;

    const oldId = (original_id_entite || old_id_entite || id_entite || '').trim();
    if (!oldId) {
      return NextResponse.json(
        { error: "L'identifiant original de la structure est requis." },
        { status: 400 }
      );
    }

    if (!nom || typeof nom !== 'string' || nom.trim().length < 3) {
      return NextResponse.json(
        { error: 'Le nom de la structure doit comporter au moins 3 caractères.' },
        { status: 400 }
      );
    }

    const cleanNom = nom.trim();
    const cleanNature = (id_nature || 'STRUCTURE').trim().toUpperCase();
    const cleanNewId = (id_entite || oldId).trim().toUpperCase();
    const cleanLoc = (localisation || 'Abidjan').trim();
    const cleanSigle = sigle?.trim() || cleanNature;
    const cleanResp = responsable_nom?.trim() || null;
    const cleanParent =
      id_entite_parent &&
      typeof id_entite_parent === 'string' &&
      id_entite_parent.trim() !== '' &&
      id_entite_parent.trim().toUpperCase() !== 'NONE'
        ? id_entite_parent.trim()
        : null;
    const cleanHierarchie =
      id_hierarchisation?.trim() || getDefaultHierarchieForNature(cleanNature);

    // Si l'identifiant système est modifié, vérifier qu'il n'existe pas déjà
    if (cleanNewId !== oldId) {
      const existing = await query('SELECT id_entite, nom FROM entite WHERE id_entite = $1', [cleanNewId]);
      if (existing.length > 0) {
        return NextResponse.json(
          {
            error: `Le nouvel identifiant système "${cleanNewId}" est déjà utilisé par la structure "${existing[0].nom}". Veuillez choisir un identifiant unique.`,
          },
          { status: 400 }
        );
      }

      // Mettre à jour en cascade dans reception_carte, livraison_carte, entite (id_entite_parent), et entite
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE reception_carte SET id_entite = $1 WHERE id_entite = $2', [cleanNewId, oldId]);
        await client.query('UPDATE livraison_carte SET id_entite = $1 WHERE id_entite = $2', [cleanNewId, oldId]);
        await client.query('UPDATE entite SET id_entite_parent = $1 WHERE id_entite_parent = $2', [cleanNewId, oldId]);
        const updRes = await client.query(
          `UPDATE entite 
           SET id_entite = $1, nom = $2, sigle = $3, id_hierarchisation = $4,
               id_nature = $5, localisation = $6, responsable_nom = $7, id_entite_parent = $8
           WHERE id_entite = $9
           RETURNING *`,
          [cleanNewId, cleanNom, cleanSigle, cleanHierarchie, cleanNature, cleanLoc, cleanResp, cleanParent, oldId]
        );
        await client.query('COMMIT');

        let parentNom = null;
        if (cleanParent) {
          const pInfo = await query('SELECT nom FROM entite WHERE id_entite = $1 LIMIT 1', [cleanParent]);
          if (pInfo.length > 0) parentNom = pInfo[0].nom;
        }

        return NextResponse.json({
          success: true,
          message: `Structure "${cleanNom}" mise à jour avec succès (identifiant: ${cleanNewId}).`,
          entite: { ...updRes.rows[0], nom_parent: parentNom },
        });
      } catch (txErr: any) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    } else {
      // Identifiant inchangé, mise à jour simple
      const updRes = await query(
        `UPDATE entite 
         SET nom = $1, sigle = $2, id_hierarchisation = $3,
             id_nature = $4, localisation = $5, responsable_nom = $6, id_entite_parent = $7
         WHERE id_entite = $8
         RETURNING *`,
        [cleanNom, cleanSigle, cleanHierarchie, cleanNature, cleanLoc, cleanResp, cleanParent, oldId]
      );

      if (updRes.length === 0) {
        return NextResponse.json({ error: "Structure introuvable dans le référentiel." }, { status: 404 });
      }

      let parentNom = null;
      if (cleanParent) {
        const pInfo = await query('SELECT nom FROM entite WHERE id_entite = $1 LIMIT 1', [cleanParent]);
        if (pInfo.length > 0) parentNom = pInfo[0].nom;
      }

      return NextResponse.json({
        success: true,
        message: `Structure "${cleanNom}" mise à jour avec succès.`,
        entite: { ...updRes[0], nom_parent: parentNom },
      });
    }
  } catch (error: any) {
    console.error('Erreur modification structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim() || searchParams.get('id_entite')?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de la structure à supprimer est requis." },
        { status: 400 }
      );
    }

    // Vérifier l'existence de la structure
    const entiteCheck = await query('SELECT id_entite, nom FROM entite WHERE id_entite = $1', [id]);
    if (entiteCheck.length === 0) {
      return NextResponse.json(
        { error: `Structure "${id}" introuvable dans le référentiel.` },
        { status: 404 }
      );
    }

    // Vérifier si des mouvements de cartes (réceptions ou livraisons) existent
    const recCount = await query('SELECT count(*)::int as c FROM reception_carte WHERE id_entite = $1', [id]);
    const livCount = await query('SELECT count(*)::int as c FROM livraison_carte WHERE id_entite = $1', [id]);
    const nbRec = recCount[0]?.c || 0;
    const nbLiv = livCount[0]?.c || 0;

    if (nbRec > 0 || nbLiv > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer la structure "${entiteCheck[0].nom}" (${id}) : elle possède ${nbRec} lot(s) de réception et ${nbLiv} livraison(s) de cartes enregistrés. Veuillez d'abord supprimer ou réassigner ses opérations associées.`,
          hasMovements: true,
          nbReceptions: nbRec,
          nbLivraisons: nbLiv,
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Détacher les structures filles éventuelles rattachées à celle-ci
      await client.query('UPDATE entite SET id_entite_parent = NULL WHERE id_entite_parent = $1', [id]);
      // Supprimer l'entité
      await client.query('DELETE FROM entite WHERE id_entite = $1', [id]);
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Structure "${entiteCheck[0].nom}" (${id}) supprimée avec succès du référentiel.`,
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erreur suppression structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



