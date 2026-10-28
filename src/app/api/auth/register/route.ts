import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error:
            "L'inscription publique est fermée. La création de compte est strictement réservée à l'Administrateur du système via le Panel Administration.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Veuillez utiliser l'API d'administration dédiée /api/admin/users pour gérer les utilisateurs.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte.' },
      { status: 500 }
    );
  }
}
