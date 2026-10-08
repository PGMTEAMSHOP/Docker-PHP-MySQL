'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading, showToast, checkSession, loadScripts } = useAuth();
  const router = useRouter();

  // Active Admin Tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle

  // Stats States
  const [stats, setStats] = useState({
    total_sales: 0,
    total_scripts: 0,
    total_pending: 0,
    total_users: 0,
    recent_orders: [],
  });

  // Categories States
  const [adminCategories, setAdminCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  // Script Creator States
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptCat, setNewScriptCat] = useState('');
  const [newScriptPrice, setNewScriptPrice] = useState('');
  const [newScriptImage, setNewScriptImage] = useState('');
  const [newScriptDesc, setNewScriptDesc] = useState('');
  const [newScriptYoutube, setNewScriptYoutube] = useState('');
  const [newScriptFeatures, setNewScriptFeatures] = useState('');
  const [newScriptFile, setNewScriptFile] = useState('');
  const [newScriptStatus, setNewScriptStatus] = useState('undetected');
  const [newScriptEmoji, setNewScriptEmoji] = useState('📦');
  const [newScriptBanner, setNewScriptBanner] = useState('');
  const [newScriptPlaceIds, setNewScriptPlaceIds] = useState('');
  const [newScriptPlatform, setNewScriptPlatform] = useState('Windows 10 & 11');
  const [newScriptType, setNewScriptType] = useState('Script');
  const [newScriptDeliveryType, setNewScriptDeliveryType] = useState('program');
  const [editingScript, setEditingScript] = useState(null);
  
  // Plans template
  const [newScriptPlans, setNewScriptPlans] = useState([
    { name: '30 วัน (เช่า)', price: '' },
    { name: 'ถาวร (ตลอดชีพ)', price: '' },
  ]);

  // Scripts List
  const [adminScripts, setAdminScripts] = useState([]);

  // Stock Management States
  const [stocksList, setStocksList] = useState([]);
  const [stocksSummary, setStocksSummary] = useState([]);
  const [selectedStockProduct, setSelectedStockProduct] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');
  const [stockProductFilter, setStockProductFilter] = useState('all');

  // Orders & Claims Management States
  const [ordersList, setOrdersList] = useState([]);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [ordersDeliveryFilter, setOrdersDeliveryFilter] = useState('all');

  // Topups States
  const [pendingTopups, setPendingTopups] = useState([]);
  const [allTopupsList, setAllTopupsList] = useState([]);
  
  // Available images inside public/img
  const [availableImages, setAvailableImages] = useState([]);

  // Manual Keys Generator States
  const [genKeyScript, setGenKeyScript] = useState('');
  const [genKeyDuration, setGenKeyDuration] = useState('ถาวร (ตลอดชีพ)');
  const [generatedKey, setGeneratedKey] = useState('');

  // Site Settings States
  const [osxpayApiKey, setOsxpayApiKey] = useState('');
  const [osxpayWalletPhone, setOsxpayWalletPhone] = useState('');
  const [promptpayNumber, setPromptpayNumber] = useState('217-8-18873-1');
  const [promptpayName, setPromptpayName] = useState('นายวัชรพัฐ นะราวัฒน์');
  const [bankName, setBankName] = useState('ธนาคารกสิกรไทย');
  const [bankAccountNo, setBankAccountNo] = useState('217-8-18873-1');
  const [bankAccountName, setBankAccountName] = useState('นายวัชรพัฐ นะราวัฒน์');
  const [truewalletName, setTruewalletName] = useState('นายวัชรพัฐ นะราวัฒน์');
  const [promptpayEnabled, setPromptpayEnabled] = useState('1');
  const [truewalletEnabled, setTruewalletEnabled] = useState('1');
  const [slipEnabled, setSlipEnabled] = useState('1');
  const [promptpayMaintEnabled, setPromptpayMaintEnabled] = useState('1');
  const [promptpayMaintStart, setPromptpayMaintStart] = useState('23:30');
  const [promptpayMaintEnd, setPromptpayMaintEnd] = useState('02:30');
  const [topupFeePercent, setTopupFeePercent] = useState('0');
  const [feePromptpayPercent, setFeePromptpayPercent] = useState('0');
  const [feeTruewalletPercent, setFeeTruewalletPercent] = useState('0');
  const [feeSlipPercent, setFeeSlipPercent] = useState('0');
  const [promptpayDecimalMin, setPromptpayDecimalMin] = useState('1');
  const [promptpayDecimalMax, setPromptpayDecimalMax] = useState('99');
  const [topupTier1Min, setTopupTier1Min] = useState('200');
  const [topupTier1Rate, setTopupTier1Rate] = useState('10');
  const [topupTier2Min, setTopupTier2Min] = useState('500');
  const [topupTier2Rate, setTopupTier2Rate] = useState('15');
  const [topupTier3Min, setTopupTier3Min] = useState('1000');
  const [topupTier3Rate, setTopupTier3Rate] = useState('20');
  const [discordOrderWebhookUrl, setDiscordOrderWebhookUrl] = useState('');
  const [discordTicketUrl, setDiscordTicketUrl] = useState('https://discord.gg/BXM5WEkD3J');

  // User Management States
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUserModal, setEditingUserModal] = useState(null);
  const [editUserBalance, setEditUserBalance] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');

  // Keys Management States
  const [keysList, setKeysList] = useState([]);
  const [keysSearch, setKeysSearch] = useState('');

  // Discount Codes States
  const [discountCodes, setDiscountCodes] = useState([]);
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState('percent');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newDiscountMinPurchase, setNewDiscountMinPurchase] = useState('0');
  const [newDiscountMaxUses, setNewDiscountMaxUses] = useState('0');
  const [newDiscountExpiresAt, setNewDiscountExpiresAt] = useState('');

  // Redeem Codes States
  const [redeemCodes, setRedeemCodes] = useState([]);
  const [newRedeemCode, setNewRedeemCode] = useState('');
  const [newRedeemType, setNewRedeemType] = useState('balance');
  const [newRedeemValue, setNewRedeemValue] = useState('');
  const [newRedeemDuration, setNewRedeemDuration] = useState('ถาวร (ตลอดชีพ)');
  const [newRedeemMaxUses, setNewRedeemMaxUses] = useState('1');
  const [newRedeemExpiresAt, setNewRedeemExpiresAt] = useState('');

  // Announcements States
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnType, setNewAnnType] = useState('info');
  const [newAnnIsBanner, setNewAnnIsBanner] = useState('1');
  const [newAnnIsPopup, setNewAnnIsPopup] = useState('0');
  const [newAnnImageUrl, setNewAnnImageUrl] = useState('');
  const [newAnnIsActive, setNewAnnIsActive] = useState('1');
  const [newAnnLink, setNewAnnLink] = useState('');
  const [editingAnnId, setEditingAnnId] = useState(null);

  // Check admin rights
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        showToast('⚠️ ไม่อนุญาต! สำหรับผู้ดูแลระบบเท่านั้น', 'error');
        router.push('/');
      } else {
        loadAdminData();
      }
    }
  }, [user, loading]);

  const loadAdminData = async () => {
    await Promise.all([
      loadStats(),
      loadCategories(),
      loadPendingTopups(),
      loadScriptsList(),
      loadSettings(),
      loadImagesList(),
      loadUsersList(),
      loadKeysList(),
      loadAllTopups(),
      loadDiscountCodes(),
      loadRedeemCodes(),
      loadStocksList(),
      loadOrdersList(),
      loadAnnouncements(),
    ]);
  };

  const loadDiscountCodes = async () => {
    try {
      const res = await fetch('/api/admin.php?action=list_discount_codes').then(r => r.json());
      if (res.status === 'success') {
        setDiscountCodes(res.data);
      }
    } catch (e) {
      console.error('Error loadDiscountCodes:', e);
    }
  };

  const handleCreateDiscountCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin.php?action=create_discount_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newDiscountCode,
          type: newDiscountType,
          value: parseFloat(newDiscountValue),
          min_purchase: parseFloat(newDiscountMinPurchase || 0),
          max_uses: parseInt(newDiscountMaxUses || 0),
          expires_at: newDiscountExpiresAt || null,
        })
      }).then(r => r.json());

      if (res.status === 'success') {
        showToast('สร้างโค้ดส่วนลดสำเร็จ!', 'success');
        setNewDiscountCode('');
        setNewDiscountValue('');
        setNewDiscountMinPurchase('0');
        setNewDiscountMaxUses('0');
        setNewDiscountExpiresAt('');
        await loadDiscountCodes();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างโค้ดส่วนลด', 'error');
    }
  };

  const handleDeleteDiscountCode = async (id) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโค้ดส่วนลดนี้?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_discount_code&id=${id}`).then(r => r.json());
      if (res.status === 'success') {
        showToast('ลบโค้ดส่วนลดสำเร็จ!', 'success');
        await loadDiscountCodes();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบโค้ดส่วนลด', 'error');
    }
  };

  const loadRedeemCodes = async () => {
    try {
      const res = await fetch('/api/admin.php?action=list_redeem_codes').then(r => r.json());
      if (res.status === 'success') {
        setRedeemCodes(res.data);
      }
    } catch (e) {
      console.error('Error loadRedeemCodes:', e);
    }
  };

  const handleCreateRedeemCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin.php?action=create_redeem_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newRedeemCode,
          reward_type: newRedeemType,
          reward_value: parseFloat(newRedeemValue),
          duration: newRedeemType === 'script' ? newRedeemDuration : null,
          max_uses: parseInt(newRedeemMaxUses || 1),
          expires_at: newRedeemExpiresAt || null,
        })
      }).then(r => r.json());

      if (res.status === 'success') {
        showToast('สร้างโค้ดรางวัลสำเร็จ!', 'success');
        setNewRedeemCode('');
        setNewRedeemValue('');
        setNewRedeemDuration('ถาวร (ตลอดชีพ)');
        setNewRedeemMaxUses('1');
        setNewRedeemExpiresAt('');
        await loadRedeemCodes();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างโค้ดรางวัล', 'error');
    }
  };

  const handleDeleteRedeemCode = async (id) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโค้ดของขวัญนี้?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_redeem_code&id=${id}`).then(r => r.json());
      if (res.status === 'success') {
        showToast('ลบโค้ดรางวัลสำเร็จ!', 'success');
        await loadRedeemCodes();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบโค้ดรางวัล', 'error');
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin.php?action=stats').then((r) => r.json());
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error loadStats:', e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin.php?action=categories').then((r) => r.json());
      if (res.status === 'success') {
        setAdminCategories(res.data);
        if (res.data.length > 0 && !newScriptCat) {
          setNewScriptCat(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadImagesList = async () => {
    try {
      const res = await fetch('/api/admin.php?action=list_images').then((r) => r.json());
      if (res.status === 'success') {
        setAvailableImages(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadScriptsList = async () => {
    try {
      const res = await fetch(`/api/scripts.php?action=list&_t=${Date.now()}`).then((r) => r.json());
      if (res.status === 'success') {
        setAdminScripts(res.data.scripts);
        if (res.data.scripts.length > 0 && !genKeyScript) {
          setGenKeyScript(res.data.scripts[0].name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPendingTopups = async () => {
    try {
      const res = await fetch('/api/admin.php?action=pending_topups').then((r) => r.json());
      if (res.status === 'success') {
        setPendingTopups(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllTopups = async () => {
    try {
      const res = await fetch('/api/admin.php?action=all_topups').then((r) => r.json());
      if (res.status === 'success') {
        setAllTopupsList(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsersList = async (search = '') => {
    try {
      const res = await fetch(`/api/admin.php?action=users_list&search=${encodeURIComponent(search)}`).then((r) => r.json());
      if (res.status === 'success') {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadKeysList = async (search = '') => {
    try {
      const res = await fetch(`/api/admin.php?action=keys_list&search=${encodeURIComponent(search)}`).then((r) => r.json());
      if (res.status === 'success') {
        setKeysList(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin.php?action=list_announcements').then((r) => r.json());
      if (res.status === 'success') {
        setAnnouncementsList(res.data);
      }
    } catch (e) {
      console.error('Error loadAnnouncements:', e);
    }
  };



  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin.php?action=get_settings').then(r => r.json());
      if (res.status === 'success') {
        setOsxpayApiKey(res.data.osxpay_api_key || '');
        setOsxpayWalletPhone(res.data.osxpay_wallet_phone || '');
        setPromptpayNumber(res.data.promptpay_number || '');
        setPromptpayName(res.data.promptpay_name || '');
        setBankName(res.data.bank_name || 'ธนาคารกสิกรไทย');
        setBankAccountNo(res.data.bank_account_number || '217-8-18873-1');
        setBankAccountName(res.data.bank_account_name || 'นายวัชรพัฐ นะราวัฒน์');
        setTruewalletName(res.data.truewallet_name || 'นายวัชรพัฐ นะราวัฒน์');
        setPromptpayEnabled(res.data.promptpay_enabled !== undefined ? String(res.data.promptpay_enabled) : '1');
        setTruewalletEnabled(res.data.truewallet_enabled !== undefined ? String(res.data.truewallet_enabled) : '1');
        setSlipEnabled(res.data.slip_enabled !== undefined ? String(res.data.slip_enabled) : '1');
        setPromptpayMaintEnabled(res.data.promptpay_maintenance_enabled !== undefined ? String(res.data.promptpay_maintenance_enabled) : '1');
        setPromptpayMaintStart(res.data.promptpay_maintenance_start || '23:30');
        setPromptpayMaintEnd(res.data.promptpay_maintenance_end || '02:30');
        setTopupFeePercent(res.data.topup_fee_percent !== undefined ? String(res.data.topup_fee_percent) : '0');
        setFeePromptpayPercent(res.data.fee_promptpay_percent !== undefined ? String(res.data.fee_promptpay_percent) : (res.data.topup_fee_percent !== undefined ? String(res.data.topup_fee_percent) : '0'));
        setFeeTruewalletPercent(res.data.fee_truewallet_percent !== undefined ? String(res.data.fee_truewallet_percent) : (res.data.topup_fee_percent !== undefined ? String(res.data.topup_fee_percent) : '0'));
        setFeeSlipPercent(res.data.fee_slip_percent !== undefined ? String(res.data.fee_slip_percent) : (res.data.topup_fee_percent !== undefined ? String(res.data.topup_fee_percent) : '0'));
        setPromptpayDecimalMin(res.data.promptpay_decimal_min !== undefined ? String(res.data.promptpay_decimal_min) : '1');
        setPromptpayDecimalMax(res.data.promptpay_decimal_max !== undefined ? String(res.data.promptpay_decimal_max) : '99');
        setTopupTier1Min(res.data.topup_tier1_min || '200');
        setTopupTier1Rate(res.data.topup_tier1_rate || '10');
        setTopupTier2Min(res.data.topup_tier2_min || '500');
        setTopupTier2Rate(res.data.topup_tier2_rate || '15');
        setTopupTier3Min(res.data.topup_tier3_min || '1000');
        setTopupTier3Rate(res.data.topup_tier3_rate || '20');
        setDiscordOrderWebhookUrl(res.data.discord_order_webhook_url || '');
        setDiscordTicketUrl(res.data.discord_ticket_url || 'https://discord.gg/BXM5WEkD3J');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -----------------------
  // STOCK MANAGEMENT LOAD & ACTIONS
  // -----------------------
  const loadStocksList = async (productId = 0) => {
    try {
      const url = productId > 0 
        ? `/api/admin.php?action=list_stocks&product_id=${productId}`
        : '/api/admin.php?action=list_stocks';
      const res = await fetch(url).then(r => r.json());
      if (res.status === 'success') {
        setStocksList(res.data.stocks);
        setStocksSummary(res.data.summary);
        if (res.data.summary.length > 0 && !selectedStockProduct) {
          setSelectedStockProduct(res.data.summary[0].product_id);
        }
      }
    } catch (e) {
      console.error('Error loadStocksList:', e);
    }
  };

  const handleAddBulkStock = async (e) => {
    e.preventDefault();
    if (!selectedStockProduct || !bulkStockInput.trim()) {
      showToast('กรุณาเลือกสินค้าและกรอกข้อมูลสต็อกอย่างน้อย 1 ชิ้น', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin.php?action=add_bulk_stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(selectedStockProduct),
          items_text: bulkStockInput
        })
      }).then(r => r.json());

      if (res.status === 'success') {
        showToast(res.message, 'success');
        setBulkStockInput('');
        await loadStocksList();
        await loadScriptsList();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเติมสต็อก', 'error');
    }
  };

  const handleDeleteStock = async (id) => {
    if (!confirm('ยืนยันการลบสต็อกชิ้นนี้?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_stock&id=${id}`).then(r => r.json());
      if (res.status === 'success') {
        showToast('ลบสต็อกสำเร็จ', 'success');
        await loadStocksList();
        await loadScriptsList();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบสต็อก', 'error');
    }
  };

  const handleClearSoldStocks = async (productId = 0) => {
    if (!confirm('ยืนยันล้างข้อมูลสต็อกที่ขายแล้ว?')) return;
    try {
      const res = await fetch('/api/admin.php?action=clear_sold_stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      }).then(r => r.json());
      if (res.status === 'success') {
        showToast('ล้างสต็อกที่ขายแล้วสำเร็จ', 'success');
        await loadStocksList();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // -----------------------
  // ORDERS & CLAIMS LOAD & ACTIONS
  // -----------------------
  const loadOrdersList = async (search = ordersSearch, status = ordersStatusFilter, delivery = ordersDeliveryFilter) => {
    try {
      const url = `/api/admin.php?action=list_orders&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&delivery_type=${encodeURIComponent(delivery)}`;
      const res = await fetch(url).then(r => r.json());
      if (res.status === 'success') {
        setOrdersList(res.data);
      }
    } catch (e) {
      console.error('Error loadOrdersList:', e);
    }
  };

  const handleMarkOrderClaimed = async (orderId, status = 'completed') => {
    try {
      const res = await fetch('/api/admin.php?action=mark_order_claimed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status })
      }).then(r => r.json());
      if (res.status === 'success') {
        showToast('✅ ยืนยันการส่งมอบสินค้าสำเร็จแล้ว!', 'success');
        await loadOrdersList();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // ------------------
  // CATEGORIES ACTIONS
  // ------------------
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatImage) return;

    try {
      const endpoint = editingCategory 
        ? '/api/admin.php?action=edit_category' 
        : '/api/admin.php?action=add_category';

      const bodyData = {
        name: newCatName,
        name_en: newCatNameEn,
        image_url: newCatImage,
        parent_id: newCatParent !== '' ? parseInt(newCatParent) : null,
      };

      if (editingCategory) {
        bodyData.id = editingCategory.id;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      }).then((r) => r.json());

      if (res.status === 'success') {
        showToast(editingCategory ? 'แก้ไขหมวดหมู่สำเร็จ!' : 'เพิ่มหมวดหมู่สำเร็จ!', 'success');
        handleCancelCategoryEdit();
        await loadCategories();
        await loadStats();
        await loadScripts();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleStartCategoryEdit = (cat) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatNameEn(cat.name_en || '');
    setNewCatImage(cat.image_url);
    setNewCatParent(cat.parent_id || '');
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatNameEn('');
    setNewCatImage('');
    setNewCatParent('');
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('ยืนยันลบหมวดหมู่นี้? (สินค้าภายใต้หมวดหมู่นี้อาจถูกยกเลิกการจัดกลุ่ม)')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_category&id=${id}`).then((r) => r.json());
      if (res.status === 'success') {
        showToast('ลบหมวดหมู่เรียบร้อยแล้ว', 'success');
        await loadCategories();
        await loadStats();
        await loadScripts();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // ---------------
  // SCRIPTS ACTIONS
  // ---------------
  const handleAddPlanRow = () => {
    setNewScriptPlans((prev) => [...prev, { name: '', price: '' }]);
  };

  const handleRemovePlanRow = (idx) => {
    setNewScriptPlans((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePlanRowChange = (idx, field, value) => {
    setNewScriptPlans((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleAddScript = async (e) => {
    e.preventDefault();
    if (!newScriptName || newScriptPrice === '' || newScriptPrice === null || newScriptPrice === undefined || !newScriptCat) {
      showToast('กรุณากรอกข้อมูลหลักให้ครบถ้วน', 'error');
      return;
    }

    const validPlans = newScriptPlans
      .filter((p) => p.name.trim() !== '' && p.price !== '')
      .map((p) => ({ name: p.name.trim(), price: parseFloat(p.price) }));

    const plansJsonStr = validPlans.length > 0 ? JSON.stringify(validPlans) : '';

    try {
      const endpoint = editingScript 
        ? '/api/admin.php?action=edit_script' 
        : '/api/admin.php?action=add_script';

      const bodyData = {
        name: newScriptName,
        category_id: newScriptCat ? parseInt(newScriptCat) : (adminCategories.length > 0 ? adminCategories[0].id : 0),
        price: parseFloat(newScriptPrice),
        image_url: newScriptImage,
        description: newScriptDesc,
        youtube_url: newScriptYoutube,
        features: newScriptFeatures,
        script_file: newScriptFile,
        status: newScriptStatus,
        emoji: newScriptEmoji,
        banner_url: newScriptBanner,
        place_ids: newScriptPlaceIds,
        platform: newScriptPlatform,
        type: newScriptType,
        delivery_type: newScriptDeliveryType,
        plans: plansJsonStr,
      };

      if (editingScript) {
        bodyData.id = editingScript.id;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      }).then((r) => r.json());

      if (res.status === 'success') {
        showToast(editingScript ? 'แก้ไขสคริปต์สำเร็จ!' : 'เพิ่มสคริปต์วางจำหน่ายสำเร็จ!', 'success');
        handleCancelScriptEdit();
        await loadScriptsList();
        await loadStats();
        await loadScripts();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า', 'error');
    }
  };

  const handleStartScriptEdit = (s) => {
    setEditingScript(s);
    setNewScriptName(s.name);
    setNewScriptCat(s.category_id ? s.category_id.toString() : (adminCategories.length > 0 ? adminCategories[0].id.toString() : ''));
    setNewScriptPrice(s.price);
    setNewScriptImage(s.image_url || '');
    setNewScriptDesc(s.description || '');
    setNewScriptYoutube(s.youtube_url || '');
    setNewScriptFeatures(Array.isArray(s.features) ? s.features.join(',') : s.features || '');
    setNewScriptFile(s.script_file || '');
    setNewScriptStatus(s.status || 'undetected');
    setNewScriptEmoji(s.emoji || '📦');
    setNewScriptBanner(s.banner_url || '');
    setNewScriptPlaceIds(s.place_ids || '');
    setNewScriptPlatform(s.platform || 'Windows 10 & 11');
    let dType = s.delivery_type;
    const file = (s.script_file || '').toLowerCase();
    const isExe = s.type === 'EXE' || file.includes('.exe') || file.includes('.zip') || file.includes('.rar') || file.includes('.msi');
    if (dType === 'program' || isExe) {
      dType = 'program';
    } else if (dType === 'stock_ticket' || dType === 'stock_item') {
      // keep stock type
    } else {
      dType = 'script';
    }
    setNewScriptDeliveryType(dType);

    if (s.plans && Array.isArray(s.plans)) {
      setNewScriptPlans(s.plans);
    } else {
      setNewScriptPlans([
        { name: '30 วัน (เช่า)', price: '' },
        { name: 'ถาวร (ตลอดชีพ)', price: '' },
      ]);
    }
  };

  const handleCancelScriptEdit = () => {
    setEditingScript(null);
    setNewScriptName('');
    setNewScriptCat(adminCategories.length > 0 ? adminCategories[0].id : '');
    setNewScriptPrice('');
    setNewScriptImage('');
    setNewScriptDesc('');
    setNewScriptYoutube('');
    setNewScriptFeatures('');
    setNewScriptFile('');
    setNewScriptStatus('undetected');
    setNewScriptEmoji('📦');
    setNewScriptBanner('');
    setNewScriptPlaceIds('');
    setNewScriptPlatform('Windows 10 & 11');
    setNewScriptType('Script');
    setNewScriptDeliveryType('program');
    setNewScriptPlans([
      { name: '30 วัน (เช่า)', price: '' },
      { name: 'ถาวร (ตลอดชีพ)', price: '' },
    ]);
  };

  const handleDeleteScript = async (id) => {
    if (!confirm('ยืนยันลบสคริปต์สินค้าชิ้นนี้?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_script&id=${id}`).then((r) => r.json());
      if (res.status === 'success') {
        showToast('ลบสคริปต์สินค้าสำเร็จ!', 'success');
        await loadScriptsList();
        await loadStats();
        await loadScripts();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // --------------
  // USER ACTIONS
  // --------------
  const handleStartUserEdit = (u) => {
    setEditingUserModal(u);
    setEditUserBalance(u.balance);
    setEditUserRole(u.role);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUserModal) return;
    try {
      const res = await fetch('/api/admin.php?action=edit_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingUserModal.id,
          balance: parseFloat(editUserBalance),
          role: editUserRole,
        }),
      }).then((r) => r.json());

      if (res.status === 'success') {
        showToast('แก้ไขข้อมูลผู้ใช้สำเร็จ!', 'success');
        setEditingUserModal(null);
        await loadUsersList(userSearch);
        await loadStats();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('ยืนยันที่จะลบผู้ใช้งานรายนี้ออกจากระบบ?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=delete_user&user_id=${userId}`).then((r) => r.json());
      if (res.status === 'success') {
        showToast('ลบสมาชิกเรียบร้อยแล้ว', 'success');
        await loadUsersList(userSearch);
        await loadStats();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // ------------
  // KEYS ACTIONS
  // ------------
  const handleGenKeySubmit = async (e) => {
    e.preventDefault();
    if (!genKeyScript) return;

    try {
      const res = await fetch('/api/admin.php?action=gen_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script_name: genKeyScript,
          duration: genKeyDuration,
        }),
      }).then((r) => r.json());

      if (res.status === 'success') {
        setGeneratedKey(res.data.key_code);
        showToast('สร้างคีย์ลิขสิทธิ์สำเร็จ!', 'success');
        await loadScriptsList();
        await loadKeysList(keysSearch);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm('ยืนยันที่จะถอนการเปิดใช้งาน (Revoke) และลบคีย์นี้ออกจากระบบ?')) return;
    try {
      const res = await fetch(`/api/admin.php?action=revoke_key&key_id=${keyId}`).then((r) => r.json());
      if (res.status === 'success') {
        showToast('ยกเลิกคีย์สิทธิ์การใช้งานแล้ว', 'success');
        await loadKeysList(keysSearch);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // --------------
  // TOPUPS ACTIONS
  // --------------
  const handleApproveTopup = async (id) => {
    const verifiedAmountStr = prompt("กรุณาระบุจำนวนยอดโอนเงินจริง (บาท) ที่แอดมินตรวจสอบได้จากภาพสลิป:", "50");
    if (verifiedAmountStr === null) return;
    const verifiedAmount = parseFloat(verifiedAmountStr);
    if (isNaN(verifiedAmount) || verifiedAmount <= 0) {
      showToast("❌ ยอดเงินไม่ถูกต้อง", "error");
      return;
    }

    try {
      const res = await fetch('/api/admin.php?action=approve_topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount: verifiedAmount }),
      }).then((r) => r.json());
      if (res.status === 'success') {
        showToast('อนุมัติยอดโอนเงินสำเร็จ!', 'success');
        await loadPendingTopups();
        await loadAllTopups();
        await loadStats();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleRejectTopup = async (id) => {
    if (!confirm('ยืนยันปฏิเสธรายการโอนเงินนี้?')) return;
    try {
      const res = await fetch('/api/admin.php?action=reject_topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then((r) => r.json());
      if (res.status === 'success') {
        showToast('ปฏิเสธรายการสำเร็จแล้ว', 'info');
        await loadPendingTopups();
        await loadAllTopups();
        await loadStats();
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // ───────────────────────────────────────────────────
  // ANNOUNCEMENTS & CHANGELOGS ACTIONS
  // ───────────────────────────────────────────────────
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnTitle) return showToast('กรุณาระบุหัวข้อประกาศ', 'error');

    const payload = {
      id: editingAnnId,
      title: newAnnTitle,
      content: newAnnContent,
      type: newAnnType,
      is_banner: parseInt(newAnnIsBanner),
      is_popup: parseInt(newAnnIsPopup),
      image_url: newAnnImageUrl,
      is_active: parseInt(newAnnIsActive),
      banner_link: newAnnLink,
    };

    const action = editingAnnId ? 'edit_announcement' : 'add_announcement';
    try {
      const res = await fetch(`/api/admin.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.status === 'success') {
        showToast(res.message, 'success');
        setNewAnnTitle('');
        setNewAnnContent('');
        setNewAnnType('info');
        setNewAnnIsBanner('1');
        setNewAnnIsPopup('0');
        setNewAnnImageUrl('');
        setNewAnnIsActive('1');
        setNewAnnLink('');
        setEditingAnnId(null);
        await loadAnnouncements();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('ยืนยันลบประกาศนี้?')) return;
    try {
      const res = await fetch('/api/admin.php?action=delete_announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then((r) => r.json());

      if (res.status === 'success') {
        showToast(res.message, 'success');
        await loadAnnouncements();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };



  // --------------
  // SAVE SITE SETTINGS
  // --------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin.php?action=save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          osxpay_api_key: osxpayApiKey,
          osxpay_wallet_phone: osxpayWalletPhone,
          promptpay_number: promptpayNumber,
          promptpay_name: promptpayName,
          bank_name: bankName,
          bank_account_number: bankAccountNo,
          bank_account_name: bankAccountName,
          truewallet_name: truewalletName,
          promptpay_enabled: promptpayEnabled,
          truewallet_enabled: truewalletEnabled,
          slip_enabled: slipEnabled,
          promptpay_maintenance_enabled: promptpayMaintEnabled,
          promptpay_maintenance_start: promptpayMaintStart,
          promptpay_maintenance_end: promptpayMaintEnd,
          topup_fee_percent: topupFeePercent,
          fee_promptpay_percent: feePromptpayPercent,
          fee_truewallet_percent: feeTruewalletPercent,
          fee_slip_percent: feeSlipPercent,
          promptpay_decimal_min: promptpayDecimalMin,
          promptpay_decimal_max: promptpayDecimalMax,
          topup_tier1_min: topupTier1Min,
          topup_tier1_rate: topupTier1Rate,
          topup_tier2_min: topupTier2Min,
          topup_tier2_rate: topupTier2Rate,
          topup_tier3_min: topupTier3Min,
          topup_tier3_rate: topupTier3Rate,
          discord_order_webhook_url: discordOrderWebhookUrl,
          discord_ticket_url: discordTicketUrl,
        })
      }).then(r => r.json());

      if (res.status === 'success') {
        showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!', 'success');
        await loadSettings();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  // ----------------------------------------------------
  // SIDEBAR NAVIGATION LINKS
  // ----------------------------------------------------
  const navigationItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'news', label: 'ข่าวสารและประกาศ', icon: 'fa-bullhorn' },
    { id: 'stocks', label: 'Stock Manager', icon: 'fa-boxes-stacked' },
    { id: 'orders', label: 'Orders & Claims', icon: 'fa-ticket' },
    { id: 'users', label: 'Users', icon: 'fa-user-group' },
    { id: 'categories', label: 'Categories', icon: 'fa-folder-open' },
    { id: 'scripts', label: 'Products', icon: 'fa-gamepad' },
    { id: 'keys', label: 'Licenses & Keys', icon: 'fa-key' },
    { id: 'topups', label: 'Financial Audit', icon: 'fa-file-invoice-dollar' },
    { id: 'discounts', label: 'Discount Codes', icon: 'fa-tags' },
    { id: 'redeems', label: 'Redeem Codes', icon: 'fa-gift' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070b13] text-slate-100 font-sans antialiased">
      
      {/* ────────────────────────────────────────────────────────
          MOBILE TOP HEADER (Responsive layout toggle)
          ──────────────────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0a0f1d] border-b border-[#1b233a] z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50 animate-pulse"></span>
          <span className="font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase">OSX CMS</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-slate-400 hover:text-white p-1 text-lg transition-colors cursor-pointer"
        >
          <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────
          LEFT SIDEBAR (Dashdark X template style)
          ──────────────────────────────────────────────────────── */}
      <aside className={`w-full lg:w-64 bg-[#0a0f1d] border-r border-[#1b233a] flex flex-col justify-between shrink-0 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'block' : 'hidden lg:flex'
      } relative z-40`}>
        <div className="flex flex-col py-6">
          {/* Logo Brand Header */}
          <div className="px-6 pb-6 border-b border-[#1b233a]/60 hidden lg:flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/50 animate-pulse"></span>
            <span className="font-black text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase font-mono">
              OSX DASHBOARD
            </span>
          </div>

          {/* Search bar mock (from Dashdark template) */}
          <div className="px-4 py-4">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="w-full bg-[#070b13] border border-[#1b233a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-400 focus:outline-none placeholder-slate-600 select-none opacity-60"
              />
            </div>
          </div>

          {/* Menu links list */}
          <nav className="px-3 space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                    if (item.id === 'stocks') loadStocksList();
                    if (item.id === 'orders') loadOrdersList();
                    if (item.id === 'users') loadUsersList(userSearch);
                    if (item.id === 'keys') loadKeysList(keysSearch);
                    if (item.id === 'topups') {
                      loadPendingTopups();
                      loadAllTopups();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all border-l-3 text-left cursor-pointer ${
                    isActive
                      ? 'border-violet-500 bg-gradient-to-r from-violet-600/10 to-indigo-600/5 text-violet-300'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-[#12192c]/40'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} text-sm ${isActive ? 'text-violet-400' : 'text-slate-500'}`}></i>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-[#1b233a]/60 space-y-3 bg-[#080d19]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow shadow-violet-850">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 text-[10px] truncate">
              <strong className="text-slate-200 font-bold block leading-tight">{user.username}</strong>
              <span className="text-violet-400 uppercase tracking-widest text-[8px] font-black mt-0.5 block">ADMIN PANEL</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full bg-[#12192c] hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-[10px] border border-[#1b233a] transition-all"
          >
            <i className="fa-solid fa-arrow-left-long"></i> กลับหน้าร้านค้า
          </Link>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────
          MAIN WORKSPACE CONTENT PANELS
          ──────────────────────────────────────────────────────── */}
      <main className="flex-1 bg-[#070b13] p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
        
        {/* Top welcome status bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1b233a]/50 pb-6">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-white leading-tight">Welcome back, {user.username}</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold">
              ตรวจสอบสถิติร้านค้า จัดการใบเสิทธิ์ผู้ใช้ และตั้งค่าการเงิน
            </p>
          </div>
          {/* Mock Buttons from Template */}
          <div className="flex gap-2">
            <button className="bg-[#12192c] hover:bg-slate-800 text-slate-300 font-extrabold text-[10.5px] px-3.5 py-2 rounded-xl border border-[#1b233a] transition-all flex items-center gap-1 opacity-70 cursor-not-allowed">
              <i className="fa-solid fa-arrow-down-long text-[9.5px]"></i> Export data
            </button>
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-[10.5px] px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-950/20 flex items-center gap-1 opacity-70 cursor-not-allowed">
              Create report
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────
            TAB 1: OVERVIEW / DASHBOARD (High fidelity layout)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Template Metrics Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">ยอดเงินหมุนเวียน (Sales)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-white">฿{parseFloat(stats.total_sales).toFixed(2)}</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5 shrink-0">
                    <i className="fa-solid fa-arrow-trend-up text-[7px]"></i> 24.6%
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-violet-500/10 text-3xl shrink-0"><i className="fa-solid fa-coins"></i></div>
              </div>
              {/* Card 2 */}
              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">รายการสคริปต์ (Scripts)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-white">{stats.total_scripts} รายการ</span>
                  <span className="bg-violet-500/10 text-violet-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-violet-500/20 shrink-0">
                    Active
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-violet-500/10 text-3xl shrink-0"><i className="fa-solid fa-cube"></i></div>
              </div>
              {/* Card 3 */}
              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">สลิปที่รอตรวจสอบ (Slips)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-white">{stats.total_pending} รายการ</span>
                  {stats.total_pending > 0 ? (
                    <span className="bg-rose-500/20 text-rose-400 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse shrink-0">
                      ตรวจสอบ
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-500 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full border border-slate-700 shrink-0">
                      เคลียร์แล้ว
                    </span>
                  )}
                </div>
                <div className="absolute right-4 top-2 text-violet-500/10 text-3xl shrink-0"><i className="fa-solid fa-receipt"></i></div>
              </div>
              {/* Card 4 */}
              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-2">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">ผู้สมัครใช้ระบบ (Users)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-white">{stats.total_users} บัญชี</span>
                  <span className="bg-fuchsia-500/10 text-fuchsia-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-fuchsia-500/20 shrink-0">
                    +11.3%
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-violet-500/10 text-3xl shrink-0"><i className="fa-solid fa-user-group"></i></div>
              </div>
            </div>

            {/* Template Visual SVG Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SVG Line Graph: Revenue Chart */}
              <div className="lg:col-span-2 bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">รายได้หมุนเวียน 12 เดือนล่าสุด</span>
                    <strong className="text-base sm:text-lg font-black text-white">฿ {parseFloat(stats.total_sales).toFixed(2)}</strong>
                  </div>
                  <div className="bg-[#12192c] border border-[#1b233a] px-3 py-1 rounded-lg text-[9px] font-extrabold text-slate-400">
                    ม.ค. 2026 - ธ.ค. 2026
                  </div>
                </div>

                {/* SVG Graph path drawing */}
                <div className="relative w-full h-56 pt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#1b233a" strokeWidth="0.5" strokeDasharray="4" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#1b233a" strokeWidth="0.5" strokeDasharray="4" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="#1b233a" strokeWidth="0.5" strokeDasharray="4" />
                    
                    {/* Fill Area path under line */}
                    <path
                      d="M0,200 L50,160 L120,130 L180,145 L250,85 L320,120 L400,60 L450,90 L500,40 L500,200 Z"
                      fill="url(#chartGlow)"
                    />
                    
                    {/* Pure-CSS Line path */}
                    <path
                      d="M0,200 L50,160 L120,130 L180,145 L250,85 L320,120 L400,60 L450,90 L500,40"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Nodes indicator circles */}
                    <circle cx="250" cy="85" r="4.5" fill="#c084fc" stroke="#070b13" strokeWidth="1.5" />
                    <circle cx="400" cy="60" r="4.5" fill="#c084fc" stroke="#070b13" strokeWidth="1.5" />
                    <circle cx="500" cy="40" r="4.5" fill="#c084fc" stroke="#070b13" strokeWidth="1.5" />
                  </svg>
                  {/* Floating tooltip mock */}
                  <div className="absolute top-[35px] left-[45%] bg-[#12192c] border border-violet-500/40 rounded-xl px-2.5 py-1.5 text-[9px] font-black shadow-lg shadow-black">
                    <span className="text-slate-400 block font-bold">พ.ค. ยอดขายสูงสุด</span>
                    <strong className="text-violet-400 font-black">฿ {parseFloat(stats.total_sales * 0.45).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* SVG Bar Chart: Profit / Orders split */}
              <div className="lg:col-span-1 bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">กำไรจำแนกรายวัน</span>
                  <strong className="text-base sm:text-lg font-black text-white">฿ {parseFloat(stats.total_sales * 0.85).toFixed(2)}</strong>
                </div>

                {/* SVG Bar graphs */}
                <div className="relative w-full h-56 flex items-end justify-between pt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 150">
                    <defs>
                      <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d946ef" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    {/* Bars */}
                    <rect x="15" y="60" width="12" height="90" rx="3" fill="url(#barGlow)" />
                    <rect x="40" y="80" width="12" height="70" rx="3" fill="url(#barGlow)" />
                    <rect x="65" y="40" width="12" height="110" rx="3" fill="url(#barGlow)" />
                    <rect x="90" y="95" width="12" height="55" rx="3" fill="url(#barGlow)" />
                    <rect x="115" y="30" width="12" height="120" rx="3" fill="url(#barGlow)" />
                    <rect x="140" y="75" width="12" height="75" rx="3" fill="url(#barGlow)" />
                    <rect x="165" y="50" width="12" height="100" rx="3" fill="url(#barGlow)" />
                  </svg>
                  
                  {/* Axis labels */}
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-1 text-[8.5px] text-slate-600 font-extrabold font-mono pt-1">
                    <span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span><span>อา</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders details table (styled cleanly) */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                รายการสั่งซื้อสคริปต์ล่าสุดในระบบ
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-extrabold">
                      <th className="py-3.5 px-4">ลูกค้า</th>
                      <th className="py-3.5 px-4">รายการสินค้า</th>
                      <th className="py-3.5 px-4">ยอดเงิน</th>
                      <th className="py-3.5 px-4">วันทำรายการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 font-bold">ไม่พบข้อมูลใบสั่งซื้อ</td>
                      </tr>
                    ) : (
                      stats.recent_orders.map((o, idx) => (
                        <tr key={idx} className="border-b border-slate-850/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-200">{o.user}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">{o.script}</td>
                          <td className="py-3.5 px-4 font-black text-violet-400">฿ {parseFloat(o.price).toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-semibold">{o.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB: NEWS & CHANGELOG MANAGEMENT
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-8 animate-fade-in">
            {/* Announcement Banner Management */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1b233a] pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <i className="fa-solid fa-bullhorn text-violet-400"></i> จัดการป้ายประกาศข่าวสาร (Announcement Banners)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">สร้างป้ายประกาศที่จะแสดงด้านบนสุดของหน้าเว็บ</p>
                </div>
                {editingAnnId && (
                  <button
                    onClick={() => {
                      setEditingAnnId(null);
                      setNewAnnTitle('');
                      setNewAnnContent('');
                      setNewAnnType('info');
                      setNewAnnIsBanner('1');
                      setNewAnnIsPopup('0');
                      setNewAnnImageUrl('');
                      setNewAnnIsActive('1');
                      setNewAnnLink('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              {/* Add/Edit Announcement Form */}
              <form onSubmit={handleSaveAnnouncement} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#070b13]/60 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-slate-300 font-bold block">หัวข้อประกาศ *</label>
                  <input
                    type="text"
                    placeholder="เช่น 🚀 OSX HUB v2.5 อัปเดตสคริปต์ Blox Fruits ใหม่แล้ว!"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-slate-300 font-bold block">รายละเอียดเพิ่มเติม (แสดงซ่อนย่อย / ข้อความใน Popup)</label>
                  <input
                    type="text"
                    placeholder="เช่น เพิ่มฟีเจอร์ Auto Farm Mirage Island และเพิ่มระบบป้องกันหลุด"
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-bold block">URL รูปภาพประกอบ (สำหรับ Popup / ประกาศ)</label>
                    <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
                      💡 สเกลที่แนะนำ: 16:9 (1200 x 675 px หรือ 800 x 450 px)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น https://example.com/image.png หรือ /img/banner_promo.png"
                    value={newAnnImageUrl}
                    onChange={(e) => setNewAnnImageUrl(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                  {newAnnImageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 max-w-xs bg-slate-950 p-1">
                      <img src={newAnnImageUrl} alt="Preview" className="w-full h-auto max-h-32 object-contain rounded" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">ประเภทป้ายประกาศ</label>
                  <select
                    value={newAnnType}
                    onChange={(e) => setNewAnnType(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="info">📢 ทั่วไป (Info - ฟ้า)</option>
                    <option value="update">🚀 อัปเดตใหม่ (Update - เขียว)</option>
                    <option value="warning">⚠️ แจ้งเตือน (Warning - ส้ม)</option>
                    <option value="danger">🚨 สำคัญมาก (Alert - แดง)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">ลิงก์เมื่อคลิกป้าย/Popup (Optional)</label>
                  <input
                    type="text"
                    placeholder="เช่น /changelog หรือ /store"
                    value={newAnnLink}
                    onChange={(e) => setNewAnnLink(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">แสดงเป็น Banner แถบบน</label>
                  <select
                    value={newAnnIsBanner}
                    onChange={(e) => setNewAnnIsBanner(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="1">✅ แสดงเป็น Banner บนสุด</option>
                    <option value="0">❌ ไม่แสดงเป็น Banner</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">แสดงเป็น Popup (เด้งกลางจอ)</label>
                  <select
                    value={newAnnIsPopup}
                    onChange={(e) => setNewAnnIsPopup(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="1">✨ แสดงเป็น Popup Modal</option>
                    <option value="0">❌ ไม่แสดงเป็น Popup</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-bold block">สถานะการเปิดใช้งาน</label>
                  <select
                    value={newAnnIsActive}
                    onChange={(e) => setNewAnnIsActive(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  >
                    <option value="1">🟢 เปิดใช้งาน (Active)</option>
                    <option value="0">🔴 ปิดใช้งาน (Inactive)</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md"
                  >
                    {editingAnnId ? '💾 บันทึกการแก้ไขประกาศ' : '➕ เพิ่มประกาศใหม่'}
                  </button>
                </div>
              </form>

              {/* Announcements List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070b13] text-slate-400 uppercase text-[10px] font-bold border-b border-[#1b233a]">
                    <tr>
                      <th className="py-3 px-4">หัวข้อประกาศ</th>
                      <th className="py-3 px-4">ประเภท</th>
                      <th className="py-3 px-4 text-center">Banner</th>
                      <th className="py-3 px-4 text-center">Popup</th>
                      <th className="py-3 px-4 text-center">สถานะ</th>
                      <th className="py-3 px-4 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b233a]/60">
                    {announcementsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">
                          ยังไม่มีประกาศข่าวสาร
                        </td>
                      </tr>
                    ) : (
                      announcementsList.map((ann) => (
                        <tr key={ann.id} className="hover:bg-[#12192c]/30">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{ann.title}</span>
                            {ann.content && <span className="text-[11px] text-slate-400 block truncate max-w-md">{ann.content}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {ann.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ann.is_banner == 1 ? <span className="text-emerald-400 font-bold">YES</span> : <span className="text-slate-600">NO</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ann.is_popup == 1 ? <span className="text-cyan-400 font-bold">YES</span> : <span className="text-slate-600">NO</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ann.is_active == 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">Inactive</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingAnnId(ann.id);
                                setNewAnnTitle(ann.title);
                                setNewAnnContent(ann.content || '');
                                setNewAnnType(ann.type);
                                setNewAnnIsBanner(String(ann.is_banner));
                                setNewAnnIsPopup(String(ann.is_popup || 0));
                                setNewAnnImageUrl(ann.image_url || '');
                                setNewAnnIsActive(String(ann.is_active));
                                setNewAnnLink(ann.banner_link || '');
                              }}
                              className="text-violet-400 hover:text-violet-300 font-bold text-xs"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB: STOCK MANAGEMENT (จัดการสต็อกสินค้า)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'stocks' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stock Summary Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">สต็อกสินค้าพร้อมจำหน่าย</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400">
                    {stocksSummary.reduce((acc, curr) => acc + parseInt(curr.available_count || 0), 0)} ชิ้น
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    Available
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-emerald-500/10 text-3xl shrink-0"><i className="fa-solid fa-box-open"></i></div>
              </div>

              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">จำหน่ายแล้ว (ส่งมอบแล้ว)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-cyan-400">
                    {stocksSummary.reduce((acc, curr) => acc + parseInt(curr.sold_count || 0), 0)} ชิ้น
                  </span>
                  <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-cyan-500/20">
                    Sold Out
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-cyan-500/10 text-3xl shrink-0"><i className="fa-solid fa-receipt"></i></div>
              </div>

              <div className="bg-[#0e121b] border border-[#1b233a] p-5 rounded-2xl relative overflow-hidden space-y-1">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">จำนวนสินค้าประเภทสต็อก</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">
                    {adminScripts.filter(s => s.delivery_type === 'stock_ticket' || s.delivery_type === 'stock_item').length} รายการ
                  </span>
                  <span className="bg-violet-500/10 text-violet-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-violet-500/20">
                    Products
                  </span>
                </div>
                <div className="absolute right-4 top-2 text-violet-500/10 text-3xl shrink-0"><i className="fa-solid fa-boxes-stacked"></i></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Add Bulk Stock Form */}
              <div className="lg:col-span-1 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-plus-circle text-cyan-400"></i> นำเข้าสต็อกสินค้า (Bulk Stock)
                </h3>
                <form onSubmit={handleAddBulkStock} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">เลือกสินค้าที่ต้องการเติมสต็อก</label>
                    <select
                      value={selectedStockProduct}
                      onChange={(e) => setSelectedStockProduct(e.target.value)}
                      required
                      className="w-full bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {adminScripts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.delivery_type === 'stock_ticket' ? '🎫 Ticket' : s.delivery_type === 'stock_item' ? '📦 Stock' : '⚡ Key'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-400 font-bold block">ข้อมูลสต็อกสินค้า (1 บรรทัด = 1 ชิ้น)</label>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {bulkStockInput.split('\n').filter(l => l.trim()).length} รายการ
                      </span>
                    </div>
                    <textarea
                      rows="8"
                      placeholder={`ตัวอย่างเช่น:\nuser1:pass1\nuser2:pass2\nREDEEM-KEY-001\nREDEEM-KEY-002`}
                      value={bulkStockInput}
                      onChange={(e) => setBulkStockInput(e.target.value)}
                      required
                      className="w-full bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl p-3 text-white font-mono text-xs focus:outline-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      💡 เมื่อลูกค้าซื้อสินค้า ระบบจะตัดทีละ 1 บรรทัดส่งมอบให้ลูกค้าและบันทึกรหัส Claim Code ให้อัตโนมัติ
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-md shadow-cyan-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-boxes-stacked"></i> เติมสต็อกสินค้า
                  </button>
                </form>
              </div>

              {/* Right Column: Stock Items Table with filter */}
              <div className="lg:col-span-2 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-list-check text-cyan-400"></i> รายการสต็อกทั้งหมด ({stocksList.length})
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={stockProductFilter}
                      onChange={(e) => {
                        setStockProductFilter(e.target.value);
                        loadStocksList(parseInt(e.target.value) || 0);
                      }}
                      className="bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
                    >
                      <option value="all">สินค้าทั้งหมด</option>
                      {stocksSummary.map((sm) => (
                        <option key={sm.product_id} value={sm.product_id}>
                          {sm.product_name} (เหลือ {sm.available_count})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleClearSoldStocks(stockProductFilter === 'all' ? 0 : parseInt(stockProductFilter))}
                      className="bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                      title="ล้างสต็อกที่ขายแล้ว"
                    >
                      <i className="fa-solid fa-trash-can mr-1"></i> ล้างที่ขายแล้ว
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs max-h-[550px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0c1017] z-10">
                      <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                        <th className="py-3 px-4">สินค้า</th>
                        <th className="py-3 px-4">ข้อมูลสต็อก (Content)</th>
                        <th className="py-3 px-4">สถานะ</th>
                        <th className="py-3 px-4">ผู้ซื้อ / เคลม</th>
                        <th className="py-3 px-4">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocksList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-slate-500 font-bold">
                            ไม่มีรายการสต็อกสินค้าในระบบ
                          </td>
                        </tr>
                      ) : (
                        stocksList.map((st) => (
                          <tr key={st.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                              {st.product_name}
                            </td>
                            <td className="py-3 px-4 font-mono text-cyan-300 max-w-xs truncate select-all">
                              {st.content}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {st.status === 'available' ? (
                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  🟢 พร้อมจำหน่าย
                                </span>
                              ) : (
                                <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  🔴 ขายแล้ว (Order #{st.order_id})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                              {st.buyer_username ? (
                                <span className="font-semibold text-white">@{st.buyer_username}</span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteStock(st.id)}
                                className="text-rose-400 hover:bg-rose-650 hover:text-white border border-rose-950 bg-rose-950/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB: ORDERS & TICKET CLAIMS (รายการสั่งซื้อ & เคลม Ticket)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="ค้นหาด้วย Claim Code (OSX-CLAIM-...), ชื่อผู้ใช้, Discord ID..."
                  value={ordersSearch}
                  onChange={(e) => {
                    setOrdersSearch(e.target.value);
                    loadOrdersList(e.target.value, ordersStatusFilter, ordersDeliveryFilter);
                  }}
                  className="bg-[#0e121b] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none flex-1 font-semibold"
                />
                <button
                  onClick={() => loadOrdersList(ordersSearch, ordersStatusFilter, ordersDeliveryFilter)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                >
                  ค้นหา
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex gap-1.5 bg-[#0e121b] border border-[#1b233a] p-1 rounded-xl shrink-0">
                <button
                  onClick={() => {
                    setOrdersStatusFilter('all');
                    loadOrdersList(ordersSearch, 'all', ordersDeliveryFilter);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ordersStatusFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => {
                    setOrdersStatusFilter('pending_claim');
                    loadOrdersList(ordersSearch, 'pending_claim', ordersDeliveryFilter);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ordersStatusFilter === 'pending_claim'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟡 รอเคลม Ticket
                </button>
                <button
                  onClick={() => {
                    setOrdersStatusFilter('completed');
                    loadOrdersList(ordersSearch, 'completed', ordersDeliveryFilter);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ordersStatusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 ส่งของแล้ว
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-ticket text-cyan-400"></i> รายการสั่งซื้อ & การเคลม Ticket ({ordersList.length})
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3.5 px-4">Claim Code</th>
                      <th className="py-3.5 px-4">ลูกค้า (Discord ID)</th>
                      <th className="py-3.5 px-4">สินค้า</th>
                      <th className="py-3.5 px-4">ราคา</th>
                      <th className="py-3.5 px-4">ข้อมูลสต็อก (ID:Pass)</th>
                      <th className="py-3.5 px-4">สถานะ</th>
                      <th className="py-3.5 px-4">วันสั่งซื้อ / เคลม</th>
                      <th className="py-3.5 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-slate-500 font-bold">
                          ไม่พบรายการสั่งซื้อที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      ordersList.map((ord) => {
                        const isPending = ord.status === 'pending_claim';

                        return (
                          <tr key={ord.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded select-all">
                                  {ord.claim_code || `#${ord.id}`}
                                </span>
                                {ord.claim_code && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(ord.claim_code);
                                      showToast('คัดลอก Claim Code แล้ว', 'success');
                                    }}
                                    className="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors cursor-pointer"
                                    title="คัดลอก Claim Code"
                                  >
                                    <i className="fa-solid fa-copy text-[10px]"></i>
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-bold text-white block">@{ord.username}</span>
                                {ord.discord_id ? (
                                  <span className="text-[10px] text-[#5865F2] font-mono font-bold flex items-center gap-1">
                                    <i className="fa-brands fa-discord text-[9px]"></i> {ord.discord_id}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-600">ไม่มี Discord ID</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-200">{ord.script_name}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  ord.delivery_type === 'stock_ticket'
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    : ord.delivery_type === 'stock_item'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {ord.delivery_type === 'stock_ticket' ? '🎫 Ticket' : ord.delivery_type === 'stock_item' ? '📦 Stock' : '⚡ Key'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                              ฿ {parseFloat(ord.price).toFixed(2)}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300 max-w-[180px] truncate select-all">
                              {ord.stock_data || ord.key_str || '-'}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                  🟡 รอเคลม Ticket
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  <i className="fa-solid fa-check text-[9px]"></i> 🟢 ส่งของแล้ว
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-[10.5px] text-slate-400 whitespace-nowrap">
                              <div>{ord.created_at}</div>
                              {ord.claimed_at && (
                                <span className="text-[9.5px] text-emerald-500 block">
                                  เคลมเมื่อ: {ord.claimed_at}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isPending ? (
                                <button
                                  onClick={() => handleMarkOrderClaimed(ord.id, 'completed')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-emerald-950/20 flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="fa-solid fa-check"></i> ยืนยันส่งของ
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkOrderClaimed(ord.id, 'pending_claim')}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer"
                                  title="เปลี่ยนกลับเป็นรอเคลม"
                                >
                                  ↩️ รอเคลม
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 2: USERS LIST (Admin CMS layout)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ค้นหาสมาชิกด้วยชื่อ Username หรืออีเมล..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  loadUsersList(e.target.value);
                }}
                className="bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none flex-1 font-semibold"
              />
              <button
                onClick={() => loadUsersList(userSearch)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
              >
                ค้นหา
              </button>
            </div>

            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-users text-violet-400"></i> รายชื่อสมาชิกในร้านทั้งหมด
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">ชื่อผู้ใช้</th>
                      <th className="py-3.5 px-4">อีเมล</th>
                      <th className="py-3.5 px-4">ยอดเงิน</th>
                      <th className="py-3.5 px-4">สิทธิ์การใช้งาน</th>
                      <th className="py-3.5 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold">ไม่พบผู้ใช้ที่ค้นหา</td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="border-b border-slate-850/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono">{u.id}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{u.username}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{u.email}</td>
                          <td className="py-3.5 px-4 font-bold text-violet-400">฿ {parseFloat(u.balance).toFixed(2)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                              u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 flex items-center gap-2">
                            <button
                              onClick={() => handleStartUserEdit(u)}
                              className="text-violet-400 hover:bg-violet-950/20 border border-violet-850 bg-violet-950/5 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              แก้ไขสิทธิ์/เงิน
                            </button>
                            <button
                              disabled={u.id === user.id}
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-rose-400 hover:bg-rose-650 hover:text-white border border-rose-950 bg-rose-950/10 px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit User Modal Overlay */}
            {editingUserModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-6 w-full max-w-md space-y-4 animate-scale-up">
                  <div>
                    <h3 className="text-sm font-black text-white">👤 ปรับยอดเงิน & สิทธิ์แอดมิน</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">ผู้ใช้งาน: <b className="text-violet-400">{editingUserModal.username}</b></p>
                  </div>
                  <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">ยอดเงินกระเป๋า (บาท)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editUserBalance}
                        onChange={(e) => setEditUserBalance(e.target.value)}
                        className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">ระดับสิทธิ์บทบาทผู้ใช้ (Role)</label>
                      <select
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value)}
                        className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                      >
                        <option value="user">User (ผู้ซื้อทั่วไป)</option>
                        <option value="admin">Admin (ผู้ดูแลระบบหลังบ้าน)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        บันทึกการแก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserModal(null)}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 3: CATEGORIES SETTINGS (Left form, right table layout)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Form */}
            <div className="lg:col-span-1 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-circle-plus text-violet-400"></i> {editingCategory ? `แก้ไขหมวดหมู่ (ID: ${editingCategory.id})` : 'เพิ่มหมวดหมู่สินค้าใหม่'}
              </h3>
              <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ชื่อหมวดหมู่สินค้า (ภาษาไทย)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ROBLOX, รวมสคริปต์ฟรี"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ชื่อหมวดหมู่สินค้า (ภาษาอังกฤษ - English Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. ROBLOX, Free Scripts"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">เลือกภาพปกหมวดหมู่ (จากโฟลเดอร์ public/img)</label>
                  <select
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="">-- เลือกไฟล์รูปภาพในเครื่อง --</option>
                    {availableImages.map((img) => (
                      <option key={img} value={`img/${img}`}>{img}</option>
                    ))}
                    {newCatImage && !availableImages.some(x => `img/${x}` === newCatImage) && (
                      <option value={newCatImage}>{newCatImage} (ลิงก์ปัจจุบัน)</option>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-0.5">โยนไฟล์ภาพใส่ใน <b>public/img/</b> จากนั้นกดเลือกได้ที่นี่</span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ตั้งค่าเป็นหมวดหมู่ย่อยภายใต้</label>
                  <select
                    value={newCatParent}
                    onChange={(e) => setNewCatParent(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="">-- ไม่ระบุ (กำหนดให้เป็นหมวดหมู่หลัก) --</option>
                    {adminCategories.filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 cursor-pointer"
                  >
                    {editingCategory ? 'บันทึกการแก้ไข' : 'บันทึกหมวดหมู่ใหม่'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-folder text-violet-400"></i> รายการหมวดหมู่สินค้าทั้งหมด
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">ชื่อหมวดหมู่</th>
                      <th className="py-3 px-4">ระดับชั้นสิทธิ์</th>
                      <th className="py-3 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminCategories.map((c) => {
                      const parent = adminCategories.find((p) => p.id == c.parent_id);
                      return (
                        <tr key={c.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3 px-4 font-mono">{c.id}</td>
                          <td className="py-3 px-4 font-bold text-white">
                            {c.name} {c.name_en ? <span className="text-[10px] text-slate-500 font-normal">({c.name_en})</span> : null}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-400">
                            {parent ? (
                              <span>ย่อยของ: <b className="text-violet-400 font-bold">{parent.name}</b></span>
                            ) : (
                              <span className="text-violet-400 font-bold">หมวดหมู่หลัก (Root)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <button
                              onClick={() => handleStartCategoryEdit(c)}
                              className="text-violet-400 hover:bg-violet-950/20 border border-violet-850 bg-violet-950/5 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="text-rose-400 hover:bg-rose-650 hover:text-white border border-rose-950 bg-rose-950/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 4: SCRIPTS/PRODUCT CMS
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'scripts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Form layout */}
            <div className="lg:col-span-1 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-circle-plus text-violet-400"></i> {editingScript ? `แก้ไขสคริปต์ (ID: ${editingScript.id})` : 'นำเข้าสินค้าสคริปต์ใหม่'}
              </h3>
              <form onSubmit={handleAddScript} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ชื่อสคริปต์สินค้า</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น FiveM Auto Farm"
                    value={newScriptName}
                    onChange={(e) => setNewScriptName(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">เลือกรูปภาพไอคอนสินค้า (Square Icon)</label>
                  <select
                    value={newScriptImage}
                    onChange={(e) => setNewScriptImage(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="">-- เลือกไฟล์รูปภาพในเครื่อง --</option>
                    {availableImages.map((img) => (
                      <option key={img} value={`img/${img}`}>{img}</option>
                    ))}
                    {newScriptImage && !availableImages.some(x => `img/${x}` === newScriptImage) && (
                      <option value={newScriptImage}>{newScriptImage} (ลิงก์ปัจจุบัน)</option>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-0.5">โยนไฟล์ภาพใส่ใน <b>public/img/</b> จากนั้นเลือกได้ที่นี่</span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">หมวดหมู่ของสินค้า</label>
                  <select
                    value={newScriptCat}
                    onChange={(e) => setNewScriptCat(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    {adminCategories.map((c) => {
                      const parent = adminCategories.find((p) => p.id == c.parent_id);
                      const prefix = parent ? `${parent.name} > ` : '';
                      return (
                        <option key={c.id} value={c.id}>
                          {prefix}{c.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ราคาเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    required
                    placeholder="เช่น 150"
                    value={newScriptPrice}
                    onChange={(e) => setNewScriptPrice(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">เลือกรูปภาพแบนเนอร์สินค้า (Banner Image)</label>
                  <select
                    value={newScriptBanner}
                    onChange={(e) => setNewScriptBanner(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="">-- เลือกไฟล์รูปภาพในเครื่อง --</option>
                    {availableImages.map((img) => (
                      <option key={img} value={`img/${img}`}>{img}</option>
                    ))}
                    {newScriptBanner && !availableImages.some(x => `img/${x}` === newScriptBanner) && (
                      <option value={newScriptBanner}>{newScriptBanner} (ลิงก์ปัจจุบัน)</option>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-0.5">โยนไฟล์ภาพใส่ใน <b>public/img/</b> จากนั้นเลือกได้ที่นี่</span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ลิงก์ดาวน์โหลดโปรแกรม / ชื่อไฟล์สคริปต์ (Download Link / Script File)</label>
                  <input
                    type="text"
                    placeholder="เช่น https://drive.google.com/... หรือ ลิงก์ .exe/.zip หรือ Evade.lua"
                    value={newScriptFile}
                    onChange={(e) => setNewScriptFile(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    * สำหรับโปรแกรม: ใส่ลิงก์ดาวน์โหลดไฟล์ (Google Drive, Mega, Mediafire ฯลฯ) ลูกค้าจะได้รับปุ่มดาวน์โหลดทันทีหลังสั่งซื้อ
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">เกม Place ID ที่อนุญาตให้รัน (คั่นด้วย `,` เช่น 9872472334)</label>
                  <input
                    type="text"
                    placeholder="เช่น 9872472334, 10324346056"
                    value={newScriptPlaceIds}
                    onChange={(e) => setNewScriptPlaceIds(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">แพลตฟอร์มที่รองรับ (Platform)</label>
                  <input
                    type="text"
                    placeholder="เช่น Windows 10 & 11, Android, iOS"
                    value={newScriptPlatform}
                    onChange={(e) => setNewScriptPlatform(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">
                    รูปแบบสินค้า / การส่งมอบ (Delivery Mode)
                  </label>
                  <select
                    value={newScriptDeliveryType}
                    onChange={(e) => setNewScriptDeliveryType(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="program">💻 โปรแกรม / ซอฟต์แวร์ (Downloadable Program / App)</option>
                    <option value="script">⚡ สคริปต์เกม (Game Script / Lua Loader)</option>
                    <option value="stock_item">📦 สินค้าสต็อกข้อความ/ไอดี (ส่งมอบข้อมูลอัตโนมัติ)</option>
                    <option value="stock_ticket">🎫 รับสินค้าใน Discord Ticket (เปิด Ticket เคลม)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ประเภทสินค้า (Type)</label>
                  <input
                    type="text"
                    placeholder="เช่น Script, Executor, Bypass, Account"
                    value={newScriptType}
                    onChange={(e) => setNewScriptType(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">สถานะความปลอดภัยสคริปต์ (Status)</label>
                  <select
                    value={newScriptStatus}
                    onChange={(e) => setNewScriptStatus(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  >
                    <option value="undetected">Undetected (สีเขียว - ปลอดภัยใช้งานได้)</option>
                    <option value="detected">Detected (สีแดง - ไม่ปลอดภัย ปิดใช้งาน)</option>
                    <option value="updating">Updating (สีเหลือง - กำลังอัปเดตระบบ)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">ลิงก์คลิปสาธิตสินค้า (YouTube URL)</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newScriptYoutube}
                    onChange={(e) => setNewScriptYoutube(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">คุณสมบัติสินค้า (Features - คั่นด้วยจุลภาค `,` )</label>
                  <textarea
                    rows="2"
                    placeholder="เช่น Auto Quest, Esp, Teleport"
                    value={newScriptFeatures}
                    onChange={(e) => setNewScriptFeatures(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">คำอธิบายสินค้า</label>
                  <textarea
                    rows="3"
                    placeholder="ใส่รายละเอียดรายละเอียดสินค้าสคริปต์..."
                    value={newScriptDesc}
                    onChange={(e) => setNewScriptDesc(e.target.value)}
                    className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                  />
                </div>

                {/* Pricing Plans dynamic list */}
                <div className="space-y-2 pt-2 border-t border-[#1b233a]/60">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-bold block">ตัวเลือกแพลนเวลา / ราคา</label>
                    <button
                      type="button"
                      onClick={handleAddPlanRow}
                      className="text-violet-400 hover:text-violet-300 font-black text-[10px] cursor-pointer"
                    >
                      + เพิ่มแถวแพลน
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newScriptPlans.map((p, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="ระยะเวลา (เช่น 30 วัน)"
                          required
                          value={p.name}
                          onChange={(e) => handlePlanRowChange(idx, 'name', e.target.value)}
                          className="bg-[#070b13] border border-[#1b233a] rounded-xl px-2 py-1.5 text-white w-1/2 focus:outline-none focus:border-violet-500 font-semibold"
                        />
                        <input
                          type="number"
                          placeholder="ราคา (บาท)"
                          required
                          value={p.price}
                          onChange={(e) => handlePlanRowChange(idx, 'price', e.target.value)}
                          className="bg-[#070b13] border border-[#1b233a] rounded-xl px-2 py-1.5 text-white w-1/3 focus:outline-none focus:border-violet-500 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePlanRow(idx)}
                          className="text-rose-500 hover:text-rose-400 font-bold px-1.5 text-sm shrink-0 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 cursor-pointer"
                  >
                    {editingScript ? 'บันทึกการแก้ไข' : 'เพิ่มสคริปต์ใหม่'}
                  </button>
                  {editingScript && (
                    <button
                      type="button"
                      onClick={handleCancelScriptEdit}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: scripts table list */}
            <div className="lg:col-span-2 bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-gamepad text-violet-400"></i> รายการสินค้าสคริปต์ในร้านทั้งหมด
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3 px-4">ชื่อสินค้า</th>
                      <th className="py-3 px-4">หมวดหมู่</th>
                      <th className="py-3 px-4">ราคาเริ่มต้น</th>
                      <th className="py-3 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminScripts.map((s) => {
                      const c = adminCategories.find((cat) => cat.id == s.category_id);
                      const catLabel = c ? c.name : 'ไม่มี';
                      return (
                        <tr key={s.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span>{s.name}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                s.delivery_type === 'stock_ticket'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : s.delivery_type === 'stock_item'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : s.delivery_type === 'program'
                                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {s.delivery_type === 'stock_ticket' ? '🎫 Ticket' : s.delivery_type === 'stock_item' ? '📦 Stock' : s.delivery_type === 'program' ? '💻 Program' : '⚡ Script'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-violet-400 font-bold">{catLabel}</td>
                          <td className="py-3 px-4 font-mono font-bold">฿ {parseFloat(s.price).toFixed(2)}</td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <button
                              onClick={() => handleStartScriptEdit(s)}
                              className="text-violet-400 hover:bg-violet-950/20 border border-violet-850 bg-violet-950/5 px-3 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteScript(s.id)}
                              className="text-rose-400 hover:bg-rose-650 hover:text-white border border-rose-950 bg-rose-950/10 px-3 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 5: LICENSES & KEYS (Manually generator & list)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'keys' && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            {/* List Table */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-list text-violet-400"></i> ทะเบียนสิทธิ์และคีย์การใช้งานของลูกค้าทั้งหมด
                </h3>
                <input
                  type="text"
                  placeholder="ค้นหาด้วย คีย์สิทธิ์ / ชื่อผู้ใช้ / ชื่อสินค้า..."
                  value={keysSearch}
                  onChange={(e) => {
                    setKeysSearch(e.target.value);
                    loadKeysList(e.target.value);
                  }}
                  className="w-full bg-[#070b13] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3 px-4">รหัสคีย์สิทธิ์</th>
                      <th className="py-3 px-4">สคริปต์</th>
                      <th className="py-3 px-4">ผู้ถือครอง</th>
                      <th className="py-3 px-4">แพลน</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keysList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-semibold">ไม่พบสิทธิ์การใช้งานที่ค้นหา</td>
                      </tr>
                    ) : (
                      keysList.map((k) => (
                        <tr key={k.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white select-all">{k.user_key || k.key_code}</td>
                          <td className="py-3 px-4 font-bold">{k.script_name}</td>
                          <td className="py-3 px-4 text-violet-400 font-bold">{k.owner_name || 'ยังไม่ผูกสิทธิ์'}</td>
                          <td className="py-3 px-4 text-slate-400">{k.duration}</td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              k.status === 'active' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : k.status === 'used'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {k.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              className="text-rose-400 hover:bg-rose-650 hover:text-white border border-rose-950 bg-rose-950/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              ยกเลิกสิทธิ์
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 6: FINANCIAL TRANSACTION AUDIT
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'topups' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pending slips */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                รายการอัปโหลดสลิปที่รอตรวจสอบยืนยันยอดโอนเงิน (Pending Review)
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3.5 px-4">ลูกค้า</th>
                      <th className="py-3.5 px-4">รูปภาพสลิปโอน</th>
                      <th className="py-3.5 px-4">โบนัสระบบ</th>
                      <th className="py-3.5 px-4">อัปโหลดเมื่อ</th>
                      <th className="py-3.5 px-4">สถานะ</th>
                      <th className="py-3.5 px-4">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTopups.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">🎉 ไม่มีรายการโอนเงินคงค้างรออนุมัติ</td>
                      </tr>
                    ) : (
                      pendingTopups.map((t) => (
                        <tr key={t.id} className="border-b border-slate-850/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{t.username}</td>
                          <td className="py-3.5 px-4">
                            <a
                              href={t.slip_url ? (t.slip_url.startsWith('http') ? t.slip_url : `/api/view_slip.php?file=${t.slip_url.split('/').pop()}`) : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <i className="fa-solid fa-image"></i> คลิกดูสลิป
                            </a>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-400">โบนัส: {t.bonus}%</td>
                          <td className="py-3.5 px-4 text-slate-500">{t.created_at}</td>
                          <td className="py-3.5 px-4 text-yellow-500 font-bold animate-pulse">รอยืนยันยอด</td>
                          <td className="py-3.5 px-4 flex items-center gap-2">
                            <button
                              onClick={() => handleApproveTopup(t.id)}
                              className="bg-violet-950/20 border border-violet-850 text-violet-400 hover:bg-violet-600 hover:text-white font-extrabold px-3 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              อนุมัติยอดเงิน
                            </button>
                            <button
                              onClick={() => handleRejectTopup(t.id)}
                              className="bg-rose-950/10 border border-rose-900/30 text-rose-400 hover:bg-rose-650 hover:text-white font-extrabold px-3 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              ปฏิเสธ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All transactions history */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-receipt text-violet-400"></i> ประวัติรายการธุรกรรมการเงินทั้งหมดในระบบ
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-extrabold">
                      <th className="py-3 px-4">ผู้ใช้งาน</th>
                      <th className="py-3 px-4">ยอดเงิน</th>
                      <th className="py-3 px-4">โบนัส</th>
                      <th className="py-3 px-4">วันที่ทำรายการ</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">หลักฐาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTopupsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">ไม่พบประวัติรายการโอนเงิน</td>
                      </tr>
                    ) : (
                      allTopupsList.map((t) => (
                        <tr key={t.id} className="border-b border-slate-855/60 text-slate-300 hover:bg-[#12192c]/40 transition-colors">
                          <td className="py-3 px-4 font-bold">{t.username || 'ระบบอัตโนมัติ'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">฿ {parseFloat(t.amount).toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">+{t.bonus}%</td>
                          <td className="py-3 px-4 text-slate-500">{t.created_at}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                              t.status === 'completed' || t.status === 'approved'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : t.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {t.slip_url ? (
                              <a
                                href={t.slip_url.startsWith('http') ? t.slip_url : `/api/view_slip.php?file=${t.slip_url.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-400 hover:underline font-bold"
                              >
                                ดูรูปสลิป
                              </a>
                            ) : (
                              <span className="text-slate-500">อัตโนมัติ</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB: DISCOUNT CODES MANAGEMENT
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'discounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Create Code Form */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-tag text-violet-400"></i> สร้างโค้ดส่วนลดใหม่
              </h3>
              
              <form onSubmit={handleCreateDiscountCode} className="space-y-4 text-xs font-semibold text-slate-350">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">ชื่อรหัสโค้ด (CODE)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น OSX-SUMMER-10"
                    value={newDiscountCode}
                    onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">ประเภทส่วนลด</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  >
                    <option value="percent">เปอร์เซ็นต์ (%)</option>
                    <option value="amount">จำนวนเงินตรงๆ (฿)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">มูลค่าส่วนลด</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder={newDiscountType === 'percent' ? 'เช่น 10 (ลด 10%)' : 'เช่น 50 (ลด 50 บาท)'}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">ยอดซื้อขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="ใส่ 0 หากไม่มีขั้นต่ำ"
                    value={newDiscountMinPurchase}
                    onChange={(e) => setNewDiscountMinPurchase(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">โควต้าการใช้งานสูงสุด (ครั้ง)</label>
                  <input
                    type="number"
                    required
                    placeholder="ใส่ 0 หากไม่จำกัดสิทธิ์"
                    value={newDiscountMaxUses}
                    onChange={(e) => setNewDiscountMaxUses(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">วันหมดอายุ (หมดสิทธิ์หลังเวลานี้)</label>
                  <input
                    type="datetime-local"
                    value={newDiscountExpiresAt}
                    onChange={(e) => setNewDiscountExpiresAt(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-plus-circle"></i> สร้างรหัสส่วนลด
                </button>
              </form>
            </div>

            {/* List Codes */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 lg:col-span-2">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-violet-400"></i> โค้ดส่วนลดทั้งหมดในระบบ
              </h2>
              
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b233a] text-[10px] text-slate-400 uppercase font-black tracking-wider bg-[#0a0f1d]">
                      <th className="py-3 px-4">โค้ด</th>
                      <th className="py-3 px-4">ลดราคา</th>
                      <th className="py-3 px-4">ขั้นต่ำ</th>
                      <th className="py-3 px-4">การใช้งาน</th>
                      <th className="py-3 px-4">วันหมดอายุ</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-bold">
                          ยังไม่มีโค้ดส่วนลดใดๆ ในระบบ
                        </td>
                      </tr>
                    ) : (
                      discountCodes.map((c) => (
                        <tr key={c.id} className="border-b border-[#1c243a]/40 hover:bg-[#0f1524]/60 transition-colors font-medium">
                          <td className="py-3.5 px-4 font-mono font-bold text-violet-400">
                            {c.code}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.type === 'percent' ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                                ลด {parseFloat(c.value)}%
                              </span>
                            ) : (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full font-bold">
                                ลด ฿{parseFloat(c.value).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            ฿{parseFloat(c.min_purchase).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {c.used_count} / {parseInt(c.max_uses) > 0 ? c.max_uses : '∞'}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-400">
                            {c.expires_at ? new Date(c.expires_at).toLocaleString('th-TH') : 'ไม่มีวันหมดอายุ'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteDiscountCode(c.id)}
                              className="bg-rose-950/10 border border-rose-900/30 text-rose-400 hover:bg-rose-650 hover:text-white font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              <i className="fa-solid fa-trash mr-1"></i> ลบ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB: REDEEM CODES MANAGEMENT
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'redeems' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Create Code Form */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-gift text-violet-400"></i> สร้างโค้ดของขวัญ / รางวัลใหม่
              </h3>
              
              <form onSubmit={handleCreateRedeemCode} className="space-y-4 text-xs font-semibold text-slate-350">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">ชื่อรหัสโค้ดรางวัล (CODE)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น FREE-CREDIT-50"
                    value={newRedeemCode}
                    onChange={(e) => setNewRedeemCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">ประเภทของรางวัล</label>
                  <select
                    value={newRedeemType}
                    onChange={(e) => setNewRedeemType(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  >
                    <option value="balance">เงินเครดิตฟรี (฿)</option>
                    <option value="script">สิทธิ์เปิดใช้งานสคริปต์ (Script)</option>
                  </select>
                </div>

                {newRedeemType === 'balance' ? (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">จำนวนเงินเครดิตที่จะได้รับ (บาท)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="เช่น 50"
                      value={newRedeemValue}
                      onChange={(e) => setNewRedeemValue(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block font-bold">เลือกสคริปต์รางวัล</label>
                      <select
                        value={newRedeemValue}
                        required
                        onChange={(e) => setNewRedeemValue(e.target.value)}
                        className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                      >
                        <option value="">-- เลือกสคริปต์ --</option>
                        {adminScripts.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 block font-bold">ระยะเวลาของสิทธิ์</label>
                      <select
                        value={newRedeemDuration}
                        onChange={(e) => setNewRedeemDuration(e.target.value)}
                        className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                      >
                        <option value="1 วัน">1 วัน</option>
                        <option value="7 วัน">7 วัน</option>
                        <option value="30 วัน">30 วัน</option>
                        <option value="ถาวร (ตลอดชีพ)">ถาวร (ตลอดชีพ)</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">โควต้าใช้ได้สูงสุด (ครั้ง)</label>
                  <input
                    type="number"
                    required
                    placeholder="โควต้าการแลก เช่น 100"
                    value={newRedeemMaxUses}
                    onChange={(e) => setNewRedeemMaxUses(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">วันหมดอายุ (หมดสิทธิ์หลังเวลานี้)</label>
                  <input
                    type="datetime-local"
                    value={newRedeemExpiresAt}
                    onChange={(e) => setNewRedeemExpiresAt(e.target.value)}
                    className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-plus-circle"></i> สร้างโค้ดของรางวัล
                </button>
              </form>
            </div>

            {/* List Codes */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 lg:col-span-2 font-semibold">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-violet-400"></i> โค้ดรางวัลทั้งหมดในระบบ
              </h2>
              
              <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-[#090d16]/80 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b233a] text-[10px] text-slate-400 uppercase font-black tracking-wider bg-[#0a0f1d]">
                      <th className="py-3 px-4">โค้ดรางวัล</th>
                      <th className="py-3 px-4">ประเภท</th>
                      <th className="py-3 px-4">มูลค่ารางวัล</th>
                      <th className="py-3 px-4">โควต้าเคลม</th>
                      <th className="py-3 px-4">วันหมดอายุ</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redeemCodes.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-bold">
                          ยังไม่มีโค้ดของขวัญ/รางวัลใดๆ ในระบบ
                        </td>
                      </tr>
                    ) : (
                      redeemCodes.map((c) => {
                        let rewardText = '';
                        if (c.reward_type === 'balance') {
                          rewardText = `เครดิต ฿${parseFloat(c.reward_value).toFixed(2)}`;
                        } else {
                          const targetScript = adminScripts.find(s => s.id == c.reward_value);
                          rewardText = `สคริปต์: ${targetScript ? targetScript.name : `ID: ${c.reward_value}`} (${c.duration || 'ถาวร'})`;
                        }

                        return (
                          <tr key={c.id} className="border-b border-[#1c243a]/40 hover:bg-[#0f1524]/60 transition-colors font-medium">
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                              {c.code}
                            </td>
                            <td className="py-3.5 px-4">
                              {c.reward_type === 'balance' ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                                  Balance
                                </span>
                              ) : (
                                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2.5 py-0.5 rounded-full font-bold">
                                  Script Code
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-200">
                              {rewardText}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-300">
                              {c.used_count} / {parseInt(c.max_uses) > 0 ? c.max_uses : '∞'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {c.expires_at ? new Date(c.expires_at).toLocaleString('th-TH') : 'ไม่มีวันหมดอายุ'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRedeemCode(c.id)}
                                className="bg-rose-950/10 border border-rose-900/30 text-rose-400 hover:bg-rose-650 hover:text-white font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                <i className="fa-solid fa-trash mr-1"></i> ลบ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            TAB 7: SITE SETTINGS (Credentials bank config)
            ──────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Setting form */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-credit-card text-violet-400"></i> ตั้งค่าช่องทางการโอนเงิน & Gateway
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                
                {/* Payment Methods Enable/Disable Toggles */}
                <div className="space-y-3 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block">
                    <i className="fa-solid fa-toggle-on mr-1"></i> 1. เปิด-ปิดช่องทางการชำระเงิน (Payment Methods Status)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* PromptPay Toggle */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">QR PromptPay</label>
                      <select
                        value={promptpayEnabled}
                        onChange={(e) => setPromptpayEnabled(e.target.value)}
                        className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border ${
                          promptpayEnabled === '1'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                            : 'bg-rose-950/40 text-rose-400 border-rose-500/50'
                        }`}
                      >
                        <option value="1">🟢 เปิดใช้งาน</option>
                        <option value="0">🔴 ปิดปรับปรุง</option>
                      </select>
                    </div>

                    {/* TrueMoney Toggle */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">TrueMoney Gift</label>
                      <select
                        value={truewalletEnabled}
                        onChange={(e) => setTruewalletEnabled(e.target.value)}
                        className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border ${
                          truewalletEnabled === '1'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                            : 'bg-rose-950/40 text-rose-400 border-rose-500/50'
                        }`}
                      >
                        <option value="1">🟢 เปิดใช้งาน</option>
                        <option value="0">🔴 ปิดปรับปรุง</option>
                      </select>
                    </div>

                    {/* Slip Verify Toggle */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 block">Slip Verify (สลิป)</label>
                      <select
                        value={slipEnabled}
                        onChange={(e) => setSlipEnabled(e.target.value)}
                        className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none border ${
                          slipEnabled === '1'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                            : 'bg-rose-950/40 text-rose-400 border-rose-500/50'
                        }`}
                      >
                        <option value="1">🟢 เปิดใช้งาน</option>
                        <option value="0">🔴 ปิดปรับปรุง</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PromptPay Daily Maintenance Window */}
                <div className="space-y-3 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                      <i className="fa-solid fa-clock mr-1"></i> 2. ตั้งเวลาปิดปรับปรุง PromptPay สุ่มทศนิยม (ธนาคารปิดรอบดึก)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ระบบจะปิดรับการสร้าง QR Code สุ่มทศนิยมชั่วคราวในช่วงเวลานี้ และแนะนำให้ลูกค้าใช้ Slip Verify แทน
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-300">ระบบตั้งเวลาอัตโนมัติ:</label>
                      <select
                        value={promptpayMaintEnabled}
                        onChange={(e) => setPromptpayMaintEnabled(e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border ${
                          promptpayMaintEnabled === '1'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        <option value="1">เปิดใช้งานตั้งเวลาปิดปรับปรุง</option>
                        <option value="0">ปิดการตั้งเวลา (เปิดตลอด 24 ชม.)</option>
                      </select>
                    </div>

                    {promptpayMaintEnabled === '1' && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-bold block">เวลาเริ่มปิดปรับปรุง (HH:mm)</label>
                          <input
                            type="time"
                            value={promptpayMaintStart}
                            onChange={(e) => setPromptpayMaintStart(e.target.value)}
                            className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-bold block">เวลาเปิดให้บริการปกติ (HH:mm)</label>
                          <input
                            type="time"
                            value={promptpayMaintEnd}
                            onChange={(e) => setPromptpayMaintEnd(e.target.value)}
                            className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PromptPay account details & Custom Random Decimal Range */}
                <div className="space-y-3 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block">
                    <i className="fa-solid fa-qrcode mr-1"></i> 3. บัญชีพร้อมเพย์ & กำหนดช่วงสุ่มทศนิยม (PromptPay Settings)
                  </span>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block text-[11px]">เบอร์พร้อมเพย์ / เลขบัตรประชาชน / เลขบัญชี</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 0812345678 หรือเลขบัตรประชาชน"
                      value={promptpayNumber}
                      onChange={(e) => setPromptpayNumber(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors font-semibold font-mono text-xs"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block text-[11px]">ชื่อบัญชีพร้อมเพย์</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายวัชรพัฐ นะราวัฒน์"
                      value={promptpayName}
                      onChange={(e) => setPromptpayName(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-2 text-white focus:outline-none transition-colors font-semibold text-xs"
                    />
                  </div>

                  {/* Random Decimal Range Configuration */}
                  <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-cyan-300 block">
                        <i className="fa-solid fa-dice mr-1"></i> กำหนดช่วงสุ่มทศนิยม PromptPay (สตางค์ 1 - 99)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (สุ่มระหว่าง .{parseInt(promptpayDecimalMin) < 10 ? '0' + parseInt(promptpayDecimalMin || 1) : promptpayDecimalMin || 1} ถึง .{parseInt(promptpayDecimalMax) < 10 ? '0' + parseInt(promptpayDecimalMax || 99) : promptpayDecimalMax || 99} บาท)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">เศษสตางค์ขั้นต่ำ (1-99)</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          required
                          value={promptpayDecimalMin}
                          onChange={(e) => setPromptpayDecimalMin(e.target.value)}
                          className="w-full bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">เศษสตางค์สูงสุด (1-99)</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          required
                          value={promptpayDecimalMax}
                          onChange={(e) => setPromptpayDecimalMax(e.target.value)}
                          className="w-full bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top-up Tax / Fee Percent per Channel */}
                <div className="space-y-3 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-rose-400 font-black uppercase tracking-wider block">
                      <i className="fa-solid fa-percent mr-1"></i> 4. ภาษี / ค่าธรรมเนียมหัก ณ การเติมเงิน (แยกรายช่องทาง)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      กำหนดหัก % แยกอิสระตามแต่ละวิธี
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    * ใส่ 0 หากไม่ต้องการหักค่าธรรมเนียม (เช่น TrueMoney อาจตั้งหัก 2.5% หรือ 5% ตามต้นทุนเกตเวย์)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* PromptPay Fee */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-cyan-400 block flex items-center justify-between">
                        <span>QR PromptPay</span>
                        <span className="text-[10px] text-slate-400 font-mono">{feePromptpayPercent}%</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          value={feePromptpayPercent}
                          onChange={(e) => setFeePromptpayPercent(e.target.value)}
                          className="w-full bg-[#070b13] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                        />
                        <span className="text-xs font-black text-slate-400 px-2 py-1 bg-[#070b13] border border-[#1b233a] rounded-lg">%</span>
                      </div>
                    </div>

                    {/* TrueMoney Fee */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-400 block flex items-center justify-between">
                        <span>TrueMoney Gift</span>
                        <span className="text-[10px] text-slate-400 font-mono">{feeTruewalletPercent}%</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          value={feeTruewalletPercent}
                          onChange={(e) => setFeeTruewalletPercent(e.target.value)}
                          className="w-full bg-[#070b13] border border-[#1b233a] focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                        />
                        <span className="text-xs font-black text-slate-400 px-2 py-1 bg-[#070b13] border border-[#1b233a] rounded-lg">%</span>
                      </div>
                    </div>

                    {/* Slip Verify Fee */}
                    <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1b233a] space-y-1.5">
                      <label className="text-[11px] font-bold text-emerald-400 block flex items-center justify-between">
                        <span>Slip Verify (สลิป)</span>
                        <span className="text-[10px] text-slate-400 font-mono">{feeSlipPercent}%</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                          value={feeSlipPercent}
                          onChange={(e) => setFeeSlipPercent(e.target.value)}
                          className="w-full bg-[#070b13] border border-[#1b233a] focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none"
                        />
                        <span className="text-xs font-black text-slate-400 px-2 py-1 bg-[#070b13] border border-[#1b233a] rounded-lg">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank account details */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-violet-400 font-black uppercase tracking-wider block">5. บัญชีธนาคารโอนเงินตรง</span>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">ชื่อธนาคาร</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">เลขบัญชีธนาคาร</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">ชื่อเจ้าของบัญชีธนาคาร</label>
                    <input
                      type="text"
                      required
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                    />
                  </div>
                </div>

                {/* True Wallet details */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">6. บัญชี TrueMoney Wallet (รับเงินซองของขวัญ / โอนตรง)</span>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">ชื่อบัญชี True Wallet</label>
                    <input
                      type="text"
                      required
                      value={truewalletName}
                      onChange={(e) => setTruewalletName(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">หมายเลขโทรศัพท์ True Wallet (สำหรับรับอั่งเปา & โอนตรง)</label>
                    <input
                      type="text"
                      placeholder="เช่น 0812345678"
                      value={osxpayWalletPhone}
                      onChange={(e) => setOsxpayWalletPhone(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* API settings */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">7. คีย์เกตเวย์ความปลอดภัย (OSXPAY API Gateway)</span>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">OSXPAY API KEY</label>
                    <input
                      type="text"
                      placeholder="เช่น kb_your_api_key_here"
                      value={osxpayApiKey}
                      onChange={(e) => setOsxpayApiKey(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Top-up Bonus Tiers */}
                <div className="space-y-4 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-violet-400 font-black uppercase tracking-wider block">8. ตั้งค่าระดับโบนัสแถมเติมเงิน (Top-up Bonus Promotions)</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tier 1 */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#0e121b]/50 border border-[#1b233a]/30">
                      <span className="text-[9px] text-violet-400 font-extrabold uppercase tracking-wide block">โปรโมชั่นขั้นที่ 1</span>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">ยอดเติมเงินขั้นต่ำ (บาท)</label>
                        <input
                          type="number"
                          value={topupTier1Min}
                          onChange={(e) => setTopupTier1Min(e.target.value)}
                          className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">โบนัสที่จะแถม (%)</label>
                        <input
                          type="number"
                          value={topupTier1Rate}
                          onChange={(e) => setTopupTier1Rate(e.target.value)}
                          className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#0e121b]/50 border border-[#1b233a]/30">
                      <span className="text-[9px] text-violet-400 font-extrabold uppercase tracking-wide block">โปรโมชั่นขั้นที่ 2</span>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">ยอดเติมเงินขั้นต่ำ (บาท)</label>
                        <input
                          type="number"
                          value={topupTier2Min}
                          onChange={(e) => setTopupTier2Min(e.target.value)}
                          className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold block">โบนัสที่จะแถม (%)</label>
                        <input
                          type="number"
                          value={topupTier2Rate}
                          onChange={(e) => setTopupTier2Rate(e.target.value)}
                          className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Tier 3 */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-[#0e121b]/50 border border-[#1b233a]/30 sm:col-span-2">
                      <span className="text-[9px] text-violet-400 font-extrabold uppercase tracking-wide block">โปรโมชั่นขั้นที่ 3</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-bold block">ยอดเติมเงินขั้นต่ำ (บาท)</label>
                          <input
                            type="number"
                            value={topupTier3Min}
                            onChange={(e) => setTopupTier3Min(e.target.value)}
                            className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-bold block">โบนัสที่จะแถม (%)</label>
                          <input
                            type="number"
                            value={topupTier3Rate}
                            onChange={(e) => setTopupTier3Rate(e.target.value)}
                            className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-violet-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discord Ticket & Order Webhook Settings */}
                <div className="space-y-3 p-4 rounded-xl bg-[#070b13]/70 border border-[#1b233a]/55">
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block">
                    <i className="fa-brands fa-discord mr-1"></i> 9. ตั้งค่าการแจ้งเตือน Discord & ห้องเปิด Ticket
                  </span>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">Discord Webhook URL (แจ้งเตือนคำสั่งซื้อใหม่ & เคลม)</label>
                    <input
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={discordOrderWebhookUrl}
                      onChange={(e) => setDiscordOrderWebhookUrl(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-mono"
                    />
                    <p className="text-[10px] text-slate-500">
                      เมื่อลูกค้าสั่งซื้อสินค้า ระบบจะส่งการแจ้งเตือนพร้อมรหัส Claim Code, Discord ID และชื่อสินค้าไปยังห้อง Discord อัตโนมัติ
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold block">ลิงก์ห้อง Ticket / Discord Server Invite (สำหรับลูกค้ากดรับของ)</label>
                    <input
                      type="text"
                      placeholder="https://discord.gg/BXM5WEkD3J"
                      value={discordTicketUrl}
                      onChange={(e) => setDiscordTicketUrl(e.target.value)}
                      className="w-full bg-[#0e121b] border border-[#1b233a] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white focus:outline-none transition-colors font-mono"
                    />
                    <p className="text-[10px] text-slate-500">
                      ลิงก์นี้จะแสดงให้ลูกค้ากดเปิด Ticket ทันทีหลังซื้อสินค้าเสร็จสิ้น
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าทั้งหมด
                </button>
              </form>
            </div>

            {/* Instruction CMS panel */}
            <div className="bg-[#0e121b] border border-[#1b233a] rounded-2xl p-5 space-y-4 h-fit text-xs text-slate-300">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-info text-violet-400"></i> แผงแนะนำการใช้งานแดชบอร์ด CMS
              </h3>
              <div className="space-y-3 leading-relaxed">
                <p>ยินดีต้อนรับสู่แผงควบคุมระบบร้านค้า **OSX CMS Dashboard** ที่เปลี่ยนดีไซน์ใหม่สไตล์พรีเมียมแดชบอร์ด Dashdark X เรียบร้อยแล้วครับ!</p>
                
                <div className="p-3 bg-[#070b13]/60 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-violet-400 font-extrabold block">📝 การทำงานของแผนภูมิข้อมูล (SVG Charts)</strong>
                  <p className="text-slate-400 text-[11px]">
                    แผนภูมิด้านบนจำลองพล็อตข้อมูลจากพิกัดรูปทรง SVG เพื่อการประมวลผลที่คมชัดและรวดเร็วสูงสุด โดยจะแสดงแนวโน้มรายได้หมุนเวียน 12 เดือน และระดับปริมาณกำไรในแต่ละสัปดาห์
                  </p>
                </div>

                <div className="p-3 bg-[#070b13]/60 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-violet-400 font-extrabold block">📂 การจัดเก็บรูปภาพในระบบ</strong>
                  <p className="text-slate-400 text-[11px]">
                    หลีกเลี่ยงการก๊อปปี้ลิงก์ข้อความยาว ๆ ที่ระบบอาจตัดคำจนพัง โดยนำไฟล์รูปปกสินค้า/หมวดหมู่ไปวางไว้ในโฟลเดอร์ <b>public/img/</b> จากนั้นคุณจะสามารถกดเลือกไฟล์ภาพปกผ่านช่อง Dropdown ในหน้านี้ได้ทันที
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
