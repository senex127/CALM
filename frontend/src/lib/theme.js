// Dérive une palette complète (clair + sombre) à partir de la seule couleur choisie dans les
// réglages du site — on ne règle qu'une teinte, pas 5 tokens séparés.

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * `hex` est la couleur choisie dans les réglages (ex. "#c2410c"). Renvoie les 5 tokens
 * d'accent (light + dark) utilisés dans index.css, ou `null` si la couleur est absente/invalide
 * — dans ce cas l'appelant doit simplement garder la palette par défaut du projet.
 */
export function buildBrandTheme(hex) {
  if (!hex || !HEX_RE.test(hex)) return null;
  const [h] = hexToHsl(hex);
  const s = Math.max(hexToHsl(hex)[1], 35); // évite un accent trop terne si la couleur choisie est proche du gris

  return {
    light: {
      accent: hex,
      accentHover: hslToHex(h, s, 32),
      accentInk: hslToHex(h, Math.min(s + 10, 70), 26),
      accentSubtle: hslToHex(h, Math.min(s, 55), 94),
      accentGradient: `linear-gradient(135deg, ${hslToHex(h, s, 46)} 0%, ${hslToHex(h, s, 30)} 100%)`,
    },
    dark: {
      accent: hslToHex(h, Math.min(s, 60), 62),
      accentHover: hslToHex(h, Math.min(s, 60), 68),
      accentInk: hslToHex(h, Math.min(s, 50), 80),
      accentSubtle: `hsla(${h.toFixed(1)}, ${Math.min(s, 55).toFixed(0)}%, 55%, 0.16)`,
      accentGradient: `linear-gradient(135deg, ${hslToHex(h, s, 26)} 0%, ${hslToHex(h, s, 15)} 100%)`,
    },
  };
}
