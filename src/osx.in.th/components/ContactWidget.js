'use client';

import React, { useState } from 'react';
import { MessageSquare, X, ExternalLink } from 'lucide-react';

export function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      name: 'Discord',
      label: 'OSX HUB Community',
      url: 'https://discord.gg/BXM5WEkD3J',
      icon: 'fa-brands fa-discord',
      color: '#5865F2',
      badge: 'แนะนำ',
    },
    {
      name: 'YouTube',
      label: '@YuharuModz_XD',
      url: 'https://www.youtube.com/@YuharuModz_XD',
      icon: 'fa-brands fa-youtube',
      color: '#FF0000',
    },
    {
      name: 'Facebook',
      label: 'OSX HUB Official',
      url: 'https://www.facebook.com/osxhub',
      icon: 'fa-brands fa-facebook',
      color: '#1877F2',
    },
    {
      name: 'TikTok',
      label: '@osxhub',
      url: 'https://tiktok.com/',
      icon: 'fa-brands fa-tiktok',
      color: '#00F2FE',
    },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white flex items-center justify-center shadow-lg shadow-sky-950/60 border border-sky-400/40 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer"
        title="ติดต่อเรา"
        aria-label="ติดต่อเรา"
      >
        <span className="relative flex items-center justify-center">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
        </span>
      </button>

      {/* Contact Pop-up Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#0a1220] to-[#060a12] border border-sky-500/30 shadow-2xl p-6 overflow-hidden animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Blue Glow in modal */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm transition-colors cursor-pointer"
              aria-label="ปิด"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 border border-sky-400/40 flex items-center justify-center p-1 shadow-md shadow-sky-950/40">
                <img src="/img/NewLogo88 (3).png" alt="OSX HUB" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white tracking-wide flex items-center gap-1.5">
                  OSX <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">HUB</span>
                </h3>
                <p className="text-xs text-slate-400">ช่องทางติดต่อและติดตามเรา</p>
              </div>
            </div>

            {/* Contact Links List */}
            <div className="flex flex-col gap-2.5">
              {contacts.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0e1626] border border-white/5 hover:border-sky-500/40 hover:bg-[#142036] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base shadow-sm group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${item.color}25`, color: item.color }}
                    >
                      <i className={item.icon}></i>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white flex items-center gap-2">
                        {item.name}
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-400/40 text-sky-400 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block leading-tight">{item.label}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500">
              ทีมงานพร้อมให้บริการและตอบคำถามตลอด 24 ชม.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
