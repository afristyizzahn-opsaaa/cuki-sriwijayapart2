# CUKI Gameplay Summary

Dokumen ini merangkum alur bermain CUKI: The Kingdom of Sriwijaya dalam bahasa yang lebih ringkas dan mudah dibaca.

## Gambaran Umum

CUKI adalah game papan strategi berbasis giliran yang dimainkan di papan 11 x 11 intersection. Pemain menggerakkan satu pawn per pemain untuk menangkap Oncak dan mengumpulkan poin.

Setiap Oncak yang berhasil ditangkap bernilai 1 poin. Pertandingan selesai ketika semua Oncak di papan habis, lalu pemain dengan skor tertinggi menjadi pemenang.

## Komponen Utama

- Oncak: 120 buah total, terdiri dari 60 hitam dan 60 putih.
- Pawn: 1 pawn untuk tiap pemain.
- Board: papan 10 x 10 cell dengan 11 x 11 titik intersection.
- Central Logo: titik tengah di koordinat (5,5) yang selalu diblok dan tidak boleh dilewati.
- Dadu: menentukan jumlah Oncak yang harus ditangkap pada giliran itu.

## Setup Permainan

- Semua pawn mulai dalam status `OFF_BOARD`.
- Tidak ada penempatan pawn bebas di awal permainan.
- Oncak disebar ke seluruh intersection valid, kecuali titik tengah (5,5).
- Komposisi warna Oncak harus tetap seimbang: 60 hitam dan 60 putih.

## Tujuan Permainan

Tujuan utama pemain adalah mendapatkan skor tertinggi dengan menangkap Oncak sebanyak mungkin.

## Alur Giliran

1. Pemain aktif melempar dadu.
2. Nilai dadu menentukan jumlah Oncak yang harus ditangkap, bukan jarak gerak pawn.
3. Sistem mencari semua kelompok Oncak legal yang cocok dengan nilai dadu.
4. Jika ada pilihan yang valid, pemain wajib memilih salah satu.
5. Setelah satu kelompok selesai ditangkap, board dievaluasi ulang dari posisi akhir pawn.
6. Jika masih ada kelompok valid dengan nilai dadu yang sama, pemain wajib lanjut menangkap.
7. Jika tidak ada lagi kelompok valid, pemain mendapat reroll.
8. Jika dari hasil lemparan awal tidak ada langkah valid sama sekali, giliran langsung berakhir.

## Aturan Penangkapan

- Kelompok yang ditangkap harus terdiri dari Oncak dengan warna yang sama.
- Jumlah Oncak yang ditangkap harus persis sama dengan nilai dadu.
- Satu kelompok harus diselesaikan penuh sebelum sistem mengevaluasi ulang board.
- Pawn berhenti di posisi Oncak terakhir yang ditangkap.

## Aturan Gerak Pawn

- Pawn bergerak hanya secara horizontal atau vertikal.
- Gerakan diagonal tidak diperbolehkan.
- Satu rute capture maksimal terdiri dari 3 segmen lurus.
- Pawn tidak boleh melewati pawn pemain lain.
- Titik (5,5) tidak boleh dilewati, dimasuki, atau dijadikan tujuan.

## Pawn OFF_BOARD dan ON_BOARD

- Pawn yang masih `OFF_BOARD` masuk ke board melalui capture pertama yang sah.
- Saat capture pertama berhasil, pawn langsung menempati posisi Oncak pertama yang ditangkap.
- Tidak ada spawn zone khusus atau posisi awal di pinggir papan.

## Sistem Giliran

- Urutan pemain berjalan secara rotasi.
- Setelah giliran berakhir, kontrol pindah ke pemain berikutnya.
- Jika pemain AI aktif, sistem menjalankan langkah AI secara otomatis.

## Kapan Giliran Berakhir

Giliran berakhir jika:

- hasil dadu tidak punya kelompok valid yang bisa ditangkap, atau
- setelah capture dan evaluasi ulang tidak ada lagi kelompok valid untuk nilai dadu yang sama.

## Kapan Pertandingan Selesai

Pertandingan selesai saat semua Oncak di papan sudah habis.

Jika ada skor yang sama di posisi tertinggi, hasilnya seri.

## Ringkasan Cepat

- Dadu menentukan jumlah Oncak yang harus ditangkap.
- Pawn bergerak ortogonal saja.
- Maksimal 3 segmen gerak per capture.
- Titik tengah (5,5) selalu diblok.
- Pawn mulai dari `OFF_BOARD`.
- AI dan pemain manusia memakai aturan yang sama.
- Game selesai saat semua Oncak habis.

## Catatan UI

Di versi aplikasi ini, pemain yang masih `OFF_BOARD` ditampilkan terpisah dari board supaya papan utama tetap bersih dan tidak membingungkan saat permainan baru dimulai.

