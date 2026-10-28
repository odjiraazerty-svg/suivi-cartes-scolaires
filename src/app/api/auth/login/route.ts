import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, encodeSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Veuillez saisir votre adresse email et votre mot de passe.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants incorrects. Aucun compte trouvé avec cet email.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect. Veuillez réessayer.' },
        { status: 401 }
      );
    }

    const sessionToken = encodeSession(user);
    const userRole = (user.role || 'USER').toUpperCase();
    const redirectTo =
      userRole === 'ADMIN'
        ? '/admin'
        : userRole === 'DRH' || userRole === 'ADMIN_DRH'
          ? '/drh'
          : '/user';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Utilisateur',
        role: userRole,
      },
      redirectTo,
    });

    // Définir le cookie de session
    response.cookies.set('mffe_user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur. ' + (error.message || '') },
      { status: 500 }
    );
  }
}
