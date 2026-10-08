/* ========================
   APP.JS — OSX HUB
======================== */

/* ---- DATA ---- */
let SCRIPTS = [];
let CATEGORIES = [];
let USER = null;
let selectedPlan = null;
let currentScript = null;

// Multi-Level Category Navigation States
let storeNavState = 'root'; // 'root', 'sub', 'products'
let currentRootCatId = null;
let currentSubCatId = null;

/* ---- NAVIGATION ---- */
function navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    // Update nav links (desktop)
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });
    // Update bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();

    // Trigger views reload when entering profile page
    if (page === 'profile') {
        renderProfileInfo();
    }
    if (page === 'store') {
        showStoreCategories();
    }
}
window.navigate = navigate;

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load HTML Components first
    if (typeof loadComponents === 'function') {
        await loadComponents();
    }
    
    // 2. Fetch scripts and check authentication
    await loadScripts();
    await checkSession();

    // 3. Initialize interactive events
    renderFeatured();
    initCounters();
    initTopup();
    initPaymentMethod();
    initSearch();
    initFilters();
    initProfileTabs();
    initNavbar();
    initLoginBtn();
    navigate('home');
    if (window.lucide) window.lucide.createIcons();
});

/* ---- API FETCH ACTIONS ---- */
async function loadScripts() {
    try {
        const response = await fetch('api/scripts.php?action=list');
        const res = await response.json();
        if (res.status === 'success') {
            SCRIPTS = res.data.scripts;
            CATEGORIES = res.data.categories;
        }
    } catch (e) {
        console.error('Error fetching scripts:', e);
    }
}

async function checkSession() {
    try {
        const response = await fetch('api/auth.php?action=status');
        const res = await response.json();
        if (res.status === 'success') {
            USER = res.data;
            await loadUserKeysAndHistory();
        } else {
            USER = null;
        }
    } catch (e) {
        console.error('Session check error:', e);
    }
    updateAuthUI();
}

async function loadUserKeysAndHistory() {
    if (!USER) return;
    try {
        const [keysRes, histRes] = await Promise.all([
            fetch(`api/scripts.php?action=user_keys&_t=${Date.now()}`).then(r => r.json()),
            fetch(`api/scripts.php?action=user_history&_t=${Date.now()}`).then(r => r.json())
        ]);
        if (keysRes.status === 'success') USER.keys = keysRes.data;
        if (histRes.status === 'success') USER.history = histRes.data;
    } catch (e) {
        console.error('Error fetching user meta:', e);
    }
}

/* ---- NAVBAR SCROLL ---- */
function initNavbar() {
    const nb = document.getElementById('navbar');
    if (nb) {
        window.addEventListener('scroll', () => {
            nb.classList.toggle('scrolled', window.scrollY > 10);
        });
    }
}

/* ---- COUNTER ANIMATION ---- */
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = +el.dataset.target;
            let current = 0;
            const step = target / 60;
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = Math.floor(current).toLocaleString('th-TH');
                if (current >= target) {
                    clearInterval(timer);
                    el.textContent = target.toLocaleString('th-TH');
                }
            }, 20);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
}

/* ---- RENDER FEATURED (first 4) ---- */
function renderFeatured() {
    const container = document.getElementById('featuredGrid');
    if (!container) return;
    const featured = SCRIPTS.slice(0, 4);
    container.innerHTML = featured.map(s => productCardHTML(s)).join('');
}

/* ---- RENDER STORE GRID ---- */
/* ---- RENDER STORE GRID ---- */
function showStoreCategories() {
    storeNavState = 'root';
    currentRootCatId = null;
    currentSubCatId = null;

    const catView = document.getElementById('storeCategoryView');
    const listView = document.getElementById('storeListView');
    if (catView) catView.style.display = 'grid';
    if (listView) listView.style.display = 'none';

    const backBtn = document.getElementById('categoryBackContainer');
    if (backBtn) backBtn.style.display = 'none';

    const headerBanner = document.getElementById('categoryHeaderBanner');
    if (headerBanner) headerBanner.style.display = 'none';

    // Reset titles
    const titleEl = document.getElementById('storeHeaderTitle');
    const subEl = document.getElementById('storeHeaderSub');
    if (titleEl) titleEl.textContent = "หมวดหมู่สินค้า";
    if (subEl) subEl.textContent = "หมวดหมู่ที่น่าสนใจจากเรา";

    // Filter root categories
    const rootCats = CATEGORIES.filter(c => c.parent_id === null || c.parent_id === 0 || !c.parent_id);
    renderCategoryBanners(rootCats, 'root');
}
window.showStoreCategories = showStoreCategories;

