'use client';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Profile() {
  const { user, loading, logout, showToast, checkSession } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('keys');
  const [showKey, setShowKey] = useState(false);

  // Helper to calculate remaining time text
  const getRemainingTimeText = (expiresTimestamp) => {
    if (!expiresTimestamp) return '';
    const now = Math.floor(Date.now() / 1000);
    const diff = expiresTimestamp - now;
    if (diff <= 0) return lang === 'th' ? 'หมดอายุแล้ว' : 'Expired';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    let timeStr = lang === 'th' ? 'เหลือเวลา ' : 'Remaining: ';
    if (days > 0) {
      timeStr += `${days} ${lang === 'th' ? 'วัน ' : 'days '}`;
      if (hours > 0) timeStr += `${hours} ${lang === 'th' ? 'ชม.' : 'hrs'}`;
    } else if (hours > 0) {
      timeStr += `${hours} ${lang === 'th' ? 'ชม. ' : 'hrs '}${minutes} ${lang === 'th' ? 'นาที' : 'mins'}`;
    } else {
      timeStr += `${minutes} ${lang === 'th' ? 'นาที' : 'mins'}`;
    }
    return timeStr;
  };

  // Settings form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [autoKeyEnabled, setAutoKeyEnabled] = useState(true);

  // Sync settings inputs when user profile loads
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setDiscordId(user.discord_id || '');
      setNickname(user.nickname || '');
      setAvatarUrl(user.avatar_url || '');
      const isAutoKey = user.auto_key_enabled === undefined || user.auto_key_enabled === null || user.auto_key_enabled === true || user.auto_key_enabled === 1 || user.auto_key_enabled === '1';
      setAutoKeyEnabled(isAutoKey);
    }
  }, [user]);

  const handleToggleAutoKey = async (newValue) => {
    setAutoKeyEnabled(newValue);
    try {
      const res = await fetch('/api/auth.php?action=toggle_auto_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(newValue ? '🟢 เปิดใช้งาน Auto Login Key แล้ว' : '🔴 ปิดใช้งาน Auto Login Key แล้ว', 'success');
        checkSession();
      } else {
        showToast(data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
        setAutoKeyEnabled(!newValue);
      }
    } catch (err) {
      showToast('ไม่สามารถอัปเดตการตั้งค่าได้', 'error');
      setAutoKeyEnabled(!newValue);
    }
  };

  // Protect route: Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      showToast('⚠️ กรุณาเข้าสู่ระบบก่อนดูโปรไฟล์', 'error');
      router.push('/');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  // Count active licenses
  const activeLicensesCount = user.keys
    ? user.keys.filter((k) => k.status === 'active').length
    : 0;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username || !email) {
      showToast('กรุณากรอกชื่อผู้ใช้และอีเมล', 'error');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/auth.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          discord_id: discordId,
          new_password: newPassword,
          nickname,
          avatar_url: avatarUrl,
        }),
      });
      const res = await response.json();
      if (res.status === 'success') {
        showToast('✅ บันทึกการเปลี่ยนแปลงแล้ว', 'success');
        setNewPassword('');
        await checkSession();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast(`📋 คัดลอกคีย์บัญชีของคุณเรียบร้อยแล้ว`, 'success');
  };

  // Calculate VIP Tier progress
  const totalDep = parseFloat(user.total_deposited || 0);
  let vipTier = 'MEMBER';
  let nextTierAmount = 200;
  if (totalDep >= 1000) {
    vipTier = 'DIAMOND';
    nextTierAmount = 1000;
  } else if (totalDep >= 500) {
    vipTier = 'GOLD';
    nextTierAmount = 1000;
  } else if (totalDep >= 200) {
    vipTier = 'SILVER';
    nextTierAmount = 500;
  }

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────────
          PROFILE HEADER - Modern Glassmorphic Container
      ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        {/* Glowing background blob */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full md:w-auto">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 bg-slate-900/80 flex items-center justify-center text-3xl text-cyan-400 shadow-inner overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <i className="fa-solid fa-user-astronaut"></i>
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#090d16] rounded-full animate-pulse"></span>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-black text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {user.nickname || user.username}
              <span className={`border text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase ${
                vipTier === 'DIAMOND'
                  ? 'bg-rose-500/10 text-rose-455 border-rose-900/30'
                  : vipTier === 'GOLD'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-900/30'
                    : vipTier === 'SILVER'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-900/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-900/30'
              }`}>
                <i className="fa-solid fa-crown text-[8px]"></i> {vipTier}
              </span>
            </h2>
            {user.nickname && (
              <p className="text-[10px] text-slate-400 font-extrabold -mt-1 block">
                @{user.username}
              </p>
            )}
            <p className="text-xs text-slate-500 font-bold">
              <i className="fa-regular fa-envelope mr-1.5 text-cyan-500/80"></i> {user.email}
            </p>
          </div>
        </div>

        {/* Account Key Box & Auto Key Toggle Container */}
        <div className="w-full md:w-auto flex flex-col gap-3">
          {/* Account Key Box */}
          <div className="w-full min-w-[280px] sm:min-w-[340px] p-4 rounded-xl border border-slate-800 bg-[#090d16]/90 relative z-10 flex items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">คีย์สำหรับใช้งานประจำบัญชี (Account Key)</span>
              <div className="flex items-center gap-2">
                <code 
                  onClick={() => setShowKey(!showKey)}
                  className={`text-xs font-mono font-bold text-cyan-400 cursor-pointer select-none transition-all duration-300 ${!showKey ? 'blur-[5px]' : ''}`}
                  title="คลิกเพื่อแสดง / ซ่อนคีย์"
                >
                  {user.user_key || 'OSX-NO-KEY-FOUND'}
                </code>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-500 hover:text-cyan-400 transition-colors text-[10px]"
                  title={showKey ? "ซ่อนคีย์" : "แสดงคีย์"}
                >
                  <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(user.user_key)}
              className="bg-[#0e1626] hover:bg-cyan-600 hover:border-cyan-600 hover:text-white text-slate-300 border border-slate-800 font-bold text-xs p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
              title="คัดลอกคีย์ประจำบัญชี"
            >
              <i className="fa-regular fa-copy"></i>
            </button>
          </div>

          {/* Auto Login Key Switch */}
          <div className="w-full min-w-[280px] sm:min-w-[340px] p-3.5 rounded-xl border border-slate-800 bg-[#090d16]/90 relative z-10 flex items-center justify-between gap-3 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <i className="fa-solid fa-key text-cyan-400"></i> Auto Login Key
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {autoKeyEnabled ? '🟢 เปิดใช้งาน (จำคีย์ในเครื่องอัตโนมัติ)' : '🔴 ปิดใช้งาน (กรอกคีย์เองทุกครั้ง)'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoKeyEnabled}
                onChange={(e) => handleToggleAutoKey(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          VIP TIER PROGRESS CARD
      ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1 shrink-0">
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">ระดับการเติมเงินสะสม (VIP TIER STATUS)</span>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-200">ระดับของคุณปัจจุบัน:</span>
              <span className={`border text-[9px] font-black px-2.5 py-0.5 rounded-lg uppercase ${
                vipTier === 'DIAMOND'
                  ? 'bg-rose-500/10 text-rose-455 border-rose-900/30'
                  : vipTier === 'GOLD'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-900/30'
                    : vipTier === 'SILVER'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-900/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-900/30'
              }`}>
                <i className="fa-solid fa-crown text-[8px] mr-1"></i> {vipTier}
              </span>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
            <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
              <span className="text-slate-400">ยอดเงินสะสมทั้งหมด: <span className="text-cyan-400 font-black">฿ {parseFloat(totalDep).toFixed(2)}</span></span>
              {vipTier !== 'DIAMOND' && (
                <span className="text-slate-500">เป้าหมายขึ้นขั้นถัดไป: ฿ {nextTierAmount}</span>
              )}
            </div>
            <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalDep / nextTierAmount) * 100)}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-slate-500 font-bold block mt-1.5">
              {vipTier === 'DIAMOND' 
                ? '🏆 ขอขอบพระคุณเป็นอย่างยิ่งที่สนับสนุนเราจนถึงระดับสูงสุด!' 
                : `อีกเพียง ฿ ${parseFloat(nextTierAmount - totalDep).toFixed(2)} เพื่อปลดล็อคสิทธิ์และอัปเกรดเป็นระดับ ${
                    vipTier === 'GOLD' ? 'DIAMOND' : vipTier === 'SILVER' ? 'GOLD' : 'SILVER'
                  }`
              }
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          STATS METRICS
      ───────────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-lg">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {lang === 'th' ? 'ยอดเงินคงเหลือ' : 'Current Balance'}
            </p>
            <strong className="text-xl font-extrabold text-cyan-400">฿ {parseFloat(user.balance).toFixed(2)}</strong>
          </div>
          <button
            onClick={() => router.push('/topup')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-cyan-900/20"
          >
            {lang === 'th' ? 'เติมเงิน' : 'Top Up'}
          </button>
        </div>

        {/* Owned Licenses */}
        <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-center text-xl text-cyan-400">
            <i className="fa-solid fa-file-shield"></i>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {lang === 'th' ? 'สิทธิ์การเข้าใช้งาน' : 'Active Licenses'}
            </p>
            <strong className="text-base font-extrabold text-white block mt-0.5">
              {activeLicensesCount} {lang === 'th' ? 'สคริปต์' : 'Scripts'}
            </strong>
          </div>
        </div>

        {/* Account History */}
        <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-center justify-center text-xl text-cyan-400">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {lang === 'th' ? 'รายการคำสั่งซื้อทั้งหมด' : 'Total Orders'}
            </p>
            <strong className="text-base font-extrabold text-white block mt-0.5">
              {user.history ? `${user.history.length} ${lang === 'th' ? 'รายการ' : 'Orders'}` : `0 ${lang === 'th' ? 'รายการ' : 'Orders'}`}
            </strong>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          TABS NAVIGATION & CONTENT PANEL
      ───────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex border-b border-slate-800/60 gap-2">
          {[
            { id: 'keys', label: lang === 'th' ? 'สิทธิ์สคริปต์ของฉัน' : 'My Script Keys', icon: 'fa-shield-halved' },
            { id: 'loader', label: lang === 'th' ? 'สคริปต์รันหลัก (Loader)' : 'Main Script (Loader)', icon: 'fa-code' },
            { id: 'history', label: lang === 'th' ? 'ประวัติการซื้อ' : 'Purchase History', icon: 'fa-history' },
            { id: 'settings', label: lang === 'th' ? 'ตั้งค่าบัญชี' : 'Account Settings', icon: 'fa-sliders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-xs sm:text-sm font-extrabold transition-all relative -mb-px flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-500 font-extrabold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content renderer panel */}
        <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-6 shadow-xl min-h-[300px]">
          
          {/* TAB: ACTIVE LICENSES (สิทธิ์สคริปต์ของฉัน) */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              {!user.keys || user.keys.filter((k) => k.status !== 'expired').length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="text-4xl">🛡️</div>
                  <p className="text-slate-400 text-xs font-bold">คุณยังไม่มีสิทธิ์เข้าใช้งานสคริปต์ใด ๆ ในบัญชีนี้</p>
                  <p className="text-[10px] text-slate-600">กรุณาเลือกซื้อสคริปต์ที่หน้าเว็บร้านค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.keys.filter((k) => k.status !== 'expired').map((k, i) => {
                    const isLifetime = k.expires === 'ถาวร';
                    const isExpired = k.status === 'expired';

                    return (
                      <div key={i} className="bg-[#090d16]/90 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Product Custom Icon or Default Code Icon */}
                            <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center text-lg shadow-sm border shrink-0 ${
                              isExpired 
                                ? 'bg-red-950/10 border-red-550/20 text-red-400' 
                                : isLifetime 
                                  ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 animate-pulse'
                                  : 'bg-blue-950/20 border-blue-500/20 text-blue-400'
                            }`}>
                              {k.script_image ? (
                                <img
                                  src={k.script_image.startsWith('http') || k.script_image.startsWith('/') ? k.script_image : '/' + k.script_image}
                                  alt="Script Icon"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <i className="fa-solid fa-code"></i>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-200">{k.script}</h4>
                                
                                {/* Script safety status inline badge */}
                                {(() => {
                                  let statusText = 'Undetected';
                                  let statusColor = 'text-emerald-400';
                                  let dotColor = 'bg-emerald-500';
                                  let bgColor = 'bg-emerald-950/20';
                                  let borderColor = 'border-emerald-800/40';
                                  let pingColor = 'bg-emerald-450';

                                  if (k.script_status === 'detected') {
                                    statusText = 'Detected';
                                    statusColor = 'text-rose-400';
                                    dotColor = 'bg-rose-500';
                                    bgColor = 'bg-rose-950/20';
                                    borderColor = 'border-rose-800/40';
                                    pingColor = 'bg-rose-450';
                                  } else if (k.script_status === 'updating') {
                                    statusText = 'Updating';
                                    statusColor = 'text-amber-400';
                                    dotColor = 'bg-amber-500';
                                    bgColor = 'bg-amber-950/20';
                                    borderColor = 'border-amber-800/40';
                                    pingColor = 'bg-amber-450';
                                  }

                                  const hasAnim = k.script_status === 'detected' || k.script_status === 'updating';

                                  return (
                                    <span className={`inline-flex items-center gap-1 ${bgColor} border ${borderColor} px-1.5 py-0.5 rounded text-[8px] font-black`}>
                                      <span className="relative flex h-1 w-1">
                                        {hasAnim && (
                                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}></span>
                                        )}
                                        <span className={`relative inline-flex rounded-full h-1 w-1 ${dotColor} ${hasAnim ? 'animate-pulse' : ''}`}></span>
                                      </span>
                                      <span className={`${statusColor} ${hasAnim ? 'animate-pulse' : ''}`}>{statusText}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                <span className="text-[9px] text-slate-500 font-bold">
                                  แพลน: <span className="text-slate-400 font-extrabold">{k.plan}</span>
                                </span>
                              </div>

                              {/* Account Key binding badge */}
                              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                                <span className="inline-flex items-center gap-1 text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded-md text-[9px] font-bold">
                                  <i className="fa-solid fa-circle-check"></i> ผูกสิทธิ์กับ Account Key แล้ว
                                </span>
                              </div>

                              {/* Download button ONLY for program delivery type or executable files (Game scripts do not have installer download) */}
                              {(() => {
                                const dlUrl = k.download_url;
                                const isProg = k.delivery_type === 'program' || (dlUrl && !dlUrl.endsWith('.lua') && (dlUrl.includes('.exe') || dlUrl.includes('.zip') || dlUrl.includes('.rar') || dlUrl.includes('.msi')));
                                if (!dlUrl || !isProg) return null;
                                return (
                                  <div className="mt-2">
                                    <a
                                      href={dlUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95"
                                    >
                                      <i className="fa-solid fa-download text-[11px]"></i>
                                      <span>ดาวน์โหลดโปรแกรมติดตั้ง</span>
                                    </a>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* License Status Badge */}
                          <div className="text-right flex flex-col items-end gap-1 shrink-0">
                            {isExpired ? (
                              <span className="bg-red-650/10 border border-red-900/30 text-red-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg whitespace-nowrap">
                                ❌ หมดอายุสิทธิ์
                              </span>
                            ) : isLifetime ? (
                              <span className="bg-cyan-650/10 border border-cyan-900/30 text-cyan-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-sm shadow-cyan-900/10 whitespace-nowrap">
                                ✓ ถาวร (ตลอดชีพ)
                              </span>
                            ) : (
                              <div className="text-right flex flex-col items-end gap-0.5">
                                <span className="bg-blue-650/10 border border-blue-900/30 text-blue-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg whitespace-nowrap">
                                  ✓ {getRemainingTimeText(k.expires_timestamp)}
                                </span>
                                <span className="text-[8px] text-slate-500 font-semibold block whitespace-nowrap">
                                  หมดวันที่ {k.expires}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: LOADER SCRIPT */}
          {activeTab === 'loader' && (
            <div className="space-y-5 max-w-2xl w-full min-w-0">
              <div className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-slate-200">คัดลอกรหัสเข้าใช้งานในเกม (Loader Script)</h3>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  นำชุดสคริปต์โหลดเดอร์สากลด้านล่างนี้ ไปรันผ่านตัวรันสคริปต์ (Executor) ของคุณในเกม Roblox เพื่อโหลดหน้าสำหรับล็อกอินและเปิดหน้าสคริปต์ที่คุณเป็นเจ้าของขึ้นมาใช้งาน
                </p>
              </div>

              <div className="bg-[#090d16]/80 border border-slate-800/80 p-5 rounded-2xl space-y-4 w-full min-w-0 overflow-hidden">
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">สคริปต์รันความปลอดภัยหลัก (OSX Loader Script)</span>
                  <div className="flex items-center gap-2 bg-[#060a10]/80 border border-slate-850 rounded-xl px-3 py-2.5 shadow-inner min-w-0">
                    <code className="text-xs font-mono text-cyan-400 overflow-x-auto whitespace-nowrap scrollbar-none flex-1 select-all select-none min-w-0 py-0.5">
                      loadstring(game:HttpGet("https://osx.in.th/api/loader.php"))()
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('loadstring(game:HttpGet("https://osx.in.th/api/loader.php"))()').catch(() => {});
                        showToast('📋 คัดลอก Loader Script เรียบร้อยแล้ว!', 'success');
                      }}
                      className="text-slate-400 hover:text-cyan-400 transition-colors shrink-0 text-sm p-1.5"
                      title="คัดลอก Loader Script"
                    >
                      <i className="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800/50 pt-3 text-[10px] text-slate-500 font-bold space-y-1.5">
                  <p className="text-slate-400">💡 วิธีใช้งานสคริปต์:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>คัดลอกสคริปต์ด้านบนด้านขวา</li>
                    <li>เปิดเข้าเกม Roblox ที่คุณเป็นเจ้าของสิทธิ์สคริปต์ หรือเล่นเกมใดก็ได้ (สำหรับรันสคริปต์ Universal)</li>
                    <li>รันสคริปต์นี้ในตัวรัน (Executor) จากนั้นกล่องล็อกอินจะเด้งขึ้นมาในเกม</li>
                    <li>นำคีย์ระบบความปลอดภัยประจำบัญชีของคุณมาใส่เพื่อลงชื่อเข้าใช้งาน</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDER HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {!user.history || user.history.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <div className="text-3xl text-slate-600">📁</div>
                  <p className="text-slate-400 text-xs font-bold">ไม่มีประวัติการซื้อสินค้า</p>
                  <p className="text-[10px] text-slate-600">รายการสั่งซื้อทั้งหมดของคุณจะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.history.map((h, i) => {
                    const isTicket = h.delivery_type === 'stock_ticket';
                    const isPending = h.status === 'pending_claim';

                    return (
                      <div key={i} className="bg-[#090d16]/90 border border-slate-800/80 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 transition-all hover:border-slate-700/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0c1017] border border-slate-800 flex items-center justify-center text-xl shrink-0">
                              {h.script_image ? (
                                <img
                                  src={h.script_image.startsWith('http') || h.script_image.startsWith('/') ? h.script_image : '/' + h.script_image}
                                  alt="Product Icon"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{isTicket ? '🎫' : '📦'}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-slate-200">{h.script}</h4>
                                {isTicket ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    🎫 Ticket Claim
                                  </span>
                                ) : h.delivery_type === 'program' ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                    💻 Program
                                  </span>
                                ) : h.delivery_type === 'stock_item' ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    📦 Stock
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                    ⚡ Instant
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                <i className="fa-regular fa-calendar mr-1 text-cyan-500"></i> ทำรายการสั่งซื้อเมื่อ {h.date}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-850">
                            {/* Status badge */}
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                🟡 รอรับสินค้าใน Ticket
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                <i className="fa-solid fa-check text-[9px]"></i> รับสินค้าแล้ว
                              </span>
                            )}
                            <strong className="text-red-400 text-xs sm:text-sm font-black">− ฿ {parseFloat(h.price).toFixed(2)}</strong>
                          </div>
                        </div>

                        {/* Program Download / Key / Ticket Actions Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850/60 text-xs">
                          {/* Left: Stock data / Key display if exists */}
                          {h.stock_data && !isTicket ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-bold">ข้อมูล/คีย์:</span>
                              <code className="text-[11px] font-mono text-cyan-300 bg-[#070b13] px-2 py-0.5 rounded border border-slate-800">
                                {h.stock_data}
                              </code>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(h.stock_data);
                                  showToast('📋 คัดลอกข้อมูลสินค้าแล้ว', 'success');
                                }}
                                className="text-slate-400 hover:text-cyan-400 text-[11px] cursor-pointer"
                                title="คัดลอก"
                              >
                                <i className="fa-regular fa-copy"></i>
                              </button>
                            </div>
                          ) : <div />}

                          {/* Right: Action Buttons */}
                          <div className="flex items-center gap-2 ml-auto">
                            {(() => {
                              const dlUrl = h.download_url;
                              const isProg = h.delivery_type === 'program' || (dlUrl && !dlUrl.endsWith('.lua') && (dlUrl.includes('.exe') || dlUrl.includes('.zip') || dlUrl.includes('.rar') || dlUrl.includes('.msi')));
                              if (!dlUrl || !isProg) return null;
                              return (
                                <a
                                  href={dlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 text-[11px] font-bold px-3 py-1 rounded-lg transition-all"
                                >
                                  <i className="fa-solid fa-download text-[10px]"></i> ดาวน์โหลดโปรแกรม
                                </a>
                              );
                            })()}
                            {isTicket && isPending && (
                              <a
                                href={h.discord_ticket_url || 'https://discord.gg/BXM5WEkD3J'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-[11px] px-3.5 py-1 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                              >
                                <i className="fa-brands fa-discord"></i> ไปเปิด Ticket รับสินค้า
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS & PASSWORD */}
          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">ชื่อผู้ใช้งาน</label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="w-full bg-[#090d16]/40 border border-slate-850 rounded-lg px-3 py-2.5 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                  title="ไม่สามารถเปลี่ยนชื่อผู้ใช้งานที่ใช้ในการเข้าสู่ระบบได้"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">อีเมลแอดเดรส</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Discord ID</label>
                <input
                  type="text"
                  placeholder="เช่น YourName#0000"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">ชื่อเล่น (Nickname)</label>
                <input
                  type="text"
                  placeholder="ใส่ชื่อเล่นของคุณที่นี่"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">ลิงก์รูปโปรไฟล์ (Avatar Image URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-400">รหัสผ่านใหม่ (ปล่อยว่างหากไม่เปลี่ยน)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
              
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow shadow-cyan-900/20"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  {updating ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="bg-red-950/10 border border-red-900/30 hover:bg-red-600 hover:text-white text-red-400 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
