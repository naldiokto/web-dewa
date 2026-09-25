import React from 'react';
import { History, Trash2, Bell, Sparkles } from 'lucide-react';

export default function ActivityLog({ 
  logs, 
  onClearLogs, 
  onSimulateFaceDetect, 
  onSimulateNoFace 
}) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-bold text-slate-100">Log Aktivitas Sistem</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            title="Bersihkan riwayat log"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulator Testing Buttons for user */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Alat Pengujian Sensor (Simulator Deteksi Wajah)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Gunakan tombol simulasi di bawah untuk menguji respons otomatis kipas tanpa harus menyalakan ESP32:
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onSimulateFaceDetect}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all text-center"
          >
            👤 Simulasikan Wajah Muncul
          </button>
          <button
            type="button"
            onClick={onSimulateNoFace}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all text-center"
          >
            🚫 Simulasikan Wajah Pergi
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Belum ada aktivitas tercatat. Mulai gunakan kipas atau jalankan simulasi di atas.
          </div>
        ) : (
          logs.map((log, index) => {
            const getBadgeColor = (type) => {
              switch (type) {
                case 'success':
                  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                case 'warning':
                  return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                case 'danger':
                  return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                default:
                  return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
              }
            };

            return (
              <div
                key={index}
                className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono shrink-0 ${getBadgeColor(log.type)}`}>
                    {log.type?.toUpperCase() || 'INFO'}
                  </span>
                  <span className="text-slate-300 leading-relaxed font-medium">
                    {log.message}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {log.time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
