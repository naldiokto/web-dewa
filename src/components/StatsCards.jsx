import React from 'react';
import { 
  Fan, 
  ScanFace, 
  Cpu, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Gauge,
  Activity
} from 'lucide-react';

export default function StatsCards({
  power,
  mode,
  speed,
  faceDetected,
  lastFaceSeen,
  espOnline,
  firebaseConnected
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Status Kipas */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Status Kipas</span>
          <div className={`p-2 rounded-xl ${power ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-500'}`}>
            <Fan className={`w-4 h-4 ${power ? (speed === 3 ? 'animate-spin-fast' : 'animate-spin-slow') : ''}`} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${power ? 'text-teal-400' : 'text-slate-400'}`}>
              {power ? 'MENYALA' : 'MATI'}
            </span>
            {power && (
              <span className="text-xs font-mono text-slate-400">
                (Level {speed})
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {power ? `Berputar kecepatan ${speed}` : 'Siaga / Menunggu Perintah'}
          </p>
        </div>

        {/* Ambient indicator stripe */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${power ? 'bg-teal-500' : 'bg-slate-800'}`} />
      </div>

      {/* 2. Sensor Wajah (ESP32-CAM) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Sensor Wajah</span>
          <div className={`p-2 rounded-xl ${faceDetected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <ScanFace className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${faceDetected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {faceDetected ? 'TERDETEKSI' : 'TIDAK ADA'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {faceDetected 
              ? 'Wajah berada di depan kipas' 
              : lastFaceSeen 
                ? `Terakhir: ${lastFaceSeen}` 
                : 'Belum ada deteksi'}
          </p>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-1 ${faceDetected ? 'bg-emerald-500' : 'bg-slate-800'}`} />
      </div>

      {/* 3. Mode Operasi */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Mode Sistem</span>
          <div className={`p-2 rounded-xl ${mode === 'auto' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100">
            {mode === 'auto' ? 'OTOMATIS' : 'MANUAL'}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {mode === 'auto' ? 'Kontrol via Deteksi Wajah' : 'Kontrol Penuh Pengguna'}
          </p>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-1 ${mode === 'auto' ? 'bg-cyan-500' : 'bg-indigo-500'}`} />
      </div>

      {/* 4. IoT Backend Firebase */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Sinkronisasi Cloud</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-300">
            {firebaseConnected ? 'REAL-TIME' : 'CONNECTING'}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Firestore Database ID: dewa-1df85
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
}
