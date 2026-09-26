# 📋 Rincian Alat, Bahan & Spesifikasi: Smart Fan ESP32-CAM

Dokumen ini memuat daftar lengkap peralatan, komponen elektronik, bahan perakitan, beserta spesifikasi teknis mendalam untuk membangun sistem **Smart Fan IoT dengan Deteksi Wajah dan CCTV Monitoring**.

---

## 🛠️ 1. Daftar Komponen Utama & Spesifikasi

### A. Modul Mikrokontroler & Kamera
| Komponen | Spesifikasi Teknis | Fungsi / Peran | Catatan Penting |
| :--- | :--- | :--- | :--- |
| **ESP32-CAM (AI-Thinker)** | - Chip: ESP32-S dual-core 32-bit Tensilica LX6 @ 240 MHz<br>- RAM: 520 KB SRAM + 4 MB PSRAM eksternal<br>- Flash: 4 MB SPI Flash<br>- Wi-Fi: 802.11 b/g/n (2.4 GHz)<br>- Bluetooth: BLE v4.2 BR/EDR<br>- Slot MicroSD (TF Card up to 4GB) | Otak utama sistem untuk pemrosesan AI (deteksi wajah), web server streaming video, dan komunikasi ke Firebase. | **PSRAM wajib aktif** saat kompilasi di Arduino IDE agar buffer gambar JPEG tidak kehabisan memori. |
| **Sensor Kamera OV2640** | - Resolusi: 2 Megapixel (UXGA 1600x1200 max)<br>- Format Output: JPEG, RGB565, YUV422<br>- Field of View (FOV): 66° s/d 160° (opsional lensa fisheye)<br>- Frame Rate: 15 fps (SVGA), 30 fps (CIF/QVGA) | Menangkap citra secara *real-time* untuk deteksi wajah pengguna di depan kipas. | Disarankan menggunakan resolusi QVGA (320x240) atau CIF (400x296) agar streaming lancar tanpa lag. |

---

### B. Modul Kontrol Beban (Saklar & Kecepatan Kipas)
| Komponen | Spesifikasi Teknis | Fungsi / Peran | Catatan Penting |
| :--- | :--- | :--- | :--- |
| **Modul Relay 5V 1-Channel (Optocoupler)** | - Tegangan Trigger: 5V DC<br>- Arus Trigger: 5 mA - 15 mA (Active LOW/HIGH)<br>- Kapasitas Kontak: AC 250V/10A, DC 30V/10A<br>- Isolasi: Optocoupler EL817 | Sebagai saklar pemutus dan penyambung daya utama ke kipas angin (Power ON/OFF). | Memberikan proteksi isolasi galvanis antara sirkuit tegangan rendah ESP32 dan daya motor kipas. |
| **Modul MOSFET IRF520 / Driver PWM (Opsi Kipas DC)** | - Tegangan Input: DC 0 - 24V<br>- Arus Beban Max: 5A (dengan heatsink)<br>- Sinyal Kontrol: PWM 3.3V - 5V | Mengatur kecepatan putaran motor kipas DC secara presisi berdasarkan slider web. | Jika menggunakan **Kipas AC (listrik rumah)**, gunakan *Modul AC Dimmer PWM (Zero-Crossing detection)* seperti RobotDyn AC Dimmer. |

---

### C. Sistem Catu Daya (Power Supply) - *Sangat Krusial!*
| Komponen | Spesifikasi Teknis | Fungsi / Peran | Catatan Penting |
| :--- | :--- | :--- | :--- |
| **Adaptor Power Supply 5V (Minimal 2A - 3A)** | - Tegangan Output: 5.0V DC stabil<br>- Arus Maksimal: 2.0A s/d 3.0A (Regulated)<br>- Jack DC 5.5x2.1mm atau Micro-USB | Memberikan pasokan daya ke ESP32-CAM dan Modul Relay. | ⚠️ **PENTING:** Jangan memberi daya ESP32-CAM hanya dari port USB laptop saat streaming kamera, karena arus puncak Wi-Fi (~500mA - 800mA) akan menyebabkan *Brownout Detector Error* / reset berulang-ulang. |
| **Kapasitor Elektrolit 100µF – 470µF (16V / 25V)** | - Kapasitansi: 100µF - 470µF<br>- Rating Tegangan: Minimal 10V - 25V | Ditempatkan paralel pada pin 5V dan GND ESP32-CAM. | Meredam lonjakan arus mendadak (*voltage drop spike*) saat kamera dan pemancar Wi-Fi aktif bersamaan. |
| **Buck Converter Step-Down LM2596 (Opsional)** | - Input: DC 4V - 40V<br>- Output: DC 1.25V - 37V (Adjustable)<br>- Efisiensi: ~92%, Arus Max: 3A | Jika menggunakan satu adaptor 12V untuk kipas DC 12V, alat ini menurunkan tegangan ke 5V stabil untuk ESP32-CAM. | Putar potensiometer dan ukur dengan multimeter hingga output pas di 5.0V sebelum disambungkan ke ESP32. |