function selectStoreCategory(catId) {
    const subs = CATEGORIES.filter(c => c.parent_id == catId);
    if (subs.length > 0) {
        storeNavState = 'sub';
        currentRootCatId = catId;
        
        const backBtn = document.getElementById('categoryBackContainer');
        if (backBtn) backBtn.style.display = 'block';

        const rootCat = CATEGORIES.find(c => c.id == catId);
        const headerBanner = document.getElementById('categoryHeaderBanner');
        if (headerBanner && rootCat && rootCat.image_url) {
            headerBanner.style.backgroundImage = `url('${rootCat.image_url}')`;
            headerBanner.style.display = 'block';
        }

        const titleEl = document.getElementById('storeHeaderTitle');
        const subEl = document.getElementById('storeHeaderSub');
        if (titleEl && rootCat) titleEl.textContent = rootCat.name;
        if (subEl) subEl.textContent = "หมวดหมู่ย่อยของ " + (rootCat ? rootCat.name : '');

        renderCategoryBanners(subs, 'sub');
    } else {
        storeNavState = 'products';
        currentSubCatId = catId;

        const backBtn = document.getElementById('categoryBackContainer');
        if (backBtn) backBtn.style.display = 'none';

        const subCat = CATEGORIES.find(c => c.id == catId);
        const headerBanner = document.getElementById('categoryHeaderBanner');
        if (headerBanner && subCat && subCat.image_url) {
            headerBanner.style.backgroundImage = `url('${subCat.image_url}')`;
            headerBanner.style.display = 'block';
        } else if (headerBanner) {
            // fallback to parent root category banner if subcategory has no image
            const rootCat = CATEGORIES.find(c => c.id == currentRootCatId);
            if (rootCat && rootCat.image_url) {
                headerBanner.style.backgroundImage = `url('${rootCat.image_url}')`;
                headerBanner.style.display = 'block';
            } else {
                headerBanner.style.display = 'none';
            }
        }

        const subCatObj = CATEGORIES.find(c => c.id == catId);
        const catView = document.getElementById('storeCategoryView');
        const listView = document.getElementById('storeListView');
        if (catView) catView.style.display = 'none';
        if (listView) listView.style.display = 'block';

        const listTitleEl = document.getElementById('storeListTitle');
        if (listTitleEl && subCatObj) listTitleEl.textContent = subCatObj.name;

        // Reset search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        renderStoreGrid();
    }
}
window.selectStoreCategory = selectStoreCategory;

function goBackStoreLevel() {
    if (storeNavState === 'products') {
        if (currentRootCatId) {
            storeNavState = 'sub';
            const catView = document.getElementById('storeCategoryView');
            const listView = document.getElementById('storeListView');
            if (catView) catView.style.display = 'grid';
            if (listView) listView.style.display = 'none';
            
            const backBtn = document.getElementById('categoryBackContainer');
            if (backBtn) backBtn.style.display = 'block';

            const subs = CATEGORIES.filter(c => c.parent_id == currentRootCatId);
            const rootCat = CATEGORIES.find(c => c.id == currentRootCatId);
            const headerBanner = document.getElementById('categoryHeaderBanner');
            if (headerBanner && rootCat && rootCat.image_url) {
                headerBanner.style.backgroundImage = `url('${rootCat.image_url}')`;
                headerBanner.style.display = 'block';
            }

            const titleEl = document.getElementById('storeHeaderTitle');
            if (titleEl && rootCat) titleEl.textContent = rootCat.name;
            renderCategoryBanners(subs, 'sub');
        } else {
            showStoreCategories();
        }
    } else if (storeNavState === 'sub') {
        showStoreCategories();
    }
}
window.goBackStoreLevel = goBackStoreLevel;

