import { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n';

const languages: Record<Language, { code: string; name: string }> = {
  pt: { code: 'PT', name: 'Português' },
  en: { code: 'EN', name: 'English' },
  fr: { code: 'FR', name: 'Français' },
};

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <a href="/" className="flex items-center" data-testid="link-logo">
            <img 
              src="/logo.svg" 
              alt="Hubisck" 
              width="300"
              height="109"
              className="w-[150px] h-auto dark:invert"
            />
          </a>

          <div className="flex items-center gap-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-language-selector">
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="font-medium">{languages[language].code}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(languages) as Language[]).map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={language === lang ? 'bg-accent' : ''}
                    data-testid={`menu-item-language-${lang}`}
                  >
                    <span className="font-medium text-primary mr-2">{languages[lang].code}</span>
                    {languages[lang].name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="/login">
              <Button variant="ghost" size="sm" data-testid="button-login">
                {t.nav.login}
              </Button>
            </a>
            <a href="/login">
              <Button size="sm" data-testid="button-signup">
                {t.nav.signup}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
