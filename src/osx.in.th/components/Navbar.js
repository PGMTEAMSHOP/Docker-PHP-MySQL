'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Home,
  Store,
  Coins,
  ShieldCheck,
  User,
  Wrench,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import gsap from 'gsap';

if (typeof window !== 'undefined') {
  gsap.registerPlugin();
}

export function Navbar() {
  const { user, setIsLoginOpen, setIsRegisterOpen, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // GSAP Navbar entrance animation
  useEffect(() => {
    if (!navRef.current) return;

    const ctx = gsap.context(() => {
      // Topbar slides down
      gsap.fromTo('.topbar-inner',
        { y: -25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.05 }
      );

      // Nav links stagger in (desktop)
      gsap.fromTo('.topbar-inner nav a',
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out', delay: 0.3 }
      );
    }, navRef);

    return () => ctx.revert();
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.store'), path: '/store', icon: Store },
    { name: t('nav.topup'), path: '/topup', icon: Coins },
    { name: t('nav.status'), path: '/status', icon: ShieldCheck },
  ];

  if (user) {
    navLinks.push({ name: t('nav.profile'), path: '/profile', icon: User });
    if (user.role === 'admin') {
      navLinks.push({ name: t('nav.admin'), path: '/admin', icon: Wrench });
    }
  }

  return (
    <header ref={navRef} className="topbar-wrapper">
      <div className="topbar-inner px-3.5 sm:px-6">
        <div className="flex items-center justify-between h-[56px] sm:h-[62px]">
          
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/img/NewLogo88 (3).png"
              alt="OSX HUB Logo"
              className="h-8 sm:h-9 w-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]"
            />
            <div className="text-sm sm:text-lg font-black tracking-wide text-white">
              OSX <span className="gtx">HUB</span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Centered) */}
          <nav className="hidden md:flex items-center gap-1 mx-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              const IconComp = link.icon;

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-200 group ${
                    isActive ? 'text-white font-semibold' : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#38bdf8]' : 'text-[#64748b] group-hover:text-[#38bdf8]'
                    }`}
                  />
                  <span>{link.name}</span>
                  
                  {/* Rank1Shop style active underline with electric blue gradient */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#38bdf8] to-[#0284c7] transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-75'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions (Lang & Auth) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#070b14] border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'th'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-3 bg-[#0d1626] border border-white/10 rounded-xl px-3.5 py-1.5 shadow-inner">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-[#94a3b8] font-medium leading-none">{user.username}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#38bdf8] mt-1 leading-none">
                    ฿ {parseFloat(user.balance).toFixed(2)}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer flex items-center justify-center p-1"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="btn-dark px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {t('nav.register') || 'สมัครสมาชิก'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="btn-blue px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {t('nav.login')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {!user ? (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="btn-blue px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-transform shadow-sm"
              >
                {t('nav.login')}
              </button>
            ) : (
              <div className="text-xs font-bold text-[#38bdf8] bg-sky-500/10 border border-sky-500/25 px-2.5 py-1 rounded-xl">
                ฿ {parseFloat(user.balance).toFixed(2)}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl bg-white/5 active:scale-95 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-sky-400" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-3.5 sm:p-4 rounded-2xl bg-[#080e1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl animate-modal-in space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            const IconComp = link.icon;

            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-[#94a3b8]">{t('lang.switch')}</span>
            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setLang('th')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  lang === 'th' ? 'bg-sky-600 text-white' : 'text-[#94a3b8]'
                }`}
              >
                🇹🇭 TH
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  lang === 'en' ? 'bg-sky-600 text-white' : 'text-[#94a3b8]'
                }`}
              >
                🇺🇸 EN
              </button>
            </div>
          </div>

          {!user ? (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsRegisterOpen(true);
                }}
                className="btn-dark py-2 rounded-xl text-xs font-semibold text-center"
              >
                {t('nav.register') || 'สมัครสมาชิก'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginOpen(true);
                }}
                className="btn-blue py-2 rounded-xl text-xs font-semibold text-center"
              >
                {t('nav.login')}
              </button>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5">
              <div>
                <span className="text-xs text-[#94a3b8] block">{user.username}</span>
                <span className="text-sm font-bold text-[#38bdf8]">฿ {parseFloat(user.balance).toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold bg-rose-950/30 border border-rose-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
