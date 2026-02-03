import { useEffect } from 'react';

const GA_TRACKING_ID =
  import.meta.env.VITE_GA_TRACKING_ID ||
  import.meta.env.NEXT_PUBLIC_GA_TRACKING_ID ||
  '';

const ANALYTICS_ENABLED =
  (import.meta.env.VITE_ENABLE_ANALYTICS || import.meta.env.NEXT_PUBLIC_ENABLE_ANALYTICS) === 'true';

export const GoogleAnalytics = () => {
  useEffect(() => {
    if (!GA_TRACKING_ID || !import.meta.env.PROD || !ANALYTICS_ENABLED) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const gtagScript = document.createElement('script');
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    gtagScript.async = true;

    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}');
    `;

    document.head.appendChild(gtagScript);
    document.head.appendChild(inlineScript);

    return () => {
      document.head.removeChild(gtagScript);
      document.head.removeChild(inlineScript);
    };
  }, []);

  return null;
};
