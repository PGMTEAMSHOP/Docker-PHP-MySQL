'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Store() {
  const { scripts, categories } = useAuth();
  const { lang, t, getCategoryName } = useLanguage();

  // Navigation states
  const [currentParentId, setCurrentParentId] = useState(null); // null = top level root categories
  const [currentSubId, setCurrentSubId] = useState(null); // null = not viewing specific leaf products

  // Filter root categories (those without a parent)
  const rootCategories = categories ? categories.filter((c) => !c.parent_id) : [];

  // Filter subcategories for the currently selected root
  const subCategories = currentParentId
    ? categories.filter((c) => c.parent_id == currentParentId)
    : [];

  // Currently active parent category info
  const activeParent = currentParentId
    ? categories.find((c) => c.id == currentParentId)
    : null;

  // Currently active subcategory info
  const activeSub = currentSubId
    ? categories.find((c) => c.id == currentSubId)
    : null;

  // Filter scripts to display
  let displayedScripts = [];
  if (currentSubId) {
    // Show scripts only in this specific subcategory
    displayedScripts = scripts ? scripts.filter((s) => s.category_id == currentSubId) : [];
  } else if (currentParentId) {
    // Show all scripts belonging directly to this parent OR to any subcategory of this parent
    const subIds = subCategories.map((sc) => sc.id);
    displayedScripts = scripts ? scripts.filter((s) =>
      s.category_id == currentParentId || subIds.includes(s.category_id)
    ) : [];
  } else {
    // Show all scripts
    displayedScripts = scripts || [];
  }

  // Sort displayedScripts by status: 'undetected' first, then 'updating', then 'detected'
  displayedScripts = [...displayedScripts].sort((a, b) => {
    const order = { 'undetected': 1, 'updating': 2, 'detected': 3 };
    const statusA = a.status || 'undetected';
    const statusB = b.status || 'undetected';
    return (order[statusA] || 99) - (order[statusB] || 99);
  });

  // GSAP container ref
  const storeRef = useRef(null);

  // GSAP Animations — replaces the old IntersectionObserver
  useEffect(() => {
    if (!storeRef.current) return;

    // Small delay to let React render the new content
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Section-level reveals
        gsap.utils.toArray('.gsap-section').forEach((section) => {
          gsap.fromTo(section,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          );
        });

        // Stagger grid children
        gsap.utils.toArray('.gsap-stagger-grid').forEach((grid) => {
          const children = grid.children;
          if (!children.length) return;

          gsap.fromTo(children,
            { y: 25, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: grid,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        });

        // Page entrance animation
        gsap.fromTo(storeRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
      }, storeRef);

      // Store cleanup function reference
      storeRef.current._gsapCtx = ctx;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (storeRef.current?._gsapCtx) {
        storeRef.current._gsapCtx.revert();
      }
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [categories, scripts, currentParentId, currentSubId]);

  // Handle URL query param ?cat=...
  useEffect(() => {
    if (typeof window !== 'undefined' && categories && categories.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('cat');
      if (catParam) {
        const catId = parseInt(catParam);
        const target = categories.find((c) => c.id === catId);
        if (target) {
          if (target.parent_id) {
            setCurrentParentId(target.parent_id);
            setCurrentSubId(target.id);
          } else {
            setCurrentParentId(target.id);
            setCurrentSubId(null);
          }
        }
      }
    }
  }, [categories]);

  // Back button navigation handler
  const handleBack = () => {
    if (currentSubId) {
      setCurrentSubId(null);
    } else if (currentParentId) {
      setCurrentParentId(null);
    }
  };

  const selectRootCategory = (id) => {
    setCurrentParentId(id);
    setCurrentSubId(null);
  };

  const selectSubCategory = (id) => {
    setCurrentSubId(id);
  };

  if (!currentParentId) {
    return (
      <div ref={storeRef} className="space-y-6 py-4">
        {/* Header with solid cyan divider line */}
        <div className="relative flex items-center w-full gsap-section">
          <div className="absolute inset-x-0 h-px bg-cyan-500 z-0 animate-line-grow" />
          <span className="relative z-10 inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-slate-300 uppercase bg-[#090d16] border border-cyan-500/20 px-4 py-1.5 rounded-full pr-5">
            <span className="text-cyan-400"><i className="fa-solid fa-folder-open animate-pulse"></i></span>
            {lang === 'th' ? 'หมวดหมู่สินค้า' : 'Categories'}
          </span>
        </div>
        <div className="flex flex-col animate-fade-up anim-delay-1">
          <h1 className="text-xl font-extrabold text-white">
            {lang === 'th' ? 'หมวดหมู่สินค้า' : 'Categories'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            {lang === 'th' ? 'หมวดหมู่ที่น่าสนใจจากเรา' : 'Browse categories from us'}
          </p>
        </div>

        {/* 2-column grid of categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 gsap-section gsap-stagger-grid">
          {rootCategories.map((c, idx) => {
            const subCount = categories.filter((sc) => sc.parent_id === c.id).length;
            const scriptCount = scripts.filter((s) => s.category_id === c.id || categories.some(sc => sc.id === s.category_id && sc.parent_id === c.id)).length;

            return (
              <div
                key={c.id}
                onClick={() => selectRootCategory(c.id)}
                className="cursor-pointer flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-[#0c1017]/80 hover:border-slate-700/80 transition-all duration-300 shadow-md group card-hover-lift"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="relative w-full aspect-[2.8/1] rounded-xl overflow-hidden border border-slate-800/40 shadow-sm">
                  <img
                    src={c.image_url ? (c.image_url.startsWith('http') || c.image_url.startsWith('/') ? c.image_url : '/' + c.image_url) : '/img/default-cover.png'}
                    alt={getCategoryName(c)}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Info details */}
                <div className="px-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-200 group-hover:text-cyan-400 transition-colors">{getCategoryName(c)}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-cyan-400 mt-0.5">
                    {subCount > 0 
                      ? (lang === 'th' ? `หมวดหมู่ย่อย ${subCount} รายการ` : `${subCount} Subcategories`)
                      : (lang === 'th' ? `สินค้าทั้งหมด ${scriptCount} รายการ` : `${scriptCount} Products`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2 & 3: Selected parent category / subcategory view
  // ──────────────────────────────────────────────────────────────────────────
  const showSubcategoriesGrid = currentParentId && !currentSubId && subCategories.length > 0;

  return (
    <div ref={storeRef} className="space-y-6 py-4">
      {/* Category Proportional Header Banner */}
      {currentParentId && activeParent && (
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0d0f15] shadow-lg card-hover-lift gsap-section">
          <img
            src={
              activeSub && activeSub.image_url
                ? (activeSub.image_url.startsWith('http') || activeSub.image_url.startsWith('/') ? activeSub.image_url : '/' + activeSub.image_url)
                : (activeParent && activeParent.image_url
                  ? (activeParent.image_url.startsWith('http') || activeParent.image_url.startsWith('/') ? activeParent.image_url : '/' + activeParent.image_url)
                  : '/img/default-cover.png')
            }
            alt={activeParent ? getCategoryName(activeParent) : ''}
            className="w-full h-auto block"
          />
        </div>
      )}

      {/* Category Level Badge */}
      <div className="relative flex items-center w-full gsap-section">
        <div className="absolute inset-x-0 h-px bg-cyan-500 z-0 animate-line-grow" />
        <span className="relative z-10 inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-slate-300 uppercase bg-[#090d16] border border-cyan-500/20 px-4 py-1.5 rounded-full pr-5">
          <span className="text-cyan-400">
            <i className={`fa-solid ${showSubcategoriesGrid ? 'fa-layer-group' : 'fa-box-open'} animate-pulse`}></i>
          </span>
          {activeSub
            ? (lang === 'th' ? 'สินค้าในหมวดหมู่' : 'Category Products')
            : showSubcategoriesGrid
              ? (lang === 'th' ? 'หมวดหมู่ย่อย' : 'Subcategories')
              : (lang === 'th' ? 'หมวดหมู่สินค้า' : 'Categories')}
        </span>
      </div>

      {/* Header Info area with back button */}
      <div className="flex flex-col gap-4 animate-fade-up anim-delay-1">
        {/* Back Button (Cyan gradient themed) */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-full transition-all shadow-md shadow-cyan-900/20 w-fit btn-press"
        >
          <i className="fa-solid fa-arrow-left"></i> {lang === 'th' ? 'ย้อนกลับ' : 'Back'}
        </button>

        {/* Title */}
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-white">
            {activeSub ? getCategoryName(activeSub) : activeParent ? getCategoryName(activeParent) : ''}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            {activeSub
              ? (lang === 'th' ? 'สินค้าวางจำหน่าย' : 'Available Products')
              : showSubcategoriesGrid
                ? (lang === 'th' ? `หมวดหมู่ย่อยของ ${getCategoryName(activeParent)}` : `Subcategories of ${getCategoryName(activeParent)}`)
                : (lang === 'th' ? 'หมวดหมู่สินค้า' : 'Categories')}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {showSubcategoriesGrid ? (
        /* Subcategories 2-column grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 gsap-section gsap-stagger-grid">
          {subCategories.map((sc, idx) => {
            const scriptCount = scripts.filter((s) => s.category_id === sc.id).length;

            return (
              <div
                key={sc.id}
                onClick={() => selectSubCategory(sc.id)}
                className="cursor-pointer flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-[#0c1017]/80 hover:border-slate-700/80 transition-all duration-300 shadow-md group card-hover-lift"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="relative w-full aspect-[2.8/1] rounded-xl overflow-hidden border border-slate-800/40 shadow-sm">
                  <img
                    src={sc.image_url ? (sc.image_url.startsWith('http') || sc.image_url.startsWith('/') ? sc.image_url : '/' + sc.image_url) : '/img/default-cover.png'}
                    alt={getCategoryName(sc)}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Subcategory Details */}
                <div className="px-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-200 group-hover:text-cyan-400 transition-colors">{getCategoryName(sc)}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-cyan-400 mt-0.5">
                    {lang === 'th' ? `สินค้าทั้งหมด ${scriptCount} รายการ` : `All ${scriptCount} Products`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Scripts / Products grid view */
        <div className="space-y-4 gsap-section">
          {displayedScripts.length === 0 ? (
            <div className="bg-[#0f172a] border border-slate-850/60 rounded-2xl p-12 text-center text-slate-400 space-y-2 animate-fade-up">
              <div className="text-3xl animate-bounce">📦</div>
              <p className="text-sm font-semibold">
                {lang === 'th' ? 'ขออภัย ยังไม่มีสินค้าวางขายในหมวดหมู่นี้' : 'Sorry, no products in this category yet'}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'th' ? 'กรุณาเลือกหมวดหมู่อื่น หรือตรวจเช็คกับแอดมินภายหลัง' : 'Please check back later or explore other categories'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 gsap-stagger-grid">
              {displayedScripts.map((s, idx) => {
                const hasBadgeNew = s.name.toLowerCase().includes('auto farm') || s.name.toLowerCase().includes('lifetime');
                const isFree = parseFloat(s.price) === 0;

                let statusText = 'Undetected';
                let statusColor = 'text-emerald-400';
                let dotColor = 'bg-emerald-500';

                if (s.status === 'detected') {
                  statusText = 'Detected';
                  statusColor = 'text-rose-500';
                  dotColor = 'bg-rose-500';
                } else if (s.status === 'updating') {
                  statusText = 'Updating';
                  statusColor = 'text-amber-500';
                  dotColor = 'bg-amber-500';
                }

                const bannerSrc = s.banner_url
                  ? (s.banner_url.startsWith('http') || s.banner_url.startsWith('/') ? s.banner_url : '/' + s.banner_url)
                  : 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=600&q=80';

                const iconSrc = s.image_url
                  ? (s.image_url.startsWith('http') || s.image_url.startsWith('/') ? s.image_url : '/' + s.image_url)
                  : null;

                return (
                  <div
                    key={s.id}
                    className="relative bg-[#0d0f17] border border-slate-800/80 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl hover:shadow-cyan-950/5 overflow-hidden card-hover-lift"
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    {/* 1. Product Banner */}
                    <div className="relative w-full h-28 overflow-hidden bg-slate-950 border-b border-slate-900/60 shrink-0">
                      <img
                        src={bannerSrc}
                        alt="Product Banner"
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] via-transparent to-transparent"></div>

                      {hasBadgeNew && (
                        <span className="absolute top-3 right-3 bg-[#0d0f17]/85 border border-slate-800 text-slate-400 text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full z-20 animate-pop">
                          LIFETIME UD
                        </span>
                      )}
                    </div>

                    {/* 2. Overlapping Profile Icon + Title & Status */}
                    <div className="px-5 pt-3 flex flex-col flex-1">
                      <div className="relative flex items-end gap-3.5 pl-16 min-h-[44px] -mt-9 mb-3 z-10">
                        <div className="absolute left-0 bottom-0 w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-cyan-500/40 transition-colors">
                          {iconSrc ? (
                            <img src={iconSrc} alt="Product Icon" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl filter drop-shadow-md select-none">{s.emoji || '📦'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <Link href={`/product/${s.id}`} className="text-sm sm:text-base font-black text-white group-hover:text-cyan-400 transition-colors block leading-tight truncate">
                            {s.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold mt-0.5">
                            <span className="relative flex h-1.5 w-1.5">
                              {(s.status === 'detected' || s.status === 'updating') && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor} ${(s.status === 'detected' || s.status === 'updating') ? 'animate-pulse' : ''}`}></span>
                            </span>
                            <span className={`${statusColor} ${(s.status === 'detected' || s.status === 'updating') ? 'animate-pulse' : ''}`}>{statusText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 font-semibold line-clamp-2 leading-relaxed mb-4">
                        {s.description || 'A premium product built for users who want to unlock the full potential for the best experience.'}
                      </p>

                      <div className="mt-auto">
                        <div className="h-px bg-slate-800/60 w-full mb-3.5"></div>

                        {/* Stats Fields Columns */}
                        <div className="space-y-2.5 pb-3.5">
                          <div className="flex items-center justify-between text-[10.5px] font-extrabold">
                            <span className="text-slate-500 uppercase tracking-wider">PLATFORM</span>
                            <span className="text-slate-300">{s.platform || 'Windows 10 & 11'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10.5px] font-extrabold">
                            <span className="text-slate-500 uppercase tracking-wider">TYPE</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                              s.delivery_type === 'stock_ticket'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : s.delivery_type === 'stock_item'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : s.delivery_type === 'program'
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                    : 'text-slate-300'
                            }`}>
                              {s.delivery_type === 'stock_ticket' 
                                ? '🎫 Ticket Claim' 
                                : s.delivery_type === 'stock_item' 
                                  ? '📦 Stock Auto' 
                                  : s.delivery_type === 'program'
                                    ? '💻 Program'
                                    : (s.type || 'Script')}
                            </span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-800/60 w-full mb-3.5"></div>

                        {/* Footer: Price and Button */}
                        <div className="flex items-center justify-between pb-4">
                          <div>
                            {isFree ? (
                              <strong className="text-sm sm:text-base font-black text-cyan-400">
                                {lang === 'th' ? 'ฟรี' : 'Free'}
                              </strong>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-[8.5px] text-slate-500 font-extrabold uppercase tracking-wider">
                                  {lang === 'th' ? 'ราคาเริ่มต้น' : 'Starting from'}
                                </span>
                                <strong className="text-sm sm:text-base font-black text-white">฿ {s.price}</strong>
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/product/${s.id}`}
                            className="bg-white hover:bg-slate-100 text-slate-950 font-black px-4.5 py-2.5 rounded-full text-[10.5px] transition-all shadow-md flex items-center gap-1 active:scale-95 cursor-pointer btn-press"
                          >
                            {lang === 'th' ? 'ดูรายละเอียด' : 'VIEW DETAILS'} <i className="fa-solid fa-chevron-right text-[8.5px] opacity-60"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
