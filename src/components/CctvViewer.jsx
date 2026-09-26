import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Maximize2, 
  Minimize2, 
  Settings, 
  ScanFace, 
  Wifi, 
  WifiOff, 
  Video, 
  VideoOff, 
  HelpCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function CctvViewer({ 
  streamUrl, 
  onUpdateStreamUrl, 
  faceDetected, 
  lastFaceSeen,
  fanPower
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(streamUrl || '');
  const [streamError, setStreamError] = useState(false);
  const [demoMode, setDemoMode] = useState(!streamUrl);
  const [hudActive, setHudActive] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (streamUrl) {
      setCustomUrl(streamUrl);
      setDemoMode(false);
    }
  }, [streamUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    onUpdateStreamUrl(customUrl.trim());
    setShowConfig(false);
    setStreamError(false);
    if (!customUrl.trim()) {
      setDemoMode(true);
    } else {
      setDemoMode(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* CCTV Screen Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              demoMode ? 'bg-amber-400' : 'bg-red-400'
            } opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              demoMode ? 'bg-amber-500' : 'bg-red-500'
            }`}></span>
          </span>
          <span className="font-bold tracking-wider uppercase text-slate-200">
            {demoMode ? 'CCTV SIMULATOR (DEMO)' : 'ESP32-CAM LIVE'}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            30 FPS • MJPEG
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHudActive(!hudActive)}
            title="Toggle AI Face Detection HUD"
            className={`p-1.5 rounded-lg border transition-colors ${
              hudActive 
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <ScanFace className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Konfigurasi URL Streaming Global / Tunnel"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
        {demoMode ? (
          /* Simulated CCTV Feed */
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
            {/* Scanline Background Texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            {/* Simulated Room Graphics */}
            <div className="relative flex flex-col items-center justify-center z-10 space-y-4">
              <div className="relative">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-dashed transition-all duration-700 flex items-center justify-center ${
                  fanPower ? 'border-teal-400 animate-spin-slow' : 'border-slate-700'
                }`}>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl">🌀</span>
                  </div>
                </div>
                {fanPower && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 text-[9px] font-bold text-slate-950 items-center justify-center">
                      ON
                    </span>
                  </span>
                )}
              </div>

              <div className="max-w-xs space-y-1">
                <p className="text-sm font-semibold text-slate-200">
                  Mode Simulasi Kamera Aktif
                </p>
                <p className="text-xs text-slate-400">
                  Kamera asli belum terhubung. Masukkan URL Ngrok / Cloudflare atau IP ESP32-CAM pada tombol pengaturan di kanan atas.
                </p>
              </div>

              <button
                onClick={() => setShowConfig(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all font-semibold"
              >
                Hubungkan ESP32-CAM
              </button>
            </div>
          </div>
        ) : (
          /* Real Camera Stream */
          <div className="relative w-full h-full flex items-center justify-center">
            {streamError ? (
              <div className="text-center p-6 space-y-3">
                <VideoOff className="w-12 h-12 text-rose-400 mx-auto" />
                <p className="text-sm text-slate-200 font-medium">Gagal memuat siaran kamera</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Pastikan ESP32-CAM menyala dan URL streaming (Ngrok / Cloudflare / IP) dapat dijangkau.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setStreamError(false)}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={() => setDemoMode(true)}
                    className="px-3 py-1.5 text-xs bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 rounded-lg border border-teal-500/40"
                  >
                    Beralih ke Simulasi
                  </button>
                </div>
              </div>
            ) : (
              <img
                src={streamUrl}
                alt="ESP32-CAM Live Feed"
                className="w-full h-full object-contain"
                onError={() => setStreamError(true)}
              />
            )}
          </div>
        )}

        {/* AI Face Detection HUD Overlay */}
        {hudActive && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top HUD info */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span>AI VISION: FACE_RECOGNITION</span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-slate-300">
                {new Date().toLocaleTimeString('id-ID')}
              </div>
            </div>

            {/* Center Face Target Box */}
            <div className="relative flex items-center justify-center">
              <div className={`relative w-44 h-48 sm:w-56 sm:h-60 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                faceDetected 
                  ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]' 
                  : 'border-slate-600/50 border-dashed'
              }`}>
                {/* Corner reticles */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-teal-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-teal-300" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-teal-300" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-teal-300" />

                {faceDetected ? (
                  <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 animate-bounce">
                    <ScanFace className="w-4 h-4" />
                    <span>WAJAH TERDETEKSI</span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs font-mono flex items-center gap-1.5">
                    <span>Mencari Wajah...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom HUD info */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-slate-300">
                SENSOR: {faceDetected ? 'TARGET LOCKED' : 'SEARCHING'}
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-slate-400">
                CAM_ID: ESP32-CAM-01
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stream Config Modal / Drawer */}
      {showConfig && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-teal-400" />
              Konfigurasi Streaming Global ESP32-CAM
            </h4>
            <button 
              onClick={() => setShowConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕ Tutup
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Agar siaran CCTV dapat diakses dari <strong>manapun (luar jaringan WiFi)</strong>, jalankan tunnel seperti 
            <span className="text-teal-400 font-mono ml-1">ngrok http 81</span> atau 
            <span className="text-cyan-400 font-mono ml-1">Cloudflare Tunnel</span> pada komputer yang satu jaringan dengan ESP32-CAM, lalu masukkan URL streaming di bawah ini:
          </p>

          <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="Contoh: https://xxxx.ngrok-free.app/stream atau http://192.168.1.15:81/stream"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Simpan & Sambungkan
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomUrl('');
                  onUpdateStreamUrl('');
                  setDemoMode(true);
                  setShowConfig(false);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-slate-700"
              >
                Gunakan Demo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
