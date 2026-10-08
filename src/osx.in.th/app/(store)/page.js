'use client';

export const dynamic = 'force-dynamic';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users,
  Package,
  Boxes,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Headphones,
  FolderOpen,
  Star,
  ArrowRight,
  Info,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const { categories, scripts, stats, statsLoaded } = useAuth();
  const { lang, t, getCategoryName } = useLanguage();

  // Filter root categories
  const rootCategories = categories ? categories.filter((c) => !c.parent_id) : [];

  // Calculate total stock
  const totalStock = scripts ? scripts.reduce((sum, s) => sum + (s.stock ? parseInt(s.stock) || 0 : 0), 0) : 0;

  // Top featured scripts (up to 8)
  const featuredScripts = scripts ? scripts.slice(0, 8) : [];

  // Main container ref for GSAP context
  const mainRef = useRef(null);
  const statsReadyRef = useRef(false);
  const displayedStatsRef = useRef([0, 0, 0, 0]);
  const entrancePlayedRef = useRef(false);

  const statValues = [
    stats?.total_users ?? 0,
    scripts?.length ?? 0,
    totalStock,
    stats?.total_sold ?? 0,
  ].map((value) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0));

  const [userCount, productCount, stockCount, soldCount] = statValues;
  const statValuesRef = useRef([0, 0, 0, 0]);

  useEffect(() => {
    statsReadyRef.current = statsLoaded;
    statValuesRef.current = statValues;
  }, [statsLoaded, userCount, productCount, stockCount, soldCount]);

  // GSAP Animations — replaces the old IntersectionObserver
  useEffect(() => {
    if (!mainRef.current) return;

    const ctx = gsap.context(() => {
      // ── Hero entrance timeline ──
      const heroTl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      heroTl.fromTo('.hero-banner-wrap',
        { y: 50, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 1 }
      );

      heroTl.fromTo('.hero-glow',
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
        '-=0.7'
      );

      const statCards = gsap.utils.toArray('.stat-card');
      const statCounters = statCards.map((card) => card.querySelector('[data-stat-counter]'));
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reducedMotion) {
        gsap.set(statCards, { x: 0, opacity: 1, scale: 1 });
        statCounters.forEach((element, index) => {
          if (element) element.textContent = statValuesRef.current[index].toLocaleString('en-US');
        });
        displayedStatsRef.current = [...statValuesRef.current];
        entrancePlayedRef.current = true;
      } else {
        // If stats are already available, add the coordinated entrance to the hero timeline.
        // When async data has not settled yet, render the cards first and animate only the values later.
        if (statsReadyRef.current && !entrancePlayedRef.current) {
          // Start stat cards with the hero instead of waiting for the banner/glow animations to finish.
          const statsStartAt = 0;
          statCards.forEach((card, index) => {
            const counter = { value: 0 };
            const target = statValuesRef.current[index] ?? 0;
            const startAt = statsStartAt + index * 0.2;

            heroTl.fromTo(card,
              { x: 40, opacity: 0, scale: 0.9 },
              { x: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' },
              startAt
            );
            heroTl.to(counter, {
              value: target,
              duration: 0.7,
              ease: 'power2.out',
              onUpdate: () => {
                displayedStatsRef.current[index] = counter.value;
                if (statCounters[index]) {
                  statCounters[index].textContent = Math.round(counter.value).toLocaleString('en-US');
                }
              },
              onComplete: () => {
                displayedStatsRef.current[index] = target;
                if (statCounters[index]) statCounters[index].textContent = target.toLocaleString('en-US');
              },
            }, startAt);
          });
          entrancePlayedRef.current = true;
        } else if (!entrancePlayedRef.current) {
          gsap.set(statCards, { x: 0, opacity: 1, scale: 1 });
        }
      }

      // ── Scroll-triggered sections ──
      gsap.utils.toArray('.gsap-section').forEach((section) => {
        gsap.fromTo(section,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // ── Stagger grid children (banner cards, why cards, category cards, product cards) ──
      gsap.utils.toArray('.gsap-stagger-grid').forEach((grid) => {
        const children = grid.children;
        if (!children.length) return;

        gsap.fromTo(children,
          { y: 30, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: grid.classList.contains('why-feature-grid') ? 0.3 : 0.55,
            stagger: grid.classList.contains('why-feature-grid') ? 0.2 : 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: grid,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // ── Section headers slide-in ──
      gsap.utils.toArray('.sec-head').forEach((head) => {
        gsap.fromTo(head,
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: head,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // ── About section special entrance ──
      const aboutSection = mainRef.current?.querySelector('.gsap-about');
      if (aboutSection) {
        const aboutChildren = aboutSection.children;
        gsap.fromTo(aboutChildren,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: aboutSection,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

    }, mainRef);

    return () => ctx.revert();
  }, [categories, scripts, statsLoaded, userCount, productCount, stockCount, soldCount]);

  // Subsequent stat updates animate from the currently displayed number without replaying card entrance.
  useEffect(() => {
    if (!statsLoaded || !entrancePlayedRef.current) return;
    const elements = mainRef.current?.querySelectorAll('[data-stat-counter]');
    if (!elements?.length) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    statValues.forEach((target, index) => {
      const element = elements[index];
      if (!element) return;
      if (reducedMotion) {
        displayedStatsRef.current[index] = target;
        element.textContent = target.toLocaleString('en-US');
        return;
      }

      const counter = { value: displayedStatsRef.current[index] ?? 0 };
      gsap.to(counter, {
        value: target,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => {
          displayedStatsRef.current[index] = counter.value;
          element.textContent = Math.round(counter.value).toLocaleString('en-US');
        },
        onComplete: () => {
          displayedStatsRef.current[index] = target;
          element.textContent = target.toLocaleString('en-US');
        },
      });
    });
  }, [statsLoaded, userCount, productCount, stockCount, soldCount]);

  return (
    <div ref={mainRef} className="flex flex-col gap-6 sm:gap-8 w-full max-w-[1360px] mx-auto pb-10">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO ROW — Banner (with Sheen) + Vertical Stats Column
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full flex flex-col lg:flex-row gap-3.5 sm:gap-5 items-stretch pt-1 sm:pt-2">
        
        {/* Left: Hero Banner with Ambient Blue Glow & Sheen Effect */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="hero-stage">
            <div className="hero-glow" />
            
            <div className="hero-banner-wrap group">
              <Link href="/store" className="block relative overflow-hidden">
                <img
                  src="/img/welcome_banner.png"
                  alt="OSX HUB Banner"
                  className="w-full h-auto object-cover group-hover:scale-[1.015] transition-transform duration-500"
                />
                {/* Sweep Sheen Effect like Rank1Shop */}
                <div className="hero-sheen" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Vertical Stats Panel (Rank1Shop style with Lucide icons) */}
        <div className="w-full lg:w-[260px] flex-none grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
          
          {/* Stat 1: ผู้ใช้งาน */}
          <div className="stat-card flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#94a3b8] font-semibold">
              <div className="stat-ic">
                <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span>{lang === 'th' ? 'ผู้ใช้งาน' : 'Users'}</span>
            </div>
            <div className="mt-1.5 sm:mt-2 text-base sm:text-xl font-extrabold text-white flex items-baseline gap-1">
              <span data-stat-counter>0</span>
              <small className="text-[10px] sm:text-xs text-[#64748b] font-normal">{lang === 'th' ? 'คน' : 'users'}</small>
            </div>
            <div className="stat-wm">
              <Users className="w-full h-full" />
            </div>
          </div>

          {/* Stat 2: สินค้า */}
          <div className="stat-card flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#94a3b8] font-semibold">
              <div className="stat-ic">
                <Package className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span>{lang === 'th' ? 'สินค้า' : 'Products'}</span>
            </div>
            <div className="mt-1.5 sm:mt-2 text-base sm:text-xl font-extrabold text-white flex items-baseline gap-1">
              <span data-stat-counter>0</span>
              <small className="text-[10px] sm:text-xs text-[#64748b] font-normal">{lang === 'th' ? 'รายการ' : 'items'}</small>
            </div>
            <div className="stat-wm">
              <Package className="w-full h-full" />
            </div>
          </div>

          {/* Stat 3: คลังสินค้า */}
          <div className="stat-card flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#94a3b8] font-semibold">
              <div className="stat-ic">
                <Boxes className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span>{lang === 'th' ? 'คลังสินค้า' : 'In Stock'}</span>
            </div>
            <div className="mt-1.5 sm:mt-2 text-base sm:text-xl font-extrabold text-white flex items-baseline gap-1">
              <span data-stat-counter>0</span>
              <small className="text-[10px] sm:text-xs text-[#64748b] font-normal">{lang === 'th' ? 'ชิ้น' : 'pcs'}</small>
            </div>
            <div className="stat-wm">
              <Boxes className="w-full h-full" />
            </div>
          </div>

          {/* Stat 4: ขายแล้ว */}
          <div className="stat-card flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-[#94a3b8] font-semibold">
              <div className="stat-ic">
                <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </div>
              <span>{lang === 'th' ? 'ขายแล้ว' : 'Total Sold'}</span>
            </div>
            <div className="mt-1.5 sm:mt-2 text-base sm:text-xl font-extrabold text-white flex items-baseline gap-1">
              <span data-stat-counter>0</span>
              <small className="text-[10px] sm:text-xs text-[#64748b] font-normal">{lang === 'th' ? 'ชิ้น' : 'sold'}</small>
            </div>
            <div className="stat-wm">
              <CheckCircle2 className="w-full h-full" />
            </div>
          </div>

        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. QUICK BANNER CARDS (สินค้า, เติมเงิน, ติดต่อ)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4 gsap-section gsap-stagger-grid">
        <Link
          href="/store"
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-500/50 shadow-md transition-all duration-300 card-hover-lift block"
        >
          <img
            src="/img/banner_product.png"
            alt="สินค้า"
            className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        </Link>

        <Link
          href="/topup"
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-500/50 shadow-md transition-all duration-300 card-hover-lift block"
        >
          <img
            src="/img/banner_topup.png"
            alt="เติมเงิน"
            className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        </Link>

        <a
          href="https://discord.gg/BXM5WEkD3J"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-500/50 shadow-md transition-all duration-300 card-hover-lift block"
        >
          <img
            src="/img/banner_contact.png"
            alt="ติดต่อเรา"
            className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        </a>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. FEATURED CATEGORIES (หมวดหมู่แนะนำ)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full gsap-section">
        <div className="sec-head">
          <div className="sec-ic">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
              หมวดหมู่แนะนำ
            </h2>
            <small className="text-[10px] sm:text-xs font-bold text-[#64748b] tracking-widest uppercase block">
              FEATURED CATEGORIES
            </small>
          </div>
          <div className="sec-line" />
        </div>

        {rootCategories.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#64748b]">กำลังโหลดหมวดหมู่...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-2 sm:mt-3 gsap-stagger-grid">
            {rootCategories.slice(0, 4).map((c) => {
              // Calculate scripts in this category or any of its subcategories
              const scriptCount = scripts
                ? scripts.filter(
                    (s) =>
                      s.category_id == c.id ||
                      (categories &&
                        categories.some(
                          (sc) => sc.id == s.category_id && sc.parent_id == c.id
                        ))
                  ).length
                : 0;

              return (
                <Link
                  key={c.id}
                  href={`/store?cat=${c.id}`}
                  className="group relative block rounded-2xl overflow-hidden border border-white/10 hover:border-sky-500/50 shadow-lg bg-[#0a1120] aspect-[2.6/1] sm:aspect-[1700/400] transition-all duration-300 card-hover-lift"
                >
                  {/* Background Image — Clean & bright by default, dims and zooms slightly on hover */}
                  <img
                    src={
                      c.image_url
                        ? (c.image_url.startsWith('http') || c.image_url.startsWith('/') ? c.image_url : '/' + c.image_url)
                        : '/img/default-cover.png'
                    }
                    alt={getCategoryName(c)}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 brightness-100 group-hover:scale-105 group-hover:brightness-50"
                  />
                  {/* Dark gradient shade overlay — visible only on hover */}
                  <div className="category-hover-overlay absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />

                  {/* Category Details — hidden by default, smoothly shows on hover */}
                  <div className="category-hover-content absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 max-w-[75%] sm:max-w-[70%] pointer-events-none">
                    <h3 className="text-sm sm:text-xl font-black text-white group-hover:text-sky-400 transition-colors drop-shadow-md">
                      {getCategoryName(c)}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#94a3b8] mt-0.5 sm:mt-1 font-medium drop-shadow">
                      {lang === 'th' ? `สินค้าทั้งหมด ${scriptCount} รายการ` : `${scriptCount} Products`}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-sky-400 font-bold mt-1.5 sm:mt-2 group-hover:translate-x-1 transition-transform drop-shadow">
                      <span>เข้าชมหมวดหมู่นี้</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

                  {/* ═══════════════════════════════════════════════════════════════════
          3. WHY CHOOSE US (ทำไมต้องเลือก OSX HUB)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full gsap-section">
        <div className="sec-head">
          <div className="sec-ic">
            <Sparkles aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
              ทำไมต้องเลือก OSX HUB
            </h2>
            <small className="text-[10px] sm:text-xs font-bold text-[#64748b] tracking-widest uppercase block">
              WHY CHOOSE US
            </small>
          </div>
          <div className="sec-line" />
        </div>

        <div className="gsap-stagger-grid why-feature-grid mt-2 grid auto-rows-fr grid-cols-1 gap-3 sm:mt-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <article className="group why-feature-card flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1722] to-[#08111a] p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_12px_32px_rgba(2,132,199,0.12)] sm:p-5">
            <div className="why-feature-icon relative isolate mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-[0_4px_14px_rgba(2,132,199,0.28)] perspective-[500px]">
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-1 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-2 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-3 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <ShoppingCart aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white transition-colors group-hover:text-sky-300 sm:text-base">
              ซื้อง่าย ไม่กี่ขั้นตอน
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8] sm:text-xs sm:leading-6">
              ระบบหน้าเว็บใช้งานง่าย สะดวก รวดเร็ว สั่งซื้อได้ตลอด 24 ชั่วโมง พร้อมคู่มือแนะนำ
            </p>
          </article>

          <article className="group why-feature-card flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1722] to-[#08111a] p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_12px_32px_rgba(2,132,199,0.12)] sm:p-5">
            <div className="why-feature-icon relative isolate mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-[0_4px_14px_rgba(2,132,199,0.28)] perspective-[500px]">
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-1 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-2 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-3 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <Zap aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white transition-colors group-hover:text-sky-300 sm:text-base">
              รวดเร็ว จัดส่งทันที
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8] sm:text-xs sm:leading-6">
              ชำระเงินเสร็จสิ้น ระบบจัดส่งคีย์และสคริปต์ให้อัตโนมัติทันที ไม่ต้องรอแอดมินอนุมัติ
            </p>
          </article>

          <article className="group why-feature-card flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1722] to-[#08111a] p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_12px_32px_rgba(2,132,199,0.12)] sm:p-5">
            <div className="why-feature-icon relative isolate mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-[0_4px_14px_rgba(2,132,199,0.28)] perspective-[500px]">
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-1 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-2 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-3 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white transition-colors group-hover:text-sky-300 sm:text-base">
              ปลอดภัย 100%
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8] sm:text-xs sm:leading-6">
              สคริปต์ผ่านการทดสอบอย่างเข้มงวด ปลอดภัย ไร้ไวรัส ป้องกันระบบตรวจจับ อัปเดตสม่ำเสมอ
            </p>
          </article>

          <article className="group why-feature-card flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1722] to-[#08111a] p-4 transition duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_12px_32px_rgba(2,132,199,0.12)] sm:p-5">
            <div className="why-feature-icon relative isolate mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-[0_4px_14px_rgba(2,132,199,0.28)] perspective-[500px]">
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-1 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-2 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <span aria-hidden="true" className="why-feature-wave why-feature-wave-3 pointer-events-none absolute inset-0 rounded-xl border border-sky-200/80 opacity-0" />
              <Headphones aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white transition-colors group-hover:text-sky-300 sm:text-base">
              ซัพพอร์ตตลอด 24 ชม.
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#94a3b8] sm:text-xs sm:leading-6">
              มีทีมงานคอยช่วยเหลือ ให้คำปรึกษา และแก้ไขปัญหาตลอดเวลาผ่าน Discord ชุมชนใหญ่
            </p>
          </article>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. FEATURED PRODUCTS (สินค้าแนะนำ)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full gsap-section">
        <div className="sec-head">
          <div className="sec-ic">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
              สินค้าแนะนำ
            </h2>
            <small className="text-[10px] sm:text-xs font-bold text-[#64748b] tracking-widest uppercase block">
              FEATURED PRODUCTS
            </small>
          </div>
          <span className="count-badge">
            {featuredScripts.length} รายการ
          </span>
          <div className="sec-line" />
        </div>

        {featuredScripts.length === 0 ? (
          <div className="text-center py-10 sm:py-12 text-xs sm:text-sm text-[#64748b] bg-white/[0.02] border border-white/5 rounded-2xl">
            ยังไม่มีสินค้าแนะนำในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 sm:mt-3 gsap-stagger-grid">
            {featuredScripts.map((s) => {
              const price = parseFloat(s.price || 0);
              const inStock = s.stock === null || parseInt(s.stock) > 0;

              return (
                <div
                  key={s.id}
                  className="group relative flex flex-col rounded-2xl bg-[#090f1d] border border-white/10 hover:border-sky-500/50 shadow-lg overflow-hidden transition-all duration-300 card-hover-lift"
                >
                  {/* Product Thumbnail */}
                  <Link href={`/product/${s.id}`} className="block relative aspect-video overflow-hidden bg-black/40">
                    <img
                      src={s.image_url || '/img/default-cover.png'}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Status Badge */}
                    {/* <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 z-10">
                      <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shadow-md ${
                        inStock
                          ? 'bg-sky-600/90 text-white border border-sky-400/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {inStock ? 'พร้อมส่งทันที' : 'สินค้าหมด'}
                      </span>
                    </div> */}
                  </Link>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
                    <div>
                      <Link href={`/product/${s.id}`}>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                          {s.name}
                        </h4>
                      </Link>
                      <p className="text-[10px] sm:text-[11px] text-[#64748b] mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed">
                        {s.description || 'สคริปต์แท้ คุณภาพสูง ปลอดภัย 100%'}
                      </p>
                    </div>

                    {/* Footer: Price + Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 sm:gap-2">
                      <div>
                        <small className="text-[9px] sm:text-[10px] text-[#64748b] block leading-none">ราคา</small>
                        <span className="text-xs sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500 leading-none">
                          ฿ {price.toFixed(2)}
                        </span>
                      </div>

                      <Link
                        href={`/product/${s.id}`}
                        className="btn-blue px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5"
                      >
                        <span>สั่งซื้อ</span>
                        <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. ABOUT US & VIDEO SHOWCASE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="w-full gsap-section mt-2">
        <div className="sec-head">
          <div className="sec-ic">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              เกี่ยวกับ OSX HUB
            </h2>
            <small className="text-[10px] sm:text-xs font-bold text-[#64748b] tracking-widest uppercase block">
              ABOUT US &amp; TUTORIAL
            </small>
          </div>
          <div className="sec-line" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch mt-2 sm:mt-3 gsap-about">
          
          {/* Left: About Text & Highlights */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#090f1d] border border-white/10 flex flex-col justify-between space-y-3.5 sm:space-y-4">
            <div>
              <h3 className="text-lg font-black text-white">
                แหล่งรวมสคริปต์เกม <span className="gtx">อันดับ 1</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 leading-relaxed">
                <b>OSX HUB</b> เป็นศูนย์รวมสคริปต์และโปรแกรมช่วยเล่นสำหรับเกมชั้นนำ ออกแบบมาเพื่อมอบประสบการณ์การเล่นที่ดีที่สุด ฟังก์ชันครบครัน ใช้งานง่าย และมีความเสถียรสูงสุด
              </p>
              <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 leading-relaxed">
                ระบบชำระเงินรองรับการเติมเงินอัตโนมัติ สั่งซื้อผ่านหน้าเว็บได้ตลอด 24 ชั่วโมง พร้อมระบบจัดการคีย์และการันตีการอัปเดตรองรับตัวเกมเวอร์ชันล่าสุดเสมอ
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-sky-400 font-extrabold text-lg">24 / 7</div>
                <div className="text-[11px] text-[#64748b]">ระบบออโต้ตลอดเวลา</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-sky-400 font-extrabold text-lg">100%</div>
                <div className="text-[11px] text-[#64748b]">รับประกันความพึงพอใจ</div>
              </div>
            </div>
          </div>

          {/* Right: Video Tutorial Showcase */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/k5bcBvQxUR4"
              title="OSX HUB - Tutorial &amp; Showcase"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>

        </div>
      </section>

    </div>
  );
}
