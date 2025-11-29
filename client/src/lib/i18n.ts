export type Language = 'pt' | 'en' | 'fr';
export type Currency = 'BRL' | 'EUR' | 'USD';

export interface CurrencyInfo {
  symbol: string;
  code: Currency;
  price: string;
  period: string;
  priceId: string;
}

export const currencies: Record<Currency, CurrencyInfo> = {
  BRL: { symbol: 'R$', code: 'BRL', price: '19,99', period: '/mês', priceId: 'price_1SY85uDCM0yp0jAABGJW2dpT' },
  EUR: { symbol: '€', code: 'EUR', price: '19.99', period: '/month', priceId: 'price_1SY85uDCM0yp0jAA8e1JFV4P' },
  USD: { symbol: '$', code: 'USD', price: '19.99', period: '/month', priceId: 'price_1SY85uDCM0yp0jAAvHYOzP2H' },
};

export const translations = {
  pt: {
    nav: {
      login: 'Login',
      signup: 'Cadastre-se',
      dashboard: 'Painel',
      myPages: 'Minhas Páginas',
      settings: 'Configurações',
      googleAds: 'Google Ads',
      logout: 'Sair',
    },
    dashboard: {
      welcome: 'Bem-vindo(a) de volta',
      subscription: {
        active: 'Plano Ativo',
        inactive: 'Sem assinatura',
        monthly: 'Mensal',
        price: '/mês',
      },
      stats: {
        totalPages: 'Total de Páginas',
        totalClicks: 'Total de Cliques',
      },
      pages: {
        title: 'Minhas Páginas',
        createNew: 'Criar Nova Página',
        empty: 'Você ainda não tem páginas. Crie sua primeira página!',
        edit: 'Editar',
        delete: 'Excluir',
        preview: 'Visualizar',
        analytics: 'Análises',
        copyLink: 'Copiar Link',
      },
      pageTypes: {
        standard: 'Página Padrão',
        smartLink: 'Smart Link',
      },
      createOptions: {
        standardTitle: 'Página Padrão',
        standardDescription: 'Crie uma página de links simples',
        smartLinkTitle: 'Smart Link',
        smartLinkDescription: 'Crie uma página de streaming para músicas',
      },
      streamingLinks: {
        title: 'Links de Streaming',
        spotify: 'Spotify',
        soundcloud: 'SoundCloud',
        youtube: 'YouTube',
        netease: 'NetEase',
        deezer: 'Deezer',
        appleMusic: 'Apple Music',
        tidal: 'Tidal',
        amazonMusic: 'Amazon Music',
        addCustom: 'Adicionar Link Personalizado',
      },
      googleAds: {
        title: 'Google Tag Manager',
        description: 'Configure o GTM para remarketing e analytics nas suas páginas',
        pixelId: 'GTM Container ID',
        pixelPlaceholder: 'Ex: GTM-XXXXXXX',
        connect: 'Configurar Google Tag Manager',
        status: 'Status da Integração',
        active: 'Ativo',
        inactive: 'Não configurado',
      },
      smartLinkWizard: {
        gtmStep: 'Google Tag Manager',
        gtmLabel: 'GTM Container ID (opcional)',
        gtmPlaceholder: 'GTM-XXXXXXX',
        gtmHelperText: 'Adicione seu GTM Container ID para habilitar remarketing e analytics na sua página. Configure tracking de conversão, remarketing do Google Ads e muito mais através do seu painel GTM.',
      },
    },
    hero: {
      title: 'Crie sua página de links personalizada e impulsione seu público com',
      highlight: 'remarketing inteligente!',
      description: 'Hubisck é uma ferramenta simples para centralizar seus links de redes sociais, sites e conteúdos em um só lugar. Aumente o engajamento e alcance mais pessoas com análises integradas e suporte a anúncios via Google Ads.',
      cta: 'Comece Agora',
      ctaSecondary: 'Saiba Mais',
      trustBadge: 'Pagamento seguro via Stripe',
    },
    benefits: {
      title: 'Por que escolher o Hubisck?',
      subtitle: 'Ferramentas poderosas para impulsionar sua presença online',
      items: [
        {
          title: 'Fácil de Usar',
          description: 'Crie e personalize sua página de links em minutos, sem necessidade de conhecimento técnico.',
        },
        {
          title: 'Multilíngue e Global',
          description: 'Suporte completo para Português, Inglês e Francês. Alcance seu público em qualquer lugar.',
        },
        {
          title: 'Remarketing via Google Ads',
          description: 'Adicione anúncios personalizados para retargeting de visitantes e aumente suas conversões.',
        },
        {
          title: 'Análises Integradas',
          description: 'Acompanhe métricas de cliques, engajamento e comportamento do seu público em tempo real.',
        },
        {
          title: 'Design Responsivo',
          description: 'Sua página fica perfeita em qualquer dispositivo: desktop, tablet ou smartphone.',
        },
        {
          title: 'Totalmente Customizável',
          description: 'Personalize cores, fontes e layout para combinar com sua marca e identidade visual.',
        },
      ],
    },
    pricing: {
      title: 'Plano Simples e Transparente',
      subtitle: 'Tudo que você precisa por um preço único',
      features: [
        'Página de links ilimitada',
        'Análises completas de engajamento',
        'Suporte a remarketing Google Ads',
        'Design customizável',
        'Suporte multilíngue (PT, EN, FR)',
        'Suporte prioritário 24/7',
      ],
      cta: 'Assine Agora',
      secure: 'Pagamento seguro e recorrente via Stripe',
      perMonth: '/mês',
    },
    footer: {
      tagline: 'Centralize seus links. Amplie seu alcance.',
      links: {
        terms: 'Termos de Serviço',
        privacy: 'Política de Privacidade',
        contact: 'Contato',
      },
      copyright: '© 2025 Hubisck - Todos os direitos reservados.',
    },
  },
  en: {
    nav: {
      login: 'Login',
      signup: 'Sign Up',
      dashboard: 'Dashboard',
      myPages: 'My Pages',
      settings: 'Settings',
      googleAds: 'Google Ads',
      logout: 'Logout',
    },
    dashboard: {
      welcome: 'Welcome back',
      subscription: {
        active: 'Active Plan',
        inactive: 'No subscription',
        monthly: 'Monthly',
        price: '/month',
      },
      stats: {
        totalPages: 'Total Pages',
        totalClicks: 'Total Clicks',
      },
      pages: {
        title: 'My Pages',
        createNew: 'Create New Page',
        empty: 'You don\'t have any pages yet. Create your first page!',
        edit: 'Edit',
        delete: 'Delete',
        preview: 'Preview',
        analytics: 'Analytics',
        copyLink: 'Copy Link',
      },
      pageTypes: {
        standard: 'Standard Page',
        smartLink: 'Smart Link',
      },
      createOptions: {
        standardTitle: 'Standard Page',
        standardDescription: 'Create a simple link page',
        smartLinkTitle: 'Smart Link',
        smartLinkDescription: 'Create a streaming page for music',
      },
      streamingLinks: {
        title: 'Streaming Links',
        spotify: 'Spotify',
        soundcloud: 'SoundCloud',
        youtube: 'YouTube',
        netease: 'NetEase',
        deezer: 'Deezer',
        appleMusic: 'Apple Music',
        tidal: 'Tidal',
        amazonMusic: 'Amazon Music',
        addCustom: 'Add Custom Link',
      },
      googleAds: {
        title: 'Google Tag Manager',
        description: 'Configure GTM for remarketing and analytics on your pages',
        pixelId: 'GTM Container ID',
        pixelPlaceholder: 'e.g., GTM-XXXXXXX',
        connect: 'Configure Google Tag Manager',
        status: 'Integration Status',
        active: 'Active',
        inactive: 'Not set',
      },
      smartLinkWizard: {
        gtmStep: 'Google Tag Manager',
        gtmLabel: 'GTM Container ID (optional)',
        gtmPlaceholder: 'GTM-XXXXXXX',
        gtmHelperText: 'Add your Google Tag Manager container ID to enable remarketing and analytics on your landing page. You can configure conversion tracking, Google Ads remarketing, and more through your GTM dashboard.',
      },
    },
    hero: {
      title: 'Create your personalized link page and boost your audience with',
      highlight: 'smart remarketing!',
      description: 'Hubisck is a simple tool to centralize your social media links, websites, and content in one place. Increase engagement and reach more people with integrated analytics and Google Ads support.',
      cta: 'Get Started',
      ctaSecondary: 'Learn More',
      trustBadge: 'Secure payment via Stripe',
    },
    benefits: {
      title: 'Why Choose Hubisck?',
      subtitle: 'Powerful tools to boost your online presence',
      items: [
        {
          title: 'Easy to Use',
          description: 'Create and customize your link page in minutes, no technical knowledge required.',
        },
        {
          title: 'Multilingual & Global',
          description: 'Full support for Portuguese, English, and French. Reach your audience anywhere.',
        },
        {
          title: 'Remarketing via Google Ads',
          description: 'Add personalized ads for visitor retargeting and increase your conversions.',
        },
        {
          title: 'Integrated Analytics',
          description: 'Track clicks, engagement, and audience behavior metrics in real-time.',
        },
        {
          title: 'Responsive Design',
          description: 'Your page looks perfect on any device: desktop, tablet, or smartphone.',
        },
        {
          title: 'Fully Customizable',
          description: 'Personalize colors, fonts, and layout to match your brand and visual identity.',
        },
      ],
    },
    pricing: {
      title: 'Simple & Transparent Pricing',
      subtitle: 'Everything you need at one price',
      features: [
        'Unlimited link page',
        'Complete engagement analytics',
        'Google Ads remarketing support',
        'Customizable design',
        'Multilingual support (PT, EN, FR)',
        'Priority 24/7 support',
      ],
      cta: 'Subscribe Now',
      secure: 'Secure and recurring payment via Stripe',
      perMonth: '/month',
    },
    footer: {
      tagline: 'Centralize your links. Expand your reach.',
      links: {
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        contact: 'Contact',
      },
      copyright: '© 2025 Hubisck - All rights reserved.',
    },
  },
  fr: {
    nav: {
      login: 'Connexion',
      signup: "S'inscrire",
      dashboard: 'Tableau de bord',
      myPages: 'Mes Pages',
      settings: 'Paramètres',
      googleAds: 'Google Ads',
      logout: 'Déconnexion',
    },
    dashboard: {
      welcome: 'Bon retour',
      subscription: {
        active: 'Plan Actif',
        inactive: 'Pas d\'abonnement',
        monthly: 'Mensuel',
        price: '/mois',
      },
      stats: {
        totalPages: 'Total des Pages',
        totalClicks: 'Total des Clics',
      },
      pages: {
        title: 'Mes Pages',
        createNew: 'Créer une Nouvelle Page',
        empty: 'Vous n\'avez pas encore de pages. Créez votre première page !',
        edit: 'Modifier',
        delete: 'Supprimer',
        preview: 'Aperçu',
        analytics: 'Analyses',
        copyLink: 'Copier le Lien',
      },
      pageTypes: {
        standard: 'Page Standard',
        smartLink: 'Smart Link',
      },
      createOptions: {
        standardTitle: 'Page Standard',
        standardDescription: 'Créer une page de liens simple',
        smartLinkTitle: 'Smart Link',
        smartLinkDescription: 'Créer une page de streaming pour la musique',
      },
      streamingLinks: {
        title: 'Liens de Streaming',
        spotify: 'Spotify',
        soundcloud: 'SoundCloud',
        youtube: 'YouTube',
        netease: 'NetEase',
        deezer: 'Deezer',
        appleMusic: 'Apple Music',
        tidal: 'Tidal',
        amazonMusic: 'Amazon Music',
        addCustom: 'Ajouter un Lien Personnalisé',
      },
      googleAds: {
        title: 'Google Tag Manager',
        description: 'Configurez GTM pour le remarketing et les analyses sur vos pages',
        pixelId: 'GTM Container ID',
        pixelPlaceholder: 'Ex: GTM-XXXXXXX',
        connect: 'Configurer Google Tag Manager',
        status: 'Statut de l\'Intégration',
        active: 'Actif',
        inactive: 'Non configuré',
      },
      smartLinkWizard: {
        gtmStep: 'Google Tag Manager',
        gtmLabel: 'GTM Container ID (optionnel)',
        gtmPlaceholder: 'GTM-XXXXXXX',
        gtmHelperText: 'Ajoutez votre GTM Container ID pour activer le remarketing et les analyses sur votre page. Configurez le suivi des conversions, le remarketing Google Ads et plus encore via votre tableau de bord GTM.',
      },
    },
    hero: {
      title: 'Créez votre page de liens personnalisée et boostez votre audience avec un',
      highlight: 'remarketing intelligent !',
      description: "Hubisck est un outil simple pour centraliser vos liens de réseaux sociaux, sites web et contenus en un seul endroit. Augmentez l'engagement et touchez plus de personnes avec des analyses intégrées et le support Google Ads.",
      cta: 'Commencer',
      ctaSecondary: 'En Savoir Plus',
      trustBadge: 'Paiement sécurisé via Stripe',
    },
    benefits: {
      title: 'Pourquoi Choisir Hubisck ?',
      subtitle: 'Des outils puissants pour booster votre présence en ligne',
      items: [
        {
          title: 'Facile à Utiliser',
          description: 'Créez et personnalisez votre page de liens en quelques minutes, sans connaissances techniques.',
        },
        {
          title: 'Multilingue et Global',
          description: 'Support complet pour le Portugais, Anglais et Français. Atteignez votre audience partout.',
        },
        {
          title: 'Remarketing via Google Ads',
          description: 'Ajoutez des annonces personnalisées pour le reciblage des visiteurs et augmentez vos conversions.',
        },
        {
          title: 'Analyses Intégrées',
          description: "Suivez les clics, l'engagement et le comportement de votre audience en temps réel.",
        },
        {
          title: 'Design Responsive',
          description: "Votre page est parfaite sur n'importe quel appareil : ordinateur, tablette ou smartphone.",
        },
        {
          title: 'Entièrement Personnalisable',
          description: 'Personnalisez les couleurs, polices et mise en page pour correspondre à votre marque.',
        },
      ],
    },
    pricing: {
      title: 'Tarification Simple et Transparente',
      subtitle: "Tout ce dont vous avez besoin à un prix unique",
      features: [
        'Page de liens illimitée',
        "Analyses complètes d'engagement",
        'Support remarketing Google Ads',
        'Design personnalisable',
        'Support multilingue (PT, EN, FR)',
        'Support prioritaire 24/7',
      ],
      cta: "S'abonner Maintenant",
      secure: 'Paiement sécurisé et récurrent via Stripe',
      perMonth: '/mois',
    },
    footer: {
      tagline: 'Centralisez vos liens. Élargissez votre portée.',
      links: {
        terms: "Conditions d'Utilisation",
        privacy: 'Politique de Confidentialité',
        contact: 'Contact',
      },
      copyright: '© 2025 Hubisck - Tous droits réservés.',
    },
  },
};

export function detectLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('fr')) return 'fr';
  return 'en';
}

export function detectCurrency(): Currency {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.includes('br') || browserLang.startsWith('pt-br')) return 'BRL';
  if (browserLang.includes('fr') || browserLang.includes('de') || browserLang.includes('es') || browserLang.includes('it')) return 'EUR';
  return 'USD';
}
