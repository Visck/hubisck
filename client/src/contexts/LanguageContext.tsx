import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, type Currency, detectLanguage, detectCurrency, translations, currencies } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: typeof translations['en'];
  currencyInfo: typeof currencies['USD'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => detectLanguage());
  const [currency, setCurrency] = useState<Currency>(() => detectCurrency());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    async function fetchGeolocation() {
      try {
        const response = await fetch('/api/geolocation');
        if (response.ok) {
          const data = await response.json() as { currency: Currency };
          if (data.currency && currencies[data.currency]) {
            setCurrency(data.currency);
          }
        }
      } catch (error) {
        console.log('Using browser-based currency detection');
      }
    }
    fetchGeolocation();
  }, []);

  const t = translations[language];
  const currencyInfo = currencies[currency];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency, t, currencyInfo }}>
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
