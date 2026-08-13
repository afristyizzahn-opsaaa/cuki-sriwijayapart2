Product Requirements Document (PRD)

1. Document Information

Document Control

Property

Value

Project Name

CUKI: The Kingdom of Sriwijaya

Document Version

1.2

Status

Repository Ready

Reference Document

Game Design Bible v2.1 (Repository Ready) (Source of Truth)

Target Platform

Responsive Web Application

Target Release

Minimum Viable Product (MVP)

Development Timeline

2 Days

Related Documents

This Product Requirements Document should be read together with:

01_Game_Design_Bible.md

03_Design_System.md

04_Software_Architecture.md

05_CUKI_Rulebook.md

06_Game_Engine_Test_Cases.md

07_Functional_Specification.md

08_Master_Codex_Prompt.md

2. Product Overview

Product Summary

CUKI: The Kingdom of Sriwijaya is a responsive web application that transforms the traditional Palembang board game Cuki into an interactive digital experience. The platform combines gameplay, historical storytelling, and reward-driven progression to encourage players to learn about the Sriwijaya Kingdom through play rather than conventional reading.

The MVP focuses on delivering a complete and polished gameplay experience through:

- Single Player (Player vs AI)
- Local Multiplayer (2–4 Players)

while showcasing the physical Cuki board game as part of Indonesia's cultural heritage.

3. Product Goals

Primary Goal

Create an enjoyable digital adaptation of Cuki that naturally introduces players to the history of Sriwijaya through gameplay.

Secondary Goals

Increase player engagement through gamification.

Preserve and promote traditional Indonesian culture.

Showcase the physical Cuki board game.

Deliver a competition-ready MVP within two days.

4. Stakeholders

Role

Responsibility

Product Team

Product vision and requirements

UI/UX Designer

Interface and user experience

Frontend Developer

Website implementation

AI Coding Assistant (Codex)

Accelerated development

Competition Judges

Product evaluation

5. Target Users

Primary Users

Junior High School students

Senior High School students

University students

Teachers

Cultural enthusiasts

User Needs

Users want to:

Learn the rules of Cuki quickly.

Play immediately without complicated registration.

Collect rewards while playing.

Discover historical facts naturally.

Explore the physical board game.

6. Functional Requirements

FEAT-001 — Welcome & Guest Session

Feature ID: FEAT-001

Priority: 🔥 Critical

Business Goal: Menghilangkan hambatan saat pertama kali masuk sehingga pemain dapat langsung mencoba permainan tanpa harus membuat akun.

User Story: Sebagai pemain baru, saya ingin langsung masuk sebagai tamu agar dapat segera mencoba permainan tanpa proses registrasi.

Functional Requirements

ID

Requirement

FR-001

Sistem menampilkan Welcome Page saat website pertama kali dibuka.

FR-002

Sistem menyediakan tombol Continue as Guest sebagai CTA utama.

FR-003

Setelah tombol ditekan, sistem membuat sesi lokal menggunakan Local Storage.

FR-004

Sistem menjalankan micro transition (gerbang terbuka 1–2 detik).

FR-005

Setelah transisi selesai, pengguna diarahkan ke Homepage.

UI Components

Background gerbang Sriwijaya

Continue as Guest button

Logo

Ambient background

Acceptance Criteria

Website dapat diakses tanpa login.

Guest session tersimpan di browser.

Transisi berjalan mulus.

Homepage berhasil terbuka.

Technical Notes

Local Storage only.

Tidak menggunakan backend.

Tidak menggunakan authentication service.

FEAT-002 — Homepage

Feature ID: FEAT-002

Priority: 🔥 Critical

Business Goal: Menjadikan Homepage sebagai pusat navigasi seluruh pengalaman bermain.

User Story: Sebagai pemain, saya ingin melihat seluruh fitur utama dalam satu halaman sehingga saya dapat memilih aktivitas dengan mudah.

Functional Requirements

ID

Requirement

FR-006

Homepage mengikuti desain yang telah dikunci pada Game Design Bible.

FR-007

Raja muncul sebagai pemandu.

FR-008

Menampilkan lima menu utama dalam bentuk cards.

FR-009

