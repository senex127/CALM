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

// Couleur de marque par défaut du projet (voir seed.js / AdminSettingsPage.jsx) : le bleu
// marine du vrai site commealamaison-puteaux.fr. Son dégradé de bouton réel passe par un bleu
// vif à une teinte différente (~209°) plutôt qu'un simple dégradé de lightness sur la même
// teinte (~232°) — un vrai choix de designer, pas quelque chose qu'une formule à teinte fixe
// peut retrouver. On rejoue donc ce dégradé pour CETTE couleur précise ; toute autre couleur
// choisie dans les réglages retombe sur le dégradé générique calculé plus bas.
//
// Le bleu vif exact du site (#1189fb) ne tient que 3.50:1 avec du texte blanc dessus — sous la
// barre WCAG 4.5:1, y compris sur le vrai site. Assombri à #0473dd (même teinte, 4.67:1) plutôt
// que reproduit à l'identique : l'esprit du dégradé sans reprendre son défaut d'accessibilité.
const DEFAULT_BRAND_HEX = '#0c1239';
const DEFAULT_BRAND_GRADIENT = 'linear-gradient(90deg, #0473dd 0%, #0c1239 100%)';

// Luminance relative WCAG — sert uniquement à garantir que --accent reste lisible en texte
// blanc dessus (voir ensureAccentContrast ci-dessous), pas à choisir les autres tokens.
function relLuminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrastWithWhite(hex) {
  return 1.05 / (relLuminance(hex) + 0.05);
}

// --accent sert TOUJOURS de fond à du texte blanc dans ce projet (boutons pleins, pastilles,
// item de nav actif — Button.jsx, Navbar.jsx, HomePage.jsx, AdminLayout.jsx...), jamais comme
// simple décoration. Quelle que soit la couleur choisie par l'administrateur dans les réglages,
// on assombrit (à teinte/saturation égales) jusqu'à repasser sous la barre WCAG 4.5:1 — sans ce
// garde-fou, une couleur trop claire (ou juste limite, comme la couleur par défaut du projet)
// rend ce texte illisible pour les malvoyants.
function ensureAccentContrast(h, s, startLightness) {
  let l = startLightness;
  let hex = hslToHex(h, s, l);
  let guard = 0;
  // Cible 4.6 plutôt que le minimum WCAG 4.5 : une petite marge pour ne pas dépendre de
  // l'arrondi exact du dernier chiffre (vu avec le bleu de marque, qui ne clairait 4.5 que de
  // 0.09 avant cet ajustement).
  while (contrastWithWhite(hex) < 4.6 && l > 8 && guard < 100) {
    l -= 1;
    hex = hslToHex(h, s, l);
    guard++;
  }
  return hex;
}

/**
 * `hex` est la couleur choisie dans les réglages (ex. "#c2410c"). Renvoie les 5 tokens
 * d'accent (light + dark) utilisés dans index.css, ou `null` si la couleur est absente/invalide
 * — dans ce cas l'appelant doit simplement garder la palette par défaut du projet.
 */
export function buildBrandTheme(hex) {
  if (!hex || !HEX_RE.test(hex)) return null;
  const [h, rawS, rawL] = hexToHsl(hex);
  const s = Math.max(rawS, 35); // évite un accent trop terne si la couleur choisie est proche du gris

  return {
    light: {
      accent: ensureAccentContrast(h, s, rawL),
      accentHover: hslToHex(h, s, 32),
      accentInk: hslToHex(h, Math.min(s + 10, 70), 26),
      accentSubtle: hslToHex(h, Math.min(s, 55), 94),
      accentGradient: hex.toLowerCase() === DEFAULT_BRAND_HEX
        ? DEFAULT_BRAND_GRADIENT
        : `linear-gradient(135deg, ${hslToHex(h, s, 46)} 0%, ${hslToHex(h, s, 30)} 100%)`,
    },
    dark: {
      accent: ensureAccentContrast(h, Math.min(s, 60), 62),
      accentHover: hslToHex(h, Math.min(s, 60), 68),
      accentInk: hslToHex(h, Math.min(s, 50), 80),
      accentSubtle: `hsla(${h.toFixed(1)}, ${Math.min(s, 55).toFixed(0)}%, 55%, 0.16)`,
      accentGradient: `linear-gradient(135deg, ${hslToHex(h, s, 26)} 0%, ${hslToHex(h, s, 15)} 100%)`,
    },
  };
}
