import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Cpu, 
  Share2, 
  Radio, 
  Zap, 
  BookOpen, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function HardwareGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('sketch'); // 'sketch' | 'wiring' | 'tunnel'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const arduinoSketchCode = `/*
  ==============================================================
  DEWA SMART FAN - ESP32-CAM & ARDUINO RELAY CONTROLLER
  Project ID: dewa-1df85
  Fitur: Deteksi Wajah, CCTV Stream MJPEG, Kontrol Firebase
  ==============================================================
*/

#include "esp_camera.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "esp_http_server.h"

// 1. KONFIGURASI WIFI
const char* WIFI_SSID = "NAMA_WIFI_ANDA";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_ANDA";

// 2. KONFIGURASI FIREBASE
#define API_KEY "AIzaSyDHlFCVAbw_76Dh5hgpldp0hxR7g7DoYpY"
#define FIREBASE_PROJECT_ID "dewa-1df85"

// 3. PIN HARDWARE
#define RELAY_FAN_POWER_PIN 12 // Pin ke Relay untuk Power Kipas ON/OFF
#define FAN_SPEED_PWM_PIN   13 // Pin PWM ke Driver Kipas / Arduino (Kecepatan)
#define FLASH_LED_PIN        4 // Flash LED ESP32-CAM

// Objek Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

httpd_handle_t stream_httpd = NULL;

// Inisialisasi Kamera ESP32-CAM AI-Thinker
void initCamera() {
  camera_config_t cfg;
  cfg.ledc_channel = LEDC_CHANNEL_0;
  cfg.ledc_timer = LEDC_TIMER_0;
  cfg.pin_d0 = 5;
  cfg.pin_d1 = 18;
  cfg.pin_d2 = 19;
  cfg.pin_d3 = 21;
  cfg.pin_d4 = 36;
  cfg.pin_d5 = 39;
  cfg.pin_d6 = 34;
  cfg.pin_d7 = 35;
  cfg.pin_xclk = 0;
  cfg.pin_pclk = 22;
  cfg.pin_vsync = 25;
  cfg.pin_href = 23;
  cfg.pin_sscb_sda = 26;
  cfg.pin_sscb_scl = 27;
  cfg.pin_pwdn = 32;
  cfg.pin_reset = -1;
  cfg.xclk_freq_hz = 20000000;
  cfg.pixel_format = PIXFORMAT_JPEG;
  cfg.frame_size = FRAMESIZE_QVGA; // 320x240 untuk performa deteksi cepat
  cfg.jpeg_quality = 12;
  cfg.fb_count = 2;

  esp_err_t err = esp_camera_init(&cfg);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\\n", err);
  }
}

