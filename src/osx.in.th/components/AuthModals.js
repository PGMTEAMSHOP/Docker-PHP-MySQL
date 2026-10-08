'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export function AuthModals() {
  const {
    isLoginOpen,
    setIsLoginOpen,
    isRegisterOpen,
    setIsRegisterOpen,
    login,
    register,
  } = useAuth();

  const { t, lang, setLang } = useLanguage();

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;
    setLoading(true);
    await login(loginUser, loginPass);
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUser || !regEmail || !regPass) {
      alert(t('auth.validation.allFieldsRequired'));
      return;
    }

    if (/\s/.test(regUser)) {
      alert(t('auth.validation.userNoSpaces'));
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(regUser)) {
      alert(t('auth.validation.userCharsOnly'));
      return;
    }

    if (regUser.length < 3 || regUser.length > 30) {
      alert(t('auth.validation.userLength'));
      return;
    }

    setLoading(true);
    const res = await register(regUser, regEmail, regPass);
    setLoading(false);
    if (res.success) {
      setRegUser('');
      setRegEmail('');
      setRegPass('');
    }
  };

  if (!isLoginOpen && !isRegisterOpen) return null;

  return (
    <>
      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-overlay p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-modal-in">
            {/* Modal Header Bar with Language Switcher & Close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center bg-[#090d16] border border-slate-800/90 rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setLang('th')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lang === 'th'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="ภาษาไทย"
                >
                  <span>🇹🇭</span>
                  <span>TH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="English"
                >
                  <span>🇺🇸</span>
                  <span>EN</span>
                </button>
              </div>

              <button
                onClick={() => setIsLoginOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                aria-label={t('auth.close')}
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-bold mb-6 text-center text-white">
              <span className="text-blue-500">{t('auth.loginTitle')}</span> OSX HUB
            </h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('auth.usernameOrEmail')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('auth.usernameOrEmailPlaceholder')}
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors mt-2 shadow-lg shadow-blue-900/20"
              >
                {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="absolute bg-[#0f172a] px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'หรือ' : 'OR'}
                </span>
              </div>

              <a
                href="/api/discord-login.php"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-black py-2.5 px-4 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 active:scale-95 cursor-pointer select-none"
              >
                <i className="fa-brands fa-discord text-base"></i> {lang === 'th' ? 'เข้าสู่ระบบด้วย Discord' : 'Sign in with Discord'}
              </a>
            </form>
            <p className="text-center text-xs text-slate-400 mt-6">
              {t('auth.noAccount')}{' '}
              <button
                onClick={() => {
                  setIsLoginOpen(false);
                  setIsRegisterOpen(true);
                }}
                className="text-blue-400 hover:underline font-medium"
              >
                {t('auth.registerNow')}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-overlay p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-modal-in">
            {/* Modal Header Bar with Language Switcher & Close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center bg-[#090d16] border border-slate-800/90 rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setLang('th')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lang === 'th'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="ภาษาไทย"
                >
                  <span>🇹🇭</span>
                  <span>TH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="English"
                >
                  <span>🇺🇸</span>
                  <span>EN</span>
                </button>
              </div>

              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                aria-label={t('auth.close')}
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-bold mb-6 text-center text-white">
              <span className="text-blue-500">{t('auth.registerTitle')}</span> OSX HUB
            </h2>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('auth.username')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('auth.usernamePlaceholder')}
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {lang === 'th'
                    ? '* ภาษาอังกฤษ ตัวเลข และ _ หรือ - (3-30 ตัวอักษร ห้ามใช้ภาษาไทย/เว้นวรรค)'
                    : '* English letters, numbers, and _ or - (3-30 characters, no spaces)'}
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('auth.password')}</label>
                <input
                  type="password"
                  required
                  placeholder={lang === 'th' ? 'ขั้นต่ำ 6 ตัวอักษร' : 'Minimum 6 characters'}
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="w-full bg-[#090d16] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors mt-2 shadow-lg shadow-blue-900/20"
              >
                {loading ? t('auth.registering') : t('auth.registerBtn')}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="absolute bg-[#0f172a] px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {lang === 'th' ? 'หรือ' : 'OR'}
                </span>
              </div>

              <a
                href="/api/discord-login.php"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-black py-2.5 px-4 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 active:scale-95 cursor-pointer select-none"
              >
                <i className="fa-brands fa-discord text-base"></i> {lang === 'th' ? 'สมัครใช้งานด้วย Discord' : 'Sign up with Discord'}
              </a>
            </form>
            <p className="text-center text-xs text-slate-400 mt-6">
              {t('auth.haveAccount')}{' '}
              <button
                onClick={() => {
                  setIsRegisterOpen(false);
                  setIsLoginOpen(true);
                }}
                className="text-blue-400 hover:underline font-medium"
              >
                {t('auth.loginNow')}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
