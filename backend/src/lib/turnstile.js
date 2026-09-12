// Vérifie un jeton Cloudflare Turnstile (anti-bot à l'inscription). Si le service n'est pas
// configuré (pas de clé secrète), la vérification est désactivée — comportement identique à
// Google OAuth / Mailjet ailleurs dans ce projet : une intégration tierce absente dégrade la
// fonctionnalité sans jamais casser le reste.
async function verifyTurnstile(token, remoteip) {
  if (!process.env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    });
    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] Vérification impossible :', err.message);
    return false; // panne du service tiers → on refuse plutôt que d'ouvrir la porte en grand
  }
}

module.exports = { verifyTurnstile };
