"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import ko from '../locales/ko.json';
import en from '../locales/en.json';

type Dictionary = typeof ko;
type Locale = 'ko' | 'en';

interface I18nContextType {
  locale: Locale;
  t: (path: string) => string;
  setLocale: (locale: Locale) => void;
}

const dictionaries: Record<Locale, any> = { ko, en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ko');

  const t = (path: string): string => {
    const keys = path.split('.');
    let result = dictionaries[locale];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; // Fallback to path string if not found
      }
    }

    return typeof result === 'string' ? result : path;
  };

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
