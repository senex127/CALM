// Données de test pour le développement local.
// Usage : npm run db:seed (voir README — nécessite une base déjà migrée : npm run db:push)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

if (process.env.NODE_ENV === 'production') {
  console.error('[seed] Refusé : NODE_ENV=production. Ce script efface les données existantes avant de les recréer.');
  process.exit(1);
}

const PASSWORD = 'password123';
const ADDRESS = '18 rue des Tanneurs, 69005 Lyon';
const inDays = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('[seed] Purge des données existantes…');
  await prisma.reservation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log('[seed] Création des comptes…');
  const [admin, lea, hugo, nora, tom] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@commealamaison.test', passwordHash, name: 'Admin CALM', role: 'ADMIN' } }),
    prisma.user.create({ data: { email: 'lea@client.test', passwordHash, name: 'Léa Fontaine' } }),
    prisma.user.create({ data: { email: 'hugo@client.test', passwordHash, name: 'Hugo Perrin' } }),
    prisma.user.create({ data: { email: 'nora@client.test', passwordHash, name: 'Nora Benali' } }),
    prisma.user.create({ data: { email: 'tom@client.test', passwordHash, name: 'Tom Lacroix' } }),
  ]);

  console.log('[seed] Réglages du site…');
  await prisma.settings.create({ data: {
    id: 'main',
    name: 'Comme à la Maison',
    description: 'Bar à jeux, vente de cartes à collectionner et tournois toutes les semaines — dans une ambiance de salon.',
    address: ADDRESS,
    phone: '04 78 00 00 00',
    openingHours: 'Mar–Ven 16h–00h · Sam–Dim 14h–00h',
    accentColor: '#b5651d',
  } });

  console.log('[seed] Création des offres…');
  const boosterBox = await prisma.offer.create({ data: {
    type: 'PRODUCT', title: 'Booster Box — Extension Aurore Céleste',
    description: '36 boosters scellés, sortie officielle. Retrait au comptoir.', price: 89.90, startAt: inDays(4),
    location: ADDRESS, limitPerPerson: 1, totalCapacity: 15, requiresValidation: false, status: 'PUBLISHED',
  } });
  const eliteTrainer = await prisma.offer.create({ data: {
    type: 'PRODUCT', title: 'Coffret Dresseur d’Élite',
    description: 'Le grand classique pour préparer un tournoi — accessoires inclus.', price: 54.90, startAt: inDays(2),
    location: ADDRESS, limitPerPerson: 2, requiresValidation: false, status: 'PUBLISHED',
  } });
  const rareCard = await prisma.offer.create({ data: {
    type: 'PRODUCT', title: 'Carte rare en vitrine — exemplaire unique',
    description: 'Pièce unique sous verre. Une seule réservation possible, validée à la main.', price: 149, startAt: inDays(6),
    location: ADDRESS, limitPerPerson: 1, totalCapacity: 1, requiresValidation: true, status: 'PUBLISHED',
  } });
  const thursdayTournament = await prisma.offer.create({ data: {
    type: 'TOURNAMENT', title: 'Tournoi Standard du jeudi',
    description: 'Format Standard, 4 rondes suisses. Places limitées — complet, nouvelles inscriptions en liste d’attente.',
    price: 5, startAt: inDays(3), location: ADDRESS,
    limitPerPerson: 1, totalCapacity: 2, requiresValidation: true, status: 'PUBLISHED',
  } });
  const draftSunday = await prisma.offer.create({ data: {
    type: 'TOURNAMENT', title: 'Draft découverte du dimanche',
    description: 'Ouvert à tous niveaux, boosters fournis sur place.', price: 12, startAt: inDays(9),
    location: ADDRESS, limitPerPerson: 1, totalCapacity: 8, requiresValidation: false, status: 'PUBLISHED',
  } });
  await prisma.offer.create({ data: {
    type: 'TOURNAMENT', title: 'Soirée Commander',
    description: 'Brouillon — pas encore publié, invisible côté client.', startAt: inDays(5),
    location: ADDRESS, limitPerPerson: 1, totalCapacity: 6, requiresValidation: true, status: 'DRAFT',
  } });
  const pastLeague = await prisma.offer.create({ data: {
    type: 'TOURNAMENT', title: 'Ligue amicale — session passée',
    description: 'Session déjà terminée.', startAt: inDays(-3),
    location: ADDRESS, limitPerPerson: 1, totalCapacity: 10, requiresValidation: false, status: 'CLOSED',
  } });

  console.log('[seed] Création des réservations…');
  await prisma.reservation.createMany({ data: [
    { offerId: boosterBox.id, userId: lea.id, quantity: 1, status: 'CONFIRMED' },
    { offerId: boosterBox.id, userId: hugo.id, quantity: 1, status: 'CONFIRMED' },
    { offerId: boosterBox.id, userId: nora.id, quantity: 1, status: 'CANCELLED' },

    { offerId: eliteTrainer.id, userId: tom.id, quantity: 2, status: 'CONFIRMED' },

    // carte rare : demande fraîche, encore à traiter — visible dans le tableau de bord admin
    { offerId: rareCard.id, userId: hugo.id, quantity: 1, status: 'PENDING' },

    // tournoi du jeudi : capacité 2, exactement remplie par léa + hugo → tom arrive en liste d'attente
    { offerId: thursdayTournament.id, userId: lea.id, quantity: 1, status: 'CONFIRMED', processedAt: new Date(), processedBy: admin.id },
    { offerId: thursdayTournament.id, userId: hugo.id, quantity: 1, status: 'CONFIRMED', processedAt: new Date(), processedBy: admin.id },
    { offerId: thursdayTournament.id, userId: nora.id, quantity: 1, status: 'REFUSED', processedAt: new Date(), processedBy: admin.id },
    { offerId: thursdayTournament.id, userId: tom.id, quantity: 1, status: 'WAITLISTED', waitlistRank: 1 },

    { offerId: draftSunday.id, userId: nora.id, quantity: 1, status: 'CONFIRMED' },

    // session passée : léa ne s'est pas présentée
    { offerId: pastLeague.id, userId: lea.id, quantity: 1, status: 'NO_SHOW', processedAt: new Date(), processedBy: admin.id },
  ] });

  console.log('[seed] Terminé.\n');
  console.log(`Comptes de test (mot de passe : ${PASSWORD}) :`);
  console.log('  admin@commealamaison.test — administrateur (gère offres, réservations, réglages)');
  console.log('  lea / hugo / nora / tom @client.test — clients');
}

main()
  .catch((err) => { console.error('[seed] Échec :', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
