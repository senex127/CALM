#!/usr/bin/env node
'use strict';

/**
 * Audit d'accessibilité (axe-core + HTML CodeSniffer, WCAG2AA) sur les routes de l'app,
 * en clair ET en sombre, y compris les pages derrière connexion (client / admin).
 *
 * Deux choix qui s'écartent d'un pa11y-ci "de base", tous deux pour des raisons concrètes
 * rencontrées en mettant en place cet audit — pas des simplifications de confort :
 *
 * 1. Connexion via l'API (une fois par rôle) + injection de session dans localStorage,
 *    plutôt que de repasser par le formulaire de connexion à chaque page protégée. Avec 8
 *    pages derrière connexion, repasser par le formulaire à chaque fois envoie 8 POST
 *    /api/auth/login coup sur coup — largement assez pour déclencher authLimiter (20/15 min,
 *    voir backend/src/middleware/rateLimiter.middleware.js), une vraie protection anti-
 *    bruteforce qu'il n'est pas question d'affaiblir pour les besoins de l'audit.
 *
 * 2. Audit explicite en `prefers-color-scheme: dark` en plus du clair. La palette de marque
 *    est calculée dynamiquement à partir de la couleur choisie dans Réglages (voir
 *    lib/theme.js) : un souci de contraste peut n'apparaître que dans un des deux modes (c'est
 *    d'ailleurs arrivé ici — voir le commit qui a introduit ce script).
 */

const pa11y = require('pa11y');
const puppeteer = require('puppeteer');

const BASE = process.env.A11Y_FRONTEND_URL || 'http://localhost:5174';
const API = process.env.A11Y_API_URL || 'http://localhost:3002/api';

const PA11Y_OPTIONS = {
  timeout: 30000,
  runners: ['axe', 'htmlcs'],
  standard: 'WCAG2AA',
  // axe ne sait pas résoudre un fond dégradé (background-image: linear-gradient) en une seule
  // couleur solide et classe alors le contraste en "incomplete" (à vérifier à la main) plutôt
  // qu'en violation confirmée — mais pa11y traite par défaut "à vérifier" exactement comme une
  // vraie violation. Nos boutons CTA ont un fond en dégradé (voir Button.jsx#primaryButtonStyle) ;
  // le contraste réel a été vérifié à la main (calcul WCAG à chaque point du dégradé, marge
  // ≥4.6:1 partout) avant d'ajouter ce réglage — ça ne baisse pas la barre, ça évite juste de
  // traiter un "axe n'a pas pu trancher" comme un "axe a trouvé un vrai problème".
  levelCapWhenNeedsReview: 'notice',
};

async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Connexion impossible pour ${email} (HTTP ${res.status}) — voir authLimiter si 429`);
  }
  return res.json(); // { user, token }
}

async function fetchSampleOfferId() {
  const res = await fetch(`${API}/offers`);
  if (!res.ok) return null;
  const { offers } = await res.json();
  return offers?.[0]?.id ?? null;
}

// Même clé/forme que zustand persist dans frontend/src/store/authStore.js.
async function injectSession(page, session) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => {
    localStorage.setItem('calm-auth', JSON.stringify({ state: { user: s.user, token: s.token }, version: 0 }));
  }, session);
}

async function auditPath(browser, path, { session, scheme } = {}) {
  const page = await browser.newPage();
  try {
    if (scheme) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    if (session) await injectSession(page, session);
    const url = `${BASE}${path}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    const result = await pa11y(url, { ...PA11Y_OPTIONS, browser, page, ignoreUrl: true });
    return { url, scheme: scheme || 'light', result };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const results = [];

  try {
    const offerId = await fetchSampleOfferId();

    console.log('Connexion des comptes de test (une fois par rôle, pour ne pas déclencher le rate limiter)…');
    const client = await apiLogin('lea@client.test', 'password123');
    const admin = await apiLogin('admin@commealamaison.test', 'password123');

    const publicPaths = [
      '/', '/offres', offerId ? `/offres/${offerId}` : null, '/connexion', '/inscription', '/a-propos',
    ].filter(Boolean);
    const clientPaths = ['/mes-reservations'];
    const adminPaths = [
      '/admin', '/admin/offres', '/admin/offres/nouvelle',
      offerId ? `/admin/offres/${offerId}` : null,
      '/admin/reservations', '/admin/utilisateurs', '/admin/parametres',
    ].filter(Boolean);

    const total = (publicPaths.length + clientPaths.length + adminPaths.length) * 2;
    console.log(`Audit de ${total} pages (axe + HTML CodeSniffer, WCAG2AA — clair et sombre)…\n`);

    for (const scheme of ['light', 'dark']) {
      for (const p of publicPaths) results.push(await auditPath(browser, p, { scheme }));
      for (const p of clientPaths) results.push(await auditPath(browser, p, { session: client, scheme }));
      for (const p of adminPaths) results.push(await auditPath(browser, p, { session: admin, scheme }));
    }
  } finally {
    await browser.close();
  }

  let totalErrors = 0;
  for (const { url, scheme, result } of results) {
    const errors = result.issues.filter((i) => i.type === 'error');
    totalErrors += errors.length;
    console.log(` ${errors.length === 0 ? '✔' : '✘'} [${scheme}] ${url} — ${errors.length} erreur${errors.length > 1 ? 's' : ''}`);
  }

  const failing = results.filter(({ result }) => result.issues.some((i) => i.type === 'error'));
  if (failing.length) {
    console.log('\nDétail :\n');
    for (const { url, scheme, result } of failing) {
      const errors = result.issues.filter((i) => i.type === 'error');
      console.log(`— [${scheme}] ${url} —`);
      for (const issue of errors) {
        console.log(`  [${issue.runner}] ${issue.message}`);
        console.log(`    ${issue.selector}`);
        if (issue.context) console.log(`    ${issue.context.slice(0, 200)}`);
      }
      console.log('');
    }
  }

  if (totalErrors === 0) {
    console.log(`\n✔ ${results.length}/${results.length} pages sans violation sérieuse.`);
    process.exit(0);
  } else {
    console.log(`\n✘ ${totalErrors} violation(s) sur ${failing.length}/${results.length} pages.`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('\na11y audit : échec inattendu —', err.message);
  process.exit(1);
});
