'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Safe JSON fetcher that won't throw on HTML / 500 error responses
const safeJsonFetch = async (url, options) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total_users: 5458, total_sold: 0 });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch scripts & categories list
  const loadScripts = async () => {
    try {
      const data = await safeJsonFetch(`/api/scripts.php?action=list&_t=${Date.now()}`);
      if (data && data.status === 'success' && data.data) {
        setScripts(data.data.scripts || []);
        setCategories(data.data.categories || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      }
    } catch (e) {
      console.warn('Could not load scripts:', e);
    }
  };

  // Fetch user profile keys & history
  const loadUserKeysAndHistory = async (currentUser) => {
    if (!currentUser) return;
    try {
      const [keysRes, histRes] = await Promise.all([
        safeJsonFetch(`/api/scripts.php?action=user_keys&_t=${Date.now()}`),
        safeJsonFetch(`/api/scripts.php?action=user_history&_t=${Date.now()}`),
      ]);
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          keys: keysRes?.status === 'success' ? keysRes.data : [],
          history: histRes?.status === 'success' ? histRes.data : [],
        };
      });
    } catch (e) {
      console.warn('Error fetching user meta:', e);
    }
  };

  // Check auth session status
  const checkSession = async () => {
    try {
      const data = await safeJsonFetch('/api/auth.php?action=status');
      if (data && data.status === 'success') {
        setUser(data.data);
        await loadUserKeysAndHistory(data.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Session check error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const login = async (username, password) => {
    try {
      const data = await safeJsonFetch('/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (data && data.status === 'success') {
        setUser(data.data);
        showToast('🔓 เข้าสู่ระบบสำเร็จ!', 'success');
        setIsLoginOpen(false);
        await loadUserKeysAndHistory(data.data);
        return { success: true };
      } else {
        const msg = data?.message || 'เกิดข้อผิดพลาด หรือเซิร์ฟเวอร์ฐานข้อมูลยังไม่พร้อมใช้งาน';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
    } catch (e) {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
      return { success: false };
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    try {
      const data = await safeJsonFetch('/api/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (data && data.status === 'success') {
        showToast('📝 สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
        setIsRegisterOpen(false);
        setIsLoginOpen(true);
        return { success: true };
      } else {
        const msg = data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
    } catch (e) {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
      return { success: false };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      const data = await safeJsonFetch('/api/auth.php?action=logout');
      if (data && data.status === 'success') {
        setUser(null);
        showToast('🔒 ออกจากระบบเรียบร้อยแล้ว', 'info');
        window.location.href = '/';
      }
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  // Initialize
  useEffect(() => {
    loadScripts();
    checkSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        scripts,
        categories,
        stats,
        isLoginOpen,
        setIsLoginOpen,
        isRegisterOpen,
        setIsRegisterOpen,
        loading,
        toasts,
        showToast,
        login,
        register,
        logout,
        checkSession,
        loadScripts,
      }}
    >
      {children}

      {/* Global Toast Container (Mobile Responsive) */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              t.type === 'success'
                ? 'bg-[#0a1f18]/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : t.type === 'error'
                ? 'bg-[#200d11]/90 text-rose-300 border-rose-500/40 shadow-rose-950/40'
                : 'bg-[#0d1626]/90 text-slate-200 border-slate-700/50 shadow-black/40'
            }`}
          >
            {t.type === 'success' && <span className="text-base">✅</span>}
            {t.type === 'error' && <span className="text-base">❌</span>}
            {t.type === 'info' && <span className="text-base">ℹ️</span>}
            <span className="flex-1 break-words leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
