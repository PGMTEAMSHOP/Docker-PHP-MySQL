'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, Headphones } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function Footer() {
  const { t } = useLanguage();
  const { setIsLoginOpen, setIsRegisterOpen } = useAuth();
  const footerRef = useRef(null);

  // GSAP Footer reveal animation
  useEffect(() => {
    if (!footerRef.current) return;

    const ctx = gsap.context(() => {
      // Footer columns stagger in
      gsap.fromTo('.footer-col',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 92%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Footer bottom bar
      gsap.fromTo('.footer-bottom',
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.footer-bottom',
            start: 'top 95%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="mt-auto border-t border-white/5 bg-[#060911] text-[#94a3b8] relative z-10 pt-8 pb-6 sm:pt-12 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-8 sm:pb-10 border-b border-white/5">
          
          {/* Col 1: Brand Info & Socials */}
          <div className="sm:col-span-2 space-y-3.5 sm:space-y-4 footer-col">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <img
                src="/img/NewLogo88 (3).png"
                alt="OSX HUB Logo"
                className="h-9 w-auto object-contain rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-black tracking-wide text-white">
                OSX <span className="gtx">HUB</span>
              </span>
            </Link>
            
            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-md leading-relaxed">
              ร้านจำหน่ายสคริปต์ Roblox คุณภาพสูง ลิขสิทธิ์แท้ ปลอดภัย 100% พร้อมระบบจัดส่งอัตโนมัติ 24 ชม. และทีมงานซัพพอร์ตคอยช่วยเหลือตลอดเวลา
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://discord.gg/BXM5WEkD3J"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/15 hover:text-white flex items-center justify-center text-sm transition-all text-[#94a3b8]"
                title="Discord"
              >
                <i className="fa-brands fa-discord"></i>
              </a>
              <a
                href="https://www.youtube.com/@YuharuModz_XD"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/15 hover:text-white flex items-center justify-center text-sm transition-all text-[#94a3b8]"
                title="YouTube"
              >
                <i className="fa-brands fa-youtube"></i>
              </a>
              <a
                href="https://www.facebook.com/osxhub"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/15 hover:text-white flex items-center justify-center text-sm transition-all text-[#94a3b8]"
                title="Facebook"
              >
                <i className="fa-brands fa-facebook"></i>
              </a>
              <a
                href="https://tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/15 hover:text-white flex items-center justify-center text-sm transition-all text-[#94a3b8]"
                title="TikTok"
              >
                <i className="fa-brands fa-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3 footer-col">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">เมนูลัด</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>หน้าหลัก</span>
                </Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>ร้านค้า & สินค้า</span>
                </Link>
              </li>
              <li>
                <Link href="/topup" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>เติมเงิน</span>
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>สถานะการทำงาน</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Account & Support */}
          <div className="space-y-3 footer-col">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">บัญชี & ช่วยเหลือ</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>สมัครสมาชิก</span>
                </button>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-400 transition-colors flex items-center gap-1.5 group">
                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>{t('footer.terms')}</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/BXM5WEkD3J"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-400 transition-colors flex items-center gap-2 text-sky-400 font-semibold"
                >
                  <Headphones className="w-3.5 h-3.5 text-sky-400" />
                  <span>ติดต่อแอดมิน 24 ชม.</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748b] footer-bottom">
          <p>© {new Date().getFullYear()} <b className="text-white">OSX HUB</b> — ALL RIGHTS RESERVED</p>
          <p>Powered by OSX Engine</p>
        </div>

      </div>
    </footer>
  );
}
