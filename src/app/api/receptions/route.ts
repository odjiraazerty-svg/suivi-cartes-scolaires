import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200', 10);

    const receptions = await query(
      `SELECT r.id, r.id_entite, r.date_reception, r.quantite_recue, r.annee_scolaire, 
              r.reference_bordereau, r.receptionnaire_nom, r.observations, r.created_at, 
              e.nom as nom_entite, e.sigle, e.localisation,
              u.name as auteur_nom
       FROM reception_carte r
       JOIN entite e ON r.id_entite = e.id_entite
       LEFT JOIN public."user" u ON r.id_user = u.id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ success: true, receptions });
  } catch (error: any) {
    console.error('Erreur lecture réceptions:', error);
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
      date_reception,
      quantite,
      observations = '',
      reference_bordereau = null,
      receptionnaire_nom = null,
    } = body;

    // Validations
    if (!id_entite || !id_entite.trim()) {
      return NextResponse.json({ error: "L'entité est obligatoire." }, { status: 400 });
    }

    if (!date_reception) {
      return NextResponse.json({ error: 'La date de réception est obligatoire.' }, { status: 400 });
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      return NextResponse.json({ error: 'La quantité doit être un nombre entier supérieur à 0.' }, { status: 400 });
    }

    const anneeVal = (annee_scolaire || '2026-2027').trim();

    // Insertion
    const insertResult = await query(
      `INSERT INTO reception_carte (
        id_entite, date_reception, quantite_recue, annee_scolaire, 
        observations, reference_bordereau, receptionnaire_nom, id_user
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id_entite.trim(),
        date_reception,
        qteNum,
        anneeVal,
        observations ? observations.trim() : null,
        reference_bordereau,
        receptionnaire_nom,
        session ? session.id : '1',
      ]
    );

    const newRecord = insertResult[0];

    // Récupérer le nom de l'entité pour la réponse
    const entiteInfo = await query('SELECT nom, sigle FROM entite WHERE id_entite = $1 LIMIT 1', [id_entite.trim()]);

    return NextResponse.json({
      success: true,
      message: 'Réception de cartes enregistrée avec succès.',
      reception: {
        ...newRecord,
        nom_entite: entiteInfo[0]?.nom || id_entite,
        sigle: entiteInfo[0]?.sigle || '',
      },
    });
  } catch (error: any) {
    console.error("Erreur enregistrement réception:", error);
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
      date_reception,
      quantite,
      annee_scolaire = '2026-2027',
      reference_bordereau = null,
      receptionnaire_nom = null,
      observations = '',
    } = body;

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Identifiant de réception invalide.' }, { status: 400 });
    }

    const qteNum = parseInt(quantite, 10);
    if (isNaN(qteNum) || qteNum <= 0) {
      return NextResponse.json({ error: 'La quantité doit être supérieure à 0.' }, { status: 400 });
    }

    if (!date_reception) {
      return NextResponse.json({ error: 'La date de réception est requise.' }, { status: 400 });
    }

    const updateRes = await query(
      `UPDATE reception_carte
       SET id_entite = COALESCE($1, id_entite),
           date_reception = $2,
           quantite_recue = $3,
           annee_scolaire = $4,
           reference_bordereau = $5,
           receptionnaire_nom = $6,
           observations = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        id_entite ? id_entite.trim() : null,
        date_reception,
        qteNum,
        annee_scolaire ? annee_scolaire.trim() : '2026-2027',
        reference_bordereau,
        receptionnaire_nom,
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
      message: 'Enregistrement de réception mis à jour avec succès.',
      reception: {
        ...updateRes[0],
        nom_entite: entiteInfo[0]?.nom || updateRes[0].id_entite,
        sigle: entiteInfo[0]?.sigle || '',
      },
    });
  } catch (error: any) {
    console.error('Erreur modification réception:', error);
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
      } catch {
        // pas de body JSON
      }
    }

    const idNum = parseInt(idParam || '', 10);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    const deleteRes = await query('DELETE FROM reception_carte WHERE id = $1 RETURNING *', [idNum]);
    if (deleteRes.length === 0) {
      return NextResponse.json({ error: 'Enregistrement non trouvé.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Enregistrement de réception supprimé avec succès.',
      deletedId: idNum,
    });
  } catch (error: any) {
    console.error('Erreur suppression réception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
