'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dictionaries } from '@/locales';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('th');
  const [mounted, setMounted] = useState(false);

  // Load preferred language from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('osx_shop_lang');
      if (savedLang === 'en' || savedLang === 'th') {
        setLangState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch (e) {
      console.warn('Could not read saved language:', e);
    }
    setMounted(true);
  }, []);

  // Update language
  const setLang = useCallback((newLang) => {
    if (newLang !== 'th' && newLang !== 'en') return;
    setLangState(newLang);
    try {
      localStorage.setItem('osx_shop_lang', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang;
      }
    } catch (e) {
      console.warn('Could not save language:', e);
    }
  }, []);

  // Toggle between Thai and English
  const toggleLang = useCallback(() => {
    setLang(lang === 'th' ? 'en' : 'th');
  }, [lang, setLang]);

  // Translate helper function with dot notation support: t('nav.home')
  const t = useCallback(
    (keyPath, fallback = '') => {
      if (!keyPath) return fallback;

      const keys = keyPath.split('.');
      
      // Try primary language
      let current = dictionaries[lang];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }

      if (current !== undefined && typeof current !== 'object') {
        return current;
      }

      // Fallback to Thai if not found
      if (lang !== 'th') {
        let fallbackObj = dictionaries['th'];
        for (const k of keys) {
          if (fallbackObj && typeof fallbackObj === 'object' && k in fallbackObj) {
            fallbackObj = fallbackObj[k];
          } else {
            fallbackObj = undefined;
            break;
          }
        }
        if (fallbackObj !== undefined && typeof fallbackObj !== 'object') {
          return fallbackObj;
        }
      }

      return fallback || keyPath;
    },
    [lang]
  );

  // Helper to get translated category name
  const getCategoryName = useCallback(
    (cat) => {
      if (!cat) return lang === 'th' ? 'หมวดหมู่' : 'Category';
      const name = typeof cat === 'string' ? cat : (cat.name || '');
      if (lang === 'en') {
        if (typeof cat === 'object' && cat?.name_en && cat.name_en.trim()) {
          return cat.name_en.trim();
        }
        const dict = dictionaries['en']?.categories;
        if (dict && dict[name]) {
          return dict[name];
        }
      }
      return name;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        getCategoryName,
        isTh: lang === 'th',
        isEn: lang === 'en',
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
