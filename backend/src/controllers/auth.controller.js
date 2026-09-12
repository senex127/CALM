const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { verifyGoogleIdToken } = require('../lib/googleAuth');
const { verifyTurnstile } = require('../lib/turnstile');

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, website, turnstileToken } = req.body;

    // Honeypot : un humain ne voit jamais ce champ (masqué en CSS côté frontend) ; un bot qui
    // remplit tous les champs du formulaire s'y fait piéger. Rejet silencieux, sans détail.
    if (website) return res.status(400).json({ error: 'Requête invalide' });

    if (!(await verifyTurnstile(turnstileToken, req.ip))) {
      return res.status(400).json({ error: 'Vérification anti-bot échouée, réessayez.' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });

    res.status(201).json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Identifiants incorrects' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });
    if (!user.active) return res.status(403).json({ error: 'Compte désactivé' });

    res.json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    next(err);
  }
};

// Connexion / inscription via "Sign in with Google" — le frontend envoie le
// credential (ID token) renvoyé par Google Identity Services.
exports.google = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Jeton Google manquant' });

    const { googleId, email, name } = await verifyGoogleIdToken(credential);

    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      // Un compte existe peut-être déjà avec la même adresse (inscrit par mot de passe) : on le relie.
      user = await prisma.user.findUnique({ where: { email } });
      user = user
        ? await prisma.user.update({ where: { id: user.id }, data: { googleId } })
        : await prisma.user.create({ data: { email, googleId, name } });
    }
    if (!user.active) return res.status(403).json({ error: 'Compte désactivé' });

    res.json({ user: publicUser(user), token: sign(user) });
  } catch (err) {
    console.error('[auth.google]', err.message);
    res.status(401).json({ error: 'Connexion Google invalide' });
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};
