import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const entiteId = searchParams.get('id_entite');

    let sql = `
      SELECT l.id, l.id_entite, l.date_livraison, l.quantite_livree, l.annee_scolaire, 
             l.mode_livraison, l.cout_livraison, l.receptionne_par, l.contact_receptionnaire,
             l.destinataire_nom, l.reference_decharge, l.observations, l.created_at,
             e.nom as nom_entite, e.sigle, e.localisation,
             u.name as auteur_nom
      FROM livraison_carte l
      JOIN entite e ON l.id_entite = e.id_entite
      LEFT JOIN public."user" u ON l.id_user = u.id
    `;
    const params: any[] = [];

    if (entiteId) {
      params.push(entiteId);
      sql += ` WHERE l.id_entite = $1`;
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const livraisons = await query(sql, params);
    return NextResponse.json({ success: true, livraisons });
  } catch (error: any) {
    console.error('Erreur lecture livraisons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const body = await request.json();

    const {
      annee_scolaire = '2026-2027',
      id_entite,
      date_livraison,
      quantite,
      observations = '',
      mode_livraison = 'Agent du MFFE',
      cout_livraison = 0,
      receptionne_par = '',
      contact = '',
      reference_decharge = null,
    } = body;

    // Validations obligatoires
    if (!id_entite || !id_entite.trim()) {
      return NextResponse.json({ error: 'La structure est obligatoire.' }, { status: 400 });
    }

    if (!date_livraison) {
      return NextResponse.json({ error: 'La date de livraison est obligatoire.' }, { status: 400 });
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      return NextResponse.json({ error: 'La quantité doit être un nombre supérieur à 0.' }, { status: 400 });
    }

    const anneeVal = (annee_scolaire || '2026-2027').trim();
    const coutNum = parseFloat(cout_livraison) || 0;

    // Insertion
    const insertResult = await query(
      `INSERT INTO livraison_carte (
        id_entite, date_livraison, quantite_livree, annee_scolaire, 
        observations, mode_livraison, cout_livraison, receptionne_par, 
        contact_receptionnaire, destinataire_nom, reference_decharge, id_user
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id_entite.trim(),
        date_livraison,
        qteNum,
        anneeVal,
        observations ? observations.trim() : null,
        mode_livraison ? mode_livraison.trim() : 'Agent du MFFE',
        coutNum,
        receptionne_par ? receptionne_par.trim() : null,
        contact ? contact.trim() : null,
        receptionne_par ? receptionne_par.trim() : null, // stocke aussi dans destinataire_nom pour rétro-compatibilité
        reference_decharge,
        session ? session.id : '1',
      ]
    );

    const newRecord = insertResult[0];

    // Info structure pour le retour
    const entiteInfo = await query('SELECT nom, sigle FROM entite WHERE id_entite = $1 LIMIT 1', [id_entite.trim()]);

    return NextResponse.json({
      success: true,
      message: 'Livraison de cartes enregistrée avec succès.',
      livraison: {
        ...newRecord,
        nom_entite: entiteInfo[0]?.nom || id_entite,
        sigle: entiteInfo[0]?.sigle || '',
      },
    });
  } catch (error: any) {
    console.error('Erreur enregistrement livraison:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    if (session && session.role && session.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux administrateurs.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      id_entite,
      date_livraison,
      quantite,
      annee_scolaire = '2026-2027',
      mode_livraison = 'Agent du MFFE',
      cout_livraison = 0,
      receptionne_par = '',
      contact = '',
      reference_decharge = null,
      observations = '',
    } = body;

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      return NextResponse.json({ error: 'La quantité doit être supérieure à 0.' }, { status: 400 });
    }

    if (!date_livraison) {
      return NextResponse.json({ error: 'La date de livraison est requise.' }, { status: 400 });
    }

    const updateRes = await query(
      `UPDATE livraison_carte
       SET id_entite = COALESCE($1, id_entite),
           date_livraison = $2,
           quantite_livree = $3,
           annee_scolaire = $4,
           mode_livraison = $5,
           cout_livraison = $6,
           receptionne_par = $7,
           contact_receptionnaire = $8,
           destinataire_nom = $7,
           reference_decharge = $9,
           observations = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        id_entite ? id_entite.trim() : null,
        date_livraison,
        qteNum,
        annee_scolaire ? annee_scolaire.trim() : '2026-2027',
        mode_livraison || 'Agent du MFFE',
        parseFloat(cout_livraison) || 0,
        receptionne_par ? receptionne_par.trim() : null,
        contact ? contact.trim() : null,
        reference_decharge,
        observations ? observations.trim() : null,
        idNum,
      ]
    );

    if (updateRes.length === 0) {
      return NextResponse.json({ error: 'Enregistrement non trouvé.' }, { status: 404 });
    }

    const entiteInfo = await query('SELECT nom, sigle FROM entite WHERE id_entite = $1 LIMIT 1', [updateRes[0].id_entite]);

    return NextResponse.json({
      success: true,
      message: 'Enregistrement de livraison mis à jour avec succès.',
      livraison: {
        ...updateRes[0],
        nom_entite: entiteInfo[0]?.nom || updateRes[0].id_entite,
        sigle: entiteInfo[0]?.sigle || '',
      },
    });
  } catch (error: any) {
    console.error('Erreur modification livraison:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (session && session.role && session.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux administrateurs.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let idParam = searchParams.get('id');

    if (!idParam) {
      try {
        const body = await request.json();
        idParam = body.id;
      } catch {}
    }

    const idNum = parseInt(idParam || '', 10);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    const deleteRes = await query('DELETE FROM livraison_carte WHERE id = $1 RETURNING *', [idNum]);
    if (deleteRes.length === 0) {
      return NextResponse.json({ error: 'Enregistrement non trouvé.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Enregistrement de livraison supprimé avec succès.',
      deletedId: idNum,
    });
  } catch (error: any) {
    console.error('Erreur suppression livraison:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
