import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.trim() || '';
    const stockOnly = searchParams.get('stock_only') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : (stockOnly ? 600 : 100);

    let sql = `
      SELECT id_entite, nom_entite as nom, sigle, localisation, id_hierarchisation, id_nature,
             total_recu, total_livre, solde_stock_disponible, taux_distribution_pct
      FROM vue_bilan_cartes_par_entite
      WHERE 1=1
    `;
    const params: any[] = [];

    if (stockOnly) {
      sql += ` AND solde_stock_disponible > 0`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (nom_entite ILIKE $${params.length} OR sigle ILIKE $${params.length} OR localisation ILIKE $${params.length} OR id_entite ILIKE $${params.length})`;
    }

    if (stockOnly) {
      sql += ` ORDER BY solde_stock_disponible DESC, nom_entite ASC`;
    } else {
      sql += ` ORDER BY nom_entite ASC`;
    }

    if (limit > 0) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    const entites = await query(sql, params);
    return NextResponse.json({ success: true, entites });
  } catch (error: any) {
    console.error('Erreur récupération entités:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
