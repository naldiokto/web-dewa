# 🌀 DEWA Smart Fan Control & CCTV Monitoring (IoT ESP32-CAM)

Aplikasi web modern dan responsif untuk sistem **Kipas Angin Pintar** berbasis **ESP32-CAM** & **Arduino** dengan fitur **Deteksi Wajah Otomatis**, **Live CCTV Streaming (Dapat diakses di mana saja)**, dan **Remote Kontrol via Firebase**.

---

## ✨ Fitur Utama

1. **Otomatisasi Deteksi Wajah (Auto Mode):**
   - Kipas otomatis **MENYALA** saat kamera mendeteksi keberadaan wajah di depan kipas.
   - Kipas otomatis **MATI** saat tidak ada orang/wajah terdeteksi untuk menghemat energi.
2. **Manual Override (Power ON/OFF):**
   - Tombol darurat untuk menghidupkan atau mematikan kipas kapan saja, menjaga keandalan sistem jika sensor mendeteksi error.
3. **Pengaturan Kecepatan (Fan Speed):**
   - Slider 3 tingkat kecepatan (Pelan, Sedang, Kencang) dengan animasi putaran visual di dashboard.
4. **Live CCTV Feed (Akses Global):**
   - Menampilkan siaran langsung kamera di badan kipas angin.
   - Dilengkapi HUD Target Deteksi Wajah AI & dukungan akses global via Ngrok / Cloudflare Tunnel.
5. **Realtime IoT Backend via Firebase:**
   - Terintegrasi langsung dengan Firebase Firestore (`dewa-1df85`).
6. **Simulator Pengujian Sensor Terintegrasi:**
   - Tombol simulasi untuk menguji respons sistem di browser tanpa harus menyalakan sirkuit fisik ESP32.
7. **Responsif Desktop & Mobile:**
   - Desain antarmuka fleksibel untuk Laptop/PC dan Smartphone.

---

## 🚀 Cara Menjalankan Aplikasi Web

### 1. Menjalankan Server Pengembangan (Dev)
Buka terminal pada folder proyek ini, lalu jalankan:
```bash
npm run dev
```
Buka browser pada alamat yang muncul (biasanya `http://localhost:3000`).

### 2. Membuka di Handphone (Satu Jaringan WiFi)
Saat Anda menjalankan `npm run dev`, Vite akan menampilkan **Network URL**, contoh:
```
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.15:3000/
```
Buka URL **Network** tersebut di browser HP Anda.

---

## 📱 Cara Mengubah Web Menjadi Aplikasi Android (APK)

Karena web ini dibangun menggunakan Vite + React dan Tailwind CSS, Anda bisa dengan sangat mudah mengubahnya menjadi aplikasi Android:

### Opsi A: Progressive Web App (PWA) / Add to Home Screen (Paling Cepat)
1. Buka website di browser Chrome di HP Anda.
2. Klik titik tiga di pojok kanan atas browser.
3. Pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)** / **"Install Aplikasi"**.
4. Aplikasi akan terpasang di HP Anda layaknya aplikasi asli Play Store tanpa perlu build APK!

### Opsi B: Menggunakan Capacitor (Native APK Android)
Jalankan perintah berikut di terminal:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Smart Fan" "com.dewa.smartfan"
npm run build
npx cap add android
npx cap copy
npx cap open android
```
Android Studio akan terbuka dan Anda bisa langsung klik **Build APK**.

---

---

## 💻 Mode Demo Webcam Laptop (Sebelum Hardware Tiba)

Aplikasi ini sudah dilengkapi **Mode Demo Interaktif** yang memanfaatkan **Webcam Laptop Anda**:
- Tidak perlu menunggu kiriman paket tiba untuk menguji logika otomatisasi kipas.
- Browser akan meminta izin kamera laptop, lalu mendeteksi wajah Anda secara real-time.
- Saat wajah Anda muncul di depan webcam, status Firebase akan otomatis berubah dan kipas akan menyala (Auto Mode).

---

## 🔄 Cara Mengembalikan Sistem ke Mode ESP32-CAM (Saat Hardware Tiba)

**PENTING: Tidak ada kode program yang perlu Anda hapus atau ubah!**

Ketika paket modul ESP32-CAM, Arduino, dan Relay Anda sudah sampai, ikuti 3 langkah mudah ini:

1. **Ganti Sumber Kamera di Web:**
   - Pada bagian atas kotak video CCTV di web, klik tombol tab **`[ 📡 ESP32-CAM (Hardware) ]`**.
   - Webcam laptop akan otomatis berhenti dan mati.
2. **Masukkan URL Kamera ESP32:**
   - Klik ikon ⚙️ Pengaturan di pojok kanan atas video.
   - Masukkan alamat IP lokal WiFi ESP32 Anda (misalnya: `http://192.168.1.15:81/stream`) atau link Ngrok/Cloudflare jika ingin diakses dari luar rumah.
   - Klik **"Simpan & Aktifkan ESP32"**.
3. **Flash Kode Arduino:**
   - Buka tombol **"Panduan Alat"** di navbar web, salin kode C++ Arduino yang disediakan ke Arduino IDE, lalu upload ke modul ESP32-CAM Anda.
4. **Selesai!** Sistem sekarang 100% membaca sensor wajah fisik dari ESP32-CAM di badan kipas dan mengontrol relay secara mandiri.

---

## 🛠️ Panduan Hardware (ESP32-CAM + Relay + Arduino)

Skema perkabelan dan kode program lengkap (`.ino`) sudah tersedia langsung di dalam aplikasi web. Klik tombol **"Panduan Alat"** pada bagian atas web untuk melihat:
- Pinout koneksi kabel ESP32-CAM ke Relay dan Kipas.
- Kode Arduino C++ lengkap siap upload.
- Cara setup tunnel Ngrok / Cloudflare agar CCTV bisa dilihat saat bepergian ke luar rumah.

