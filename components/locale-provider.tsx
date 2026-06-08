"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isLanguage, type Language } from "@/lib/i18n";

const STORAGE_KEY = "reparnova-language";

type LocaleContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  isReady: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLanguage(stored)) {
    return stored;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("ar")) return "ar";
  if (browserLanguage.startsWith("fr")) return "fr";
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setLanguage(resolveInitialLanguage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      setLanguage,
      isRTL: language === "ar",
      isReady,
    }),
    [isReady, language],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider.");
  }

  return context;
}