function renderCategoryBanners(cats, level) {
    const container = document.getElementById('storeCategoryView');
    if (!container) return;

    container.innerHTML = cats.map(c => {
        let label = '';
        if (level === 'root') {
            const subCount = CATEGORIES.filter(sub => sub.parent_id == c.id).length;
            label = `หมวดหมู่ย่อย <span class="accent-text">${subCount}</span> รายการ`;
        } else {
            const prodCount = SCRIPTS.filter(s => s.category_id == c.id).length;
            label = `สินค้าทั้งหมด <span class="accent-text">${prodCount}</span> รายการ`;
        }

        return `
            <div class="store-category-card" onclick="selectStoreCategory(${c.id})">
                <div class="store-category-card-img" style="background-image: url('${c.image_url}')"></div>
                <div class="store-category-card-content">
                    <h3>${c.name}</h3>
                    <p>${label}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderStoreGrid(filterCat = 'all', query = '') {
    const container = document.getElementById('storeGrid');
    if (!container) return;
    
    // Filter scripts under current subcategory
    let filtered = SCRIPTS.filter(s => s.category_id == currentSubCatId);

    if (query) {
        filtered = filtered.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.desc.toLowerCase().includes(query.toLowerCase()));
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-muted);">
            <i class="fa-solid fa-box-open" style="font-size:36px;margin-bottom:12px;display:block;"></i>
            ไม่พบสคริปต์ในหมวดหมู่นี้
        </div>`;
        return;
    }
    container.innerHTML = filtered.map(s => productCardHTML(s)).join('');
}

/* ---- PRODUCT CARD HTML ---- */
function productCardHTML(s) {
    const cat = CATEGORIES.find(c => c.id == s.category_id);
    const catLabel = cat ? cat.name : 'สคริปต์';

    const badgeHTML = [
        (s.badges || []).includes('hot')  ? '<span class="badge badge-hot">🔥 HOT</span>' : '',
        (s.badges || []).includes('new')  ? '<span class="badge badge-new">✨ NEW</span>' : '',
        (s.badges || []).includes('sale') ? '<span class="badge badge-sale">🏷 SALE</span>' : '',
        `<span class="badge badge-cat">${catLabel}</span>`,
    ].join('');

    const minPrice = s.plans && s.plans.length > 0 ? Math.min(...s.plans.map(p => p.price)) : s.price;
    const backgroundStyle = s.image_url ? `style="background-image: url('${s.image_url}'); background-size: cover; background-position: center;"` : '';
    const emojiDisplay = s.image_url ? '' : `<span>${s.emoji}</span>`;

    return `
        <div class="prod-card" onclick="viewProductDetail(${s.id})">
            <div class="prod-thumb ${s.thumb}" ${backgroundStyle}>
                <div class="prod-badges">${badgeHTML}</div>
                ${emojiDisplay}
            </div>
            <div class="prod-body">
                <p class="prod-name">${s.name}</p>
                <p class="prod-desc">${s.description}</p>
                <div class="prod-footer">
                    <div class="prod-price">
                        ฿ ${minPrice} <small>/ เริ่มต้น</small>
                    </div>
                    <button class="prod-buy-btn" onclick="event.stopPropagation();viewProductDetail(${s.id})">
                        <i class="fa-solid fa-cart-plus"></i> ซื้อ
                    </button>
                </div>
            </div>
        </div>
    `;
}

/* ---- BUY MODAL ---- */
/* ---- PRODUCT DETAIL VIEW ---- */
let detailSelectedQty = 1;

function getYoutubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

function viewProductDetail(id) {
    const script = SCRIPTS.find(s => s.id === id);
    if (!script) return;
    currentScript = script;

    const cat = CATEGORIES.find(c => c.id == script.category_id);
    const catLabel = cat ? cat.name : 'สคริปต์';

    if (!script.plans || !Array.isArray(script.plans) || script.plans.length === 0) {
        script.plans = [
            { name: '7 วัน', price: script.price || 39 },
            { name: '30 วัน', price: (script.price || 39) * 3 }
        ];
    }
    selectedPlan = script.plans[0];
    
    const stockVal = script.stock !== undefined ? script.stock : 0;
    const isOutOfStock = stockVal === 0;
    detailSelectedQty = isOutOfStock ? 0 : 1;

    // Generate simulated reviews based on product name
    const reviewerNames = ['pk****rp', 'Mo*****ee', 'do****si', 'po*********a', 'ki*****99', 'no****er'];
    const reviewTexts = [
        'ดีจริงครับบบบบบบบบบ แนะนำเลยตัวนี้',
        'ลื่นมากกกกกกกกกกกกกกกกกกก เล่นไม่เด้งเลย',
        'ลื่นจัดๆ ฟาร์มเร็วมาก',
        'อัปเดตไวมากครับ ล่าสุดยังใช้งานได้ดีอยู่',
        'ใช้งานง่ายมากครับ แอดมินตอบไวด้วย',
        'คุ้มค่ากับราคามากครับ ดีกว่าค่ายอื่นเยอะ'
    ];
    
    let reviewsHTML = '';
    for (let i = 0; i < 4; i++) {
        const rName = reviewerNames[i % reviewerNames.length];
        const rText = reviewTexts[(id + i) % reviewTexts.length];
        reviewsHTML += `
            <div class="review-card-item">
                <div class="review-card-header">
                    <span class="reviewer-name">ชื่อผู้ใช้: ${rName}</span>
                    <span class="reviewer-rating"><i class="fa-solid fa-star" style="color:var(--yellow)"></i> 5/5</span>
                </div>
                <p class="review-card-text">ซื้อแล้วดีมากกกกกกกกกก</p>
            </div>
        `;
    }

    const youtubeId = script.youtube_url ? getYoutubeId(script.youtube_url) : 'S263q9rJ2yE'; // fallback standard video

    const planOptsHTML = script.plans.map((plan, i) => `
        <div class="plan-opt-item ${i === 0 ? 'selected' : ''}" data-index="${i}" onclick="selectProductPlan(${i}, ${plan.price})">
            <div class="plan-info">
                <div class="plan-name-title">${plan.name}</div>
                <div class="plan-expiry">หมดอายุใน ${plan.name}</div>
            </div>
            <div class="plan-price-label">฿ ${plan.price}</div>
        </div>
    `).join('');

    const featuresHTML = script.features.map(f => `
        <li><i class="fa-solid fa-circle-check" style="color:var(--blue-light)"></i> ${f}</li>
    `).join('');

    let stockHTML = '';
    if (isOutOfStock) {
        stockHTML = `<i class="fa-solid fa-box-open" style="color:var(--red)"></i> สินค้าหมด <span class="stock-qty" style="background: rgba(239, 68, 68, 0.1); color: var(--red); border-color: rgba(239, 68, 68, 0.2);">0 ชิ้น</span>`;
    } else {
        stockHTML = `<i class="fa-solid fa-box-open" style="color:var(--blue-light)"></i> พร้อมจำหน่าย <span class="stock-qty">${stockVal} ชิ้น</span>`;
    }

    const detailHTML = `
        <div class="product-breadcrumb">
            <button class="btn-back-categories" onclick="navigate('store')">
                <i class="fa-solid fa-arrow-left"></i> ย้อนกลับ
            </button>
            <span class="breadcrumb-text">${script.name} / ${catLabel}</span>
        </div>

        <div class="product-detail-layout">
            <!-- Left Column -->
            <div class="product-detail-left">
                <div class="detail-card cover-image-card" style="background-image: url('${script.image_url || 'img/default-cover.png'}');">
                </div>

                <div class="detail-card video-card">
                    <h4>วีดีโอรีวิว</h4>
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>

                <div class="detail-card reviews-card">
                    <div class="reviews-header-row">
                        <h4>รีวิวสินค้า</h4>
                        <span class="badge-reviews">Reviews</span>
                    </div>
                    <div class="reviews-list">
                        ${reviewsHTML}
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="product-detail-right">
                <div class="detail-card info-card">
                    <h2 class="detail-title">${script.name}</h2>
                    <span class="detail-subtitle">${catLabel}</span>
                    
                    <p style="color: var(--text-sec); font-size: 13.5px; line-height: 1.6; margin-bottom: 1.5rem; white-space: pre-line;">${script.description || 'ไม่มีคำอธิบายสำหรับสินค้านี้'}</p>

                    <div class="detail-section-title">คุณสมบัติเด่น</div>
                    <ul class="detail-features-list">
                        ${featuresHTML}
                    </ul>
                </div>

                <div class="detail-card stock-card">
                    <div class="stock-status">
                        ${stockHTML}
                    </div>
                </div>

                <div class="detail-card buy-card">
                    <div class="checkout-header">
                        <i class="fa-solid fa-shopping-cart" style="color:var(--blue)"></i> สั่งซื้อ
                    </div>
                    
                    <div class="plan-price-display">
                        <span class="price-label">ราคารวม</span>
                        <span class="price-val" id="detailPriceVal">฿ ${(selectedPlan.price * detailSelectedQty).toFixed(2)}</span>
                    </div>

                    <div class="promo-code-section">
                        <label>โค้ดส่วนลด</label>
                        <div class="promo-input-group">
                            <input type="text" id="promoCodeInput" placeholder="PromoCode">
                            <button onclick="applyPromoCode()">Apply</button>
                        </div>
                    </div>

                    <div class="qty-section">
                        <label>จำนวน</label>
                        <div class="qty-selector">
                            <button onclick="updateDetailQty(-1)" ${isOutOfStock ? 'disabled' : ''}>-</button>
                            <input type="number" id="detailQtyInput" value="${detailSelectedQty}" min="${isOutOfStock ? 0 : 1}" max="${stockVal}" readonly>
                            <button onclick="updateDetailQty(1)" ${isOutOfStock ? 'disabled' : ''}>+</button>
                        </div>
                    </div>

                    <div class="plan-options-container">
                        <label>เลือกระยะเวลาใช้งาน</label>
                        <div class="plan-opts-grid">
                            ${planOptsHTML}
                        </div>
                    </div>

                    <button class="btn-checkout-now" ${isOutOfStock ? 'disabled style="background:var(--text-muted); cursor:not-allowed;"' : ''} onclick="confirmProductPurchase()">
                        <i class="fa-solid fa-cart-shopping"></i> ${isOutOfStock ? 'สินค้าหมดชั่วคราว' : 'สั่งซื้อตอนนี้เลย'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('page-product').innerHTML = detailHTML;
    navigate('product');
}
window.viewProductDetail = viewProductDetail;

function selectProductPlan(index, price) {
    if (!currentScript) return;
    selectedPlan = currentScript.plans[index];
    
    document.querySelectorAll('.plan-opt-item').forEach(opt => {
        opt.classList.toggle('selected', parseInt(opt.dataset.index) === index);
    });

    updatePriceVal();
}
window.selectProductPlan = selectProductPlan;

function updateDetailQty(change) {
    if (!currentScript) return;
    const stockVal = currentScript.stock !== undefined ? currentScript.stock : 0;
    if (stockVal === 0) {
        detailSelectedQty = 0;
    } else {
        detailSelectedQty = Math.max(1, Math.min(stockVal, detailSelectedQty + change));
    }
    const qtyInput = document.getElementById('detailQtyInput');
    if (qtyInput) qtyInput.value = detailSelectedQty;
    updatePriceVal();
}
window.updateDetailQty = updateDetailQty;

function updatePriceVal() {
    if (!selectedPlan) return;
    const priceVal = document.getElementById('detailPriceVal');
    if (priceVal) {
        priceVal.textContent = `฿ ${(selectedPlan.price * detailSelectedQty).toFixed(2)}`;
    }
}

function applyPromoCode() {
    const input = document.getElementById('promoCodeInput');
    if (input && input.value.trim() !== '') {
        showToast('❌ โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ', 'error');
    } else {
        showToast('⚠️ กรุณากรอกโค้ดส่วนลด', 'error');
    }
}
window.applyPromoCode = applyPromoCode;

async function confirmProductPurchase() {
    if (!USER) {
        showToast('⚠️ กรุณาเข้าสู่ระบบก่อนสั่งซื้อสคริปต์', 'error');
        document.getElementById('loginModal').classList.add('show');
        return;
    }

    if (!selectedPlan || !currentScript) return;
    const totalPrice = selectedPlan.price * detailSelectedQty;

    if (parseFloat(USER.balance) < totalPrice) {
        showToast('ยอดเงินไม่เพียงพอ กรุณาเติมเงิน', 'error');
        setTimeout(() => navigate('topup'), 600);
        return;
    }

    try {
        let purchasedKeys = [];
        let hasError = false;

        // Loop to purchase quantity times
        for (let i = 0; i < detailSelectedQty; i++) {
            const response = await fetch('api/scripts.php?action=buy', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    script_id: currentScript.id,
                    plan_name: selectedPlan.name,
                    price: selectedPlan.price
                })
            });
            const res = await response.json();
            if (res.status === 'success') {
                purchasedKeys.push(res.data.key);
            } else {
                hasError = true;
                showToast(res.message, 'error');
                break;
            }
        }

        if (purchasedKeys.length > 0) {
            showToast(`✅ ซื้อสำเร็จ! จำนวน ${purchasedKeys.length} ชิ้น คีย์: ${purchasedKeys.join(', ')}`, 'success');
            await loadScripts(); // Update local scripts data (and stock counts)
            await checkSession();
            navigate('profile');
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการซื้อสินค้า', 'error');
    }
}
window.confirmProductPurchase = confirmProductPurchase;

/* ---- TOPUP ---- */
function initTopup() {
    let selectedAmount = 200;

    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAmount = +btn.dataset.amount;
            const custom = document.getElementById('customAmount');
            if (custom) custom.value = '';
            updateTopupSummary(selectedAmount);
        });
    });

    document.getElementById('customAmount')?.addEventListener('input', (e) => {
        const val = +e.target.value;
        if (val >= 30) {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
            selectedAmount = val;
            updateTopupSummary(val);
        }
    });

    document.getElementById('btnTopupConfirm')?.addEventListener('click', async () => {
        if (!USER) {
            showToast('⚠️ กรุณาเข้าสู่ระบบก่อนทำรายการ', 'error');
            return;
        }

        const methodEl = document.querySelector('.payment-opt.active');
        const method = methodEl ? methodEl.querySelector('span').textContent.trim() : '';

        try {
            const response = await fetch('api/topup.php?action=submit', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    amount: selectedAmount,
                    method: method
                })
            });
            const res = await response.json();
            if (res.status === 'success') {
                showToast(res.message, 'success');
                await checkSession();
            } else {
                showToast(res.message, 'error');
            }
        } catch (e) {
            showToast('เกิดข้อผิดพลาดทางเทคนิค', 'error');
        }
    });

    updateTopupSummary(selectedAmount);
}

function getBonusAmount(amount) {
    if (amount >= 1000) return Math.floor(amount * 0.2);
    if (amount >= 500)  return Math.floor(amount * 0.15);
    if (amount >= 200)  return Math.floor(amount * 0.1);
    return 0;
}

function updateTopupSummary(amount) {
    const bonus = getBonusAmount(amount);
    const sumAmt = document.getElementById('summaryAmount');
    const sumBonus = document.getElementById('summaryBonus');
    const sumTotal = document.getElementById('summaryTotal');
    
    if (sumAmt) sumAmt.textContent = `฿ ${amount.toFixed(2)}`;
    if (sumBonus) sumBonus.textContent  = `+฿ ${bonus.toFixed(2)}`;
    if (sumTotal) sumTotal.textContent  = `฿ ${(amount + bonus).toFixed(2)}`;
}

function initPaymentMethod() {
    document.querySelectorAll('.payment-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });
    });
}

/* ---- SEARCH + FILTER ---- */
let currentCat = 'all';
let currentQuery = '';

function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        currentQuery = input.value.trim();
        renderStoreGrid(currentCat, currentQuery);
    });
}

function initFilters() {
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentCat = tag.dataset.cat;
            renderStoreGrid(currentCat, currentQuery);
        });
    });
}

/* ---- PROFILE TABS ---- */
function initProfileTabs() {
    document.addEventListener('click', (e) => {
        const tab = e.target.closest('.prof-tab');
        if (tab) {
            document.querySelectorAll('.prof-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.prof-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab)?.classList.add('active');
        }
    });
}

/* ---- RENDER PROFILE ---- */
function renderProfileInfo() {
    if (!USER) {
        navigate('home');
        showToast('⚠️ กรุณาเข้าสู่ระบบก่อนดูโปรไฟล์', 'error');
        document.getElementById('loginModal').classList.add('show');
        return;
    }

    // Bind username, email and meta values
    const names = document.querySelectorAll('.profile-name');
    names.forEach(el => el.textContent = USER.username);

    const emailInput = document.querySelector('#tab-settings input[type="email"]');
    if (emailInput) emailInput.value = USER.email;

    const usernameInput = document.querySelector('#tab-settings input[type="text"]');
    if (usernameInput && usernameInput.value === 'XDNZ_Player') {
        usernameInput.value = USER.username;
    }

    const discordInputReal = document.querySelectorAll('#tab-settings .input-field')[2];
    if (discordInputReal) discordInputReal.value = USER.discord_id || '';

    updateBalance();
    renderKeys();
    renderHistory();
}

/* ---- RENDER KEYS ---- */
function renderKeys() {
    const container = document.getElementById('keysList');
    if (!container) return;

    if (!USER || !USER.keys || USER.keys.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">ไม่มีคีย์สคริปต์ที่ใช้งานอยู่</div>`;
        return;
    }

    container.innerHTML = USER.keys.map(k => `
        <div class="key-item">
            <div class="key-icon"><i class="fa-solid fa-key"></i></div>
            <div>
                <div class="key-name">${k.script}</div>
                <div class="key-meta">แผน: ${k.plan} &nbsp;·&nbsp; หมดอายุ: ${k.expires}</div>
            </div>
            <div class="key-code" onclick="copyKey('${k.code}')" title="คลิกเพื่อคัดลอก">
                ${k.code.substring(0, 12)}…
            </div>
            <span class="key-status ${k.status === 'active' ? 'key-active' : 'key-expired'}">
                ${k.status === 'active' ? '✓ ใช้งานได้' : '✗ หมดอายุ'}
            </span>
        </div>
    `).join('');
}

