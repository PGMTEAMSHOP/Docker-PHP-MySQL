'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import Swal from 'sweetalert2';
import { CreditCard, Coins, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

// Ultra-Premium Responsive SweetAlert2 Theme
const swalSuccess = (title, html) => {
  return Swal.fire({
    icon: 'success',
    title: title || 'เติมเงินสำเร็จ!',
    html: html,
    background: '#090d16',
    color: '#ffffff',
    confirmButtonColor: '#10b981',
    confirmButtonText: '<i class="fa-solid fa-check mr-1.5"></i> ตกลง',
    width: '92%',
    maxWidth: '430px',
    padding: '1.25rem',
    backdrop: `rgba(0, 0, 0, 0.85)`,
    customClass: {
      popup: 'border border-emerald-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl bg-[#090d16]/95 text-white',
      title: 'text-base sm:text-lg font-black text-white tracking-wide pt-1',
      htmlContainer: 'text-xs sm:text-sm text-slate-300 px-0 sm:px-2',
      confirmButton: 'w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs sm:text-sm text-slate-950 shadow-xl shadow-emerald-950/50 cursor-pointer bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 border-none transition-all active:scale-95'
    }
  });
};

// Helper for breakdown modal with ultra-sleek layout
const renderTopupSuccessHtml = (data) => {
  const amount = parseFloat(data.amount || 0);
  const feeRate = parseFloat(data.fee_rate || 0);
  const feeAmount = parseFloat(data.fee_amount || 0);
  const netAmount = parseFloat(data.net_amount || (amount - feeAmount));
  const bonus = parseFloat(data.bonus || 0);
  const total = parseFloat(data.total || (netAmount + bonus));

  return `
    <div class="text-center py-1 space-y-3">
      <p class="text-xs text-slate-400">ระบบได้เติมเครดิตเข้าสู่บัญชีของคุณเรียบร้อยแล้ว</p>
      
      <div class="p-4 rounded-2xl bg-gradient-to-b from-[#0e1726] to-[#080d17] border border-emerald-500/30 inline-block w-full shadow-inner space-y-1">
        <div class="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 font-mono tracking-tight">฿${total.toFixed(2)}</div>
        <div class="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1">
          <span>✨</span> เครดิตสุทธิที่เข้าบัญชี
        </div>
      </div>

      <div class="p-3 rounded-2xl bg-[#060911] border border-slate-800/80 text-left text-xs space-y-2 font-sans">
        <div class="flex justify-between items-center text-slate-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-money-bill-wave text-[10px] text-slate-500"></i> ยอดเงินที่โอน:</span>
          <span class="text-white font-mono font-bold">฿${amount.toFixed(2)}</span>
        </div>
        ${feeRate > 0 ? `
        <div class="flex justify-between items-center text-rose-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-percent text-[10px]"></i> หักค่าธรรมเนียม/ภาษี (${feeRate}%):</span>
          <span class="font-mono font-bold">-฿${feeAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        ${bonus > 0 ? `
        <div class="flex justify-between items-center text-amber-400">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-gift text-[10px]"></i> โบนัสพิเศษแถมฟรี:</span>
          <span class="font-mono font-bold">+฿${bonus.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="border-t border-slate-800 pt-2 flex justify-between items-center text-slate-200 font-bold">
          <span class="text-emerald-400 font-extrabold">เครดิตรวมทั้งหมด:</span>
          <span class="text-emerald-400 font-mono text-sm font-black">฿${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;
};

const swalError = (title, text) => {
  return Swal.fire({
    icon: 'error',
    title: title || 'เกิดข้อผิดพลาด',
    text: text,
    background: '#090d16',
    color: '#ffffff',
    confirmButtonColor: '#f43f5e',
    confirmButtonText: 'ตกลง',
    width: '92%',
    maxWidth: '430px',
    padding: '1.25rem',
    backdrop: `rgba(0, 0, 0, 0.85)`,
    customClass: {
      popup: 'border border-rose-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl bg-[#090d16]/95 text-white',
      title: 'text-base sm:text-lg font-black text-rose-400 tracking-wide pt-1',
      htmlContainer: 'text-xs sm:text-sm text-slate-300 px-0 sm:px-2',
      confirmButton: 'w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs sm:text-sm text-white shadow-xl shadow-rose-950/50 cursor-pointer bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 border-none transition-all active:scale-95'
    }
  });
};

const swalInfo = (title, text) => {
  return Swal.fire({
    icon: 'info',
    title: title || 'แจ้งเตือน',
    text: text,
    background: '#090d16',
    color: '#ffffff',
    confirmButtonColor: '#06b6d4',
    confirmButtonText: 'ตกลง',
    width: '92%',
    maxWidth: '430px',
    padding: '1.25rem',
    backdrop: `rgba(0, 0, 0, 0.85)`,
    customClass: {
      popup: 'border border-cyan-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl bg-[#090d16]/95 text-white',
      title: 'text-base sm:text-lg font-black text-cyan-400 tracking-wide pt-1',
      htmlContainer: 'text-xs sm:text-sm text-slate-300 px-0 sm:px-2',
      confirmButton: 'w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs sm:text-sm text-slate-950 shadow-xl shadow-cyan-950/50 cursor-pointer bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 border-none transition-all active:scale-95'
    }
  });
};

export default function Topup() {
  const { user, loading, showToast, checkSession } = useAuth();
  const router = useRouter();

  // Active Tab: 'promptpay' | 'wallet' | 'slip'
  const [activeTab, setActiveTab] = useState('promptpay');

  // Public site settings
  const [bankSettings, setBankSettings] = useState({
    promptpay_number: '217-8-18873-1',
    promptpay_name: 'นายวัชรพัฐ นะราวัฒน์',
    truewallet_phone: '',
    truewallet_name: 'นายวัชรพัฐ นะราวัฒน์',
    bank_name: 'ธนาคารกสิกรไทย',
    bank_account_number: '217-8-18873-1',
    bank_account_name: 'นายวัชรพัฐ นะราวัฒน์',
    promptpay_enabled: '1',
    truewallet_enabled: '1',
    slip_enabled: '1',
    promptpay_maintenance_enabled: '1',
    promptpay_maintenance_start: '23:30',
    promptpay_maintenance_end: '02:30',
    is_promptpay_in_maintenance: false,
    topup_fee_percent: 0,
    fee_promptpay_percent: 0,
    fee_truewallet_percent: 0,
    fee_slip_percent: 0,
    promptpay_decimal_min: 1,
    promptpay_decimal_max: 99,
    topup_tier1_min: 200,
    topup_tier1_rate: 10,
    topup_tier2_min: 500,
    topup_tier2_rate: 15,
    topup_tier3_min: 1000,
    topup_tier3_rate: 20,
  });

  // Check if current time is inside PromptPay bank maintenance window
  const checkIsPromptPayMaintenance = () => {
    if (bankSettings.promptpay_enabled === '0') return true;
    if (bankSettings.promptpay_maintenance_enabled !== '1') return false;
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = (bankSettings.promptpay_maintenance_start || '23:30').split(':').map(Number);
    const [eH, eM] = (bankSettings.promptpay_maintenance_end || '02:30').split(':').map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    if (startMin <= endMin) {
      return curMin >= startMin && curMin <= endMin;
    } else {
      return curMin >= startMin || curMin <= endMin;
    }
  };

  // History state
  const [history, setHistory] = useState([]);

  // -------------------------------------------------------------
  // TAB 1: PromptPay Random Decimal States
  // -------------------------------------------------------------
  const [ppAmount, setPpAmount] = useState('100');
  const [creatingPp, setCreatingPp] = useState(false);
  const [ppActiveTx, setPpActiveTx] = useState(null); // { id, amount, base_amount, qr_payload, qr_data_url, reference, promptpay_number, promptpay_name }
  const [ppTimeLeft, setPpTimeLeft] = useState(300); // 5 minutes in seconds
  const [ppChecking, setPpChecking] = useState(false);
  const [ppExpired, setPpExpired] = useState(false);
  const ppTimerRef = useRef(null);
  const ppPollRef = useRef(null);

  // Quick select amounts for PromptPay
  const quickAmounts = [50, 100, 300, 500, 1000, 2000];

  // -------------------------------------------------------------
  // TAB 2: TrueMoney Gift Voucher States
  // -------------------------------------------------------------
  const [voucherUrl, setVoucherUrl] = useState('');
  const [redeemingWallet, setRedeemingWallet] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: Slip Verify (QR Decoding) States
  // -------------------------------------------------------------
  const slipInputRef = useRef(null);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [verifyingSlip, setVerifyingSlip] = useState(false);
  const [slipProgress, setSlipProgress] = useState('');

  // -------------------------------------------------------------
  // TAB 4 & 5: Credit Card (Stripe) & Crypto States
  // -------------------------------------------------------------
  const [stripeAmount, setStripeAmount] = useState('100');
  const [submittingStripe, setSubmittingStripe] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState('100');
  const [cryptoCoin, setCryptoCoin] = useState('usdttrc20');
  const [submittingCrypto, setSubmittingCrypto] = useState(false);

  // -------------------------------------------------------------
  // Redeem Gift Code State
  // -------------------------------------------------------------
  const [redeemCodeVal, setRedeemCodeVal] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);

  // Check URL params for Stripe redirect callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'stripe_success') {
        swalSuccess('🎉 ชำระเงินสำเร็จ!', 'ระบบได้รับข้อมูลการชำระเงินผ่านบัตรเรียบร้อยแล้ว');
        window.history.replaceState({}, '', '/topup');
        checkSession();
        loadHistory();
      } else if (params.get('payment') === 'stripe_cancel') {
        swalInfo('ยกเลิกรายการ', 'คุณได้ยกเลิกการทำรายการชำระเงินผ่านบัตรเครดิต');
        window.history.replaceState({}, '', '/topup');
      }
    }
  }, []);

  // Protect route & load initial data
  useEffect(() => {
    if (!loading && !user) {
      showToast('⚠️ กรุณาเข้าสู่ระบบก่อนทำการเติมเงิน', 'error');
      router.push('/');
    } else if (user) {
      loadHistory();
      loadBankSettings();
    }
  }, [user, loading]);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/topup.php?action=history').then(r => r.json());
      if (res.status === 'success') {
        setHistory(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBankSettings = async () => {
    try {
      const res = await fetch('/api/topup.php?action=get_public_settings').then(r => r.json());
      if (res.status === 'success') {
        setBankSettings(res.data);
        // If promptpay is closed or in maintenance, auto switch to slip or wallet
        const isMaint = (res.data.promptpay_maintenance_enabled === '1' && res.data.is_promptpay_in_maintenance) || res.data.promptpay_enabled === '0';
        if (isMaint) {
          if (res.data.slip_enabled === '1') {
            setActiveTab('slip');
          } else if (res.data.truewallet_enabled === '1') {
            setActiveTab('wallet');
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // 1. PROMPTPAY HANDLERS
  // -------------------------------------------------------------
  const handleCreatePromptPay = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(ppAmount);
    if (isNaN(val) || val < 1) {
      swalError('ระบุจำนวนเงินไม่ถูกต้อง', 'กรุณาระบุจำนวนเงินขั้นต่ำ 1 บาท');
      return;
    }

    setCreatingPp(true);
    try {
      const res = await fetch('/api/topup.php?action=promptpay_create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val }),
      }).then(r => r.json());

      if (res.status === 'success') {
        const data = res.data;
        // Generate QR code data URL
        const qrUrl = await QRCode.toDataURL(data.qr_payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        setPpActiveTx({
          ...data,
          qr_data_url: qrUrl
        });
        setPpTimeLeft(data.expires_in || 300);
        setPpExpired(false);
        showToast('สร้าง QR Code พร้อมเพย์สำเร็จ! กรุณาโอนเงินตามยอดที่ระบุ', 'success');
      } else {
        swalError('ไม่สามารถทำรายการได้', res.message || 'เกิดข้อผิดพลาดในการสร้างคิวอาร์โค้ด');
      }
    } catch (err) {
      swalError('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้');
    } finally {
      setCreatingPp(false);
    }
  };

  // Timer & Polling for PromptPay
  useEffect(() => {
    if (!ppActiveTx || ppExpired) {
      if (ppTimerRef.current) clearInterval(ppTimerRef.current);
      if (ppPollRef.current) clearInterval(ppPollRef.current);
      return;
    }

    // 1. Countdown timer (1s)
    ppTimerRef.current = setInterval(() => {
      setPpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(ppTimerRef.current);
          clearInterval(ppPollRef.current);
          setPpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. Polling verify every 3.5s
    ppPollRef.current = setInterval(() => {
      checkPromptPayPayment(false);
    }, 3500);

    return () => {
      if (ppTimerRef.current) clearInterval(ppTimerRef.current);
      if (ppPollRef.current) clearInterval(ppPollRef.current);
    };
  }, [ppActiveTx, ppExpired]);

  const checkPromptPayPayment = async (manual = false) => {
    if (!ppActiveTx || ppChecking) return;
    if (manual) setPpChecking(true);

    try {
      const res = await fetch('/api/topup.php?action=promptpay_verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ppActiveTx.id,
          amount: ppActiveTx.amount,
        }),
      }).then(r => r.json());

      if (res.status === 'success') {
        if (ppTimerRef.current) clearInterval(ppTimerRef.current);
        if (ppPollRef.current) clearInterval(ppPollRef.current);
        setPpActiveTx(null);

        swalSuccess(
          '🎉 ได้รับยอดเงินเรียบร้อยแล้ว!',
          renderTopupSuccessHtml(res.data)
        );

        await checkSession();
        loadHistory();
      } else if (manual) {
        swalInfo('สถานะการชำระเงิน', res.message || 'ยังไม่พบยอดโอนเงินตามยอดที่ระบุ กรุณารอสักครู่หรือตรวจสอบการโอนอีกครั้ง');
      }
    } catch (err) {
      if (manual) swalError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตรวจสอบยอดเงิน');
    } finally {
      if (manual) setPpChecking(false);
    }
  };

  const handleCancelPromptPay = () => {
    if (ppTimerRef.current) clearInterval(ppTimerRef.current);
    if (ppPollRef.current) clearInterval(ppPollRef.current);
    setPpActiveTx(null);
    setPpExpired(false);
  };

  // -------------------------------------------------------------
  // 2. TRUEWALLET GIFT HANDLER
  // -------------------------------------------------------------
  const handleRedeemWallet = async (e) => {
    e.preventDefault();
    if (!voucherUrl.trim()) {
      swalError('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet');
      return;
    }

    setRedeemingWallet(true);
    try {
      const res = await fetch('/api/topup.php?action=wallet_redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_url: voucherUrl.trim(),
        }),
      }).then(r => r.json());

      if (res.status === 'success') {
        setVoucherUrl('');

        swalSuccess(
          '🎉 เปิดรับซองของขวัญสำเร็จ!',
          renderTopupSuccessHtml(res.data)
        );

        await checkSession();
        loadHistory();
      } else {
        swalError('เติมเงินไม่สำเร็จ', res.message || 'ลิงก์ซองของขวัญถูกใช้งานแล้ว หรือเกิดข้อผิดพลาดในการเคลม');
      }
    } catch (err) {
      swalError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อรับซองของขวัญ');
    } finally {
      setRedeemingWallet(false);
    }
  };

  // -------------------------------------------------------------
  // 3. SLIP VERIFY (QR DECODE) HANDLER
  // -------------------------------------------------------------
  const scanQrFromImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // First attempt standard
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          // Second attempt with both inversion
          if (!code || !code.data) {
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          }

          if (code && code.data) {
            resolve(code.data);
          } else {
            reject(new Error('ไม่พบ QR Code ในรูปภาพสลิป กรุณาใช้สลิปที่มี QR Code คมชัด'));
          }
        };
        img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการโหลดรูปภาพ'));
      reader.readAsDataURL(file);
    });
  };

  const handleSlipFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
    setVerifyingSlip(true);
    setSlipProgress('กำลังสแกนถอดรหัส QR Code จากสลิป...');

    try {
      // 1. Scan QR from image
      const qrText = await scanQrFromImage(file);
      setSlipProgress('สแกน QR Code สำเร็จ! กำลังส่งตรวจสอบยอดเงิน...');

      // 2. Call check-slip API
      const res = await fetch('/api/topup.php?action=check_slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrcode_text: qrText,
        }),
      }).then(r => r.json());

      if (res.status === 'success') {
        setSlipFile(null);
        setSlipPreview('');
        if (slipInputRef.current) slipInputRef.current.value = '';

        swalSuccess(
          '🎉 ตรวจสอบสลิปสำเร็จ!',
          renderTopupSuccessHtml(res.data)
        );

        await checkSession();
        loadHistory();
      } else {
        swalError('ตรวจสอบสลิปไม่สำเร็จ', res.message || 'สลิปไม่ถูกต้อง หรือไม่พบข้อมูลการโอนเงิน');
      }
    } catch (err) {
      swalError('ตรวจสอบสลิปไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
    } finally {
      setVerifyingSlip(false);
      setSlipProgress('');
    }
  };

  // -------------------------------------------------------------
  // 4. REDEEM GIFT CODE HANDLER
  // -------------------------------------------------------------
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!redeemCodeVal.trim()) return;

    setRedeemingCode(true);
    try {
      const response = await fetch('/api/topup.php?action=redeem_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: redeemCodeVal.trim(),
        }),
      });
      const res = await response.json();
      if (res.status === 'success') {
        setRedeemCodeVal('');
        swalSuccess('🎁 รับสิทธิ์สำเร็จ!', `<div class="text-center py-1 text-slate-300 text-xs sm:text-sm">${res.message}</div>`);
        await checkSession();
        loadHistory();
      } else {
        swalError('โค้ดรางวัลไม่ถูกต้อง', res.message || 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดรางวัล');
      }
    } catch (err) {
      swalError('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดรางวัล');
    } finally {
      setRedeemingCode(false);
    }
  };

  // -------------------------------------------------------------
  // 5. STRIPE & CRYPTO CHECKOUT HANDLERS (ปิดปรับปรุงชั่วคราว)
  // -------------------------------------------------------------
  const handleStripeCheckout = async (e) => {
    if (e) e.preventDefault();
    swalInfo(
      'ระบบปิดปรับปรุงชั่วคราว',
      'ระบบชำระเงินผ่านบัตรเครดิต / เดบิต (Stripe) ยังไม่เปิดให้บริการในขณะนี้ อยู่ระหว่างการเตรียมความพร้อม จะเปิดใช้งานเร็วๆ นี้ครับ'
    );
  };

  const handleCryptoCheckout = async (e) => {
    if (e) e.preventDefault();
    swalInfo(
      'ระบบปิดปรับปรุงชั่วคราว',
      'ระบบชำระเงินผ่านคริปโตเคอร์เรนซี (NOWPayments) ยังไม่เปิดให้บริการในขณะนี้ อยู่ระหว่างการเตรียมความพร้อม จะเปิดใช้งานเร็วๆ นี้ครับ'
    );
  };

  // Format seconds to mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 max-w-5xl mx-auto animate-fade-in">
      
      {/* Page Badge & Header */}
      <div className="relative flex items-center w-full">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-0" />
        <span className="relative z-10 inline-flex items-center gap-2 text-[10px] font-extrabold tracking-wider text-slate-300 uppercase bg-[#090d16] border border-cyan-500/30 px-4 py-1.5 rounded-full pr-5 shadow-lg shadow-cyan-950/40">
          <span className="text-cyan-400"><i className="fa-solid fa-bolt text-xs animate-pulse"></i></span>
          ศูนย์เติมเงินอัตโนมัติ 24 ชั่วโมง
        </span>
      </div>

      {/* Promotion banner for top-up bonuses */}
      {bankSettings.topup_tier1_min > 0 && (
        <section className="bg-gradient-to-r from-cyan-950/30 via-[#0c1322] to-blue-950/30 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300 flex items-center gap-2">
                <i className="fa-solid fa-gift text-cyan-400 animate-bounce"></i> โปรโมชั่นเติมเงินวันนี้ รับโบนัสเครดิตเพิ่มฟรี!
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                เติมเงินตามเป้าหมายเพื่อรับสิทธิ์โบนัสแถมสุดคุ้มเข้าระบบโดยอัตโนมัติ
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {bankSettings.topup_tier1_min > 0 && (
                <div className="bg-[#090d16]/90 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-center shrink-0 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">฿{bankSettings.topup_tier1_min}+</span>
                  <strong className="text-xs text-cyan-400 font-black">+{bankSettings.topup_tier1_rate}% เครดิต</strong>
                </div>
              )}
              {bankSettings.topup_tier2_min > 0 && (
                <div className="bg-[#090d16]/90 border border-blue-500/20 px-3 py-1.5 rounded-xl text-center shrink-0 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">฿{bankSettings.topup_tier2_min}+</span>
                  <strong className="text-xs text-blue-400 font-black">+{bankSettings.topup_tier2_rate}% เครดิต</strong>
                </div>
              )}
              {bankSettings.topup_tier3_min > 0 && (
                <div className="bg-[#090d16]/90 border border-rose-500/20 px-3 py-1.5 rounded-xl text-center shrink-0 shadow-sm">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">฿{bankSettings.topup_tier3_min}+</span>
                  <strong className="text-xs text-rose-400 font-black">+{bankSettings.topup_tier3_rate}% เครดิต</strong>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5 Payment Methods Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Method 1: PromptPay QR */}
        {(() => {
          const isPpMaint = checkIsPromptPayMaintenance();
          const isPpOff = bankSettings.promptpay_enabled === '0';
          return (
            <button
              type="button"
              onClick={() => setActiveTab('promptpay')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-3.5 cursor-pointer select-none ${
                activeTab === 'promptpay'
                  ? 'bg-gradient-to-br from-cyan-950/60 to-[#0c1322] border-cyan-500 shadow-lg shadow-cyan-950/30'
                  : 'bg-[#0c1017]/80 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                activeTab === 'promptpay' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800/80 text-cyan-400'
              }`}>
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">วิธีที่ 1 (อัตโนมัติ)</span>
                  {isPpOff ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">ปิดปรับปรุง</span>
                  ) : isPpMaint ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/30">ปิดรอบดึก</span>
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">เปิดใช้งาน</span>
                  )}
                </div>
                <strong className="text-xs sm:text-sm font-black text-white block truncate">QR PromptPay</strong>
                <span className="text-[11px] text-slate-400 font-semibold block truncate">สแกนจ่าย สุ่มทศนิยม</span>
              </div>
            </button>
          );
        })()}

        {/* Method 2: TrueMoney Wallet Gift */}
        {(() => {
          const isWalletOff = bankSettings.truewallet_enabled === '0';
          return (
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-3.5 cursor-pointer select-none ${
                activeTab === 'wallet'
                  ? 'bg-gradient-to-br from-amber-950/60 to-[#0c1322] border-amber-500 shadow-lg shadow-amber-950/30'
                  : 'bg-[#0c1017]/80 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                activeTab === 'wallet' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800/80 text-amber-400'
              }`}>
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">วิธีที่ 2 (อัตโนมัติ)</span>
                  {isWalletOff ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">ปิดปรับปรุง</span>
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">เปิดใช้งาน</span>
                  )}
                </div>
                <strong className="text-xs sm:text-sm font-black text-white block truncate">TrueMoney Gift</strong>
                <span className="text-[11px] text-slate-400 font-semibold block truncate">ซองของขวัญอั่งเปา</span>
              </div>
            </button>
          );
        })()}

        {/* Method 3: Slip Verify */}
        {(() => {
          const isSlipOff = bankSettings.slip_enabled === '0';
          return (
            <button
              type="button"
              onClick={() => setActiveTab('slip')}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-3.5 cursor-pointer select-none ${
                activeTab === 'slip'
                  ? 'bg-gradient-to-br from-emerald-950/60 to-[#0c1322] border-emerald-500 shadow-lg shadow-emerald-950/30'
                  : 'bg-[#0c1017]/80 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                activeTab === 'slip' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800/80 text-emerald-400'
              }`}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">วิธีที่ 3 (สแกนสลิป)</span>
                  {isSlipOff ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">ปิดปรับปรุง</span>
                  ) : (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">เปิดใช้งาน</span>
                  )}
                </div>
                <strong className="text-xs sm:text-sm font-black text-white block truncate">Slip Verify</strong>
                <span className="text-[11px] text-slate-400 font-semibold block truncate">เช็คสลิปผ่าน QR ในสลิป</span>
              </div>
            </button>
          );
        })()}

        {/* Method 4: Credit / Debit Card (Stripe) - ปิดไว้ก่อน */}
        <button
          type="button"
          onClick={() => setActiveTab('stripe')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-3.5 cursor-pointer select-none ${
            activeTab === 'stripe'
              ? 'bg-gradient-to-br from-indigo-950/60 to-[#0c1322] border-indigo-500 shadow-lg shadow-indigo-950/30'
              : 'bg-[#0c1017]/80 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            activeTab === 'stripe' ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20' : 'bg-slate-800/80 text-indigo-400'
          }`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">วิธีที่ 4 (สากล)</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">ปิดปรับปรุง</span>
            </div>
            <strong className="text-xs sm:text-sm font-black text-white block truncate">Credit / Debit</strong>
            <span className="text-[11px] text-slate-400 font-semibold block truncate">Visa, Mastercard</span>
          </div>
        </button>

        {/* Method 5: Cryptocurrency - ปิดไว้ก่อน */}
        <button
          type="button"
          onClick={() => setActiveTab('crypto')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-center gap-3.5 cursor-pointer select-none ${
            activeTab === 'crypto'
              ? 'bg-gradient-to-br from-amber-950/60 to-[#0c1322] border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-[#0c1017]/80 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            activeTab === 'crypto' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800/80 text-amber-400'
          }`}>
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">วิธีที่ 5 (คริปโต)</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">ปิดปรับปรุง</span>
            </div>
            <strong className="text-xs sm:text-sm font-black text-white block truncate">Crypto Assets</strong>
            <span className="text-[11px] text-slate-400 font-semibold block truncate">USDT, BTC, LTC</span>
          </div>
        </button>
      </div>

      {/* -------------------------------------------------------------
          MAIN WORKSPACE BY TAB
          ------------------------------------------------------------- */}

      {/* TAB 1: PROMPTPAY WITH RANDOM DECIMAL */}
      {activeTab === 'promptpay' && (
        <div className="bg-[#0c1017]/85 border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-qrcode text-cyan-400"></i> ชำระเงินผ่าน QR PromptPay (สุ่มทศนิยม)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ระบบจะสุ่มทศนิยมเพื่อตรวจจับยอดเงินเข้าบัญชีอัตโนมัติภายใน 5 นาที
              </p>
            </div>
            {ppActiveTx && !ppExpired && (
              <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-full self-start">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="text-xs font-black text-cyan-300 font-mono">
                  เวลาที่เหลือ: {formatTime(ppTimeLeft)}
                </span>
              </div>
            )}
          </div>

          {/* Maintenance Notice for PromptPay */}
          {bankSettings.promptpay_enabled === '0' ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400 mx-auto">
                <i className="fa-solid fa-ban"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  ช่องทาง QR PromptPay ปิดปรับปรุงชั่วคราว
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ขออภัยในความไม่สะดวก กรุณาเลือกชำระเงินผ่าน <b>Slip Verify (ตรวจสอบสลิป)</b> หรือ <b>TrueMoney Gift</b> แทนครับ
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('slip')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-receipt"></i> ไปที่ Slip Verify
                </button>
              </div>
            </div>
          ) : checkIsPromptPayMaintenance() ? (
            <div className="max-w-lg mx-auto py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400 mx-auto animate-pulse">
                <i className="fa-solid fa-moon"></i>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm sm:text-base font-black text-amber-400">
                  ระบบ PromptPay สุ่มทศนิยม ปิดปรับปรุงประจำวันช่วงดึก
                </h3>
                <p className="text-xs text-slate-300 font-semibold">
                  ช่วงเวลาปิดปรับปรุง: <span className="font-mono text-amber-300">{bankSettings.promptpay_maintenance_start || '23:30'} - {bankSettings.promptpay_maintenance_end || '02:30'} น.</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
                  เนื่องจากช่วงเวลานี้ระบบธนาคารปิดประมวลผล ส่งผลให้การตรวจจับยอดอัตโนมัติอาจล่าช้า เพื่อความรวดเร็ว <b>กรุณาโอนเงินเข้าบัญชีแล้วนำสลิปมาสแกนผ่าน Slip Verify (วิธีที่ 3) แทนครับ</b>
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('slip')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-receipt"></i> ใช้งาน Slip Verify (สแกนสลิปโอนเงิน)
                </button>
              </div>
            </div>
          ) : !ppActiveTx ? (
            /* Input Amount Form */
            <form onSubmit={handleCreatePromptPay} className="space-y-5 max-w-xl mx-auto py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 block">
                    ระบุจำนวนเงินที่ต้องการเติม (บาท)
                  </label>
                  {parseFloat(bankSettings.topup_fee_percent || 0) > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/30">
                      หักค่าธรรมเนียม/ภาษี {bankSettings.topup_fee_percent}%
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-cyan-400">฿</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="เช่น 100, 300, 500"
                    value={ppAmount}
                    onChange={(e) => setPpAmount(e.target.value)}
                    className="w-full bg-[#070b13] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none transition-colors font-black font-mono"
                    required
                  />
                </div>

                {parseFloat(bankSettings.fee_promptpay_percent || bankSettings.topup_fee_percent || 0) > 0 && (parseFloat(ppAmount) || 0) > 0 && (
                  <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 font-semibold">
                    <span>หัก {bankSettings.fee_promptpay_percent || bankSettings.topup_fee_percent}% (-฿{((parseFloat(ppAmount) * parseFloat(bankSettings.fee_promptpay_percent || bankSettings.topup_fee_percent)) / 100).toFixed(2)})</span>
                    <span>ได้รับสุทธิ: <strong className="text-emerald-400 font-mono font-bold">฿{(parseFloat(ppAmount) - ((parseFloat(ppAmount) * parseFloat(bankSettings.fee_promptpay_percent || bankSettings.topup_fee_percent)) / 100)).toFixed(2)}</strong></span>
                  </div>
                )}
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-bold block">หรือเลือกยอดเงินด่วน:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPpAmount(amt.toString())}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                        ppAmount === amt.toString()
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                          : 'bg-[#090d16] text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      ฿{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                <strong className="text-cyan-400 font-bold block flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-info"></i> คำแนะนำการชำระเงิน
                </strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  เมื่อกดสร้าง QR Code ระบบจะสร้างยอดเงินพร้อมเศษสตางค์ (เช่น ฿{ppAmount || '100'}.42) <b>กรุณาโอนเงินตามยอดที่มีทศนิยมให้ตรงเป๊ะ</b> เพื่อให้ระบบดึงข้อมูลและปรับยอดให้อัตโนมัติทันที
                </p>
              </div>

              <button
                type="submit"
                disabled={creatingPp}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <i className="fa-solid fa-qrcode"></i>
                {creatingPp ? 'กำลังสร้างคิวอาร์โค้ด...' : 'สร้างคิวอาร์โค้ดชำระเงิน'}
              </button>
            </form>
          ) : ppExpired ? (
            /* Expired Alert & Fallback to Method 3 */
            <div className="max-w-lg mx-auto py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400 mx-auto animate-pulse">
                <i className="fa-solid fa-hourglass-end"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  หมดเวลาการทำรายการ (เกิน 5 นาที)
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  หากคุณได้ทำการโอนเงินเรียบร้อยแล้วแต่ระบบยังไม่ปรับยอดอัตโนมัติ คุณสามารถนำรูปภาพสลิปไปตรวจสอบผ่านระบบ <b>Slip Verify (วิธีที่ 3)</b> ได้ทันที
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('slip');
                    handleCancelPromptPay();
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-receipt"></i> ไปที่ตรวจสอบสลิป (Slip Verify)
                </button>
                <button
                  type="button"
                  onClick={handleCancelPromptPay}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก / สร้างรายการใหม่
                </button>
              </div>
            </div>
          ) : (
            /* Active QR Display & Polling Screen */
            <div className="max-w-md mx-auto py-2 space-y-4 text-center">
              {/* Exact Amount Banner with 1-Click Copy */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-[#0a1120] to-blue-950/60 border border-cyan-500/40 shadow-xl space-y-2">
                <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                  ยอดเงินที่ต้องโอน (กรุณาโอนตรงเศษทศนิยมเป๊ะ)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 font-mono tracking-tight">
                  ฿ {parseFloat(ppActiveTx.amount).toFixed(2)}
                </div>
                
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(parseFloat(ppActiveTx.amount).toFixed(2));
                      showToast('📋 คัดลอกยอดเงินแล้ว: ' + parseFloat(ppActiveTx.amount).toFixed(2), 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-copy text-xs"></i> คัดลอกยอดเงิน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(ppActiveTx.promptpay_number || bankSettings.promptpay_number);
                      showToast('📋 คัดลอกเลขพร้อมเพย์แล้ว', 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-copy text-xs"></i> คัดลอกเลขบัญชี
                  </button>
                </div>

                <p className="text-[11px] text-amber-400 font-extrabold flex items-center justify-center gap-1 pt-1">
                  <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                  โอนเฉพาะยอด ฿{parseFloat(ppActiveTx.amount).toFixed(2)} เท่านั้น ห้ามปัดเศษ
                </p>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block border-4 border-cyan-500/30 max-w-full">
                <img
                  src={ppActiveTx.qr_data_url}
                  alt="PromptPay QR"
                  className="w-48 h-48 sm:w-60 sm:h-60 object-contain mx-auto block"
                />
                <div className="pt-2.5 border-t border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase block">
                    {ppActiveTx.promptpay_name || bankSettings.promptpay_name}
                  </span>
                  <span className="text-xs text-slate-800 font-black font-mono block">
                    {ppActiveTx.promptpay_number || bankSettings.promptpay_number}
                  </span>
                </div>
              </div>

              {/* Countdown & Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                  <span>ระบบกำลังรอตรวจจับยอดเงินอัตโนมัติ ({formatTime(ppTimeLeft)})</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-1000"
                    style={{ width: `${(ppTimeLeft / 300) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => checkPromptPayPayment(true)}
                  disabled={ppChecking}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <i className="fa-solid fa-rotate"></i>
                  {ppChecking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบยอดเงิน'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPromptPay}
                  className="w-full sm:w-auto bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ยกเลิกรายการ
                </button>
              </div>

              {/* Footer notice */}
              <p className="text-[10px] text-slate-500 font-semibold pt-1">
                *เมื่อโอนเงินสำเร็จ ยอดเงินและโบนัสจะเข้าสู่บัญชีของคุณทันทีโดยไม่ต้องแนบสลิป
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRUEMONEY WALLET GIFT (ซองอั่งเปา) */}
      {activeTab === 'wallet' && (
        <div className="bg-[#0c1017]/85 border border-amber-500/20 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-gift text-amber-500"></i> ชำระเงินผ่าน TrueMoney Wallet (ซองของขวัญอั่งเปา)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                สร้างซองของขวัญจากแอป TrueMoney Wallet แล้วนำลิงก์มากรอกเพื่อเติมเงินทันที
              </p>
            </div>
            {parseFloat(bankSettings.fee_truewallet_percent || bankSettings.topup_fee_percent || 0) > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/30 self-start sm:self-auto shrink-0">
                หักค่าธรรมเนียม {bankSettings.fee_truewallet_percent || bankSettings.topup_fee_percent}%
              </span>
            )}
          </div>

          {bankSettings.truewallet_enabled === '0' ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400 mx-auto">
                <i className="fa-solid fa-ban"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  ช่องทาง TrueMoney Wallet ปิดปรับปรุงชั่วคราว
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  กรุณาเลือกชำระเงินผ่านช่องทางอื่น เช่น <b>QR PromptPay</b> หรือ <b>Slip Verify</b> แทนครับ
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRedeemWallet} className="space-y-5 max-w-xl mx-auto py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 block">
                    ลิงก์ซองของขวัญ TrueMoney Wallet
                  </label>
                  {parseFloat(bankSettings.fee_truewallet_percent || bankSettings.topup_fee_percent || 0) > 0 && (
                    <span className="text-[10px] text-rose-400 font-bold">
                      (หัก {bankSettings.fee_truewallet_percent || bankSettings.topup_fee_percent}%)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://gift.truemoney.com/campaign/vouchers/..."
                  value={voucherUrl}
                  onChange={(e) => setVoucherUrl(e.target.value)}
                  className="w-full bg-[#070b13] border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors font-mono font-semibold placeholder-slate-600"
                  required
                />
              </div>

              {/* Instruction Steps */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-slate-300 space-y-2">
                <strong className="text-amber-400 font-bold block flex items-center gap-1.5">
                  <i className="fa-solid fa-list-ol"></i> วิธีสร้างซองของขวัญในแอป TrueMoney Wallet
                </strong>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed pl-1">
                  <li>เปิดแอป <b>TrueMoney Wallet</b> แล้วเลือกเมนู <b>"ส่งซองของขวัญ"</b></li>
                  <li>ใส่จำนวนเงินที่ต้องการเติม</li>
                  <li>เลือกประเภทการสุ่มเป็น <b>"แบ่งจำนวนเงินเท่ากัน"</b></li>
                  <li>ใส่จำนวนคนที่รับซองเป็น <b>"1 คน"</b></li>
                  <li>กดสร้างซองและคัดลอกลิงก์มากรอกในช่องด้านบน</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={redeemingWallet || !voucherUrl.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <i className="fa-solid fa-gift"></i>
                {redeemingWallet ? 'กำลังเปิดรับซองของขวัญ...' : 'เปิดรับซองและเติมเงินทันที'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: SLIP VERIFY (สแกน QR ในสลิป) */}
      {activeTab === 'slip' && (
        <div className="bg-[#0c1017]/85 border border-emerald-500/20 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <i className="fa-solid fa-receipt text-emerald-400"></i> ตรวจสอบสลิปโอนเงินผ่าน QR Code (Slip Verify)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                อัปโหลดภาพสลิปโอนเงินที่มี QR Code ระบบจะสแกนและตรวจสอบยอดเงินเข้าให้อัตโนมัติ
              </p>
            </div>
            {parseFloat(bankSettings.fee_slip_percent || bankSettings.topup_fee_percent || 0) > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/30 self-start sm:self-auto shrink-0">
                หักค่าธรรมเนียม {bankSettings.fee_slip_percent || bankSettings.topup_fee_percent}%
              </span>
            )}
          </div>

          {bankSettings.slip_enabled === '0' ? (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400 mx-auto">
                <i className="fa-solid fa-ban"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-rose-400">
                  ช่องทาง Slip Verify ปิดปรับปรุงชั่วคราว
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  กรุณาเลือกชำระเงินผ่านช่องทางอื่น เช่น <b>QR PromptPay</b> หรือ <b>TrueMoney Gift</b> แทนครับ
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-5 py-2">
              {/* Account Info Box with Copy Button */}
              <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/img/kbank_logo.png"
                    alt="Bank"
                    className="w-10 h-10 object-contain rounded-xl shrink-0"
                    onError={(e) => { e.target.src = 'https://img.icons8.com/color/96/bank.png'; }}
                  />
                  <div className="text-xs">
                    <strong className="text-slate-200 font-black block">{bankSettings.bank_name}</strong>
                    <span className="text-[11px] text-slate-400 block mt-0.5">ชื่อบัญชี: {bankSettings.bank_account_name}</span>
                    <span className="text-[11px] text-emerald-400 font-bold font-mono block mt-0.5">เลขบัญชี: {bankSettings.bank_account_number}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bankSettings.bank_account_number);
                    showToast('📋 คัดลอกเลขบัญชีธนาคารแล้ว', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
                >
                  <i className="fa-solid fa-copy text-xs"></i> คัดลอกเลขบัญชี
                </button>
              </div>

              {/* Hidden input */}
              <input
                type="file"
                ref={slipInputRef}
                onChange={handleSlipFileSelect}
                accept="image/*"
                className="hidden"
                disabled={verifyingSlip}
              />

              {/* Dropzone Upload */}
              <div
                onClick={() => !verifyingSlip && slipInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-[#090d16]/70 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 transition-all group relative overflow-hidden min-h-[180px]"
              >
                {slipPreview ? (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3">
                    <img src={slipPreview} alt="Slip Preview" className="max-h-36 object-contain rounded-lg shadow-md" />
                    {verifyingSlip && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-black text-emerald-300 animate-pulse">{slipProgress || 'กำลังตรวจสอบ...'}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl transition-colors">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-black text-slate-200 group-hover:text-emerald-300 transition-colors block">
                        คลิกเพื่ออัปโหลดรูปภาพสลิปโอนเงิน
                      </strong>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        รองรับไฟล์ภาพ JPG, PNG, WEBP ที่มี QR Code สลิปชัดเจน
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
                <strong className="text-emerald-400 font-bold block flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved"></i> ระบบความปลอดภัย Slip Verification
                </strong>
                <p className="text-slate-400 leading-relaxed">
                  ระบบจะถอดรหัส QR ภายในสลิปและยิงตรวจสอบความถูกต้องกับธนาคารโดยตรง สลิปที่ถูกต้องจะได้รับเครดิตเข้าทันที และสลิปเดิมจะไม่สามารถใช้ซ้ำได้
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CREDIT / DEBIT CARD (STRIPE) - ปิดปรับปรุง / COMING SOON */}
      {activeTab === 'stripe' && (
        <div className="bg-[#0c1017]/85 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" /> ชำระเงินผ่านบัตรเครดิต / เดบิต (Stripe Checkout)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                รองรับ Visa, Mastercard, JCB, UnionPay และ American Express ด้วยมาตรฐานความปลอดภัยระดับโลก
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              ปิดปรับปรุงชั่วคราว (เร็วๆ นี้)
            </span>
          </div>

          {/* Maintenance Notice Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-indigo-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <strong className="text-xs sm:text-sm font-black text-rose-300 block">
                  ช่องทางชำระเงินผ่านบัตรยังไม่เปิดให้บริการในขณะนี้
                </strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระบบได้เตรียมโครงสร้าง Stripe Payment Gateway ไว้พร้อมแล้วและจะเปิดให้ใช้งานเร็วๆ นี้ กรุณาเลือกชำระผ่าน QR PromptPay, TrueMoney Gift หรือ สแกนสลิป ก่อนนะครับ
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto space-y-5 py-2">
            {/* Quick Amount Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">เลือกจำนวนเงินที่ต้องการเติม</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[50, 100, 300, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStripeAmount(String(amt))}
                    className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      stripeAmount === String(amt)
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                        : 'bg-[#090d16] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">หรือระบุจำนวนเงินเอง (บาท)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">฿</span>
                <input
                  type="number"
                  min="20"
                  max="50000"
                  value={stripeAmount}
                  onChange={(e) => setStripeAmount(e.target.value)}
                  placeholder="20 - 50,000 บาท"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#070b13] border border-slate-800 focus:border-indigo-500 text-white font-mono text-sm focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">* ยอดชำระขั้นต่ำ 20 บาท</p>
            </div>

            {/* Accepted Cards Branding */}
            <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">บัตรที่รองรับ:</span>
              <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30 text-[10px]">VISA</span>
                <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-500/30 text-[10px]">Mastercard</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 text-[10px]">JCB</span>
                <span className="px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 text-[10px]">UnionPay</span>
              </div>
            </div>

            {/* Submit Button (Disabled with explanation) */}
            <button
              type="button"
              onClick={handleStripeCheckout}
              className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-300 font-black text-sm border border-slate-700/80 transition-all cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>ปิดปรับปรุงชั่วคราว (เร็วๆ นี้)</span>
            </button>

            {/* Security Footer */}
            <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>เข้ารหัสความปลอดภัย 256-Bit SSL ผ่าน Stripe PCI-DSS Level 1</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CRYPTOCURRENCY (NOWPAYMENTS) - ปิดปรับปรุง / COMING SOON */}
      {activeTab === 'crypto' && (
        <div className="bg-[#0c1017]/85 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" /> ชำระเงินด้วยคริปโตเคอร์เรนซี (Crypto Payment Gateway)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                รองรับการโอนเหรียญดิจิทัล USDT (TRC-20), Bitcoin, Litecoin, Ethereum ยืนยันบนบล็อกเชนอัตโนมัติ
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 shrink-0 self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              ปิดปรับปรุงชั่วคราว (เร็วๆ นี้)
            </span>
          </div>

          {/* Maintenance Notice Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-amber-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <strong className="text-xs sm:text-sm font-black text-amber-300 block">
                  ช่องทางคริปโตเคอร์เรนซียังไม่เปิดให้บริการในขณะนี้
                </strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ระบบได้เตรียมโครงสร้างการเชื่อมต่อเกตเวย์คริปโตไว้เรียบร้อยแล้วและจะเปิดให้ใช้งานเร็วๆ นี้ กรุณาเลือกชำระผ่าน QR PromptPay, TrueMoney Gift หรือ สแกนสลิป ก่อนนะครับ
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto space-y-5 py-2">
            {/* Coin selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">เลือกเหรียญที่ต้องการชำระ</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'usdttrc20', name: 'USDT (TRC-20)', sub: 'ค่าธรรมเนียมต่ำ แนะนำ' },
                  { id: 'btc', name: 'Bitcoin (BTC)', sub: 'เครือข่ายหลัก' },
                  { id: 'ltc', name: 'Litecoin (LTC)', sub: 'ยืนยันรวดเร็ว' },
                  { id: 'eth', name: 'Ethereum (ETH)', sub: 'ERC-20' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCryptoCoin(c.id)}
                    className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                      cryptoCoin === c.id
                        ? 'bg-amber-950/60 text-white border-amber-500 shadow-lg shadow-amber-950/30'
                        : 'bg-[#090d16] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <strong className="text-xs font-black block text-amber-400">{c.name}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{c.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">เลือกจำนวนเงินบาทที่ต้องการเติม</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[100, 300, 500, 1000, 3000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCryptoAmount(String(amt))}
                    className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      cryptoAmount === String(amt)
                        ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30'
                        : 'bg-[#090d16] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">หรือระบุจำนวนเงินเอง (บาท)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">฿</span>
                <input
                  type="number"
                  min="50"
                  max="100000"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder="50 - 100,000 บาท"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#070b13] border border-slate-800 focus:border-amber-500 text-white font-mono text-sm focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                ≈ ${(parseFloat(cryptoAmount || 0) / 35).toFixed(2)} USD (คำนวณตามอัตราแลกเปลี่ยนปัจจุบัน)
              </p>
            </div>

            {/* Submit Button (Disabled with explanation) */}
            <button
              type="button"
              onClick={handleCryptoCheckout}
              className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-300 font-black text-sm border border-slate-700/80 transition-all cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>ปิดปรับปรุงชั่วคราว (เร็วๆ นี้)</span>
            </button>

            {/* Security Footer */}
            <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ยืนยันธุรกรรมบน Blockchain โดยตรง ปลอดภัย ไร้ตัวกลาง</span>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Gift Code Section */}
      <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest block border-b border-slate-800 pb-2 flex items-center gap-2">
          <i className="fa-solid fa-gift text-amber-500 animate-bounce"></i> REDEEM GIFT CODE / กรอกโค้ดรางวัล
        </h3>
        
        <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
          หากคุณมีรหัสโค้ดของขวัญหรือรหัสเติมเงินฟรี สามารถป้อนเพื่อรับเครดิตเงินหรือเปิดใช้งานสิทธิ์สคริปต์ได้ทันที
        </p>

        <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="กรอกรหัสโค้ดของขวัญที่นี่..."
            value={redeemCodeVal}
            onChange={(e) => setRedeemCodeVal(e.target.value.toUpperCase())}
            className="bg-[#070b13]/80 border border-slate-800 focus:border-amber-500/80 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all placeholder-slate-650 flex-1 font-semibold font-mono"
          />
          <button
            type="submit"
            disabled={redeemingCode || !redeemCodeVal.trim()}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 disabled:opacity-50 text-slate-950 font-black px-6 py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer select-none shrink-0"
          >
            {redeemingCode ? 'Redeeming...' : 'เปิดรับรางวัล'}
          </button>
        </form>
      </div>

      {/* History Log section (Responsive Mobile Cards + Desktop Table) */}
      <div className="bg-[#0c1017]/85 border border-slate-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <i className="fa-solid fa-history text-cyan-400"></i> ประวัติการเติมเงินสะสม
        </h2>

        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-semibold text-xs rounded-xl border border-slate-800/60 bg-[#090d16]/60">
            ไม่พบประวัติการทำรายการเติมเงินของคุณ
          </div>
        ) : (
          <>
            {/* Mobile View: Stacked Cards (sm:hidden) */}
            <div className="sm:hidden space-y-2.5">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#090d16] border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <i className="fa-solid fa-receipt text-cyan-400 text-[10px]"></i>
                      {h.method}
                    </span>
                    {h.status === 'approved' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        ✓ สำเร็จ
                      </span>
                    ) : h.status === 'pending' ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                        ⌛ รอดำเนินการ
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        ✗ ไม่สำเร็จ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-850">
                    <span>{h.date || h.created_at}</span>
                    <div className="text-right">
                      <span className="font-black text-white font-mono text-xs">฿{parseFloat(h.amount).toFixed(2)}</span>
                      {parseFloat(h.bonus) > 0 && (
                        <span className="text-cyan-400 font-bold text-[10px] block">+ โบนัส ฿{parseFloat(h.bonus).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                    <th className="py-3 px-4">วันที่ทำรายการ</th>
                    <th className="py-3 px-4">ช่องทาง</th>
                    <th className="py-3 px-4">จำนวนเงิน</th>
                    <th className="py-3 px-4">โบนัสแถม</th>
                    <th className="py-3 px-4">สถานะรายการ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-slate-850/60 text-slate-300 hover:bg-[#0c1017]/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{h.date || h.created_at}</td>
                      <td className="py-3 px-4 font-bold">{h.method}</td>
                      <td className="py-3 px-4 font-black text-white">฿ {parseFloat(h.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 font-black text-cyan-400">฿ {parseFloat(h.bonus).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {h.status === 'approved' ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            ✓ สำเร็จ
                          </span>
                        ) : h.status === 'pending' ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full text-[10px] animate-pulse">
                            ⌛ รอดำเนินการ
                          </span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            ✗ ไม่สำเร็จ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

