import { useState } from 'react';
import { Check, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { currencies, type Currency } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function PricingSection() {
  const { t, currency, setCurrency, currencyInfo } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await apiRequest('POST', '/api/checkout', {
        priceId: currencyInfo.priceId,
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t.pricing.cta,
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="pricing">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-visible border-2 border-primary shadow-xl" data-testid="card-pricing">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-white px-4 py-1 text-sm font-medium">
                PRO
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-10 pb-6">
              <div className="flex items-center justify-center gap-2 mb-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs" data-testid="button-currency-selector">
                      {currencyInfo.code}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    {(Object.keys(currencies) as Currency[]).map((curr) => (
                      <DropdownMenuItem
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={currency === curr ? 'bg-accent' : ''}
                        data-testid={`menu-item-currency-${curr}`}
                      >
                        {currencies[curr].symbol} {currencies[curr].code}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                  {currencyInfo.symbol}
                </span>
                <span className="text-6xl font-bold text-gray-900 dark:text-white" data-testid="text-price">
                  {currencyInfo.price}
                </span>
                <span className="text-xl text-gray-500 dark:text-gray-400">
                  {currencyInfo.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pb-8">
              <ul className="space-y-4 mb-8">
                {t.pricing.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3" data-testid={`text-feature-${index}`}>
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full text-lg py-6" 
                size="lg" 
                data-testid="button-subscribe"
                onClick={handleSubscribe}
                disabled={isCheckingOut || authLoading}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  t.pricing.cta
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span>{t.pricing.secure}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
