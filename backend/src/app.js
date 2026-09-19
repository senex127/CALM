require('dotenv').config();

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[FATAL] Variables d'environnement manquantes : ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('[FATAL] JWT_SECRET trop court (32 caractères minimum) — générez-en un avec la commande donnée dans .env.example');
  process.exit(1);
}
if (!process.env.MJ_APIKEY_PUBLIC) {
  console.warn('[WARN] MJ_APIKEY_PUBLIC absente — emails transactionnels désactivés');
}
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn('[WARN] GOOGLE_CLIENT_ID absente — connexion Google désactivée');
}
if (!process.env.TURNSTILE_SECRET_KEY) {
  console.warn('[WARN] TURNSTILE_SECRET_KEY absente — vérification anti-bot à l’inscription désactivée');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { initSocket } = require('./lib/socket');

const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');
const offerRoutes = require('./routes/offer.routes');
const reservationRoutes = require('./routes/reservation.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const notificationRoutes = require('./routes/notification.routes');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { UPLOADS_DIR } = require('./middleware/upload.middleware');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Nécessaire derrière Passenger/Apache (reverse proxy sur O2Switch) : sans ça, req.ip et
// req.secure voient l'IP du proxy pour toutes les requêtes, ce qui désactive de fait le
// rate limiting par IP (tout le monde partage la même IP apparente) et fausse la détection
// HTTPS ci-dessous. En dev (pas de proxy), inutile mais inoffensif.
if (isProd) app.set('trust proxy', 1);

// Redirige vers HTTPS en prod, avant tout le reste. `x-forwarded-proto` est fourni par
// Passenger ; `req.secure` couvre le cas d'une connexion HTTPS directe.
if (isProd) {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' sur style-src : GlobalTheme injecte la couleur de marque via une
      // balise <style> au chargement — pas de nonce simple à brancher sur du contenu statique.
      // accounts.google.com : le widget Sign In With Google charge sa propre feuille de style.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", 'https://accounts.google.com', 'https://challenges.cloudflare.com'],
      frameSrc: ['https://accounts.google.com', 'https://challenges.cloudflare.com'],
      connectSrc: ["'self'", 'https://accounts.google.com', 'https://challenges.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));
// Un seul établissement, un seul frontend : une origine fixe suffit ici (contrairement à
// Reservator, le projet marketplace dont celui-ci est dérivé, qui doit autoriser un
// sous-domaine par boutique).
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use('/api', apiLimiter);

// Images uploadées (logo/bannière, visuel d'offre) — servies indépendamment du build
// frontend, dans tous les environnements (pas seulement en prod, contrairement au bloc
// express.static plus bas). CORP en cross-origin : ce sont des images publiques, et en dev
// frontend (5174) et backend (3002) sont deux origines différentes — le CORP same-origin
// hérité de helmet ci-dessus bloquerait leur affichage dans le navigateur.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(UPLOADS_DIR, { maxAge: '30d' }));

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Global error handler — attrape les erreurs passées via next(err) ou levées dans les routes async
app.use((err, req, res, next) => {
  // Erreurs multer (fichier trop lourd, format refusé par fileFilter...) : ce sont des erreurs
  // client, pas serveur, mais elles n'ont pas de .status par défaut.
  const isUploadError = err.name === 'MulterError' || err.message?.includes('Format non supporté');
  const status = err.status || err.statusCode || (isUploadError ? 400 : 500);
  console.error('[Error]', status, err.message);
  const message = (status < 500 || !isProd) ? (err.message || 'Erreur serveur') : 'Erreur serveur';
  res.status(status).json({ error: message });
});

// En production, le build du frontend (frontend/dist) est copié dans backend/public
// par le script de déploiement (voir scripts/server-deploy.sh) puis servi ici.
if (isProd) {
  app.use(express.static(path.join(__dirname, '../public')));
  // Express 5 (path-to-regexp v8) a durci la syntaxe des routes joker : `'*'` seul n'est plus
  // valide, il faut désormais un joker nommé (`/*splat`) — sinon crash immédiat au démarrage,
  // uniquement visible en prod puisque ce bloc ne s'exécute jamais en dev (isProd).
  app.get('/*splat', (_, res) => res.sendFile(path.join(__dirname, '../public', 'index.html')));
}

// Serveur HTTP brut plutôt que app.listen() directement : Socket.IO doit s'attacher au
// serveur HTTP lui-même pour intercepter les requêtes d'upgrade WebSocket, pas seulement à
// l'app Express qui gère le reste des routes normalement par-dessus.
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Comme à la Maison API → http://localhost:${PORT}`));