Mulai Bermain menjadi CTA utama.

FR-010

Navbar selalu dapat diakses.

UI Components

Homepage Cards:

🎮 Mulai Bermain

🗺 Peta Kerajaan

📖 Tutorial

🏆 Treasures of Sriwijaya

📦 Produk

Navigation Bar

King Guide Character

Acceptance Criteria

Semua card dapat diklik.

Homepage responsif.

Tidak mengubah layout yang telah disetujui.

Technical Notes

Routing client-side.

Tidak memerlukan server/backend.

FEAT-003 — Tutorial

Feature ID: FEAT-003

Priority: 🔥 Critical

Business Goal: Memastikan pemain memahami dasar permainan sebelum bermain.

User Story: Sebagai pemain baru, saya ingin mempelajari dasar permainan secara singkat sehingga saya dapat mulai bermain dengan percaya diri.

Functional Requirements

ID

Requirement

FR-011

Tutorial hanya muncul pertama kali.

FR-012

Tutorial menjelaskan aturan dasar.

FR-013

Tutorial memberikan latihan singkat.

FR-014

Setelah selesai, pemain langsung masuk ke permainan.

UI Components

Dialogue Box / Guide Panel

Interactive Practice Board

Navigation Controls (Skip / Next)

Acceptance Criteria

Tutorial tidak muncul lagi setelah selesai (kecuali dibuka dari menu Tutorial).

Progress tutorial tersimpan di Local Storage.

Technical Notes

Save tutorial progress in Local Storage.

FEAT-004 — Cuki Gameplay

Feature ID: FEAT-004

Priority: 🔥 Critical

Business Goal: Memberikan pengalaman bermain Cuki digital yang sederhana, responsif, dan menyenangkan sambil mempertahankan esensi permainan tradisional.

Supported Game Modes:

MVP (Version 1.0):

Single Player (Player vs AI)

Local Multiplayer (2–4 Players)

Future Scope:

Online Multiplayer

Realtime Matchmaking

Remote Player Sync

User Story: Sebagai pemain, saya ingin bermain Cuki melawan AI atau secara lokal bersama teman sehingga saya dapat menikmati permainan kapan saja.

Functional Requirements

ID

Requirement

FR-015

Sistem memulai permainan setelah Tutorial selesai atau saat pemain memilih "Mulai Bermain".

FR-016

Sistem menampilkan papan permainan Cuki.

FR-017

Sistem menampilkan bidak pemain dan bidak AI.

FR-018

Sistem hanya memperbolehkan langkah yang valid.

FR-019

AI bermain secara otomatis setelah giliran pemain selesai.

FR-020

Sistem memperbarui posisi papan setelah setiap langkah.

FR-021

Sistem mendeteksi kondisi menang atau kalah.

FR-022

Sistem mengakhiri permainan ketika kondisi akhir tercapai.

UI Components

Game Board

Player Pieces

AI Pieces

Turn Indicator

Coins Counter

Hearts Counter

Pause Button

Exit Button

Acceptance Criteria

Permainan dapat dimainkan hingga selesai.

AI selalu mengambil langkah yang valid.

Tidak terjadi error saat pergantian giliran.

Hasil pertandingan dapat ditentukan dengan benar.

Technical Notes

Rule-based AI

Local game state

Supports Local Multiplayer (2–4 Players)

No server communication

No backend synchronization

Gameplay implementation SHALL follow:

05_CUKI_Rulebook.md

06_Game_Engine_Test_Cases.md

FEAT-005 — Victory & Defeat Flow

Feature ID: FEAT-005

Priority: 🔥 Critical

Business Goal: Memberikan umpan balik yang jelas setelah pertandingan serta menjaga motivasi pemain untuk terus bermain.

User Story: Sebagai pemain, saya ingin mendapatkan hadiah ketika menang dan kesempatan belajar ketika kalah sehingga saya tetap termotivasi untuk melanjutkan permainan.

Functional Requirements

ID

Requirement

FR-023

Sistem menampilkan Victory Screen jika pemain menang.

FR-024

Sistem memberikan Coins sesuai reward.

FR-025

Sistem memperbarui progress Mission.

