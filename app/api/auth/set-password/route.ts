import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization') || '';
    const token = header.replace('Bearer ', '');
    if (!token) throw new Error('Yetki yok');
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await req.json();
    await adminAuth.updateUser(decoded.uid, { password: body.password });
    await adminDb.collection('users').doc(decoded.uid).set({ mustChangePassword: false }, { merge: true });
    return NextResponse.json({ message: 'Şifre güncellendi' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'İşlem başarısız' }, { status: 400 });
  }
}
