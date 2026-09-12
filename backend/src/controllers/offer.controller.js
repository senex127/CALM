const prisma = require('../lib/prisma');

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
    res.json({ offer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable' });
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const offer = await prisma.offer.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json({ offer });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable' });
    next(err);
  }
};
