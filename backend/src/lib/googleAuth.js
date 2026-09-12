const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Vérifie le jeton d'identité envoyé par le frontend (Google Identity Services,
 * bouton "Sign in with Google") et renvoie { googleId, email, name }.
 * Lève une erreur si le jeton est invalide ou expiré.
 */
async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('Jeton Google invalide');
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
  };
}

module.exports = { verifyGoogleIdToken };
