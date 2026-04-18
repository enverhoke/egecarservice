# Ege Car Service - MVP

Bu proje, Ege Car Service için hazırlanmış ücretsiz deploy edilebilir bir Next.js MVP panelidir.

## Özellikler
- Dashboard özet kutuları
- Firma ekleme ve firma detay görünümü
- Servis kaydı ekleme
- Ödeme takibi ve kalan bakiye hesabı
- Gider yönetimi
- Basit rapor özeti
- JSON yedek alma ve geri yükleme
- Türkçe arayüz
- Mobil uyumlu tasarım

## Teknik Not
Bu sürüm verileri tarayıcı localStorage içinde tutar. Yani veriler cihaz bazlıdır.
Gerçek kullanım için bir sonraki adımda Firebase veya Supabase bağlanmalıdır.

## Çalıştırma
```bash
npm install
npm run dev
```

## Vercel Deploy
1. GitHub'a yükle
2. Vercel'de New Project seç
3. Repo'yu bağla
4. Deploy et

## Sonraki Adım Önerisi
- Firebase Auth eklemek
- Firestore veritabanı eklemek
- Çoklu kullanıcı rolleri
- Excel/PDF dışa aktarma
- Servis kaydı düzenleme/silme
