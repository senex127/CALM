import { useEffect, useRef } from 'react';

// Widget Cloudflare Turnstile (anti-bot à l'inscription). Rendu vide si
// VITE_TURNSTILE_SITE_KEY n'est pas configurée — l'inscription reste possible, juste sans ce
// filtre (le backend applique la même règle : absent des deux côtés = désactivé, pas cassé).
export default function TurnstileWidget({ onVerify }) {
  const ref = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    const render = () => {
      if (ref.current && window.turnstile) {
        window.turnstile.render(ref.current, { sitekey: siteKey, callback: onVerify });
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.body.appendChild(script);
    }
  }, [siteKey, onVerify]);

  if (!siteKey) return null;
  return <div ref={ref} className="my-2" />;
}
