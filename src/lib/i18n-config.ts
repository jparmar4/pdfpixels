export type Locale = 'en' | 'es' | 'pt' | 'de' | 'fr';

export const locales: Locale[] = ['en', 'es', 'pt', 'de', 'fr'];

export const defaultLocale: Locale = 'en';

export interface Translations {
  nav: {
    home: string;
    tools: string;
    blog: string;
    useCases: string;
    contact: string;
    pricing: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    statsTools: string;
    statsUptime: string;
    statsCost: string;
    statsCostVal: string;
  };
  ui: {
    popular: string;
    ai: string;
    pro: string;
    free: string;
    noSignup: string;
    instant: string;
    searchPlaceholder: string;
    allTools: string;
    faq: string;
    about: string;
    keyFeatures: string;
    howToUse: string;
    relatedTools: string;
    relatedArticles: string;
    download: string;
    upload: string;
    sponsored: string;
  };
}

export const i18nTranslations: Record<Locale, Translations> = {
  en: {
    nav: {
      home: 'Home',
      tools: 'Tools',
      blog: 'Blog',
      useCases: 'Use Cases',
      contact: 'Contact',
      pricing: 'Pricing',
    },
    hero: {
      title: 'Premium PDF & Image Tools',
      subtitle: 'Try ',
      description: 'Compress, convert, and edit files in seconds with a clean, professional workflow.',
      ctaPrimary: 'Start with Compress PDF',
      ctaSecondary: 'Browse All Tools',
      statsTools: 'Free Tools',
      statsUptime: 'Uptime',
      statsCost: 'Cost',
      statsCostVal: 'Free',
    },
    ui: {
      popular: 'Popular',
      ai: 'AI',
      pro: 'Pro',
      free: 'Free',
      noSignup: 'No Signup',
      instant: 'Instant',
      searchPlaceholder: 'Search tools: compress pdf, merge pdf, resize image...',
      allTools: 'All Tools',
      faq: 'Frequently Asked Questions',
      about: 'About',
      keyFeatures: 'Key Features',
      howToUse: 'How to Use',
      relatedTools: 'Related Tools',
      relatedArticles: 'Related Articles',
      download: 'Download',
      upload: 'Upload',
      sponsored: 'Sponsored',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      tools: 'Herramientas',
      blog: 'Blog',
      useCases: 'Casos de Uso',
      contact: 'Contacto',
      pricing: 'Precios',
    },
    hero: {
      title: 'Herramientas Premium de PDF e Imágenes',
      subtitle: 'Prueba ',
      description: 'Comprime, convierte y edita archivos en segundos con un flujo de trabajo limpio y profesional.',
      ctaPrimary: 'Comenzar con Comprimir PDF',
      ctaSecondary: 'Ver todas las herramientas',
      statsTools: 'Herramientas gratuitas',
      statsUptime: 'Tiempo de actividad',
      statsCost: 'Costo',
      statsCostVal: 'Gratis',
    },
    ui: {
      popular: 'Popular',
      ai: 'IA',
      pro: 'Pro',
      free: 'Gratis',
      noSignup: 'Sin registro',
      instant: 'Instantáneo',
      searchPlaceholder: 'Buscar herramientas: comprimir pdf, unir pdf, redimensionar imagen...',
      allTools: 'Todas las herramientas',
      faq: 'Preguntas Frecuentes',
      about: 'Acerca de',
      keyFeatures: 'Características clave',
      howToUse: 'Cómo utilizar',
      relatedTools: 'Herramientas relacionadas',
      relatedArticles: 'Artículos relacionados',
      download: 'Descargar',
      upload: 'Subir',
      sponsored: 'Patrocinado',
    },
  },
  pt: {
    nav: {
      home: 'Início',
      tools: 'Ferramentas',
      blog: 'Blog',
      useCases: 'Casos de Uso',
      contact: 'Contato',
      pricing: 'Preços',
    },
    hero: {
      title: 'Ferramentas Premium de PDF e Imagem',
      subtitle: 'Experimente ',
      description: 'Comprima, converta e edite arquivos em segundos com um fluxo de trabalho limpo e profissional.',
      ctaPrimary: 'Começar com Comprimir PDF',
      ctaSecondary: 'Navegar por todas as ferramentas',
      statsTools: 'Ferramentas gratuitas',
      statsUptime: 'Tempo de atividade',
      statsCost: 'Custo',
      statsCostVal: 'Gratuito',
    },
    ui: {
      popular: 'Popular',
      ai: 'IA',
      pro: 'Pro',
      free: 'Gratuito',
      noSignup: 'Sem registro',
      instant: 'Instantâneo',
      searchPlaceholder: 'Buscar ferramentas: comprimir pdf, mesclar pdf, redimensionar imagem...',
      allTools: 'Todas as ferramentas',
      faq: 'Perguntas Frequentes',
      about: 'Sobre',
      keyFeatures: 'Principais recursos',
      howToUse: 'Como usar',
      relatedTools: 'Ferramentas relacionadas',
      relatedArticles: 'Artigos relacionados',
      download: 'Baixar',
      upload: 'Enviar',
      sponsored: 'Patrocinado',
    },
  },
  de: {
    nav: {
      home: 'Startseite',
      tools: 'Werkzeuge',
      blog: 'Blog',
      useCases: 'Anwendungsfälle',
      contact: 'Kontakt',
      pricing: 'Preise',
    },
    hero: {
      title: 'Premium PDF- & Bildwerkzeuge',
      subtitle: 'Probieren Sie ',
      description: 'Komprimieren, konvertieren und bearbeiten Sie Dateien in Sekundenschnelle mit einem sauberen, professionellen Workflow.',
      ctaPrimary: 'Mit PDF komprimieren starten',
      ctaSecondary: 'Alle Werkzeuge durchsuchen',
      statsTools: 'Kostenlose Tools',
      statsUptime: 'Betriebszeit',
      statsCost: 'Kosten',
      statsCostVal: 'Kostenlos',
    },
    ui: {
      popular: 'Beliebt',
      ai: 'KI',
      pro: 'Pro',
      free: 'Kostenlos',
      noSignup: 'Ohne Anmeldung',
      instant: 'Sofort',
      searchPlaceholder: 'Werkzeuge suchen: pdf komprimieren, pdf zusammenfügen...',
      allTools: 'Alle Werkzeuge',
      faq: 'Häufig gestellte Fragen',
      about: 'Über uns',
      keyFeatures: 'Hauptmerkmale',
      howToUse: 'Anleitung',
      relatedTools: 'Ähnliche Werkzeuge',
      relatedArticles: 'Verwandte Artikel',
      download: 'Herunterladen',
      upload: 'Hochladen',
      sponsored: 'Gesponsert',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      tools: 'Outils',
      blog: 'Blog',
      useCases: 'Cas d\'utilisation',
      contact: 'Contact',
      pricing: 'Tarifs',
    },
    hero: {
      title: 'Outils PDF et Image Premium',
      subtitle: 'Essayez ',
      description: 'Compressez, convertissez et modifiez vos fichiers en quelques secondes avec un flux de travail propre et professionnel.',
      ctaPrimary: 'Commencer par Compresser PDF',
      ctaSecondary: 'Parcourir tous les outils',
      statsTools: 'Outils gratuits',
      statsUptime: 'Disponibilité',
      statsCost: 'Coût',
      statsCostVal: 'Gratuit',
    },
    ui: {
      popular: 'Populaire',
      ai: 'IA',
      pro: 'Pro',
      free: 'Gratuit',
      noSignup: 'Sans inscription',
      instant: 'Instantané',
      searchPlaceholder: 'Rechercher des outils: compresser pdf, fusionner pdf...',
      allTools: 'Tous les outils',
      faq: 'Questions Fréquentes',
      about: 'À propos',
      keyFeatures: 'Caractéristiques principales',
      howToUse: 'Comment utiliser',
      relatedTools: 'Outils associés',
      relatedArticles: 'Articles associés',
      download: 'Télécharger',
      upload: 'Téléverser',
      sponsored: 'Sponsorisé',
    },
  },
};

export function getTranslation(locale: Locale): Translations {
  return i18nTranslations[locale] || i18nTranslations[defaultLocale];
}