FR-026

Sistem mengarahkan pemain ke Treasures of Sriwijaya setelah kemenangan.

FR-027

Sistem menampilkan Defeat Flow ketika pemain kalah.

FR-028

Sistem memeriksa jumlah Hearts pemain.

FR-029

Jika Hearts > 0, pemain dapat langsung bermain kembali.

FR-030

Jika Hearts = 0, sistem menjalankan Royal Scroll Flow.

UI Components

Victory Screen Modal / Overlay

Defeat Screen Modal / Overlay

Reward Summary Card

Action Buttons (Play Again, Go to Treasures, Continue)

Victory Rewards

Coins

Mission Progress

Achievement Update

Unlock Treasure (jika memenuhi syarat)

Acceptance Criteria

Reward diberikan otomatis.

Progress tersimpan.

Redirect berjalan sesuai flow.

Technical Notes

Update Local Storage.

Tidak menggunakan backend.

FEAT-006 — Royal Scroll & Quiz

Feature ID: FEAT-006

Priority: ⭐ High

Business Goal: Mengintegrasikan pembelajaran sejarah ke dalam gameplay tanpa mengganggu pengalaman bermain.

User Story: Sebagai pemain yang kalah, saya ingin memperoleh kesempatan kedua dengan membaca sejarah singkat dan menjawab kuis sehingga belajar terasa sebagai bagian dari permainan.

Functional Requirements

ID

Requirement

FR-031

Raja muncul setelah pemain kalah dan Hearts = 0.

FR-032

Raja memberikan pesan penyemangat.

FR-033

Sistem menampilkan Royal Scroll.

FR-034

Pemain membaca cerita sejarah singkat.

FR-035

Sistem menampilkan satu pertanyaan kuis.

FR-036

Jika jawaban benar, pemain memperoleh +1 Heart.

FR-037

Jika jawaban salah, pemain dapat mencoba kembali.

FR-038

Setelah memperoleh Heart, pemain dapat kembali bermain.

UI Components

King Dialogue

Royal Scroll Panel

Quiz Card

Multiple Choice Options

Correct / Incorrect Feedback

Continue Button

Acceptance Criteria

Cerita sejarah tampil dengan benar.

Quiz dapat dijawab.

Heart diberikan hanya jika jawaban benar.

Pemain dapat kembali ke permainan setelah memperoleh Heart.

Technical Notes

Local Storage state update for Hearts.

Static scroll and quiz content from client bundle.

FEAT-007 — Treasures of Sriwijaya

Feature ID: FEAT-007

Priority: ⭐ High

Business Goal: Memberikan rasa pencapaian (sense of progression) dengan menampilkan seluruh koleksi, reward, dan pencapaian pemain dalam satu halaman.

User Story: Sebagai pemain, saya ingin melihat semua hadiah yang telah saya kumpulkan sehingga saya merasa memiliki progres dan terdorong untuk terus bermain.

Functional Requirements

ID

Requirement

FR-039

Sistem menyediakan halaman Treasures yang dapat diakses dari Homepage.

FR-040

Sistem menampilkan jumlah Coins dan Hearts secara real-time.

FR-041

Sistem menampilkan koleksi Skin yang telah dibuka.

FR-042

Sistem menampilkan daftar Mission beserta statusnya.

FR-043

Sistem menampilkan Historical Scroll yang telah dikumpulkan.

FR-044

Sistem menampilkan Achievement yang telah diperoleh.

FR-045

Setelah kemenangan pertama, pemain otomatis diarahkan ke halaman Treasures.

UI Components

Wallet Summary (Coins & Hearts)

Piece Skins

Board Themes

Avatar

Mission Progress

Achievement Collection

Historical Scroll Collection

Acceptance Criteria

Semua koleksi diperbarui secara otomatis.

Progress tetap tersimpan setelah browser ditutup (Local Storage).

Halaman dapat diakses kapan saja dari Homepage.

Technical Notes

Data berasal dari Local Storage.

Tidak memerlukan backend.

FEAT-008 — Peta Kerajaan

Feature ID: FEAT-008

Priority: ⭐ Medium

