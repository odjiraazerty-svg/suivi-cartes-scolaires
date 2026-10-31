import { NextResponse } from 'next/server';
import {
  generateActiviteJourDocx,
  generateActiviteJourExcel,
  generateActiviteJourHtml,
} from '@/lib/exportActiviteJour';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type')?.toLowerCase().trim() || 'receptions';
    const type: 'receptions' | 'livraisons' =
      typeParam === 'livraisons' || typeParam === 'distributions' ? 'livraisons' : 'receptions';

    const format = (searchParams.get('format')?.toLowerCase() || 'docx').trim();
    const dateParam = searchParams.get('date')?.trim() || new Date().toISOString().split('T')[0];
    const anneeScolaire = searchParams.get('annee_scolaire')?.trim() || '2026-2027';

    const cleanDate = dateParam.replace(/[^0-9-]/g, '');
    const prefix = type === 'receptions' ? 'RECEPTIONS_DU_JOUR' : 'DISTRIBUTIONS_DU_JOUR';

    // 1. Format Excel (.xlsx)
    if (format === 'xlsx') {
      const buffer = await generateActiviteJourExcel(type, cleanDate, anneeScolaire);
      const filename = `${prefix}_${cleanDate}.xlsx`;

      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 2. Format PDF / HTML imprimable
    if (format === 'pdf' || format === 'html') {
      const html = await generateActiviteJourHtml(type, cleanDate, anneeScolaire);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 3. Par défaut: Format Word (.docx)
    const buffer = await generateActiviteJourDocx(type, cleanDate, anneeScolaire);
    const filename = `${prefix}_${cleanDate}.docx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur API Export Activité Jour:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération du document d'activité du jour." },
      { status: 500 }
    );
  }
}

