import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import {
  parseDocxBuffer,
  parseExcelBuffer,
  parsePdfBuffer,
  matchEntriesWithEntities,
  EntityRecord,
  RawImportEntry,
  MatchedImportItem,
} from '@/lib/importParser';

export const dynamic = 'force-dynamic';

// -------------------------------------------------------------
// POST /api/activites/import?action=preview | commit
// -------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'preview';

    // =========================================================
    // ACTION 1 : PREVIEW (Extraction & Rapprochement)
    // =========================================================
    if (action === 'preview') {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const typeActivite = ((formData.get('type_activite') as string) || 'RECEPTION').toUpperCase() as
        | 'RECEPTION'
        | 'LIVRAISON';

      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier transmis.' }, { status: 400 });
      }

      const filename = file.name || 'document';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let rawEntries: RawImportEntry[] = [];

      if (ext === 'docx') {
        rawEntries = await parseDocxBuffer(buffer);
      } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        rawEntries = parseExcelBuffer(buffer, typeActivite);
      } else if (ext === 'pdf') {
        rawEntries = await parsePdfBuffer(buffer);
      } else {
        return NextResponse.json(
          {
            error: `Format de fichier non pris en charge (.${ext}). Veuillez importer un fichier Excel (.xlsx, .xls), Word (.docx) ou PDF (.pdf).`,
          },
          { status: 400 }
        );
      }

      if (rawEntries.length === 0) {
        return NextResponse.json(
          { error: "Aucune ligne de données n'a pu être extraite de ce fichier." },
          { status: 400 }
        );
      }

      // 2. Charger toutes les entités de la base de données
      const dbEntities = await query<EntityRecord>(
        `SELECT id_entite, nom, sigle, id_nature, localisation, id_hierarchisation 
         FROM entite 
         ORDER BY nom ASC`
      );

      // 3. Exécuter l'algorithme de correspondance
      const matchedItems = matchEntriesWithEntities(rawEntries, dbEntities);

      // 4. Calculer les statistiques de rapprochement
      const stats = {
        total_lignes: matchedItems.length,
        lignes_valides: matchedItems.filter((i) => i.match_status === 'EXACT' || i.match_status === 'PREFIX').length,
        lignes_approximatives: matchedItems.filter((i) => i.match_status === 'FUZZY').length,
        lignes_ambigues: matchedItems.filter((i) => i.match_status === 'AMBIGUOUS').length,
        lignes_inconnues: matchedItems.filter((i) => i.match_status === 'UNMATCHED').length,
        total_cartes: matchedItems.reduce((acc, curr) => acc + (curr.quantite || 0), 0),
        total_cartes_validees: matchedItems
          .filter((i) => i.matched_entite_id)
          .reduce((acc, curr) => acc + (curr.quantite || 0), 0),
      };

      return NextResponse.json({
        success: true,
        action: 'preview',
        filename,
        extension: ext,
        typeActivite,
        stats,
        items: matchedItems,
      });
    }

    // =========================================================
    // ACTION 2 : COMMIT (Enregistrement effectif en base)
    // =========================================================
    if (action === 'commit') {
      const body = await request.json();
      const {
        typeActivite = 'RECEPTION',
        dateOperation,
        anneeScolaire = '2026-2027',
        referenceBordereau,
        observations = '',
        agentNom = 'Agent DRH MFFE',
        items = [],
      } = body;

      const isReception = typeActivite === 'RECEPTION';

      if (!dateOperation) {
        return NextResponse.json({ error: "La date de l'opération est obligatoire." }, { status: 400 });
      }

      const validItems = (items as MatchedImportItem[]).filter(
        (it) => it.selected && it.matched_entite_id && it.quantite > 0
      );

      if (validItems.length === 0) {
        return NextResponse.json(
          { error: 'Aucune ligne valide sélectionnée pour importation.' },
          { status: 400 }
        );
      }

      const refBordereauFinal =
        referenceBordereau?.trim() ||
        `IMP-${isReception ? 'REC' : 'LIV'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
          Math.random() * 900 + 100
        )}`;

      const userId = session?.id || null;

      // Exécution transactionnelle PostgreSQL
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        let insertedCount = 0;
        let totalCartes = 0;

        for (const item of validItems) {
          if (isReception) {
            // Insertion dans reception_carte
            await client.query(
              `INSERT INTO reception_carte (
                id_entite, date_reception, quantite_recue, annee_scolaire, 
                reference_bordereau, receptionnaire_nom, observations, id_user, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [
                item.matched_entite_id,
                dateOperation,
                item.quantite,
                anneeScolaire,
                refBordereauFinal,
                agentNom,
                observations ? `${observations} (Importé: ${item.raw_name})` : `Import fichier: ${item.raw_name}`,
                userId,
              ]
            );
          } else {
            // Insertion dans livraison_carte
            await client.query(
              `INSERT INTO livraison_carte (
                id_entite, date_livraison, quantite_livree, annee_scolaire, 
                destinataire_nom, reference_decharge, observations, mode_livraison, id_user, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
              [
                item.matched_entite_id,
                dateOperation,
                item.quantite,
                anneeScolaire,
                agentNom,
                refBordereauFinal,
                observations ? `${observations} (Importé: ${item.raw_name})` : `Import distribution: ${item.raw_name}`,
                'Bordereau d’importation',
                userId,
              ]
            );
          }

          insertedCount++;
          totalCartes += item.quantite;
        }

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          action: 'commit',
          typeActivite,
          insertedCount,
          totalCartes,
          referenceBordereau: refBordereauFinal,
          dateOperation,
          message: `${insertedCount} ligne(s) d'activité importée(s) avec succès pour un volume total de ${totalCartes.toLocaleString(
            'fr-FR'
          )} cartes.`,
        });
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error("Erreur lors de l'insertion en transaction:", err);
        return NextResponse.json(
          { error: `Échec de l'enregistrement en base: ${err.message}` },
          { status: 500 }
        );
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur API import activites:', error);
    return NextResponse.json({ error: error.message || 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// -------------------------------------------------------------
// GET /api/activites/import (Historique des imports récents)
// -------------------------------------------------------------
export async function GET() {
  try {
    // Lister les bordereaux récents d'importation
    const receptionsImports = await query(
      `SELECT reference_bordereau as batch_ref, 'RECEPTION' as type_activite, 
              MIN(date_reception) as date_operation, COUNT(id) as total_lignes, 
              SUM(quantite_recue)::INTEGER as total_cartes, MAX(created_at) as created_at
       FROM reception_carte
       WHERE reference_bordereau IS NOT NULL AND reference_bordereau LIKE 'IMP-%'
       GROUP BY reference_bordereau
       ORDER BY MAX(created_at) DESC
       LIMIT 10`
    );

    const livraisonsImports = await query(
      `SELECT reference_decharge as batch_ref, 'LIVRAISON' as type_activite, 
              MIN(date_livraison) as date_operation, COUNT(id) as total_lignes, 
              SUM(quantite_livree)::INTEGER as total_cartes, MAX(created_at) as created_at
       FROM livraison_carte
       WHERE reference_decharge IS NOT NULL AND reference_decharge LIKE 'IMP-%'
       GROUP BY reference_decharge
       ORDER BY MAX(created_at) DESC
       LIMIT 10`
    );

    const history = [...receptionsImports, ...livraisonsImports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// -------------------------------------------------------------
// DELETE /api/activites/import?batch_ref=...&type=RECEPTION|LIVRAISON
// Annulation d'un lot importé (Rollback)
// -------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchRef = searchParams.get('batch_ref');
    const typeActivite = (searchParams.get('type') || 'RECEPTION').toUpperCase();

    if (!batchRef) {
      return NextResponse.json({ error: 'La référence du lot à annuler est requise.' }, { status: 400 });
    }

    if (typeActivite === 'RECEPTION') {
      const res = await query(
        `DELETE FROM reception_carte WHERE reference_bordereau = $1 RETURNING id`,
        [batchRef]
      );
      return NextResponse.json({
        success: true,
        message: `Lot ${batchRef} annulé avec succès (${res.length} réceptions supprimées).`,
      });
    } else {
      const res = await query(
        `DELETE FROM livraison_carte WHERE reference_decharge = $1 RETURNING id`,
        [batchRef]
      );
      return NextResponse.json({
        success: true,
        message: `Lot ${batchRef} annulé avec succès (${res.length} distributions supprimées).`,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
