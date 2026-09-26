import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import CctvViewer from './components/CctvViewer';
import ControlPanel from './components/ControlPanel';
import ActivityLog from './components/ActivityLog';
import HardwareGuideModal from './components/HardwareGuideModal';
import { 
  subscribeToFanStatus, 
  updateFanState, 
  logActivity 
} from './firebase';

export default function App() {
  // State from Firebase
  const [power, setPower] = useState(false);
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [speed, setSpeed] = useState(2); // 1, 2, 3
  const [faceDetected, setFaceDetected] = useState(false);
  const [lastFaceSeen, setLastFaceSeen] = useState(null);
  const [espOnline, setEspOnline] = useState(false);
  const [streamUrl, setStreamUrl] = useState(() => localStorage.getItem('dewa_stream_url') || '');

  // UI state
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [logs, setLogs] = useState([
    {
      message: 'Sistem Smart Fan DEWA diinisialisasi. Menunggu koneksi ESP32.',
      type: 'info',
      time: new Date().toLocaleTimeString('id-ID')
    }
  ]);

  const addLog = (message, type = 'info') => {
    const newEntry = {
      message,
      type,
      time: new Date().toLocaleTimeString('id-ID')
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 40)]);
    logActivity(message, type);
  };

  // Subscribe to Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToFanStatus(
      (data) => {
        setFirebaseConnected(true);
        if (data.power !== undefined) setPower(data.power);
        if (data.mode !== undefined) setMode(data.mode);
        if (data.speed !== undefined) setSpeed(data.speed);
        if (data.faceDetected !== undefined) setFaceDetected(data.faceDetected);
        if (data.lastFaceSeen) setLastFaceSeen(data.lastFaceSeen);
        if (data.espOnline !== undefined) setEspOnline(data.espOnline);
        if (data.streamUrl && !localStorage.getItem('dewa_stream_url')) {
          setStreamUrl(data.streamUrl);
        }
      },
      (error) => {
        setFirebaseConnected(false);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, []);

  // Handlers for Control Panel
  const handleTogglePower = async () => {
    const nextPower = !power;
    setPower(nextPower);
    addLog(
      `Manual Override: Kipas ${nextPower ? 'dinyalakan' : 'dimatikan'} oleh pengguna`,
      nextPower ? 'success' : 'warning'
    );
    await updateFanState({ power: nextPower });
  };

  const handleChangeMode = async (newMode) => {
    setMode(newMode);
    addLog(
      `Mode sistem diubah ke: ${newMode === 'auto' ? 'Otomatis (Sensor Wajah)' : 'Manual (Override)'}`,
      'info'
    );
    await updateFanState({ mode: newMode });
  };

  const handleChangeSpeed = async (newSpeed) => {
    setSpeed(newSpeed);
    addLog(`Kecepatan kipas diatur ke Level ${newSpeed}`, 'info');
    await updateFanState({ speed: newSpeed });
  };

  const handleUpdateStreamUrl = async (url) => {
    setStreamUrl(url);
    localStorage.setItem('dewa_stream_url', url);
    addLog(`URL streaming CCTV diperbarui: ${url || 'Mode Demo'}`, 'info');
    await updateFanState({ streamUrl: url });
  };

  // Simulation Triggers for User Testing
  const handleSimulateFaceDetect = async () => {
    const nowTime = new Date().toLocaleTimeString('id-ID');
    setFaceDetected(true);
    setLastFaceSeen(nowTime);

    // If auto mode is ON, fan turns ON automatically!
    if (mode === 'auto') {
      setPower(true);
      addLog('👤 Wajah terdeteksi! Kipas otomatis MENYALA (Auto Mode).', 'success');
      await updateFanState({
        faceDetected: true,
        lastFaceSeen: nowTime,
        power: true
      });
    } else {
      addLog('👤 Wajah terdeteksi (Kipas tetap pada status manual).', 'info');
      await updateFanState({
        faceDetected: true,
        lastFaceSeen: nowTime
      });
    }
  };

  const handleSimulateNoFace = async () => {
    setFaceDetected(false);

    // If auto mode is ON, fan turns OFF automatically!
    if (mode === 'auto') {
      setPower(false);
      addLog('🚫 Tidak ada wajah terdeteksi. Kipas otomatis DIMATIKAN untuk hemat energi.', 'danger');
      await updateFanState({
        faceDetected: false,
        power: false
      });
    } else {
      addLog('🚫 Tidak ada wajah terdeteksi di depan kamera.', 'info');
      await updateFanState({
        faceDetected: false
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addLog('Status sistem diperbarui secara manual.', 'info');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        firebaseConnected={firebaseConnected}
        espOnline={espOnline}
        onOpenGuide={() => setGuideOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Metric Cards */}
        <StatsCards
          power={power}
          mode={mode}
          speed={speed}
          faceDetected={faceDetected}
          lastFaceSeen={lastFaceSeen}
          espOnline={espOnline}
          firebaseConnected={firebaseConnected}
        />

        {/* Core Layout: CCTV Viewer & Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: CCTV Stream (Larger Area) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <CctvViewer
              streamUrl={streamUrl}
              onUpdateStreamUrl={handleUpdateStreamUrl}
              faceDetected={faceDetected}
              lastFaceSeen={lastFaceSeen}
              fanPower={power}
            />

            {/* Quick Helper Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-xs font-bold text-teal-300">
                    Belum punya sirkuit ESP32-CAM yang menyala?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol simulasi di bawah untuk mencoba fitur deteksi wajah otomatis.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGuideOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 transition-colors whitespace-nowrap"
              >
                Lihat Panduan
              </button>
            </div>
          </div>

          {/* Right Column: Remote Control Panel & Activity Log */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            <ControlPanel
              power={power}
              mode={mode}
              speed={speed}
              onTogglePower={handleTogglePower}
              onChangeMode={handleChangeMode}
              onChangeSpeed={handleChangeSpeed}
            />

            <ActivityLog
              logs={logs}
              onClearLogs={() => setLogs([])}
              onSimulateFaceDetect={handleSimulateFaceDetect}
              onSimulateNoFace={handleSimulateNoFace}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>DEWA Smart Fan IoT Project • Terhubung ke Firebase Firestore <code>dewa-1df85</code></p>
      </footer>

      {/* Hardware Schematic and Arduino Sketch Guide Modal */}
      <HardwareGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}
