import { ArrowRight, Shield, Smartphone, BarChart3, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex items-center pt-20 pb-16 bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
                {t.hero.title}{' '}
                <span className="text-primary">{t.hero.highlight}</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {t.hero.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8" data-testid="button-hero-cta">
                {t.hero.cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" data-testid="button-hero-secondary">
                {t.hero.ctaSecondary}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4 text-green-500" />
              <span>{t.hero.trustBadge}</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    H
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">@hubisck_user</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Digital Creator</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Globe, label: 'Website', color: 'bg-blue-500' },
                    { icon: BarChart3, label: 'Analytics Dashboard', color: 'bg-green-500' },
                    { icon: Smartphone, label: 'Download App', color: 'bg-purple-500' },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover-elevate cursor-pointer transition-all"
                    >
                      <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total clicks</span>
                    <span className="font-semibold text-primary">12,847</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
