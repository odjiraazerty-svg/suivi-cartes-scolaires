import { NextResponse } from 'next/server';
import { generateDisponibiliteDocx, generateDisponibiliteExcel } from '@/lib/exportDisponibilite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nature = searchParams.get('nature')?.trim() || null;
    const format = (searchParams.get('format')?.toLowerCase() || 'docx').trim();
    const anneeScolaire = searchParams.get('annee_scolaire')?.trim() || null;

    const timestamp = new Date().toISOString().split('T')[0];
    const natureTag = nature && nature !== 'ALL' ? nature.toUpperCase().replace(/\s+/g, '_') : 'CONSOLIDE';
    const anneeTag = anneeScolaire ? `_${anneeScolaire.replace(/\s+/g, '_')}` : '';

    if (format === 'xlsx') {
      const buffer = await generateDisponibiliteExcel(nature, anneeScolaire);
      const filename = `DISPONIBILITE_CARTES_SCOLAIRES_${natureTag}${anneeTag}_${timestamp}.xlsx`;

      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Par défaut: Document Word DOCX (Mise en forme DISPONIBILITE DES CARTES SCOLAIRES)
    const buffer = await generateDisponibiliteDocx(nature, anneeScolaire);
    const filename = `DISPONIBILITE_CARTES_SCOLAIRES_${natureTag}${anneeTag}_${timestamp}.docx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur API Export Disponibilité:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la génération du document de disponibilité.' },
      { status: 500 }
    );
  }
}