function copyKey(code) {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`📋 คัดลอกคีย์แล้ว: ${code}`, 'success');
}
window.copyKey = copyKey;

/* ---- RENDER HISTORY ---- */
function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;

    if (!USER || !USER.history || USER.history.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">ไม่มีประวัติการซื้อ</div>`;
        return;
    }

    container.innerHTML = USER.history.map(h => `
        <div class="hist-item">
            <div class="hist-emoji">${h.emoji || '🍇'}</div>
            <div>
                <div class="hist-name">${h.script}</div>
                <div class="hist-date"><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${h.date}</div>
            </div>
            <div class="hist-price">−฿ ${parseFloat(h.price).toFixed(2)}</div>
        </div>
    `).join('');
}

/* ---- BALANCE UPDATE ---- */
function updateBalance() {
    if (!USER) return;
    const fmt = `฿ ${parseFloat(USER.balance).toFixed(2)}`;
    const navBalAmt = document.getElementById('navBalanceAmt');
    const profBal = document.getElementById('profileBalance');
    const modalBalAmt = document.getElementById('modalBalanceAmt');
    const profPurchased = document.getElementById('profilePurchased');
    const profActiveKeys = document.getElementById('profileActiveKeys');

    if (navBalAmt) navBalAmt.textContent = fmt;
    if (profBal) profBal.textContent = fmt;
    if (modalBalAmt) modalBalAmt.textContent = fmt;
    if (profPurchased && USER.history) profPurchased.textContent = `${USER.history.length} รายการ`;
    if (profActiveKeys && USER.keys) {
        const activeCount = USER.keys.filter(k => k.status === 'active').length;
        profActiveKeys.textContent = `${activeCount} คีย์`;
    }
}

