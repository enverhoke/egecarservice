import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { appEmailFromUsername, nowIso } from '@/lib/helpers';

async function verifyAdmin(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace('Bearer ', '');
  if (!token) throw new Error('Yetki yok');
  const decoded = await adminAuth.verifyIdToken(token);
  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  const role = userSnap.data()?.role;
  if (role !== 'admin') throw new Error('Admin yetkisi gerekli');
  return decoded.uid;
}

export async function POST(req: NextRequest) {
  try {
    const adminUid = await verifyAdmin(req);
    const body = await req.json();

    if (body.action === 'toggle-active') {
      await adminDb.collection('users').doc(body.uid).set({ active: body.active }, { merge: true });
      await adminAuth.updateUser(body.uid, { disabled: !body.active });
      return NextResponse.json({ message: 'Durum güncellendi' });
    }

    if (body.action === 'reset-password') {
      await adminAuth.updateUser(body.uid, { password: body.password });
      await adminDb.collection('users').doc(body.uid).set({ mustChangePassword: true }, { merge: true });
      return NextResponse.json({ message: 'Şifre güncellendi' });
    }

    if (body.action === 'delete') {
      await adminDb.collection('users').doc(body.uid).delete();
      await adminAuth.deleteUser(body.uid);
      return NextResponse.json({ message: 'Kullanıcı silindi' });
    }

    const email = appEmailFromUsername(body.username);
    const user = await adminAuth.createUser({
      email,
      password: body.password,
      displayName: `${body.firstName} ${body.lastName}`,
    });

    await adminDb.collection('users').doc(user.uid).set({
      uid: user.uid,
      firstName: body.firstName,
      lastName: body.lastName,
      username: body.username,
      email,
      role: body.role,
      active: true,
      mustChangePassword: true,
      createdAt: nowIso(),
      createdBy: adminUid,
    });

    return NextResponse.json({ message: 'Kullanıcı oluşturuldu' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'İşlem başarısız' }, { status: 400 });
  }
}
