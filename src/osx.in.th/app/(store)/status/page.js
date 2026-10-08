'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  Search,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Smartphone,
  Monitor,
  Laptop,
  Apple,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const formatDateByLang = (dateStr, lang = 'th') => {
  if (!dateStr) return '';
  try {
    const cleaned = dateStr.replace(' at ', ' ').replace(' UTC', ' GMT');
    const parsedDate = new Date(Date.parse(cleaned));
    if (isNaN(parsedDate.getTime())) return dateStr;

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');

    if (lang === 'th') {
      const year = parsedDate.getFullYear() + 543;
      return `${day}/${month}/${year} เวลา ${hours}:${minutes} น.`;
    } else {
      const year = parsedDate.getFullYear();
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  } catch (e) {
    return dateStr;
  }
};

export default function ExecutorStatus() {
  const { lang, t } = useLanguage();
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyToClipboard = (text) => {
    if (!text || text === 'ไม่พบข้อมูล' || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const formatCost = (costStr, isFree) => {
    if (isFree) return lang === 'th' ? 'ฟรี' : 'Free';
    if (!costStr) return lang === 'th' ? 'ฟรี' : 'Free';
    if (lang === 'en') return costStr;
    return costStr
      .replace(/Lifetime/gi, 'ถาวร')
      .replace(/Weekly/gi, 'ต่อสัปดาห์')
      .replace(/Monthly/gi, 'ต่อเดือน')
      .replace(/Annually/gi, 'ต่อปี')
      .replace(/Free/gi, 'ฟรี');
  };

  const getRobloxVersion = (platformName) => {
    const match = executors.find((e) => {
      const p = e.platform ? e.platform.toLowerCase() : '';
      if (platformName === 'windows' && p.includes('win')) return true;
      if (platformName === 'mac' && (p.includes('mac') || p.includes('apple')) && !p.includes('ios')) return true;
      if (platformName === 'android' && p.includes('android')) return true;
      if (platformName === 'ios' && p.includes('ios')) return true;
      return false;
    });
    return match?.rbxversion || 'ไม่พบข้อมูล';
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Try Next.js internal API route first
      let res = await fetch('/api/executor_status');
      
      // 2. Try fallback route
      if (!res.ok) {
        res = await fetch('/api/executor_status.php');
      }

      // 3. Client-side direct fallback to WEAO if internal proxy is down
      if (!res.ok) {
        res = await fetch('https://weao.xyz/api/status/exploits', {
          headers: { 'User-Agent': 'WEAO-3PService' },
        });
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setExecutors(data);
      } else if (data && data.status === 'error') {
        setError(data.message);
      } else {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (err) {
      console.warn('Status fetch error:', err);
      // Attempt to load from fallback static cache if fetch fails completely
      try {
        const fallbackRes = await fetch('/cache_executor_status.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData)) {
            setExecutors(fallbackData);
            setLoading(false);
            return;
          }
        }
      } catch (cacheErr) {}
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์สถานะได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const filteredExecutors = executors.filter((e) => {
    return e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 1. Windows Executors (platform: Windows, extype: wexecutor)
  const winExecutors = filteredExecutors.filter((e) => {
    const p = e.platform ? e.platform.toLowerCase() : '';
    return p.includes('win') && e.extype === 'wexecutor';
  });

  // 2. Windows Externals (platform: Windows, extype: wexternal)
  const winExternals = filteredExecutors.filter((e) => {
    const p = e.platform ? e.platform.toLowerCase() : '';
    return p.includes('win') && e.extype === 'wexternal';
  });

  // 3. MacOS (platform: Mac)
  const macExecutors = filteredExecutors.filter((e) => {
    const p = e.platform ? e.platform.toLowerCase() : '';
    return (p.includes('mac') || p.includes('apple')) && !p.includes('ios');
  });

  // 4. iOS (platform: iOS)
  const iosExecutors = filteredExecutors.filter((e) => {
    const p = e.platform ? e.platform.toLowerCase() : '';
    return p.includes('ios');
  });

  // 5. Android (platform: Android)
  const androidExecutors = filteredExecutors.filter((e) => {
    const p = e.platform ? e.platform.toLowerCase() : '';
    return p.includes('android');
  });

  // Reusable Executor List rendering
  const renderExecutorList = (list) => {
    if (!list || list.length === 0) {
      return (
        <div className="bg-[#09101c]/40 border border-white/5 rounded-2xl p-6 text-center text-xs font-semibold text-[#64748b]">
          {lang === 'th' ? 'ไม่มีข้อมูลตัวรันในหมวดหมู่นี้' : 'No executors found in this category'}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((e, index) => {
          const isWorking = e.updateStatus === true;
          const isDetected = e.detected === true;
          const executorId = e._id || index;
          const isExpanded = expandedId === executorId;

          const statusBorder = isWorking ? 'border-l-emerald-500' : 'border-l-amber-500';

          return (
            <div
              key={executorId}
              className={`bg-[#09101c]/80 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-md border-l-4 ${statusBorder} hover:border-sky-500/40`}
            >
              {/* Row Header */}
              <div
                onClick={() => toggleExpand(executorId)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Logo/Icon */}
                  {e.slug?.logo ? (
                    <img
                      src={e.slug.logo}
                      alt={e.title}
                      className="w-10 h-10 rounded-xl bg-black border border-white/10 object-cover shrink-0"
                      onError={(evt) => {
                        evt.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#0e1626] border border-white/10 flex items-center justify-center text-sky-400 shrink-0 text-xs font-black shadow-inner">
                      {e.title ? e.title.slice(0, 2).toUpperCase() : 'EX'}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-white">{e.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                        {e.version || 'N/A'}
                      </span>
                      {e.uncPercentage > 0 && (
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-950/30 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          sUNC {e.suncPercentage || e.uncPercentage}%
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          e.free
                            ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/30'
                            : 'text-sky-300 bg-sky-950/30 border border-sky-400/30'
                        }`}
                      >
                        {formatCost(e.cost, e.free)}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748b] font-medium mt-1">
                      {lang === 'th' ? 'อัปเดตล่าสุด: ' : 'Last updated: '}
                      {formatDateByLang(e.updatedDate, lang)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Status Badge */}
                  {isWorking ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-3 py-1 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {lang === 'th' ? 'ใช้งานได้' : 'Working'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {lang === 'th' ? 'กำลังอัปเดต' : 'Updating'}
                    </span>
                  )}

                  {/* Chevron Toggle */}
                  <span className="text-slate-400 hover:text-white transition-colors p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {/* Expanded View */}
              {isExpanded && (
                <div className="p-4 border-t border-white/5 bg-[#060a12]/60 space-y-4">
                  {/* Warning message if detected */}
                  {isDetected && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        {e.detectionReason
                          ? e.detectionReason
                              .replace(/Last banwave:\s*/i, 'โดนแบนเวฟล่าสุด ')
                              .replace(/June 1st/i, 'วันที่ 1 มิถุนายน')
                              .replace(/May 26/i, 'วันที่ 26 พฤษภาคม')
                              .replace(/March 6-18th/i, 'วันที่ 6-18 มีนาคม')
                          : 'ตรวจพบว่ามีความเสี่ยงต่อการแบน กรุณาหลีกเลี่ยงการใช้งานกับบัญชีหลัก'}
                      </span>
                    </div>
                  )}

                  {/* UNC stats and indicators grid */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs font-bold text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      sUNC: <span className="text-sky-400 font-extrabold">{e.suncPercentage || 0}%</span>
                    </div>
                    <div>
                      UNC: <span className="text-indigo-400 font-extrabold">{e.uncPercentage || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      Decompiler:
                      {e.decompiler ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      Multi-Instance:
                      {e.multiInject ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      Raknet Library:
                      {e.raknet ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  </div>

                  {/* Action buttons (Website, Discord) */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {e.websitelink && (
                      <a
                        href={e.websitelink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0e1626] hover:bg-[#142036] border border-white/10 text-slate-200 hover:text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>เว็บไซต์ทางการ</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}
                    {e.discordlink && (
                      <a
                        href={e.discordlink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <i className="fa-brands fa-discord text-sm text-indigo-400"></i>
                        <span>Discord ชุมชน</span>
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      </a>
                    )}
                  </div>

                  {e.updatedDate && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>อัปเดตเมื่อ: {formatDateByLang(e.updatedDate, lang)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 py-4 max-w-6xl mx-auto px-4 w-full">
      {/* Page Title Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <span>สถานะ</span> <span className="gtx">ตัวรัน</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-2 font-medium">
          ตรวจสอบสถานะการทำงานและความปลอดภัยของ Roblox Exploit &amp; Executor ทุกแพลตฟอร์มแบบเรียลไทม์
        </p>
      </div>

      {/* 1. Roblox Current Versions (Live Badge Cards) */}
      <div className="bg-[#09101c]/90 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
          <span className="w-2 h-4 bg-gradient-to-b from-sky-400 to-blue-600 rounded-full" />
          <span>{lang === 'th' ? 'เวอร์ชั่น Roblox ปัจจุบัน' : 'Current Roblox Versions'}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Windows Version */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/40 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">
                {lang === 'th' ? 'เวอร์ชั่น Windows' : 'Windows Version'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/30 px-2.5 py-1 rounded-lg border border-sky-500/20">
                {getRobloxVersion('windows')}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(getRobloxVersion('windows'))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={lang === 'th' ? 'คัดลอก' : 'Copy'}
              >
                {copiedText === getRobloxVersion('windows') ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Mac Version */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/40 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <Apple className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">
                {lang === 'th' ? 'เวอร์ชั่น Mac' : 'macOS Version'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/30 px-2.5 py-1 rounded-lg border border-sky-500/20">
                {getRobloxVersion('mac')}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(getRobloxVersion('mac'))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={lang === 'th' ? 'คัดลอก' : 'Copy'}
              >
                {copiedText === getRobloxVersion('mac') ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Android Version */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/40 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">
                {lang === 'th' ? 'เวอร์ชั่น Android' : 'Android Version'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/30 px-2.5 py-1 rounded-lg border border-sky-500/20">
                {getRobloxVersion('android')}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(getRobloxVersion('android'))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={lang === 'th' ? 'คัดลอก' : 'Copy'}
              >
                {copiedText === getRobloxVersion('android') ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* iOS Version */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-black/40 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">
                {lang === 'th' ? 'เวอร์ชั่น iOS' : 'iOS Version'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/30 px-2.5 py-1 rounded-lg border border-sky-500/20">
                {getRobloxVersion('ios')}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(getRobloxVersion('ios'))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title={lang === 'th' ? 'คัดลอก' : 'Copy'}
              >
                {copiedText === getRobloxVersion('ios') ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Refresh */}
      <div className="bg-[#09101c]/90 border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={lang === 'th' ? 'ค้นหาตัวรันสคริปต์...' : 'Search executors...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-sky-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all placeholder-slate-500 font-semibold"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="shrink-0 bg-[#0e1626] hover:bg-[#142036] text-sky-400 hover:text-sky-300 border border-white/10 hover:border-sky-500/30 font-bold p-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
            title={lang === 'th' ? 'ดึงข้อมูลล่าสุด' : 'Refresh data'}
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#09101c]/50 border border-white/5 rounded-2xl p-6 animate-pulse h-20" />
          ))}
        </div>
      ) : error && executors.length === 0 ? (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center space-y-3 shadow-lg">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-black text-rose-200">
            {lang === 'th' ? 'ไม่สามารถเชื่อมต่อข้อมูลสถานะได้' : 'Unable to connect to status feed'}
          </p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            type="button"
            onClick={fetchStatus}
            className="btn-blue px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      ) : filteredExecutors.length === 0 ? (
        <div className="bg-[#09101c]/80 border border-white/10 rounded-2xl p-12 text-center space-y-2 shadow-lg">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {lang === 'th' ? 'ไม่พบข้อมูลตัวรันสคริปต์ที่ตรงกับการค้นหา' : 'No executors found matching your search'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* A. Windows Category */}
          {(winExecutors.length > 0 || winExternals.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                  <Monitor className="w-5 h-5 text-sky-400" />
                  <span>{lang === 'th' ? 'ตัวรันบน Windows' : 'Windows Executors'}</span>
                </h3>
                <span className="count-badge">
                  {winExecutors.length + winExternals.length} {lang === 'th' ? 'รายการ' : 'Items'}
                </span>
              </div>

              {/* Windows EXECUTOR sub-section */}
              {winExecutors.length > 0 && (
                <div className="space-y-3">
                  <div className="text-center my-4 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-[#05070c] text-[10px] font-black text-sky-400 uppercase tracking-widest border border-sky-500/30 rounded-full">
                        INTERNAL EXECUTOR
                      </span>
                    </div>
                  </div>
                  {renderExecutorList(winExecutors)}
                </div>
              )}

              {/* Windows EXTERNAL sub-section */}
              {winExternals.length > 0 && (
                <div className="space-y-3">
                  <div className="text-center my-4 relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-[#05070c] text-[10px] font-black text-sky-400 uppercase tracking-widest border border-sky-500/30 rounded-full">
                        EXTERNAL
                      </span>
                    </div>
                  </div>
                  {renderExecutorList(winExternals)}
                </div>
              )}
            </div>
          )}

          {/* B. MacOS Category */}
          {macExecutors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                  <Apple className="w-5 h-5 text-sky-400" />
                  <span>{lang === 'th' ? 'ตัวรันบน macOS' : 'macOS Executors'}</span>
                </h3>
                <span className="count-badge">
                  {macExecutors.length} {lang === 'th' ? 'รายการ' : 'Items'}
                </span>
              </div>
              {renderExecutorList(macExecutors)}
            </div>
          )}

          {/* C. iOS Category */}
          {iosExecutors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <span>{lang === 'th' ? 'ตัวรันบน iOS' : 'iOS Executors'}</span>
                </h3>
                <span className="count-badge">
                  {iosExecutors.length} {lang === 'th' ? 'รายการ' : 'Items'}
                </span>
              </div>
              {renderExecutorList(iosExecutors)}
            </div>
          )}

          {/* D. Android Category */}
          {androidExecutors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <span>{lang === 'th' ? 'ตัวรันบน Android' : 'Android Executors'}</span>
                </h3>
                <span className="count-badge">
                  {androidExecutors.length} {lang === 'th' ? 'รายการ' : 'Items'}
                </span>
              </div>
              {renderExecutorList(androidExecutors)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