/* ---- LOGIN / LOGOUT / REGISTER UI ---- */
function updateAuthUI() {
    const navBal = document.getElementById('navBalance');
    const btnLogin = document.getElementById('btnNavLogin');
    const desktopNav = document.getElementById('desktopNav');

    // Remove any existing admin link
    const existingAdminLink = document.getElementById('adminNavLink');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }

    if (USER) {
        if (navBal) navBal.style.display = 'flex';
        updateBalance();
        
        // If user is admin, append a link to the admin panel
        if (USER.role === 'admin' && desktopNav) {
            const adminLink = document.createElement('a');
            adminLink.id = 'adminNavLink';
            adminLink.className = 'nav-link';
            adminLink.href = 'admin.html';
            adminLink.style.cursor = 'pointer';
            adminLink.innerHTML = `<i class="fa-solid fa-user-shield" style="color: var(--blue);"></i> หลังบ้านแอดมิน`;
            desktopNav.appendChild(adminLink);
        }
        
        if (btnLogin) {
            btnLogin.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> <span>ออกจากระบบ</span>`;
            // Remove previous listeners
            const newBtn = btnLogin.cloneNode(true);
            btnLogin.parentNode.replaceChild(newBtn, btnLogin);
            newBtn.addEventListener('click', doLogout);
        }
    } else {
        if (navBal) navBal.style.display = 'none';
        if (btnLogin) {
            btnLogin.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>เข้าสู่ระบบ</span>`;
            const newBtn = btnLogin.cloneNode(true);
            btnLogin.parentNode.replaceChild(newBtn, btnLogin);
            newBtn.addEventListener('click', () => {
                document.getElementById('loginModal').classList.add('show');
            });
        }
    }
}

