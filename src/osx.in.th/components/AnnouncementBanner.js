'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export function AnnouncementBanner() {
  const { lang } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [direction, setDirection] = useState('next');

  useEffect(() => {
    fetch('/api/announcements.php?action=banner')
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          setAnnouncements(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-slide every 5 seconds
  const goNext = useCallback(() => {
    if (announcements.length <= 1) return;
    setDirection('next');
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
      setIsSliding(false);
    }, 400);
  }, [announcements.length]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [announcements.length, goNext]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex % announcements.length];
  if (!current) return null;

  // Type styling — neon accent colors
  const typeStyles = {
    info: {
      accent: '#3b82f6',
      glow: 'rgba(59,130,246,0.3)',
      icon: '📢',
      label: lang === 'th' ? 'ประกาศ' : 'Notice',
    },
    warning: {
      accent: '#f59e0b',
      glow: 'rgba(245,158,11,0.3)',
      icon: '⚠️',
      label: lang === 'th' ? 'แจ้งเตือน' : 'Warning',
    },
    danger: {
      accent: '#ef4444',
      glow: 'rgba(239,68,68,0.3)',
      icon: '🚨',
      label: lang === 'th' ? 'สำคัญ' : 'Urgent',
    },
    update: {
      accent: '#10b981',
      glow: 'rgba(16,185,129,0.3)',
      icon: '🚀',
      label: lang === 'th' ? 'อัปเดตใหม่' : 'Update',
    },
  };

  const style = typeStyles[current.type] || typeStyles.info;

  return (
    <>
      <style jsx>{`
        @keyframes marquee-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out-left {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes led-dot-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .marquee-banner {
          position: relative;
          z-index: 50;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%);
          border-bottom: 2px solid;
          border-image: linear-gradient(90deg, transparent, ${style.accent}, transparent) 1;
        }
        .marquee-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${style.accent}, transparent);
          animation: marquee-glow 2s ease-in-out infinite;
        }
        .marquee-banner::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${style.accent}80, transparent);
          animation: marquee-glow 2s ease-in-out infinite 0.5s;
        }
        .slide-content {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-content.sliding-next {
          animation: slide-out-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .slide-content.sliding-in {
          animation: slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .led-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${style.accent};
          box-shadow: 0 0 6px ${style.glow}, 0 0 12px ${style.glow};
          animation: led-dot-pulse 1.5s ease-in-out infinite;
        }
        .led-dot:nth-child(2) { animation-delay: 0.3s; }
        .led-dot:nth-child(3) { animation-delay: 0.6s; }
        .type-badge {
          background: ${style.accent}15;
          border: 1px solid ${style.accent}40;
          color: ${style.accent};
          text-shadow: 0 0 10px ${style.glow};
        }
        .neon-title {
          color: #fff;
          text-shadow: 0 0 4px ${style.glow};
        }
        .dot-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: all 0.3s;
          cursor: pointer;
        }
        .dot-indicator.active {
          background: ${style.accent};
          box-shadow: 0 0 8px ${style.glow};
          width: 18px;
          border-radius: 3px;
        }
        .dot-indicator:not(.active) {
          background: #374151;
        }
        .dot-indicator:not(.active):hover {
          background: #4b5563;
        }
      `}</style>

      <div className="marquee-banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 py-2.5 px-4 sm:px-6">
          {/* Left LED dots */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <div className="led-dot"></div>
            <div className="led-dot"></div>
            <div className="led-dot"></div>
          </div>

          {/* Center content — slides */}
          <div className="flex-1 overflow-hidden min-w-0">
            <div className={`slide-content flex items-center justify-center gap-2.5 ${isSliding ? 'sliding-next' : ''}`}>
              {/* Type badge */}
              <span className="type-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 whitespace-nowrap">
                <span>{style.icon}</span>
                <span>{style.label}</span>
              </span>

              {/* Title & content */}
              <div className="truncate text-xs sm:text-sm font-medium flex items-center gap-2 min-w-0">
                <span className="neon-title font-semibold truncate">{current.title}</span>
                {current.content && (
                  <span className="hidden md:inline text-slate-400 truncate border-l border-slate-700/60 pl-2 text-xs">
                    {current.content}
                  </span>
                )}
              </div>

              {/* Link button */}
              {current.banner_link && (
                <Link
                  href={current.banner_link}
                  className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-lg transition-all whitespace-nowrap"
                  style={{
                    background: `${style.accent}15`,
                    color: style.accent,
                    border: `1px solid ${style.accent}30`,
                  }}
                >
                  {lang === 'th' ? 'ดูเพิ่มเติม →' : 'Read more →'}
                </Link>
              )}
            </div>
          </div>

          {/* Right — dot indicators */}
          {announcements.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  className={`dot-indicator ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'next' : 'prev');
                    setIsSliding(true);
                    setTimeout(() => {
                      setCurrentIndex(idx);
                      setIsSliding(false);
                    }, 400);
                  }}
                  aria-label={`ประกาศที่ ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
