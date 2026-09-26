import React from 'react';
import { 
  Power, 
  Cpu, 
  Sliders, 
  Zap, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  ShieldAlert,
  Flame,
  Volume2
} from 'lucide-react';

export default function ControlPanel({
  power,
  mode,
  speed,
  onTogglePower,
  onChangeMode,
  onChangeSpeed,
  disabled
}) {
  const isAuto = mode === 'auto';

  const speedPresets = [
    { level: 1, label: 'Pelan', desc: 'Senyap & Hemat' },
    { level: 2, label: 'Sedang', desc: 'Sejuk Optimal' },
    { level: 3, label: 'Kencang', desc: 'Angin Kuat' },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-400" />
            Panel Remote Kontrol
          </h2>
          <p className="text-xs text-slate-400">
            Kontrol manual dan konfigurasi otomatisasi sistem
          </p>
        </div>

        {/* Status Pill */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
          power 
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
            : 'bg-slate-800 border-slate-700 text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${power ? 'bg-teal-400 animate-ping' : 'bg-slate-500'}`} />
          <span>{power ? 'KIPAS BERPUTAR' : 'KIPAS MATI'}</span>
        </div>
      </div>

      {/* 1. AUTO / MANUAL MODE SELECTOR */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          Mode Operasi Kipas
        </label>

        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeMode('auto')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg text-center transition-all ${
              isAuto
                ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase">
              <Zap className="w-3.5 h-3.5" />
              Mode Otomatis
            </div>
            <span className={`text-[10px] mt-0.5 ${isAuto ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              Sensor Wajah ESP32-CAM
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode('manual')}
            className={`flex flex-col items-center justify-center p-3 rounded-lg text-center transition-all ${
              !isAuto
                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase">
              <Sliders className="w-3.5 h-3.5" />
              Mode Manual
            </div>
            <span className={`text-[10px] mt-0.5 ${!isAuto ? 'text-blue-100 font-medium' : 'text-slate-500'}`}>
              Override Remote Kontrol
            </span>
          </button>
        </div>

        {/* Explanatory text */}
        <p className="text-[11px] text-slate-400 italic px-1">
          {isAuto 
            ? 'ℹ️ Pada mode otomatis, kipas akan menyala sendiri saat kamera mendeteksi wajah dan mati bila tidak ada orang.'
            : '⚠️ Pada mode manual, sensor wajah dinonaktifkan. Anda mengontrol penuh saklar ON/OFF di bawah.'}
        </p>
      </div>

      {/* 2. MANUAL OVERRIDE (POWER BUTTON) */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">
              Manual Override (Power Kipas)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {power ? 'Status: ON' : 'Status: OFF'}
          </span>
        </div>

        <button
          type="button"
          onClick={onTogglePower}
          disabled={disabled}
          className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
            power
              ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/20'
              : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 shadow-teal-500/20'
          }`}
        >
          <Power className={`w-5 h-5 ${power ? 'animate-pulse' : ''}`} />
          <span>{power ? 'MATIKAN KIPAS (POWER OFF)' : 'HIDUPKAN KIPAS (POWER ON)'}</span>
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Dapat digunakan kapan saja untuk mematikan atau menyalakan kipas saat terjadi error deteksi.
        </p>
      </div>

      {/* 3. FAN SPEED CONTROLLER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            Kecepatan Putaran Kipas
          </label>
          <span className="text-xs font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
            Tingkat {speed} dari 3
          </span>
        </div>

        {/* Speed Slider */}
        <div className="px-2 py-1">
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>Level 1 (Pelan)</span>
            <span>Level 2 (Sedang)</span>
            <span>Level 3 (Kencang)</span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {speedPresets.map((preset) => {
            const isSelected = speed === preset.level;
            return (
              <button
                key={preset.level}
                type="button"
                onClick={() => onChangeSpeed(preset.level)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-md shadow-teal-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className="text-[10px] text-slate-500">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