Business Goal: Memberikan konteks sejarah mengenai Kerajaan Sriwijaya melalui visualisasi wilayah dan lokasi penting.

User Story: Sebagai pemain, saya ingin menjelajahi peta Sriwijaya agar lebih memahami wilayah dan sejarah kerajaan tersebut.

Functional Requirements

ID

Requirement

FR-046

Sistem menampilkan ilustrasi peta Kerajaan Sriwijaya.

FR-047

Sistem menyediakan titik informasi (information points).

FR-048

Ketika titik diklik, sistem menampilkan pop-up berisi informasi sejarah singkat.

FR-049

Peta tidak memiliki sistem level, quest, atau unlock.

FR-050

Pengguna dapat kembali ke Homepage kapan saja.

UI Components

Kingdom Map

Information Markers

History Popup

Back Button

Acceptance Criteria

Semua marker dapat dibuka.

Pop-up tampil dengan benar.

Tidak ada logika gameplay di halaman ini.

Technical Notes

Static page.

Informasi bersifat edukatif.

FEAT-009 — Produk

Feature ID: FEAT-009

Priority: ⭐ Medium

Business Goal: Memperkenalkan board game Cuki versi fisik sebagai media pelestarian budaya.

User Story: Sebagai pengunjung, saya ingin mengetahui produk board game Cuki sehingga saya memahami bahwa permainan ini juga tersedia dalam bentuk fisik.

Functional Requirements

ID

Requirement

FR-051

Sistem menampilkan foto board game fisik.

FR-052

Sistem menampilkan komponen permainan.

FR-053

Sistem menjelaskan nilai edukatif permainan.

FR-054

Sistem menyediakan informasi kontak atau media untuk memperoleh produk.

UI Components

Product Gallery

Components Section

Educational Benefits

Contact Information

Acceptance Criteria

Informasi produk tampil lengkap.

Gambar dapat diperbesar (opsional).

Tidak ada fitur checkout atau pembayaran pada MVP.

Technical Notes

Static content.

Tidak menggunakan e-commerce.

FEAT-010 — Economy System

Feature ID: FEAT-010

Priority: ⭐ High

Business Goal: Memberikan sistem progres yang sederhana namun memotivasi pemain untuk terus bermain.

User Story: Sebagai pemain, saya ingin mendapatkan dan menggunakan Coins serta Hearts agar saya memiliki tujuan jangka panjang saat bermain.

Functional Requirements

ID

Requirement

FR-055

Sistem memberikan Coins setelah kemenangan dan penyelesaian misi.

FR-056

Sistem memberikan Hearts melalui Royal Scroll atau pembelian menggunakan Coins.

FR-057

Sistem memungkinkan pemain membeli kosmetik menggunakan Coins.

FR-058

Sistem memperbarui Wallet secara real-time.

FR-059

Sistem menyimpan seluruh progres ekonomi di Local Storage.

Economy Rules

Coins

Sources:

Menang pertandingan

Menyelesaikan Mission

Achievement

Uses:

Membeli Piece Skin

Membeli Board Theme

Membeli Avatar

Membeli Hearts

Hearts

Sources:

Royal Scroll

Mission Reward

Dibeli menggunakan Coins

Uses:

Instant Replay setelah kalah

Missions (MVP)

Finish Tutorial

Win First Match

Read First Royal Scroll

Answer First Quiz Correctly

UI Components

Wallet Bar (Coins & Hearts Counter)

Shop Modal / Interface

Mission List Item Component

Acceptance Criteria

Coins bertambah sesuai reward.

Hearts dapat digunakan dan dikurangi saat dipakai.

Semua transaksi tercatat di Local Storage.

Technical Notes

All economy data must follow the shared Local Storage schema defined in:

04_Software_Architecture.md

7. Non-Functional Requirements (NFR)

Non-Functional Requirements menjelaskan bagaimana kualitas sistem harus bekerja, bukan fitur apa yang dimiliki.

Performance

ID

Requirement

NFR-001

Website harus dimuat dalam $\le 3$ detik pada koneksi normal.

NFR-002

Perpindahan antar halaman berlangsung dalam $\le 500$ ms.

NFR-003

