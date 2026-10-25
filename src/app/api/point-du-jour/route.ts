import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentSchoolYear } from '@/lib/schoolYear';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const rawAnnee = searchParams.get('annee_scolaire')?.trim();
    const anneeParam = rawAnnee && rawAnnee.toUpperCase() === 'ALL'
      ? null
      : (rawAnnee || getCurrentSchoolYear());
    const cleanAnnee = anneeParam ? anneeParam.replace(/\s+/g, '') : null;

    // Déterminer la date cible (aujourd'hui par défaut)
    const todayRes = await query<{ today: string }>('SELECT CURRENT_DATE::text as today');
    const todayDate = todayRes[0]?.today || new Date().toISOString().split('T')[0];
    const targetDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayDate;

    // 1. Réceptions (jour + cumul <= targetDate)
    const recRes = await query<{
      categorie: string;
      recu_jour: string;
      recu_cumul: string;
    }>(
      `SELECT 
        CASE 
          WHEN UPPER(TRIM(e.id_nature)) = 'IFEF' THEN 'IFEF'
          ELSE 'CPPE/CACE'
        END as categorie,
        COALESCE(SUM(CASE WHEN r.date_reception = $1 THEN r.quantite_recue ELSE 0 END), 0)::text as recu_jour,
        COALESCE(SUM(CASE WHEN r.date_reception <= $1 THEN r.quantite_recue ELSE 0 END), 0)::text as recu_cumul
      FROM reception_carte r
      JOIN entite e ON r.id_entite = e.id_entite
      WHERE ($2::text IS NULL OR r.annee_scolaire = $2 OR replace(COALESCE(r.annee_scolaire, ''), ' ', '') = $3)
      GROUP BY 1;`,
      [targetDate, anneeParam, cleanAnnee]
    );

    // 2. Livraisons (jour + cumul <= targetDate)
    const livRes = await query<{
      categorie: string;
      livre_jour: string;
      livre_cumul: string;
    }>(
      `SELECT 
        CASE 
          WHEN UPPER(TRIM(e.id_nature)) = 'IFEF' THEN 'IFEF'
          ELSE 'CPPE/CACE'
        END as categorie,
        COALESCE(SUM(CASE WHEN l.date_livraison = $1 THEN l.quantite_livree ELSE 0 END), 0)::text as livre_jour,
        COALESCE(SUM(CASE WHEN l.date_livraison <= $1 THEN l.quantite_livree ELSE 0 END), 0)::text as livre_cumul
      FROM livraison_carte l
      JOIN entite e ON l.id_entite = e.id_entite
      WHERE ($2::text IS NULL OR l.annee_scolaire = $2 OR replace(COALESCE(l.annee_scolaire, ''), ' ', '') = $3)
      GROUP BY 1;`,
      [targetDate, anneeParam, cleanAnnee]
    );

    const recMap: Record<string, { recu_jour: number; recu_cumul: number }> = {};
    recRes.forEach((r) => {
      recMap[r.categorie] = {
        recu_jour: parseInt(r.recu_jour || '0', 10),
        recu_cumul: parseInt(r.recu_cumul || '0', 10),
      };
    });

    const livMap: Record<string, { livre_jour: number; livre_cumul: number }> = {};
    livRes.forEach((l) => {
      livMap[l.categorie] = {
        livre_jour: parseInt(l.livre_jour || '0', 10),
        livre_cumul: parseInt(l.livre_cumul || '0', 10),
      };
    });

    // Catégories ordonnées : CPPE/CACE en premier, puis IFEF
    const categories = ['CPPE/CACE', 'IFEF'];
    const rows = categories.map((cat) => {
      const r = recMap[cat] || { recu_jour: 0, recu_cumul: 0 };
      const l = livMap[cat] || { livre_jour: 0, livre_cumul: 0 };
      const restant = r.recu_cumul - l.livre_cumul;
      return {
        categorie: cat,
        recu_jour: r.recu_jour,
        livre_jour: l.livre_jour,
        total_recu: r.recu_cumul,
        total_livre: l.livre_cumul,
        total_restant: restant,
      };
    });

    const totalRow = {
      categorie: 'TOTAL',
      recu_jour: rows.reduce((s, r) => s + r.recu_jour, 0),
      livre_jour: rows.reduce((s, r) => s + r.livre_jour, 0),
      total_recu: rows.reduce((s, r) => s + r.total_recu, 0),
      total_livre: rows.reduce((s, r) => s + r.total_livre, 0),
      total_restant: rows.reduce((s, r) => s + r.total_restant, 0),
    };

    // Formatage français de la date (ex: 23/10/2026 et Vendredi 23 Octobre 2026)
    const [y, m, d] = targetDate.split('-');
    const dateFormatee = `${d}/${m}/${y}`;
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const dateComplete = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return NextResponse.json({
      success: true,
      date: targetDate,
      dateFormatee,
      dateComplete,
      anneeScolaire: cleanAnnee || '2026-2027',
      rows,
      total: totalRow,
    });
  } catch (err: any) {
    console.error('Erreur API point-du-jour:', err);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du calcul du point du jour', details: err.message },
      { status: 500 }
    );
  }
}
