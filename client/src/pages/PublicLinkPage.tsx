import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { LinkPage, Link } from '@shared/schema';

interface PublicPageData {
  page: LinkPage;
  links: Link[];
}

export default function PublicLinkPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<PublicPageData>({
    queryKey: ['/api/p', slug],
    queryFn: async () => {
      const response = await fetch(`/api/p/${slug}`);
      if (!response.ok) {
        throw new Error('Page not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Add Google Tag Manager if configured
  useEffect(() => {
    if (data?.page.gtmContainerId) {
      const gtmId = data.page.gtmContainerId;
      
      // Validate GTM ID format (GTM-XXXXXXX)
      if (!/^GTM-[A-Z0-9]{4,12}$/i.test(gtmId)) {
        console.warn('Invalid GTM Container ID format');
        return;
      }

      // GTM Head Script - uses custom data attribute for tracking
      const headScript = document.createElement('script');
      headScript.setAttribute('data-hubisck-gtm', 'head');
      headScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;
        j.setAttribute('data-hubisck-gtm-external', 'true');
        f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(headScript);

      // GTM Body noscript (as iframe fallback)
      const noscript = document.createElement('noscript');
      noscript.setAttribute('data-hubisck-gtm', 'body');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);

      return () => {
        // Clean up ALL GTM scripts on unmount to prevent leakage between pages
        const gtmHeadScript = document.querySelector('[data-hubisck-gtm="head"]');
        const gtmBodyNoscript = document.querySelector('[data-hubisck-gtm="body"]');
        const gtmExternalScript = document.querySelector('[data-hubisck-gtm-external="true"]');
        
        if (gtmHeadScript) gtmHeadScript.remove();
        if (gtmBodyNoscript) gtmBodyNoscript.remove();
        if (gtmExternalScript) gtmExternalScript.remove();
        
        // Also clear dataLayer to prevent data leakage
        if ((window as any).dataLayer) {
          (window as any).dataLayer = [];
        }
      };
    }
  }, [data?.page.gtmContainerId]);

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      await fetch(`/api/click/${linkId}`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to track click');
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <LinkIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 text-center mb-6">This link page doesn't exist or has been removed.</p>
        <a 
          href="/" 
          className="text-primary hover:underline font-medium"
          data-testid="link-go-home"
        >
          Create your own Hubisck page
        </a>
      </div>
    );
  }

  const { page, links } = data;

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
    >
      <div className="max-w-md mx-auto">
        {/* Profile */}
        <div className="text-center mb-8" style={{ color: page.textColor || '#FFFFFF' }}>
          {(page.coverArtUrl || page.avatarUrl) ? (
            <img 
              src={(page.coverArtUrl || page.avatarUrl) as string} 
              alt={page.title}
              className="w-200 h-200 mx-auto mb-4 object-cover border-4 border-white/30"
            />
          ) : (
            <div 
              className="w-200 h-200 mx-auto mb-4 bg-white/20 flex items-center justify-center text-4xl font-bold"
            >
              {page.title[0]}
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">{page.title}</h1>
          {page.bio && (
            <p className="opacity-90 max-w-xs mx-auto" data-testid="text-page-bio">{page.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className="w-full bg-white/20 backdrop-blur-sm rounded-xl py-4 px-6 flex items-center justify-between gap-4 hover:bg-white/30 transition-colors group"
              style={{ color: page.textColor || '#FFFFFF' }}
              data-testid={`link-button-${link.id}`}
            >
              <span className="font-medium truncate">{link.title}</span>
              <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center" style={{ color: page.textColor || '#FFFFFF' }}>
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
            data-testid="link-powered-by"
          >
            <div className="w-5 h-5 bg-white/30 rounded flex items-center justify-center">
              <LinkIcon className="w-3 h-3" />
            </div>
            Powered by Hubisck
          </a>
        </div>
      </div>
    </div>
  );
}
