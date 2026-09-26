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
  ExternalLink,
  Laptop,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  Users
} from 'lucide-react';
import { detectFaces } from '../utils/faceDetection';

export default function CctvViewer({ 
  streamUrl, 
  onUpdateStreamUrl, 
  faceDetected, 
  lastFaceSeen,
  fanPower,
  onWebcamFaceChange,
  activeSource = 'webcam', // 'webcam' | 'esp32' | 'simulator'
  onChangeActiveSource
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showRevertGuide, setShowRevertGuide] = useState(false);
  const [customUrl, setCustomUrl] = useState(streamUrl || '');
  const [streamError, setStreamError] = useState(false);
  const [hudActive, setHudActive] = useState(true);
  
  // Webcam state
  const [cameraSource, setCameraSource] = useState(activeSource);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState([]); // Array of { id, xPercent, yPercent, wPercent, hPercent, confidence }
  const [detectionEngine, setDetectionEngine] = useState('');
  const [sensitivityMode, setSensitivityMode] = useState('high'); // 'high' | 'normal'

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const absentCountRef = useRef(0);

  // Sync external activeSource changes
  useEffect(() => {
    if (activeSource && activeSource !== cameraSource) {
      setCameraSource(activeSource);
    }
  }, [activeSource]);

  // Keep customUrl in sync with streamUrl prop
  useEffect(() => {
    if (streamUrl) {
      setCustomUrl(streamUrl);
    }
  }, [streamUrl]);

  // Handle webcam lifecycle
  useEffect(() => {
    if (cameraSource === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [cameraSource]);

  const startWebcam = async () => {
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses webcam (getUserMedia).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
      setWebcamActive(true);
      startFaceDetectionLoop();
    } catch (err) {
      console.error('Webcam access error:', err);
      setWebcamActive(false);
      setWebcamError(
        err.name === 'NotAllowedError'
          ? 'Izin akses kamera laptop ditolak. Mohon izinkan kamera pada browser.'
          : err.message || 'Gagal mengakses webcam laptop.'
      );
    }
  };

  const stopWebcam = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setDetectedFaces([]);
  };

  const startFaceDetectionLoop = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const result = await detectFaces(
        videoRef.current, 
        offscreenCanvasRef.current,
        { sensitivity: sensitivityMode }
      );

      if (result.method) setDetectionEngine(result.method);

      if (result.detected && result.faces && result.faces.length > 0) {
        absentCountRef.current = 0;
        setDetectedFaces(result.faces);
        if (onWebcamFaceChange) {
          onWebcamFaceChange(true, result.facesCount);
        }
      } else {
        absentCountRef.current += 1;
        // Require 4 consecutive non-detections (~720ms) to prevent flicker
        if (absentCountRef.current >= 4) {
          setDetectedFaces([]);
          if (onWebcamFaceChange) {
            onWebcamFaceChange(false, 0);
          }
        }
      }
    }, 180);
  };

  const handleSwitchSource = (newSource) => {
    setCameraSource(newSource);
    if (onChangeActiveSource) {
      onChangeActiveSource(newSource);
    }
    setStreamError(false);
  };

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
    handleSwitchSource('esp32');
  };

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Hidden offscreen canvas for computer vision face processing */}
      <canvas ref={offscreenCanvasRef} className="hidden" />

      {/* Top Source Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => handleSwitchSource('webcam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              cameraSource === 'webcam'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Webcam Laptop (Demo)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchSource('esp32')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              cameraSource === 'esp32'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>ESP32-CAM (Hardware)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchSource('simulator')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
              cameraSource === 'simulator'
                ? 'bg-slate-800 text-slate-200 shadow-md'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulasi Animasi</span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Quick Hardware Transition Guide Button */}
          <button
            onClick={() => setShowRevertGuide(!showRevertGuide)}
            title="Cara Beralih ke ESP32 saat hardware tiba"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">Cara Kembali ke ESP32</span>
          </button>

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
            title="Konfigurasi URL Streaming ESP32-CAM"
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

      {/* Revert Guide Banner (Pop-down) */}
      {showRevertGuide && (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 border-b border-teal-500/30 p-4 text-xs text-slate-300 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              Panduan Transisi: Menggunakan Hardware Asli saat ESP32-CAM Tiba
            </h4>
            <button
              onClick={() => setShowRevertGuide(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5"
            >
              ✕ Tutup
            </button>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Tidak ada kode yang perlu Anda hapus atau ubah! Saat sirkuit dan ESP32-CAM Anda tiba:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-teal-400 block mb-1">Langkah 1:</span>
              Klik tab <strong>"ESP32-CAM (Hardware)"</strong> pada tombol di atas video ini.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-teal-400 block mb-1">Langkah 2:</span>
              Klik ikon ⚙️ Pengaturan, masukkan IP lokal ESP32 Anda (contoh: <code>http://192.168.1.15:81/stream</code>) atau link Ngrok.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="font-bold text-teal-400 block mb-1">Langkah 3:</span>
              Upload kode Arduino yang tersedia di tombol "Panduan Alat". Selesai!
            </div>
          </div>
        </div>
      )}

      {/* Subheader Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950/60 border-b border-slate-800/60 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              cameraSource === 'webcam' ? 'bg-cyan-400' : cameraSource === 'esp32' ? 'bg-red-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              cameraSource === 'webcam' ? 'bg-cyan-500' : cameraSource === 'esp32' ? 'bg-red-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <span className="font-bold uppercase tracking-wider text-slate-200">
            {cameraSource === 'webcam' ? 'DEMO WEBCAM LAPTOP' : cameraSource === 'esp32' ? 'ESP32-CAM LIVE MJPEG' : 'SIMULASI'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameraSource === 'webcam' && (
            <>
              {/* Sensitivity Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                <span className="text-slate-400">Sensitivitas:</span>
                <button
                  type="button"
                  onClick={() => setSensitivityMode(sensitivityMode === 'high' ? 'normal' : 'high')}
                  className={`px-1.5 py-0.2 rounded font-bold transition-colors ${
                    sensitivityMode === 'high' 
                      ? 'bg-teal-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {sensitivityMode === 'high' ? 'Tinggi (Rekomendasi)' : 'Normal'}
                </button>
              </div>

              {/* Force Test Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !faceDetected;
                  if (onWebcamFaceChange) onWebcamFaceChange(nextState);
                }}
                className={`px-2 py-0.5 rounded font-bold border transition-all flex items-center gap-1 ${
                  faceDetected 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30' 
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                <span>⚡</span>
                <span>{faceDetected ? 'Lepas Wajah' : 'Kunci Wajah'}</span>
              </button>

              <span className="text-teal-400 hidden lg:inline">
                {detectionEngine === 'native-api' ? 'Native API' : 'YCbCr Cluster'}
              </span>
            </>
          )}
          {cameraSource === 'esp32' && (
            <span>IP Stream: {streamUrl || 'Belum Dikonfigurasi'}</span>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
        {/* 1. WEBCAM LAPTOP MODE */}
        {cameraSource === 'webcam' && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
            {webcamError ? (
              <div className="text-center p-6 space-y-3">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-200">{webcamError}</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={startWebcam}
                    className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Sambungkan Lagi
                  </button>
                  <button
                    onClick={() => handleSwitchSource('simulator')}
                    className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                  >
                    Beralih ke Simulasi
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}
          </div>
        )}

        {/* 2. ESP32-CAM HARDWARE MODE */}
        {cameraSource === 'esp32' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {streamUrl && !streamError ? (
              <img
                src={streamUrl}
                alt="ESP32-CAM Live Feed"
                className="w-full h-full object-contain"
                onError={() => setStreamError(true)}
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <VideoOff className="w-12 h-12 text-amber-400 mx-auto" />
                <p className="text-sm text-slate-200 font-semibold">
                  {streamUrl ? 'Kamera ESP32-CAM Belum Terdeteksi' : 'URL Kamera ESP32-CAM Belum Diatur'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {streamUrl 
                    ? 'Pastikan ESP32-CAM menyala dan terhubung ke WiFi / Ngrok yang sama.'
                    : 'Jika hardware ESP32 belum ada, gunakan tombol "Webcam Laptop (Demo)" di atas untuk menguji coba deteksi wajah.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowConfig(true)}
                    className="px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg"
                  >
                    Atur URL ESP32
                  </button>
                  <button
                    onClick={() => handleSwitchSource('webcam')}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-lg"
                  >
                    Gunakan Webcam Laptop
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SIMULATOR GRAPHICS MODE */}
        {cameraSource === 'simulator' && (
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

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
                  Mode Simulasi Animasi Aktif
                </p>
                <p className="text-xs text-slate-400">
                  Klik tab <strong>"Webcam Laptop"</strong> di atas untuk mencoba deteksi wajah langsung menggunakan kamera laptop Anda!
                </p>
              </div>

              <button
                onClick={() => handleSwitchSource('webcam')}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-lg shadow-teal-500/20"
              >
                Aktifkan Webcam Laptop
              </button>
            </div>
          </div>
        )}

        {/* AI Face Detection HUD Overlay */}
        {hudActive && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            {/* Top HUD info */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <span className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-emerald-400 animate-ping' : 'bg-teal-400'}`}></span>
                <span>
                  {detectedFaces.length > 1 
                    ? `AI VISION: ${detectedFaces.length} WAJAH TERKUNCI (MULTI-TARGET)` 
                    : detectedFaces.length === 1 
                      ? 'AI VISION: 1 WAJAH TERKUNCI' 
                      : 'AI VISION: MENCARI TARGET WAJAH...'}
                </span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-300">
                {new Date().toLocaleTimeString('id-ID')}
              </div>
            </div>

            {/* Dynamic Multi-Face Target Bounding Boxes */}
            {detectedFaces && detectedFaces.length > 0 ? (
              <>
                {detectedFaces.map((face) => (
                  <div 
                    key={face.id}
                    className="absolute rounded-xl border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)] bg-emerald-500/15 flex items-center justify-center transition-all duration-150 pointer-events-none"
                    style={{
                      left: `${face.xPercent}%`,
                      top: `${face.yPercent}%`,
                      width: `${face.wPercent}%`,
                      height: `${face.hPercent}%`
                    }}
                  >
                    {/* Corner reticles */}
                    <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-300" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-300" />
                    <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-300" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-300" />

                    {/* Floating identification badge */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500/90 backdrop-blur-md text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide flex items-center gap-1 shadow-xl whitespace-nowrap">
                      <ScanFace className="w-3 h-3" />
                      <span>WAJAH #{face.id} ({face.confidence}%)</span>
                    </div>
                  </div>
                ))}
              </>
            ) : faceDetected ? (
              /* Single Fallback Box */
              <div className="relative flex items-center justify-center">
                <div className="w-48 h-52 sm:w-60 sm:h-64 rounded-xl border-2 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.6)] bg-emerald-500/15 flex items-center justify-center transition-all duration-300">
                  <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-300" />
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-300" />
                  <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-300" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-300" />
                  <div className="bg-emerald-500/90 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 shadow-lg animate-bounce">
                    <ScanFace className="w-4 h-4" />
                    <span>WAJAH TERDETEKSI (KIPAS AKTIF)</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Idle Searching Box */
              <div className="relative flex items-center justify-center">
                <div className="w-48 h-52 sm:w-56 sm:h-60 rounded-xl border-2 border-slate-600/50 border-dashed flex items-center justify-center">
                  <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-300/40" />
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-300/40" />
                  <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-300/40" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-300/40" />
                  <div className="text-slate-400 text-xs font-mono flex items-center gap-1.5 bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Mencari Target Wajah...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom HUD info */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-300">
                STATUS: {faceDetected ? `${detectedFaces.length > 0 ? detectedFaces.length : 1} WAJAH AKTIF (KIPAS ON)` : 'SIAGA (STANDBY)'}
              </div>
              <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-400">
                SRC: {cameraSource.toUpperCase()}
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
              Konfigurasi URL Streaming ESP32-CAM
            </h4>
            <button 
              onClick={() => setShowConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕ Tutup
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Jika hardware ESP32-CAM Anda sudah menyala, masukkan IP lokal WiFi (misal: <code className="text-teal-300">http://192.168.1.50:81/stream</code>) atau URL Public Tunnel (Ngrok / Cloudflare):
          </p>

          <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="Contoh: http://192.168.1.15:81/stream atau https://xxxx.ngrok-free.app/stream"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Simpan & Aktifkan ESP32
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSwitchSource('webcam');
                  setShowConfig(false);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
              >
                Gunakan Webcam Laptop
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
