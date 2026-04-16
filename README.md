# Yayasan Ambali - Harapan & Kesetaraan

Aplikasi berbasis web untuk **Yayasan Ambali**, sebuah yayasan fiktif yang berfokus dalam peduli sosial pada kaum tunawisma serta menghapus diskriminasi terhadap komunitas kulit hitam.

Aplikasi ini mencakup:
1. **Laman Utama Publik (Profile):** Laman pendaratan (*Landing Page*) informatif tentang program dukungan dan fasilitas perlindungan.
2. **Platform Ambali Edukslusif (Creators):** Platform monetisasi untuk kreator berbagi konten edukasi eksklusif (sejenis sistem OnlyFans) yang menggunakan integrasi **Google Drive Video Embed** dan dilindungi oleh fungsi Login / Register (Otentikasi).

---

## 🛠️ Arsitektur Teknologi
Sistem ini menggunakan gaya Full-Stack modern yang telah memisahkan antara logika *Frontend* dan *Backend*:
- **Frontend:** React + Vite (Komponen Dinamis, React Router)
- **Backend:** Node.js + Express (API Lapis Antara)
- **Database & Auth:** Supabase (PostgreSQL & Otentikasi Supabase GoTrue)
- **Styling:** Vanilla CSS (Dark Theme, Glassmorphism, UI Premium)

---

## 🚀 Cara Menjalankan Aplikasi di Lokal

### 1. Kloning dan Instalasi
Proyek ini berisi repositori bersarang (`frontend/` dan `backend/`), namun Anda dapat menginstalnya secara global dari direktori *root*.

```bash
# Lakukan kloning repositori (Contoh)
git clone https://github.com/alviangalen/yayasan-ambali.git
cd yayasan-ambali

# Unduh semua dependensi baik untuk root, frontend maupun backend hanya dengan satu baris ini
npm install
```

### 2. Setup Database Supabase
Aplikasi membutuhkan tabel khusus bernama `posts` agar fitur dinamis pembuat konten bekerja.
Lakukan hal berikut:
1. Buat/buka *project* [Supabase](https://supabase.com).
2. Pergi ke bagian **SQL Editor**.
3. Buat *New Query*, _copy_, dan jalankan kode SQL di bawah ini:

```sql
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  content text,
  google_drive_link text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text
);

-- Mematikan RLS tabel secara sementara agar memperbolehkan Frontend/Backend memasukkan row 
-- Namun untuk versi Produksi (Live) wajib menyalakannya kembali dengan menetapkan "Policies".
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
```

### 3. Setup Variabel Lingkungan (.env)
1. Pergi ke *Project Settings* -> *API* di Dasbor Supabase Anda.
2. Salin *Project URL* dan *anon key*.
3. Ubah nama (atau duplikat) file bernama `.env.example` menjadi `.env`.
4. Isi data tersebut di dalam `.env` yang berada pada tingkat *root*:

```env
PORT=5000
SUPABASE_URL=MasukkanURLSupabaseAndaDiSini
SUPABASE_ANON_KEY=MasukkanAnonKeySupabaseAndaDiSini
VITE_SUPABASE_URL=MasukkanURLSupabaseAndaDiSini
VITE_SUPABASE_ANON_KEY=MasukkanAnonKeySupabaseAndaDiSini
```

### 4. Nyalakan Aplikasi
Menyalakan *repository* hanya membutuhkan satu pintasan perintah saja.
Buka terminal di dalam folder utama (*root*) dari proyek ini, lalu ketikkan:

```bash
npm run dev
```

Selamat! Sistem otomatis akan menyalakan **Backend pada `http://localhost:5000`** dan antarmuka **Frontend pada `http://localhost:5173`** secara berdampingan.

---
*Dibuat oleh Tim Yayasan Ambali.*