function initLoginBtn() {
    // Backdrop click closures
    document.getElementById('loginModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') e.target.classList.remove('show');
    });
    document.getElementById('registerModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'registerModal') e.target.classList.remove('show');
    });
    document.getElementById('buyModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'buyModal') closeBuyModal();
    });
}

function showRegisterModal() {
    document.getElementById('loginModal')?.classList.remove('show');
    document.getElementById('registerModal')?.classList.add('show');
}
window.showRegisterModal = showRegisterModal;

function showLoginModal() {
    document.getElementById('registerModal')?.classList.remove('show');
    document.getElementById('loginModal')?.classList.add('show');
}
window.showLoginModal = showLoginModal;

async function doLogin() {
    const userVal = document.getElementById('loginUsername').value;
    const passVal = document.getElementById('loginPassword').value;

    if (!userVal || !passVal) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }

    try {
        const response = await fetch('api/auth.php?action=login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: userVal, password: passVal })
        });
        const res = await response.json();
        if (res.status === 'success') {
            USER = res.data;
            await loadUserKeysAndHistory();
            updateAuthUI();
            
            // Redirect admin to dashboard
            if (USER.role === 'admin') {
                showToast('👑 ยินดีต้อนรับแอดมิน! กำลังไปหน้าหลังบ้าน', 'success');
                setTimeout(() => window.location.href = 'admin.html', 1500);
            } else {
                showToast('✅ เข้าสู่ระบบสำเร็จ!', 'success');
            }
            
            document.getElementById('loginModal').classList.remove('show');
            // Clear forms
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดทางระบบ', 'error');
    }
}
window.doLogin = doLogin;

