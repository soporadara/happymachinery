import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import type { Product } from '../components/CartDrawer'

interface StoreProps {
  onAddToCart: (product: Product) => void
  searchQuery: string
}

export default function Store({ searchQuery }: StoreProps) {
  const [searchParams] = useSearchParams()
  const searchParamValue = searchParams.get('search') || searchParams.get('q') || searchParams.get('category') || ''
  
  const effectiveSearch = useMemo(() => {
    return (searchParamValue || searchQuery || '').trim()
  }, [searchParamValue, searchQuery])

  useEffect(() => {
    const keepProductUrlClean = () => {
      const productHash = window.location.hash.match(/^#!\/(.+)\/p\/(\d+)$/)
      if (!productHash) return

      const [, productSlug, productId] = productHash
      const cleanProductPath = `/store/${productSlug}-p${productId}`
      window.history.replaceState(window.history.state, '', cleanProductPath)
    }

    window.addEventListener('hashchange', keepProductUrlClean)
    keepProductUrlClean()
    return () => window.removeEventListener('hashchange', keepProductUrlClean)
  }, [])

  useEffect(() => {
    const scriptId = 'ecwid-script';
    
    // Parse product ID from pathname if present (e.g. /store/some-product-p12345)
    const match = window.location.pathname.match(/-p(\d+)\/?$/);
    const productId = match ? match[1] : null;

    // Set global Ecwid configuration for dynamic loading in Single Page Apps
    (window as any).ecwid_script_defer = true;
    (window as any).ecwid_dynamic_widgets = true;
    (window as any)._xnext_initialization_scripts = (window as any)._xnext_initialization_scripts || [];
    
    const args = [
      "categoriesPerRow=3",
      "views=grid(20,3) list(60) table(60)",
      "categoryView=grid",
      "searchView=list",
      "id=my-store-80100025"
    ];

    if (productId) {
      args.push(`defaultProductId=${productId}`);
    } else if (effectiveSearch) {
      args.push(`defaultSearchKeyword=${effectiveSearch}`);
    }

    const initScript = {
      widgetType: 'ProductBrowser',
      id: 'my-store-80100025',
      arg: args
    };
    
    (window as any)._xnext_initialization_scripts.push(initScript);

    let pollingTimer: number | null = null;

    const triggerRedirectFallback = () => {
      const ecwid = (window as any).Ecwid;
      if (productId) {
        if (ecwid && typeof ecwid.openPage === 'function') {
          ecwid.openPage('product', { id: Number(productId) });
        }
      } else if (effectiveSearch) {
        if (ecwid && typeof ecwid.openPage === 'function') {
          ecwid.openPage('search', { keyword: effectiveSearch });
        }
      }
    };

    const runEcwidInit = () => {
      if (typeof (window as any).ecwid_onBodyDone === 'function') {
        try {
          (window as any).ecwid_onBodyDone();
          triggerRedirectFallback();
          return true;
        } catch (e) {
          console.error("Error executing ecwid_onBodyDone:", e);
        }
      }
      if (typeof (window as any).xProductBrowser === 'function') {
        try {
          (window as any).xProductBrowser(...args);
          triggerRedirectFallback();
          return true;
        } catch (e) {
          console.error("Error executing Ecwid xProductBrowser:", e);
        }
      }
      return false;
    };

    // If script is already cached/preloaded in memory, initialize immediately without delay!
    if (!runEcwidInit()) {
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          runEcwidInit();
        }, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://app.ecwid.com/script.js?80100025&data_platform=code";
        script.async = true;
        script.charset = 'utf-8';
        script.setAttribute('data-cfasync', 'false');
        script.onload = () => {
          runEcwidInit();
        };
        document.head.appendChild(script);
      }

      // High-frequency polling (every 30ms) to fire the microsecond Ecwid finishes loading
      let elapsed = 0;
      pollingTimer = window.setInterval(() => {
        elapsed += 30;
        if (runEcwidInit() || elapsed >= 4000) {
          if (pollingTimer) {
            window.clearInterval(pollingTimer);
            pollingTimer = null;
          }
        }
      }, 30);
    }

    return () => {
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
        pollingTimer = null;
      }
      // Clean up the initialization script queue
      if ((window as any)._xnext_initialization_scripts) {
        (window as any)._xnext_initialization_scripts = (window as any)._xnext_initialization_scripts.filter(
          (s: any) => s !== initScript
        );
      }
      // Clean up Ecwid widgets to avoid lingering event listeners and modals in SPA routing
      const ecwid = (window as any).Ecwid;
      if (ecwid && typeof ecwid.destroy === 'function') {
        try {
          ecwid.destroy();
        } catch (e) {
          console.error("Error destroying Ecwid widget:", e);
        }
      }
    };
  }, []);

  useEffect(() => {
    const keyword = effectiveSearch
    if (!keyword) return

    // Immediately sync hash for Ecwid SPA router fallback
    window.location.hash = '!/~/search/keyword=' + encodeURIComponent(keyword)

    const scrollToStore = () => {
      const storeEl = document.getElementById('my-store-80100025')
      if (storeEl) {
        const headerOffset = 90
        const elementPosition = storeEl.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        })
      }
    }

    let attempts = 0
    const openSearch = () => {
      const ecwid = (window as any).Ecwid
      if (typeof ecwid?.openPage === 'function') {
        try {
          ecwid.openPage('search', { keyword })
        } catch (e) {
          console.warn('Ecwid openPage search error:', e)
        }
        setTimeout(scrollToStore, 80)
        setTimeout(scrollToStore, 350)
        setTimeout(scrollToStore, 800)
        return true
      }
      return false
    }

    if (openSearch()) return

    const searchTimer = window.setInterval(() => {
      attempts += 1
      if (openSearch() || attempts >= 40) {
        window.clearInterval(searchTimer)
        scrollToStore()
      }
    }, 150)

    return () => window.clearInterval(searchTimer)
  }, [effectiveSearch])

  return (
    <div className="page store-page">
      <PageBanner
        badgeText="OFFICIAL TYPHON CATALOG"
        eyebrow="EQUIPMENT & ATTACHMENT INVENTORY"
        title="Skid Steers & Heavy Equipment"
        titleHighlight="Ready for Dispatch"
        description="Explore genuine TYPHON machinery, Kubota-powered track loaders, mini excavators, hydraulic attachments, and OEM spare parts selected for dependable daily performance."
        features={[
          { icon: '⚡', text: '25 HP Kubota EPA Diesel' },
          { icon: '⚖️', text: '1,102 lb (500 kg) Max Load' },
          { icon: '🛡️', text: '1-Year Major Parts Warranty' },
          { icon: '🚚', text: 'Fast Nationwide USA Delivery' }
        ]}
        showColorOptions={true}
        imageSrc="/images/v900-promo.webp"
        imageAlt="TYPHON V900 Skid Steer Loader in Industrial Yellow, Crimson Red, and Cobalt Blue"
      />

      {/* Ecwid Store Integration Element */}
      <div id="my-store-80100025" className="ecwid-store-container"></div>
    </div>
  )
}