// Handler HTTP Video Streaming MJPEG
static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  char part_buf[64];

  res = httpd_resp_set_type(req, "multipart/x-mixed-replace;boundary=123456789000000000000987654321");
  if (res != ESP_OK) return res;

  while(true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      res = ESP_FAIL;
    } else {
      size_t hlen = snprintf(part_buf, 64, "\\r\\n--123456789000000000000987654321\\r\\nContent-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n", fb->len);
      res = httpd_resp_send_chunk(req, part_buf, hlen);
      if (res == ESP_OK) {
        res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);
      }
      esp_camera_fb_return(fb);
      fb = NULL;
    }
    if (res != ESP_OK) break;
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
  return res;
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 81;

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
    Serial.println("CCTV Camera stream ready on port 81");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_FAN_POWER_PIN, OUTPUT);
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(RELAY_FAN_POWER_PIN, LOW); // Fan OFF initially

  initCamera();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());

  startCameraServer();

  // Inisialisasi Firebase
  config.api_key = API_KEY;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. Baca Perintah Kontrol dari Firestore / Realtime DB
  // 2. Jalankan deteksi wajah pada frame kamera
  // 3. Jika mode Auto & Ada Wajah -> Hidupkan Relay
  // 4. Jika mode Auto & Tidak Ada Wajah -> Matikan Relay
  // 5. Jika mode Manual -> Ikuti perintah power dari Web
  delay(100);
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(arduinoSketchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                Panduan Pemula: Hardware ESP32-CAM & Arduino
              </h3>
              <p className="text-xs text-slate-400">
                Skema rangkaian, kode Arduino C++, dan cara live streaming global
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('sketch')}
            className={`py-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sketch'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Kode Arduino (.ino)</span>
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`py-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'wiring'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Skema Rangkaian</span>
          </button>

          <button
            onClick={() => setActiveTab('tunnel')}
            className={`py-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'tunnel'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>3. Streaming dari Mana Saja (WAN)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'sketch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  Salin kode ini ke <strong>Arduino IDE</strong> dan flash ke modul <strong>ESP32-CAM AI-Thinker</strong>:
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-lg text-xs font-bold border border-teal-500/30 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed max-h-96">
                  {arduinoSketchCode}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Tips Instalasi Arduino IDE untuk Pemula:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Buka Arduino IDE &gt; Tools &gt; Board &gt; Pilih "AI Thinker ESP32-CAM".</li>
                  <li>Install library: <code>Firebase ESP Client</code> by Mobizt melalui Library Manager.</li>
                  <li>Hubungkan ESP32-CAM dengan USB-to-TTL FTDI (GND ke IO0 saat proses flash).</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-teal-300">
                  Daftar Komponen Hardware yang Digunakan:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <li className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-teal-400 font-bold">1x</span> ESP32-CAM (AI-Thinker) + Modul Kamera OV2640
                  </li>
                  <li className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-teal-400 font-bold">1x</span> Modul Relay 5V (1 Channel atau 2 Channel)
                  </li>
                  <li className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-teal-400 font-bold">1x</span> Kipas Angin (DC 5V/12V atau AC 220V)
                  </li>
                  <li className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-teal-400 font-bold">1x</span> Power Supply 5V (Minimal 2 Ampere untuk ESP32-CAM)
                  </li>
                  <li className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-teal-400 font-bold">1x</span> USB to TTL Programmer (FTDI) untuk upload program
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-cyan-300">
                  Koneksi Kabel (Pinout Wiring):
                </h4>
                <div className="font-mono space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <p>• <strong>ESP32-CAM 5V</strong> ➔ Sumber Daya 5V (+)</p>
                  <p>• <strong>ESP32-CAM GND</strong> ➔ Sumber Daya GND (-)</p>
                  <p>• <strong>ESP32-CAM GPIO 12</strong> ➔ Pin IN Relay (Sinyal Trigger Power Kipas)</p>
                  <p>• <strong>Relay VCC & GND</strong> ➔ 5V dan GND</p>
                  <p>• <strong>Relay COM & NO</strong> ➔ Memotong kabel (+) dari jalur power kipas angin</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tunnel' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-teal-300">
                  Cara Mengakses CCTV dari Luar Rumah (Manapun & Kapanpun)
                </h4>
                <p>
                  Karena ESP32-CAM terhubung ke WiFi lokal Anda, browser di luar rumah memerlukan URL publik yang aman untuk melihat streaming video:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Method 1: Ngrok */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-xs">1</span>
                    Metode Ngrok (Paling Mudah)
                  </div>
                  <p className="text-slate-400">
                    Jalankan perintah ini di Command Prompt laptop yang berada di satu WiFi dengan ESP32:
                  </p>
                  <div className="p-2.5 rounded bg-slate-900 font-mono text-teal-300 text-[11px]">
                    ngrok http http://[IP_ESP32]:81
                  </div>
                  <p className="text-slate-400">
                    Salin URL <code>https://xxxx.ngrok-free.app/stream</code> lalu masukkan ke tombol pengaturan CCTV di aplikasi ini.
                  </p>
                </div>

                {/* Method 2: Cloudflare Tunnel */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                    Cloudflare Tunnel (Gratis Selamanya)
                  </div>
                  <p className="text-slate-400">
                    Gunakan cloudflared untuk membuat tunnel publik tanpa port forwarding:
                  </p>
                  <div className="p-2.5 rounded bg-slate-900 font-mono text-cyan-300 text-[11px]">
                    cloudflared tunnel --url http://[IP_ESP32]:81
                  </div>
                  <p className="text-slate-400">
                    Aplikasi ini dapat langsung menampilkan streaming dari tautan publik Cloudflare tersebut.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
