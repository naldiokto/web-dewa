import React from 'react';
import { Fan, Shield, Wifi, WifiOff, Cpu, BookOpen, RefreshCw } from 'lucide-react';

export default function Navbar({ 
  firebaseConnected, 
  espOnline, 
  onOpenGuide, 
  onRefresh, 
  isRefreshing 
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Fan className="w-5 h-5 text-slate-950 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-400 via-cyan-300 to-white bg-clip-text text-transparent">
                DEWA Smart Fan
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                v1.0 ESP32-CAM
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Face Detection & IoT Remote Monitoring
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Firebase Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            firebaseConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden md:inline">Firebase:</span>
            <span>{firebaseConnected ? 'Terhubung' : 'Sinkronisasi'}</span>
          </div>

          {/* ESP32 Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            espOnline 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ESP32:</span>
            <span>{espOnline ? 'Online' : 'Siaga'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Refresh status"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          {/* Hardware & Code Guide */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-medium border border-teal-500/30 transition-all hover:scale-105"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panduan Alat</span>
            <span className="sm:hidden">Skema</span>
          </button>
        </div>
      </div>
    </header>
  );
}