---

### D. Alat Pemrograman & Perkabelan
| Alat / Bahan | Spesifikasi Teknis | Fungsi / Peran |
| :--- | :--- | :--- |
| **USB to TTL Serial Adapter (FTDI FT232RL / CP2102)** | - Chip: FT232RL atau Silicon Labs CP2102<br>- Level Logika: Jumper switch 3.3V / 5V<br>- Pin: VCC, GND, TX, RX, DTR, CTS | Mengunggah (*flash*) program Arduino C++ dari laptop ke modul ESP32-CAM (karena ESP32-CAM tidak memiliki port micro-USB bawaan). |
| **Kabel Jumper Dupont** | - Tipe: Female-to-Female & Male-to-Female<br>- Panjang: 20 cm, Konduktor: Tembaga serabut | Menghubungkan pinout ESP32-CAM, FTDI programmer, relay, dan power supply. |
| **Kipas Angin** | - Pilihan 1: Kipas DC 5V atau 12V (Kipas Brushless PC / Exhaust Mini)<br>- Pilihan 2: Kipas Angin Meja AC 220V biasa | Beban yang dikendalikan oleh sistem. |
| **Breadboard / PCB Dot Matrix** | - 400 atau 830 titik (Breadboard) / PCB FR4 | Media merakit sirkuit sementara (prototyping) tanpa perlu menyolder langsung. |

---

## 🔌 2. Skema Rangkaian Perkabelan (Wiring Pinout)

### Tahap 1: Wiring untuk Upload Program (Flashing)
| Pin FTDI USB-TTL | Pin ESP32-CAM | Catatan |
| :--- | :--- | :--- |
| **VCC (Set Jumper ke 5V)** | **5V** | Sumber daya upload |
| **GND** | **GND** | Ground bersama |
| **TX (Transmit)** | **U0R (Receive / GPIO 3)** | Sinyal data serial |
| **RX (Receive)** | **U0T (Transmit / GPIO 1)** | Sinyal data serial |
| - | **GPIO 0 dihubungkan ke GND** | ⚠️ **Wajib dipasang jumper saat upload**, dan **dilepas** saat menjalankan program normal! |

---

### Tahap 2: Wiring Operasional Kipas & Relay (Running Mode)
| Dari Komponen | Ke Pin ESP32-CAM | Sumber Daya | Keterangan |
| :--- | :--- | :--- | :--- |
| **Power Supply 5V (+)** | **Pin 5V ESP32-CAM** & **VCC Relay** | Adaptor 5V Eksternal | Jalur Positif Catu Daya |
| **Power Supply GND (-)** | **Pin GND ESP32-CAM** & **GND Relay** | Adaptor 5V Eksternal | Ground Bersama (Common GND) |
| **Kapasitor 470µF (+)** | **Pin 5V ESP32-CAM** | - | Penyaring noise tegangan |
| **Kapasitor 470µF (-)** | **Pin GND ESP32-CAM** | - | Penyaring noise tegangan |
| **Pin IN (Sinyal Relay)** | **GPIO 12 ESP32-CAM** | - | Mengontrol saklar ON/OFF |
| **Relay COM & NO** | Jalur Kabel Kipas | Ke Steker / Adaptor Kipas | Saklar pemutus daya kipas |
| **GPIO 0** | *Dibiarkan Terbuka (Tidak terhubung)* | - | Mode eksekusi program normal |

---

## 💡 3. Tips Sukses untuk Pemula
1. **Atasi Kamera Brownout:** Jika saat dinyalakan kamera sering me-restart sendiri (*Guru Meditation Error / Brownout Detector*), 99% masalahnya ada pada adaptor yang kurang dari 2 Ampere atau kabel USB yang terlalu panjang dan tipis. Gunakan adaptor 5V 2A-3A berkualitas.
2. **Jarak Deteksi Wajah:** Jarak efektif deteksi wajah kamera OV2640 dengan lensa standar adalah **0.5 meter hingga 2 meter** di depan kipas angin pada kondisi pencahayaan ruangan yang cukup.
