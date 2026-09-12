import { useEffect, useState } from 'react';
import api from '../api/client';
import { buildBrandTheme } from '../lib/theme';

const TOKEN_VARS = ['accent', 'accentHover', 'accentInk', 'accentSubtle', 'accentGradient'];
const CSS_VAR = { accent: '--accent', accentHover: '--accent-hover', accentInk: '--accent-ink', accentSubtle: '--accent-subtle', accentGradient: '--accent-gradient' };
const declarations = (palette) => TOKEN_VARS.map((k) => `${CSS_VAR[k]}: ${palette[k]};`).join(' ');

// Un seul établissement : sa couleur de marque (réglages admin) recolore tout le site,
// pas une portion — contrairement à Reservator (le projet marketplace dont celui-ci est
// dérivé) où chaque boutique n'affecte que sa propre vitrine.
export default function GlobalTheme({ children }) {
  const [css, setCss] = useState('');

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const theme = buildBrandTheme(data.settings.accentColor);
      if (!theme) return;
      setCss(`
:root { ${declarations(theme.light)} }
@media (prefers-color-scheme: dark) {
  :root { ${declarations(theme.dark)} }
}`);
    }).catch(() => {});
  }, []);

  return (
    <>
      {css && <style>{css}</style>}
      {children}
    </>
  );
}