Gameplay berjalan dengan animasi yang halus tanpa lag yang mengganggu.

Responsiveness

ID

Requirement

NFR-004

Website mendukung Desktop, Tablet, dan Mobile.

NFR-005

Layout tetap konsisten pada berbagai ukuran layar.

Browser Compatibility

ID

Requirement

NFR-006

Google Chrome

NFR-007

Microsoft Edge

NFR-008

Safari

NFR-009

Mozilla Firefox

Usability

ID

Requirement

NFR-010

Navigasi mudah dipahami oleh pengguna baru.

NFR-011

CTA utama selalu terlihat jelas.

NFR-012

Tutorial hanya muncul saat pertama kali bermain.

Accessibility

ID

Requirement

NFR-013

Kontras warna memenuhi standar keterbacaan.

NFR-014

Semua tombol memiliki label yang jelas.

NFR-015

Seluruh fitur dapat diakses menggunakan keyboard (opsional untuk MVP).

Security

ID

Requirement

NFR-016

Tidak menyimpan data sensitif pengguna.

NFR-017

Data hanya disimpan di Local Storage.

NFR-018

Tidak menggunakan autentikasi server pada MVP.

Maintainability

ID

Requirement

NFR-019

Struktur kode modular.

NFR-020

Setiap fitur dipisahkan menjadi komponen independen.

NFR-021

Mudah dikembangkan untuk fitur multiplayer di masa depan.

8. Out of Scope (MVP)

The following features are intentionally excluded from Version 1.0:

Authentication

Backend API

Cloud Save

Online Multiplayer

Payment System

Admin Dashboard

Analytics

9. Release Scope

MVP (Version 1.0) Included Features

Welcome Page

Guest Session

Homepage

Tutorial

Single Player (Player vs AI)

Local Multiplayer (2–4 Players)

Victory Flow

Defeat Flow

Royal Scroll

Mini Quiz

Treasures of Sriwijaya

Peta Kerajaan

Produk

Economy System

Mission System

Achievement

Local Storage

Future Scope

Online Multiplayer

Private Room / Room Code Join

Realtime Matchmaking

User Login & Cloud Save

Leaderboard

Dynamic Missions & Daily Challenges

Seasonal Events

Additional AI Difficulty Levels

Marketplace & Customization Expansion

10. MVP Acceptance Criteria

MVP dinyatakan selesai apabila seluruh poin berikut terpenuhi:

Onboarding

Welcome Page berjalan.

Guest Session berjalan.

Homepage tampil sesuai desain yang disetujui.

Gameplay

Tutorial berjalan.

Permainan dapat dimainkan hingga selesai.

AI dapat mengambil langkah.

Menang dan kalah terdeteksi dengan benar.

Reward

Coins diberikan.

Hearts bekerja sesuai aturan.

Mission diperbarui.

Achievement tersimpan.

Learning

Royal Scroll tampil.

Mini Quiz berjalan.

Reward diberikan setelah jawaban benar.

Additional Pages

Peta Kerajaan dapat diakses.

Produk dapat diakses.

Treasures of Sriwijaya menampilkan koleksi pemain.

Technical

Semua progres tersimpan di Local Storage.

Tidak ada error kritis.

Website responsif.

Website dapat dijalankan secara lokal.

11. Development Milestones

Sprint 1: Foundation

Setup Project

Routing

Homepage

Navbar

Assets

Sprint 2: Gameplay

Board

Rules

AI

Turn System

Sprint 3: Reward System

Victory

Defeat

Coins

Hearts

Royal Scroll

Sprint 4: Supporting Features

Treasures of Sriwijaya

Produk

Peta Kerajaan

Tutorial

Sprint 5: Polish

Animation

Responsive

Bug Fix

Testing

12. Engineering Definition of Done

Sebuah fitur dianggap selesai apabila:

Seluruh Functional Requirements (FR-001 ~ FR-059) terpenuhi.

Seluruh Acceptance Criteria terpenuhi.

Tidak menghasilkan error kritis.

UI sesuai desain yang disetujui.

Data tersimpan dengan benar di Local Storage.

Dapat dijalankan tanpa backend.

Siap dipresentasikan kepada juri.