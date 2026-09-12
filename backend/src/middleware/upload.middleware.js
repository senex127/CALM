const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Hors de backend/public : le script de déploiement vide entièrement ce dossier à chaque
// rebuild du frontend (rm -rf public/*) — des images uploadées y seraient perdues à chaque
// déploiement. backend/uploads/ n'est jamais touché par git reset --hard (non suivi par git).
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const EXTENSION_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  // Nom généré, jamais celui envoyé par le client — évite l'écrasement de fichiers et les
  // noms de chemin piégés.
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`),
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    if (!EXTENSION_BY_MIME[file.mimetype]) {
      return cb(new Error('Format non supporté (jpeg, png ou webp uniquement)'));
    }
    cb(null, true);
  },
});

module.exports = { uploadImage, UPLOADS_DIR };