async function doRegister() {
    const userVal = document.getElementById('regUsername').value;
    const emailVal = document.getElementById('regEmail').value;
    const passVal = document.getElementById('regPassword').value;

    if (!userVal || !emailVal || !passVal) {
        showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }

    try {
        const response = await fetch('api/auth.php?action=register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: userVal, email: emailVal, password: passVal })
        });
        const res = await response.json();
        if (res.status === 'success') {
            showToast(res.message, 'success');
            document.getElementById('registerModal').classList.remove('show');
            document.getElementById('loginModal').classList.add('show');
            
            // Clear forms
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
    }
}
window.doRegister = doRegister;

async function doLogout() {
    try {
        const response = await fetch('api/auth.php?action=logout', {method: 'POST'});
        const res = await response.json();
        if (res.status === 'success') {
            USER = null;
            updateAuthUI();
            navigate('home');
            showToast('🚪 ออกจากระบบสำเร็จ', 'info');
        }
    } catch (e) {
        showToast('ออกจากระบบล้มเหลว', 'error');
    }
}
window.doLogout = doLogout;

// Save profile settings
async function saveProfile() {
    const usernameInput = document.querySelectorAll('#tab-settings .input-field')[0];
    const emailInput = document.querySelectorAll('#tab-settings .input-field')[1];
    const discordInput = document.querySelectorAll('#tab-settings .input-field')[2];
    const passwordInput = document.querySelectorAll('#tab-settings .input-field')[3];

    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const discord_id = discordInput ? discordInput.value.trim() : '';
    const new_password = passwordInput ? passwordInput.value.trim() : '';

    try {
        const response = await fetch('api/auth.php?action=update_profile', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, email, discord_id, new_password })
        });
        const res = await response.json();
        if (res.status === 'success') {
            showToast(res.message, 'success');
            if (passwordInput) passwordInput.value = ''; // clear password input
            await checkSession();
        } else {
            showToast(res.message, 'error');
        }
    } catch (e) {
        showToast('ไม่สามารถบันทึกข้อมูลตั้งค่าได้', 'error');
    }
}
// Map to button click
document.addEventListener('click', (e) => {
    if (e.target.closest('#tab-settings button.btn-primary')) {
        saveProfile();
    }
});

