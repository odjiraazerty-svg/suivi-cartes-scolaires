import { NextResponse } from 'next/server';
import { findUserByEmail, createUser, encodeSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires (Nom complet, Email, Mot de passe).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Veuillez saisir une adresse email valide.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit comporter au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.' },
        { status: 409 }
      );
    }

    const targetRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const newUser = await createUser({
      email,
      password,
      name,
      role: targetRole,
    });

    const sessionToken = encodeSession(newUser);
    const redirectTo = targetRole === 'ADMIN' ? '/admin' : '/user';

    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès ! Bienvenue sur la plateforme.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: targetRole,
      },
      redirectTo,
    });

    // Définir le cookie de session pour connexion automatique immédiate
    response.cookies.set('mffe_user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte.' },
      { status: 500 }
    );
  }
}
