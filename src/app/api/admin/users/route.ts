import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

// -----------------------------------------------------------------------------
// GET /api/admin/users : Liste des utilisateurs et profils (Accès ADMIN uniquement)
// -----------------------------------------------------------------------------
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Privilèges Administrateur requis.' },
        { status: 403 }
      );
    }

    const users = await query<{
      id: string;
      name: string | null;
      email: string;
      role: string | null;
      created_at: string;
    }>(
      'SELECT id, name, email, role, created_at FROM public."user" ORDER BY created_at DESC'
    );

    // Profils prédéfinis du système
    const profiles = [
      {
        code: 'ADMIN',
        label: 'Super-Administrateur MFFE',
        badge: 'bg-red-500/15 text-red-300 border-red-500/30',
        description: 'Accès total : gestion des comptes et profils, réceptions, livraisons, imports et paramétrage.',
        permissions: ['Gestion des utilisateurs', 'Saisie réceptions', 'Saisie livraisons', 'Import bordereaux', 'Exports & KPI', 'Paramètres système'],
      },
      {
        code: 'DRH',
        label: 'Direction des Ressources Humaines',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        description: 'Pilotage et consultation des effectifs et stocks en temps réel sans bouton de saisie opérationnelle.',
        permissions: ['Consultation des chiffres', 'Exports officiels Word/Excel', 'Point du Jour', 'Vue cartographique', 'Annuaire des structures'],
      },
      {
        code: 'SUPERVISEUR',
        label: 'Superviseur Régional / Coordinateur',
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        description: 'Suivi et validation des dotations régionales et coordination des structures.',
        permissions: ['Consultation régionale', 'Suivi des stocks', 'Validation des réceptions', 'Exports'],
      },
      {
        code: 'USER',
        label: 'Agent de Saisie Terrain',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        description: 'Enregistrement quotidien des réceptions de cartes et des distributions aux bénéficiaires.',
        permissions: ['Saisie réceptions', 'Saisie livraisons', 'Consultation locale'],
      },
    ];

    return NextResponse.json({
      success: true,
      users,
      profiles,
      currentUser: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
      },
    });
  } catch (error: any) {
    console.error('Erreur récupération utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs.' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// POST /api/admin/users : Création d'un utilisateur par l'administrateur
// -----------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Privilèges Administrateur requis.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Veuillez renseigner le nom, l\'adresse email et le mot de passe.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Format d\'adresse email invalide.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit comporter au moins 6 caractères.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT id FROM public."user" WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Un compte avec cette adresse email existe déjà.' },
        { status: 409 }
      );
    }

    const validRoles = ['ADMIN', 'DRH', 'ADMIN_DRH', 'SUPERVISEUR', 'USER'];
    const targetRole = validRoles.includes((role || '').toUpperCase()) ? (role || '').toUpperCase() : 'USER';

    const hash = await hashPassword(password);
    const newId = 'USR-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const created = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      created_at: string;
    }>(
      `INSERT INTO public."user" (id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, created_at`,
      [newId, cleanEmail, hash, name.trim(), targetRole]
    );

    return NextResponse.json({
      success: true,
      message: `Compte créé avec succès pour ${name.trim()} (${targetRole}).`,
      user: created[0],
    });
  } catch (error: any) {
    console.error('Erreur création utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte.' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// PUT /api/admin/users : Modification d'un utilisateur par l'administrateur
// -----------------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Privilèges Administrateur requis.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, email, role, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Identifiant utilisateur manquant.' },
        { status: 400 }
      );
    }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Le nom et l\'adresse email ne peuvent pas être vides.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailConflict = await query(
      'SELECT id FROM public."user" WHERE LOWER(email) = $1 AND id != $2 LIMIT 1',
      [cleanEmail, id]
    );
    if (emailConflict.length > 0) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée par un autre compte.' },
        { status: 409 }
      );
    }

    const validRoles = ['ADMIN', 'DRH', 'ADMIN_DRH', 'SUPERVISEUR', 'USER'];
    const targetRole = validRoles.includes((role || '').toUpperCase()) ? (role || '').toUpperCase() : 'USER';

    let updated;
    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' },
          { status: 400 }
        );
      }
      const newHash = await hashPassword(password.trim());
      updated = await query<{
        id: string;
        name: string;
        email: string;
        role: string;
        created_at: string;
      }>(
        `UPDATE public."user"
         SET name = $1, email = $2, role = $3, password_hash = $4
         WHERE id = $5
         RETURNING id, name, email, role, created_at`,
        [name.trim(), cleanEmail, targetRole, newHash, id]
      );
    } else {
      updated = await query<{
        id: string;
        name: string;
        email: string;
        role: string;
        created_at: string;
      }>(
        `UPDATE public."user"
         SET name = $1, email = $2, role = $3
         WHERE id = $4
         RETURNING id, name, email, role, created_at`,
        [name.trim(), cleanEmail, targetRole, id]
      );
    }

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Compte de ${name.trim()} mis à jour avec succès.`,
      user: updated[0],
    });
  } catch (error: any) {
    console.error('Erreur modification utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'utilisateur.' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/admin/users : Suppression d'un utilisateur par l'administrateur
// -----------------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Privilèges Administrateur requis.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Identifiant utilisateur requis.' },
        { status: 400 }
      );
    }

    if (sessionUser.id === id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte connecté.' },
        { status: 400 }
      );
    }

    // Vérifier si c'est le seul administrateur
    const targetUser = await query<{ role: string }>('SELECT role FROM public."user" WHERE id = $1 LIMIT 1', [id]);
    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    if (targetUser[0].role === 'ADMIN') {
      const adminCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM public."user" WHERE role = \'ADMIN\'');
      if (parseInt(adminCount[0]?.count || '0', 10) <= 1) {
        return NextResponse.json(
          { error: 'Opération refusée : impossible de supprimer le dernier compte administrateur du système.' },
          { status: 400 }
        );
      }
    }

    await query('DELETE FROM public."user" WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur suppression utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur.' },
      { status: 500 }
    );
  }
}

