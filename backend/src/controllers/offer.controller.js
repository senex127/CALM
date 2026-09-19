const prisma = require('../lib/prisma');
const { getIO } = require('../lib/socket');

// Diffuse une offre à tous les visiteurs connectés (page Offres) — jamais le contenu d'un
// brouillon : seules les offres publiques (déjà publiées, ou qui le deviennent/cessent de
// l'être) sont concernées. Le frontend décide d'ajouter/mettre à jour ou retirer l'offre de
// sa liste selon `offer.status` (voir OffersPage.jsx).
function broadcastOfferChanged(offer) {
  const io = getIO();
  if (io) io.emit('offer:changed', offer);
}

// Catalogue public : uniquement les offres publiées (utilisé par la page Offres). Filtrable
// par type via ?type=PRODUCT|TOURNAMENT.
exports.listPublic = async (req, res, next) => {
  try {
    const { type } = req.query;
    const offers = await prisma.offer.findMany({
      where: { status: 'PUBLISHED', ...(type ? { type } : {}) },
      orderBy: { startAt: 'asc' },
    });
    res.json({ offers });
  } catch (err) {
    next(err);
  }
};

// Détail public d'une offre (fiche produit/tournoi + réservation).
exports.getPublic = async (req, res, next) => {
  try {
    const offer = await prisma.offer.findFirst({ where: { id: req.params.id, status: 'PUBLISHED' } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    res.json({ offer });
  } catch (err) {
    next(err);
  }
};

// Toutes les offres, tous statuts confondus — back-office admin.
exports.listAll = async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ offers });
  } catch (err) {
    next(err);
  }
};

// Détail admin d'une offre, quel que soit son statut — contrairement à getPublic, nécessaire
// pour pré-remplir le formulaire d'édition d'une offre encore en DRAFT ou déjà CLOSED/ARCHIVED.
exports.getAdmin = async (req, res, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer) return res.status(404).json({ error: 'Offre introuvable' });
    res.json({ offer });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const offer = await prisma.offer.create({ data: req.body });
    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const offer = await prisma.offer.update({ where: { id: req.params.id }, data: req.body });
    // Édition de contenu (prix, description, date...) : ce endpoint ne touche jamais `status`
    // (absent de updateOfferSchema), donc si l'offre est déjà publique, ses nouvelles infos
    // doivent l'être aussi ; sinon (encore DRAFT) rien à diffuser.
    if (offer.status === 'PUBLISHED') broadcastOfferChanged(offer);
    res.json({ offer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable' });
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const before = await prisma.offer.findUnique({ where: { id: req.params.id }, select: { status: true } });
    const offer = await prisma.offer.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    // Diffuse à l'entrée ET à la sortie de la visibilité publique : le client doit aussi
    // savoir retirer une offre de sa liste quand elle passe de PUBLISHED à CLOSED/ARCHIVED.
    if (offer.status === 'PUBLISHED' || before?.status === 'PUBLISHED') broadcastOfferChanged(offer);
    res.json({ offer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable' });
    next(err);
  }
};