/* ---- TOAST ---- */
function showToast(msg, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}
window.showToast = showToast;

/* ---- HUB SITE REDESIGN ACTIONS ---- */
function copyLoaderScript() {
    const mainCode = document.querySelector('.main-code').innerText;
    navigator.clipboard.writeText(mainCode).then(() => {
        const feedback = document.getElementById('copy-feedback-loader');
        if (feedback) {
            feedback.style.display = 'block';
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 3000);
        }
        showToast('📋 คัดลอก Loader Script แล้ว!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
window.copyLoaderScript = copyLoaderScript;


/* ---- DASHBOARD INTERACTION ---- */
document.addEventListener('click', (e) => {
    const sideItem = e.target.closest('.side-item');
    if (sideItem) {
        const sidebar = sideItem.parentElement;
        sidebar.querySelectorAll('.side-item').forEach(item => item.classList.remove('active'));
        sideItem.classList.add('active');
        
        const tabText = sideItem.querySelector('span').childNodes[0].textContent.trim();
        const mainPanelHeader = document.querySelector('.info-panel .info-header span');
        const mainPanelContent = document.querySelector('.info-panel .info-content');
        
        if (mainPanelHeader && mainPanelContent) {
            mainPanelHeader.textContent = tabText;
            if (tabText === 'Info') {
                mainPanelContent.innerHTML = `
                    <p><strong>Owner:</strong> darkmxde.</p>
                    <p><strong>Developer:</strong> LilYouDev1997</p>
                    <p><strong>Discord:</strong> https://discord.gg/osxhub</p>
                    <div class="dash-btns">
                        <button onclick="window.open('https://t.me/yourtelegram', '_blank')">Join Telegram</button>
                        <button onclick="window.open('https://discord.gg/TmTcfuUZYV', '_blank')">Discord Server</button>
                    </div>
                `;
            } else {
                mainPanelContent.innerHTML = `
                    <p>ฟีเจอร์สำหรับกลุ่ม <strong>${tabText}</strong> กำลังโหลดจากระบบคลาวด์...</p>
                    <p style="color:var(--text-sec);font-style:italic;">ฟังก์ชันนี้ใช้งานได้ใน Executor เท่านั้น</p>
                `;
            }
        }
    }
});
