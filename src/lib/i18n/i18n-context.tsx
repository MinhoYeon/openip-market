"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ko from '../../locales/ko.json';
import en from '../../locales/en.json';

type Locale = 'ko' | 'en';
type Translations = typeof ko;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Locale, any> = { ko, en };

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('ko');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'ko' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let result = translations[locale];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; // Return key if not found
      }
    }

    return typeof result === 'string' ? result : path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
