'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProductDetail({ params }) {
  const unwrappedParams = use(params);
  const productId = parseInt(unwrappedParams.id);
  const router = useRouter();

  const {
    scripts,
    categories,
    user,
    setIsLoginOpen,
    showToast,
    checkSession,
    loadScripts,
  } = useAuth();
  const { lang, t, getCategoryName } = useLanguage();

  // Find target product
  const script = scripts.find((s) => s.id === productId);

  // License checking
  const hasActiveLicense = user && user.keys && user.keys.some((k) => k.script === script?.name && k.status === 'active');
  const isPermanentLicense = user && user.keys && user.keys.some((k) => k.script === script?.name && k.status === 'active' && (k.plan?.includes('ถาวร') || k.plan?.includes('ตลอดชีพ')));

  const [selectedPlan, setSelectedPlan] = useState(null);
  const qty = 1;
  const [buying, setBuying] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const pageRef = useRef(null);

  // GSAP Product page entrance animation
  useEffect(() => {
    if (!pageRef.current || !script) return;

    const ctx = gsap.context(() => {
      // Cover image entrance
      gsap.fromTo('.product-cover',
        { scale: 1.05, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 }
      );

      // Left column content stagger
      gsap.fromTo('.product-left > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.2 }
      );

      // Right sidebar slide in from right
      gsap.fromTo('.product-right > *',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.3 }
      );

      // Scroll-triggered reveals for below-fold content
      gsap.utils.toArray('.product-scroll-reveal').forEach((el) => {
        gsap.fromTo(el,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, [script]);

  // Auto set initial plan
  useEffect(() => {
    if (script) {
      // Setup plans
      if (!script.plans || !Array.isArray(script.plans) || script.plans.length === 0) {
        script.plans = [
          { name: '7 วัน', price: script.price || 39 },
          { name: '30 วัน', price: (script.price || 39) * 3 },
        ];
      }
      setSelectedPlan(script.plans[0]);
    }
  }, [script]);

  // Reset applied discount when selected plan changes
  useEffect(() => {
    setAppliedDiscount(null);
    setPromoCode('');
  }, [selectedPlan]);

  const handleApplyDiscount = async () => {
    if (!promoCode.trim() || !selectedPlan) return;
    setValidatingCode(true);
    try {
      const price = selectedPlan.price * qty;
      const res = await fetch(`/api/scripts.php?action=validate_discount&code=${encodeURIComponent(promoCode.trim())}&price=${price}`).then(r => r.json());
      if (res.status === 'success') {
        setAppliedDiscount(res.data);
        showToast(`✅ ใช้โค้ดส่วนลดสำเร็จ! ลดไป ฿${res.data.discount_amount.toFixed(2)}`, 'success');
      } else {
        setAppliedDiscount(null);
        showToast(res.message, 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด', 'error');
    } finally {
      setValidatingCode(false);
    }
  };

  if (!script) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="text-4xl text-slate-500">🔎</div>
        <p className="text-slate-400 font-semibold">ไม่พบข้อมูลสคริปต์นี้ในระบบ</p>
        <Link href="/store" className="text-blue-400 font-bold hover:underline">
          กลับหน้าร้านค้า
        </Link>
      </div>
    );
  }

  const cat = categories.find((c) => c.id == script.category_id);
  const catLabel = cat ? getCategoryName(cat) : (lang === 'th' ? 'สคริปต์' : 'Script');

  const stockVal = script.stock !== undefined ? script.stock : 0;
  const isOutOfStock = stockVal === 0;

  // Extract YouTube ID from link
  const getYoutubeId = (url) => {
    if (!url) return 'S263q9rJ2yE';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : 'S263q9rJ2yE';
  };
  const youtubeId = getYoutubeId(script.youtube_url);

  // Reviews mock (4 items)
  const reviewerNames = ['Pattarapon S.', 'Somchai_Dev', 'DarkKnight99', 'Kittisak_Rbx', 'Alex_OSX'];
  const reviewTexts = [
    'ใช้งานง่ายมากครับ รันผ่านได้ลื่นๆ ไม่มีเด้งเลย แนะนำร้านนี้เลยครับ!',
    'ระบบดีมากครับ ซื้อปุ๊บรับของไว บริการดีมาก 10/10',
    'คุ้มค่ากับราคามาก ฟังก์ชันครบตามที่ระบุไว้ อัปเดตตลอด',
    'ปลอดภัยดีครับ ใช้อยู่ยังไม่เคยโดนแบนเลย เยี่ยมครับ',
  ];

  const reviews = [];
  for (let i = 0; i < 4; i++) {
    reviews.push({
      id: i,
      name: reviewerNames[i % reviewerNames.length],
      text: reviewTexts[(productId + i) % reviewTexts.length],
    });
  }

  const handlePurchase = async () => {
    if (!user) {
      showToast('⚠️ กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า', 'error');
      setIsLoginOpen(true);
      return;
    }

    if (!selectedPlan) return;
    const originalPrice = selectedPlan.price * qty;
    const totalPrice = appliedDiscount ? appliedDiscount.final_price : originalPrice;

    if (parseFloat(user.balance) < totalPrice) {
      showToast('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน', 'error');
      router.push('/topup');
      return;
    }

    setBuying(true);
    try {
      const response = await fetch('/api/scripts.php?action=buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_id: script.id,
          plan_name: selectedPlan.name,
          price: selectedPlan.price,
          discount_code: appliedDiscount ? appliedDiscount.code : '',
        }),
      });
      const res = await response.json();
      if (res.status === 'success') {
        showToast('🎉 สั่งซื้อสินค้าสำเร็จเรียบร้อย!', 'success');
        await loadScripts(); // Reload stock count
        await checkSession(); // Reload profile keys & history
        setOrderModal(res.data);
      } else {
        showToast(res.message, 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการซื้อสินค้า', 'error');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div ref={pageRef} className="space-y-6 py-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/store"
            className="flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs border border-slate-800 transition-all"
          >
            <i className="fa-solid fa-arrow-left"></i> {lang === 'th' ? 'ย้อนกลับ' : 'Back'}
          </Link>
          <span className="text-sm font-semibold text-slate-400">
            {script.name} / {catLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Images, Review, Youtube) */}
        <div className="lg:col-span-2 space-y-6 product-left">
          {/* Cover image card */}
          <div
            className="w-full aspect-[2.1/1] rounded-2xl bg-cover bg-center border border-slate-800 bg-slate-900 shadow-lg product-cover"
            style={{ 
              backgroundImage: `url('${
                script.image_url 
                  ? (script.image_url.startsWith('http') || script.image_url.startsWith('/') ? script.image_url : '/' + script.image_url) 
                  : '/img/default-cover.png'
              }')` 
            }}
          ></div>

          {/* YouTube Video Review */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-4 product-scroll-reveal">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-brands fa-youtube text-red-500 text-lg"></i> {lang === 'th' ? 'วีดีโอรีวิวสินค้า' : 'Video Showcase'}
            </h3>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800/60 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                frameBorder="0"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-4 product-scroll-reveal">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'th' ? '⭐ รีวิวความประทับใจ' : '⭐ Customer Reviews'}
              </h3>
              <span className="bg-blue-600/10 text-blue-400 font-semibold px-2.5 py-0.5 rounded text-[10px]">Reviews</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-[#090d16] border border-slate-850/60 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>ผู้ใช้: {r.name}</span>
                    <span className="text-yellow-500"><i className="fa-solid fa-star"></i> 5/5</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Info, Price selector & buy button) */}
        <div className="lg:col-span-1 space-y-6 product-right">
          {/* Details / Desc card */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-white">{script.name}</h1>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                {lang === 'th' ? 'หมวดหมู่' : 'Category'}: {catLabel}
              </span>
            </div>
            
            <div className="h-px bg-slate-800/60"></div>
            
            {/* Delivery Type & Stock Badge */}
            {script.delivery_type === 'program' ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💻</span>
                  <div>
                    <span className="text-xs font-black text-violet-300 block">
                      {lang === 'th' ? 'โปรแกรม / ซอฟต์แวร์' : 'Software / Program'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'th' ? 'ดาวน์โหลดไฟล์ติดตั้งโปรแกรมหลังสั่งซื้อ' : 'Download program file after purchase'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {lang === 'th' ? 'ดาวน์โหลดตรง' : 'Direct Download'}
                </span>
              </div>
            ) : script.delivery_type === 'stock_ticket' ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎫</span>
                  <div>
                    <span className="text-xs font-black text-cyan-400 block">
                      {lang === 'th' ? 'รับสินค้าใน Discord Ticket' : 'Claim via Discord Ticket'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'th' ? 'นำรหัส Claim Code ไปแจ้งเปิด Ticket' : 'Use your Claim Code to open a ticket'}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${stockVal > 0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {stockVal > 0 ? (lang === 'th' ? `สต็อก: ${stockVal} ชิ้น` : `Stock: ${stockVal} pcs`) : (lang === 'th' ? 'สินค้าหมด' : 'Out of Stock')}
                </span>
              </div>
            ) : script.delivery_type === 'stock_item' ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📦</span>
                  <div>
                    <span className="text-xs font-black text-blue-400 block">
                      {lang === 'th' ? 'สต็อกสินค้าอัตโนมัติ' : 'Instant Auto Stock'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'th' ? 'รับข้อมูลสินค้าทันทีหลังสั่งซื้อ' : 'Get product details right after order'}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${stockVal > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {stockVal > 0 ? (lang === 'th' ? `สต็อก: ${stockVal} ชิ้น` : `Stock: ${stockVal} pcs`) : (lang === 'th' ? 'สินค้าหมด' : 'Out of Stock')}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚡</span>
                  <div>
                    <span className="text-xs font-black text-cyan-300 block">
                      {lang === 'th' ? 'สคริปต์เกม Roblox' : 'Roblox Game Script'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {lang === 'th' ? 'ผูกสิทธิ์เข้าบัญชีอัตโนมัติ (ใช้งานผ่าน Account Key)' : 'Activated to account (Use with Account Key)'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {lang === 'th' ? '✓ เข้าบัญชีทันที' : '✓ Instant'}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'th' ? 'รายละเอียดสินค้า' : 'Product Description'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {script.description || (lang === 'th' ? 'ไม่มีคำอธิบายสำหรับสินค้านี้' : 'No description available for this item.')}
              </p>
            </div>

            {script.features && script.features.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'th' ? 'คุณสมบัติเด่น' : 'Key Features'}
                </h4>
                <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-semibold">
                  {script.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                      <i className="fa-solid fa-circle-check text-blue-400"></i> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Script Status Display card */}
          {(() => {
            let statusText = 'Undetected';
            let statusColor = 'text-emerald-400';
            let dotColor = 'bg-emerald-500';
            let bgColor = 'bg-emerald-950/20';
            let borderColor = 'border-emerald-800/40';
            let pingColor = 'bg-emerald-450';
            let recommendationText = lang === 'th' 
              ? 'ระบบปลอดภัย ใช้งานได้อย่างมั่นใจ แนะนำรันตามคำแนะนำของสคริปต์หลัก'
              : 'System is safe and fully undetected. Follow script recommendations.';

            if (script.status === 'detected') {
              statusText = 'Detected';
              statusColor = 'text-rose-400';
              dotColor = 'bg-rose-500';
              bgColor = 'bg-rose-950/20';
              borderColor = 'border-rose-800/40';
              pingColor = 'bg-rose-450';
              recommendationText = lang === 'th'
                ? 'ไม่ปลอดภัยชั่วคราว! ระบบตรวจพบความไม่ปลอดภัยในแพทช์ล่าสุด กรุณางดรันสคริปต์นี้เด็ดขาดเพื่อป้องกันการถูกแบนไอดี'
                : 'Currently risky! Game patch detected. Please refrain from running this script to prevent bans.';
            } else if (script.status === 'updating') {
              statusText = 'Updating';
              statusColor = 'text-amber-400';
              dotColor = 'bg-amber-500';
              bgColor = 'bg-amber-950/20';
              borderColor = 'border-amber-800/40';
              pingColor = 'bg-amber-450';
              recommendationText = lang === 'th'
                ? 'กำลังปรับปรุงแก้ไข! ระบบอยู่ระหว่างอัปเดตโค้ดสคริปต์ให้รองรับแพทช์เกมล่าสุด ปิดระบบชั่วคราวเพื่อความปลอดภัย'
                : 'Under maintenance! The script is currently being updated for the latest game patch.';
            }

            const hasAnim = script.status === 'detected' || script.status === 'updating';

            return (
              <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {lang === 'th' ? 'สถานะระบบ' : 'System Status'}
                  </span>
                  <div className={`flex items-center gap-2 ${bgColor} border ${borderColor} px-3.5 py-1.5 rounded-xl`}>
                    <span className="relative flex h-2 w-2">
                      {hasAnim && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} ${hasAnim ? 'animate-pulse' : ''}`}></span>
                    </span>
                    <span className={`text-xs font-bold ${statusColor} ${hasAnim ? 'animate-pulse' : ''}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-slate-800/50 w-full"></div>
                <div className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  <span className="text-slate-300 font-bold block mb-0.5">
                    {lang === 'th' ? '💡 คำแนะนำความปลอดภัย:' : '💡 Safety Recommendation:'}
                  </span>
                  {recommendationText}
                </div>
              </div>
            );
          })()}

          {/* Checkout buy details card */}
          <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              <i className="fa-solid fa-receipt text-blue-500 mr-1.5"></i>
              {lang === 'th' ? 'ใบเสร็จและการชำระเงิน' : 'Checkout & Payment'}
            </h3>
            
            <div className="flex items-center justify-between bg-[#070b13]/60 border border-slate-850 rounded-2xl p-4 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {lang === 'th' ? 'ยอดชำระรวม' : 'Total Amount'}
              </span>
              <div className="flex flex-col items-end">
                {appliedDiscount && (
                  <span className="text-xs text-slate-500 line-through font-bold">
                    ฿ {(selectedPlan.price * qty).toFixed(2)}
                  </span>
                )}
                {selectedPlan && (appliedDiscount ? appliedDiscount.final_price : selectedPlan.price * qty) === 0 ? (
                  <strong className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)] font-black">
                    {lang === 'th' ? 'ฟรี' : 'Free'}
                  </strong>
                ) : (
                  <strong className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)] font-black">
                    ฿ {selectedPlan ? (appliedDiscount ? appliedDiscount.final_price : selectedPlan.price * qty).toFixed(2) : '0.00'}
                  </strong>
                )}
              </div>
            </div>

            {/* Promo code */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'th' ? 'โค้ดส่วนลด' : 'Promo Code'}
                </label>
                {appliedDiscount && (
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase animate-pulse">
                    {lang === 'th' ? `ประหยัดไป ฿${appliedDiscount.discount_amount.toFixed(2)}` : `Saved ฿${appliedDiscount.discount_amount.toFixed(2)}`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={lang === 'th' ? 'ใส่โค้ดส่วนลดของคุณที่นี่' : 'Enter your promo code here'}
                  value={promoCode}
                  disabled={appliedDiscount !== null}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={`bg-[#070b13]/80 border focus:border-cyan-500/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all duration-300 placeholder-slate-600 flex-1 font-semibold focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] ${
                    appliedDiscount ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/5' : 'border-slate-850'
                  }`}
                />
                {appliedDiscount ? (
                  <button
                    onClick={() => {
                      setAppliedDiscount(null);
                      setPromoCode('');
                    }}
                    className="bg-red-950/20 border border-red-900/30 hover:bg-red-600 hover:text-white text-red-400 font-black px-4 py-3 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  >
                    {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    onClick={handleApplyDiscount}
                    disabled={validatingCode || !promoCode.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  >
                    {validatingCode ? (lang === 'th' ? 'กำลังตรวจ...' : 'Checking...') : (lang === 'th' ? 'ใช้โค้ด' : 'Apply')}
                  </button>
                )}
              </div>
            </div>

            {/* Plans duration select */}
            {script.plans && script.plans.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'th' ? 'เลือกระยะเวลาใช้งาน' : 'Select Plan Duration'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {script.plans.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => !isOutOfStock && !hasActiveLicense && setSelectedPlan(p)}
                      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all ${
                        selectedPlan?.name === p.name
                          ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                          : 'border-slate-850/60 bg-[#090d16] text-slate-400 hover:text-white hover:border-slate-700'
                      } ${isOutOfStock || (script.delivery_type === 'script_key' && hasActiveLicense) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200">{p.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {lang === 'th' ? `ใช้งานระยะเวลา ${p.name}` : `Duration: ${p.name}`}
                        </span>
                      </div>
                      {parseFloat(p.price) === 0 ? (
                        <strong className="text-blue-400 font-extrabold">{lang === 'th' ? 'ฟรี' : 'Free'}</strong>
                      ) : (
                        <strong className="text-blue-400 font-extrabold">฿ {p.price}</strong>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Submit Button */}
            <button
              disabled={isOutOfStock || buying || (script.delivery_type === 'script_key' && hasActiveLicense)}
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              {buying 
                ? (lang === 'th' ? 'กำลังทำรายการ...' : 'Processing...') 
                : isOutOfStock 
                  ? (lang === 'th' ? 'สินค้าหมดชั่วคราว' : 'Out of Stock') 
                  : (script.delivery_type === 'script_key' && isPermanentLicense) 
                    ? (lang === 'th' ? 'คุณมีสิทธิ์การใช้งานแบบถาวรแล้ว' : 'You own a permanent license') 
                    : (script.delivery_type === 'script_key' && hasActiveLicense) 
                      ? (lang === 'th' ? 'คุณมีสิทธิ์การใช้งานที่ยังไม่หมดอายุ' : 'Active license already owned') 
                      : (lang === 'th' ? 'สั่งซื้อสินค้าตอนนี้' : 'Purchase Now')
              }
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ORDER SUCCESS CLAIM CODE MODAL (ป๊อปอัพแสดงรหัสเคลมสินค้า)
      ───────────────────────────────────────────────────────────────────── */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0e1626] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 animate-scale-up">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-cyan-900/30">
                {orderModal.delivery_type === 'stock_ticket' ? '🎫' : orderModal.delivery_type === 'program' ? '💻' : '🎉'}
              </div>
              <h3 className="text-xl font-black text-white">
                {orderModal.delivery_type === 'program' 
                  ? (lang === 'th' ? 'สั่งซื้อโปรแกรมสำเร็จแล้ว!' : 'Program Purchased Successfully!')
                  : (lang === 'th' ? 'สั่งซื้อสินค้าสำเร็จแล้ว!' : 'Order Placed Successfully!')}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">{orderModal.script} ({orderModal.plan})</p>
            </div>

            {orderModal.delivery_type === 'stock_ticket' ? (
              <div className="space-y-4">
                {/* Claim Code Box */}
                <div className="bg-[#070b13] border border-cyan-500/40 rounded-2xl p-5 space-y-2 text-center shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                    {lang === 'th' ? 'รหัสรับสินค้า (CLAIM CODE)' : 'CLAIM CODE'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-widest font-mono select-all py-1">
                    {orderModal.claim_code}
                  </div>
                  <button
                    onClick={() => copyClaimCode(orderModal.claim_code)}
                    className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <i className={`fa-solid ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
                    {copiedCode 
                      ? (lang === 'th' ? 'คัดลอกสำเร็จแล้ว!' : 'Copied!') 
                      : (lang === 'th' ? 'คัดลอกรหัส Claim Code' : 'Copy Claim Code')}
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2 font-black text-amber-400 text-xs">
                    <i className="fa-solid fa-circle-info text-sm"></i>
                    {lang === 'th' ? 'ขั้นตอนการเปิด Ticket รับสินค้าใน Discord:' : 'Steps to claim item via Discord Ticket:'}
                  </div>
                  <ol className="text-[11px] text-slate-300 space-y-1 pl-4 list-decimal leading-relaxed">
                    <li>
                      {lang === 'th' ? 'กดปุ่ม "ไปยัง Discord เพื่อเปิด Ticket" ด้านล่าง' : 'Click "Open Ticket in Discord" below'}
                    </li>
                    <li>
                      {lang === 'th' ? 'กดสร้างห้อง Ticket ในช่องแจ้งรับสินค้า' : 'Create a ticket in the claim channel'}
                    </li>
                    <li>
                      {lang === 'th' 
                        ? 'ส่งรหัส ' 
                        : 'Send code '}
                      <span className="text-cyan-400 font-black font-mono">{orderModal.claim_code}</span> 
                      {lang === 'th' 
                        ? ' ให้แอดมินใน Ticket เพื่อให้แอดมินส่งมอบสินค้าให้ทันที' 
                        : ' to the admin in your ticket to claim your item immediately.'}
                    </li>
                  </ol>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <a
                    href={orderModal.discord_ticket_url || 'https://discord.gg/BXM5WEkD3J'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold py-3.5 px-4 rounded-xl text-center text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="fa-brands fa-discord text-base"></i>
                    {lang === 'th' ? 'ไปยัง Discord เพื่อเปิด Ticket' : 'Open Ticket in Discord'}
                  </a>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all cursor-pointer"
                  >
                    {lang === 'th' ? 'ดูประวัติการสั่งซื้อใน Profile' : 'View Order History in Profile'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Download Card (Only for downloadable program delivery mode) */}
                {(() => {
                  const dlUrl = orderModal.download_url;
                  const isProg = orderModal.delivery_type === 'program' || (dlUrl && !dlUrl.endsWith('.lua') && (dlUrl.includes('.exe') || dlUrl.includes('.zip') || dlUrl.includes('.rar') || dlUrl.includes('.msi')));
                  if (!dlUrl || !isProg) return null;
                  return (
                    <div className="bg-[#070b13] border border-violet-500/40 rounded-2xl p-4 sm:p-5 text-center shadow-inner space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 block flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-cloud-arrow-down"></i>
                        {lang === 'th' ? 'ไฟล์โปรแกรม / ดาวน์โหลดติดตั้ง' : 'DOWNLOAD PROGRAM FILE'}
                      </span>
                      <a
                        href={dlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-violet-950/40 active:scale-95 cursor-pointer w-full"
                      >
                        <i className="fa-solid fa-download"></i>
                        <span>{lang === 'th' ? 'ดาวน์โหลดโปรแกรมติดตั้งทันที' : 'Download Program File'}</span>
                      </a>
                      <span className="text-[10px] text-slate-400 block">
                        {lang === 'th' ? '* คลิกปุ่มด้านบนเพื่อเริ่มดาวน์โหลดไฟล์โปรแกรม' : '* Click above to download the file directly'}
                      </span>
                    </div>
                  );
                })()}

                {/* 2. Account Key Card (ใช้ Account Key ประจำบัญชี) */}
                {user?.user_key && (
                  <div className="bg-[#070b13] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-2 text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1.5">
                      <i className="fa-solid fa-key"></i>
                      {lang === 'th' ? 'คีย์สำหรับใช้งานประจำบัญชี (ACCOUNT KEY)' : 'YOUR ACCOUNT KEY'}
                    </span>
                    <div className="text-lg sm:text-xl font-black text-cyan-300 tracking-wider font-mono select-all py-1 break-all">
                      {user.user_key}
                    </div>
                    <button
                      onClick={() => copyClaimCode(user.user_key)}
                      className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <i className={`fa-solid ${copiedCode ? 'fa-check' : 'fa-copy'}`}></i>
                      {copiedCode 
                        ? (lang === 'th' ? 'คัดลอกสำเร็จแล้ว!' : 'Copied!') 
                        : (lang === 'th' ? 'คัดลอก Account Key' : 'Copy Account Key')}
                    </button>
                    <p className="text-[10px] text-slate-400 block mt-1">
                      {lang === 'th' 
                        ? '💡 สิทธิ์ผูกเข้าบัญชีคุณเรียบร้อยแล้ว ใช้ Account Key นี้ในการเข้าใช้งานสคริปต์ในเกมได้ทันที'
                        : '💡 License activated to your account. Use this Account Key in the script loader.'}
                    </p>
                  </div>
                )}

                {/* 3. Success notification confirmation */}
                <div className="bg-[#070b13]/60 border border-emerald-500/30 rounded-2xl p-4 text-center">
                  <div className="text-emerald-400 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-circle-check text-base"></i>
                    {lang === 'th' ? 'ระบบเปิดใช้งานสิทธิ์เข้าบัญชีเรียบร้อยแล้ว' : 'License Activated Successfully'}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">
                    {lang === 'th'
                      ? 'คุณสามารถตรวจสอบรายการสิทธิ์สคริปต์และประวัติทั้งหมดได้ที่หน้าโปรไฟล์ของคุณ'
                      : 'You can check your script licenses and order history anytime in your profile.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 px-4 rounded-xl text-center text-sm transition-all shadow-lg cursor-pointer"
                  >
                    {lang === 'th' ? 'ไปยังหน้าโปรไฟล์ของฉัน' : 'Go to My Profile'}
                  </button>
                  <button
                    onClick={() => setOrderModal(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all cursor-pointer"
                  >
                    {lang === 'th' ? 'ปิดหน้าต่างนี้' : 'Close this Window'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
