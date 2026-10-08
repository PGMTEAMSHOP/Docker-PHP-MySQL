'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export function PopupAnnouncementModal() {
  const { lang } = useLanguage();
  const [popups, setPopups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/announcements.php?action=popup')
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data && data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          // Filter out popups dismissed in current session
          const activePopups = data.data.filter((item) => {
            return !sessionStorage.getItem(`dismissed_popup_${item.id}`);
          });

          if (activePopups.length > 0) {
            setPopups(activePopups);
            setIsOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    if (popups[currentIndex]) {
      // Remember dismissal for this session
      sessionStorage.setItem(`dismissed_popup_${popups[currentIndex].id}`, 'true');
    }
    
    if (currentIndex < popups.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  };

  if (!isOpen || popups.length === 0) return null;

  const current = popups[currentIndex];
  if (!current) return null;

  // Type color badge styling
  const typeStyles = {
    info: { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', icon: '📢', label: lang === 'th' ? 'ประกาศ' : 'Notice' },
    warning: { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', icon: '⚠️', label: lang === 'th' ? 'แจ้งเตือน' : 'Warning' },
    danger: { color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', icon: '🚨', label: lang === 'th' ? 'สำคัญมาก' : 'Urgent' },
    update: { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: '🚀', label: lang === 'th' ? 'อัปเดตใหม่' : 'Update' },
  };

  const style = typeStyles[current.type] || typeStyles.info;

  // Ensure image URL formatting
  const imageUrl = current.image_url
    ? (current.image_url.startsWith('http') || current.image_url.startsWith('/') ? current.image_url : '/' + current.image_url)
    : null;

  const hasLink = Boolean(current.banner_link);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0b0f19] border border-[#1e293b] rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh] animate-pop">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e293b] bg-[#070a11]">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.bg} ${style.color} ${style.border} border flex items-center gap-1.5`}>
              <span>{style.icon}</span>
              <span>{style.label}</span>
            </span>
            {popups.length > 1 && (
              <span className="text-xs font-medium text-slate-400">
                ({currentIndex + 1}/{popups.length})
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#162032] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all border border-slate-700/50"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Image Container (Scaled 16:9 or auto fit) */}
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 group">
              {hasLink ? (
                <Link href={current.banner_link} onClick={handleClose} className="block relative cursor-pointer">
                  <img
                    src={imageUrl}
                    alt={current.title}
                    className="w-full h-auto max-h-[55vh] object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity shadow-lg">
                      {lang === 'th' ? 'คลิกเพื่อดูรายละเอียดเพิ่มเติม →' : 'Click for more details →'}
                    </span>
                  </div>
                </Link>
              ) : (
                <img
                  src={imageUrl}
                  alt={current.title}
                  className="w-full h-auto max-h-[55vh] object-contain mx-auto"
                />
              )}
            </div>
          )}

          {/* Title & Body Content */}
          <div className="space-y-2 text-left">
            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
              {current.title}
            </h3>
            {current.content && (
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {current.content}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#1e293b] bg-[#070a11] flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-[#162032] hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60"
          >
            {lang === 'th' ? 'ปิดประกาศ' : 'Close'}
          </button>

          {hasLink && (
            <Link
              href={current.banner_link}
              onClick={handleClose}
              className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <span>{lang === 'th' ? 'ดูรายละเอียด' : 'Details'}</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
