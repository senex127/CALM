const { PrismaClient } = require('@prisma/client');

// Instance unique partagée par toute l'app (évite d'ouvrir une connexion par contrôleur).
const prisma = new PrismaClient();

module.exports = prisma;
