import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { appEmailFromUsername, nowIso } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const count = await adminDb.collection('users').count().get();
    if (count.data().count > 0) {
      return NextResponse.json({ error: 'Kurulum zaten yapılmış.' }, { status: 400 });
    }
    const body = await req.json();
    const email = appEmailFromUsername(body.username);
    const user = await adminAuth.createUser({ email, password: body.password, displayName: `${body.firstName} ${body.lastName}` });
    await adminDb.collection('users').doc(user.uid).set({
      uid: user.uid,
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username,
      email,
      role: 'admin',
      active: true,
      mustChangePassword: false,
      createdAt: nowIso(),
    });
    await adminDb.collection('settings').doc('system').set({ systemName: 'Ege Car Service', updatedAt: nowIso() }, { merge: true });
    return NextResponse.json({ message: 'İlk admin oluşturuldu.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Kurulum başarısız' }, { status: 400 });
  }
}
