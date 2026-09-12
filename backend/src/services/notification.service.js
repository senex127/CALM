const prisma = require('../lib/prisma');

// Notifications in-app (table Notification) : distinctes des emails transactionnels envoyés
// par lib/mailer.js — les deux partent en parallèle sur un même événement, l'email pour être
// prévenu même hors du site, la notification pour la cloche affichée dans la navbar.

async function notify(userId, type, content) {
  return prisma.notification.create({ data: { userId, type, content } });
}

// Prévient tous les administrateurs actifs — utilisé quand une réservation demande une
// action humaine (validation manuelle) plutôt qu'un simple changement de statut côté client.
async function notifyAdmins(type, content) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', active: true }, select: { id: true } });
  if (!admins.length) return;
  await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, type, content })) });
}

module.exports = { notify, notifyAdmins };
