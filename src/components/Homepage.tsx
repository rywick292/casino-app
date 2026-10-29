import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, Sparkles, HelpCircle, Shield, AlertTriangle, ArrowRight, X, Music, Volume2, VolumeX, Upload } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { bgmManager } from '../utils/bgmManager';

interface HomepageProps {
  onStart: () => void;
  onOpenRules: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onStart, onOpenRules }) => {
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(bgmManager.isPlaying());
  const [trackTitle, setTrackTitle] = useState<string>(bgmManager.getTrackName());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = bgmManager.subscribe((playing, name) => {
      setIsPlayingMusic(playing);
      setTrackTitle(name);
    });
    return unsubscribe;
  }, []);

  const handleToggleMusic = () => {
    soundEffects.playCardSelect();
    bgmManager.toggle();
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      bgmManager.setCustomAudioFile(files[0]);
    }
  };

  const handleStartClick = () => {
    soundEffects.playChipSound();
    setShowWarningModal(true);
  };

  const handleProceedToMenu = () => {
    soundEffects.playCardSelect();
    setShowWarningModal(false);
    onStart();
  };

  const handleCloseWarning = () => {
    soundEffects.playCardSelect();
    setShowWarningModal(false);
  };
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030907] flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans text-white">
      {/* Background Casino Ambient Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/60 via-[#030d0a] to-[#010403] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* 3D Floating Background Card Suit Logos / Emblems */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-between px-4 sm:px-20"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {/* Left Side 3D Floating Suits */}
        <div className="flex flex-col gap-16 text-7xl sm:text-9xl font-serif">
          <motion.div
            animate={{
              y: [-15, 15, -15],
              rotateX: [15, -15, 15],
              rotateY: [-20, 20, -20],
              rotateZ: [-10, 10, -10],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-amber-400 opacity-25 drop-shadow-[0_20px_30px_rgba(245,158,11,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♠
          </motion.div>

          <motion.div
            animate={{
              y: [15, -15, 15],
              rotateX: [-20, 15, -20],
              rotateY: [15, -25, 15],
              rotateZ: [12, -12, 12],
            }}
            transition={{
              duration: 8.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="text-rose-500 opacity-25 drop-shadow-[0_20px_30px_rgba(244,63,94,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♦
          </motion.div>
        </div>

        {/* Center Floating Ambient 3D Emblem */}
        <motion.div
          animate={{
            rotateY: [0, 360],
            rotateX: [-10, 10, -10],
            y: [-20, 20, -20],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] sm:text-[22rem] font-serif text-emerald-500/10 pointer-events-none select-none blur-[2px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          ♠
        </motion.div>

        {/* Right Side 3D Floating Suits */}
        <div className="flex flex-col gap-16 text-7xl sm:text-9xl font-serif">
          <motion.div
            animate={{
              y: [12, -18, 12],
              rotateX: [-15, 20, -15],
              rotateY: [25, -15, 25],
              rotateZ: [8, -12, 8],
            }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
            className="text-rose-500 opacity-25 drop-shadow-[0_20px_30px_rgba(244,63,94,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♥
          </motion.div>

          <motion.div
            animate={{
              y: [-18, 12, -18],
              rotateX: [20, -15, 20],
              rotateY: [-15, 20, -15],
              rotateZ: [-14, 10, -14],
            }}
            transition={{
              duration: 7.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.7,
            }}
            className="text-emerald-400 opacity-25 drop-shadow-[0_20px_30px_rgba(16,185,129,0.4)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            ♣
          </motion.div>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 bg-black/60 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-widest uppercase">VIP GRAND CASINO EDITION</span>
        </div>

        {/* Music Player & Controls Bar */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Custom MP3 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAudioUpload}
            accept="audio/mp3,audio/wav,audio/ogg,audio/*"
            className="hidden"
          />

          <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/30 px-3 py-1.5 rounded-full backdrop-blur-md text-xs shadow-md">
            <button
              id="btn-toggle-bgm"
              type="button"
              onClick={handleToggleMusic}
              className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer font-bold text-xs ${
                isPlayingMusic
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
              title={isPlayingMusic ? 'Pause Music' : 'Play Music'}
            >
              {isPlayingMusic ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline max-w-[120px] truncate text-[11px]">
                    {trackTitle}
                  </span>
                  {/* Mini animated equalizer bars */}
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-amber-400 h-2 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 bg-amber-400 h-3 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 bg-amber-400 h-1.5 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[11px]">Music: Off</span>
                </>
              )}
            </button>

            {/* Upload Custom MP3 Button */}
            <button
              id="btn-upload-mp3"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-white/50 hover:text-amber-300 hover:bg-white/10 rounded-full transition cursor-pointer"
              title="Ganti / Upload Lagu MP3 Anda"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="btn-homepage-rules"
            type="button"
            onClick={() => {
              soundEffects.playCardSelect();
              onOpenRules();
            }}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/90 border border-emerald-400/30 text-emerald-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition backdrop-blur-md shadow-lg cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rules</span>
          </button>
        </div>
      </header>

      {/* Center Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto max-w-4xl px-2">
        {/* Championship Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-[0.3em] mb-3 sm:mb-5 shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md animate-pulse">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>HIGH STAKES POKER ARENA</span>
        </div>

        {/* Big Casino Title */}
        <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black font-serif italic tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 drop-shadow-[0_10px_30px_rgba(245,158,11,0.6)]">
            RYAN'S
          </h1>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-serif tracking-[0.15em] sm:tracking-[0.25em] uppercase text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)]">
            GRAND CASINO
          </h2>
        </div>

        {/* Suit Emblems Row (No Card Shapes) */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 my-2 sm:my-4 text-2xl sm:text-3xl font-serif">
          <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">♠</span>
          <span className="text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">♥</span>
          <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">♣</span>
          <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">♦</span>
        </div>

        {/* Subtitle / Description */}
        <p className="text-white/70 text-xs sm:text-sm font-medium max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed">
          Step into the high-stakes Big 2 Poker Championship. Outsmart elite AI contenders with authentic suit hierarchies, rapid Shedding moves, and real-time casino rules.
        </p>

        {/* START BUTTON */}
        <button
          id="btn-homepage-start"
          type="button"
          onClick={handleStartClick}
          className="group relative inline-flex items-center justify-center gap-3 px-10 sm:px-16 py-4 sm:py-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-lg sm:text-xl font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:shadow-[0_0_60px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-98 transition-all duration-200 border-2 border-yellow-200 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
          <span>START</span>
        </button>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-4xl flex items-center justify-between border-t border-white/10 pt-3 text-[10px] sm:text-xs text-white/40">
        <div className="flex items-center gap-1.5 font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>CASINO FAIR PLAY VERIFIED</span>
        </div>
        <div className="flex items-center gap-3">
          <span>♠ 3♠ STARTS FIRST</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">2♥ HIGHEST</span>
        </div>
      </footer>

      {/* WARNING DISCLAIMER POPUP MODAL */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-[#0b0f0d] border-2 border-amber-500/60 w-full max-w-lg rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.3)] overflow-hidden text-white flex flex-col p-6 sm:p-8 relative"
            >
              {/* Close Button */}
              <button
                id="btn-warning-close"
                type="button"
                onClick={handleCloseWarning}
                className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Warning Icon Badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                <AlertTriangle className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>

              {/* Modal Title */}
              <h2 className="text-2xl sm:text-3xl font-black tracking-[0.2em] uppercase text-amber-400 text-center mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] font-serif">
                WARNING
              </h2>

              {/* Prominent Disclaimer Notice */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 mb-4 text-center">
                <p className="text-xs sm:text-sm font-black uppercase text-amber-200 tracking-wide leading-relaxed">
                  PERMAINAN INI MURNI HANYA BERMAIN SAJA, TIDAK DIPUNGUT BIAYA MAUPUN DIUANGKAN
                </p>
              </div>

              {/* Legal Citation Notice */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-6">
                <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed text-justify font-sans">
                  Larangan perjudian di Indonesia diatur secara tegas dalam Pasal 27 ayat (2) UU ITE mengenai larangan penyebaran konten judi online, serta Pasal 303 KUHP dan UU No. 7 Tahun 1974 tentang Penertiban Perjudian.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="btn-warning-back"
                  type="button"
                  onClick={handleCloseWarning}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Kembali
                </button>

                <button
                  id="btn-warning-proceed"
                  type="button"
                  onClick={handleProceedToMenu}
                  className="w-full flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>SAYA MENGERTI & LANJUT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
