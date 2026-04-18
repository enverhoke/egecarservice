# Ege Car Service - Gercek Surum

Bu proje Next.js + Firebase ile hazirlanmis gercek admin/personel panelidir.

## Ozellikler
- Login ekrani
- Ilk admin kurulumu
- Admin / personel rol sistemi
- Kullanicilar modulu
- Firmalar modulu
- Servis kayitlari modulu
- Cari / odeme modulu
- Sistem adi ve logo upload alani
- Dashboard yerine Ana Sayfa

## Kurulum
1. Bu projeyi GitHub reposuna yukle.
2. Firebase projesinde su servisleri ac:
   - Authentication / Email-Password
   - Firestore Database
   - Storage
3. `.env.example` dosyasindaki alanlari Vercel Environment Variables kismina gir.
4. Firebase Admin service account olustur ve su degerleri Vercel'e gir:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
5. Vercel'de deploy et.
6. Ilk acilista `/auth/login` ekranindaki `Ilk Kurulum` kartindan ilk admin kullaniciyi olustur.
7. Giris yap ve sistemi kullan.

## Onerilen Firebase Ayarlari
### Authentication
- Email/Password: Enabled

### Firestore collections
- users
- firms
- service_records
- payments
- settings/system

### Firestore Rules
Repo icindeki `firestore.rules` dosyasini kullan.

### Storage Rules
Repo icindeki `storage.rules` dosyasini kullan.

## Notlar
- Kullanici adi gorunur ama arka planda `kullaniciadi@egecarservice.local` email mantigi kullanilir.
- Personel kayit girer.
- Admin kullanici, firma, ayar ve silme islemlerini yonetir.
- Bildirim sistemi sonraki asamada Firebase Cloud Messaging ile eklenebilir.
