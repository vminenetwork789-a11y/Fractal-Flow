import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, translations, TranslationKey, LanguageOption } from './translations';
import { Globe } from 'lucide-react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  languages: LanguageOption[];
  currentLangMeta: LanguageOption;
}

const STORAGE_KEY = 'regen_flow_language_mode';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'th' || saved === 'en' || saved === 'zh') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'th'; // Default language is Thai
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // localStorage may fail in some iframe environments
    }
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const langDict = translations[language] || translations.th;
    const translated = (langDict as Record<string, string>)[key];
    if (translated) return translated;
    const thFallback = (translations.th as Record<string, string>)[key];
    if (thFallback) return thFallback;
    return fallback || key;
  };

  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((item) => item.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLangMeta,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Compact and elegant Language Selector Component with flags & native labels
 */
export const LanguageSelector: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { language, setLanguage, languages, currentLangMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} id="language-selector-dropdown" className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 text-xs font-medium transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        title="เปลี่ยนโหมดภาษา / Switch Language"
      >
        <span className="text-sm">{currentLangMeta.flag}</span>
        <span className="font-semibold">{currentLangMeta.code.toUpperCase()}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Language / ภาษา</span>
          </div>
          <div className="space-y-0.5">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  language === item.code
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{item.flag}</span>
                  <span>{item.nativeLabel}</span>
                </div>
                {language === item.code && <span className="text-[10px] text-amber-300 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
