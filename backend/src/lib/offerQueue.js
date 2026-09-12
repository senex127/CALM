// File d'attente en mémoire, une par offre : sérialise les tentatives de réservation
// concurrentes sur une même offre avant même d'ouvrir une transaction en base.
//
// Le verrou SELECT ... FOR UPDATE dans reservation.service.js garantit déjà l'exactitude
// (impossible de survendre une offre) : deux requêtes simultanées ne peuvent pas obtenir la
// même dernière place. Mais sans cette file, un pic de popularité sur une offre (un tournoi
// qui se remplit en quelques secondes) ouvrirait autant de transactions Postgres simultanées
// que de requêtes reçues, chacune bloquée en attente du verrou — au risque d'épuiser le pool
// de connexions et de ralentir tout le site, pas seulement cette offre. Ici, une seule
// transaction par offre est en vol à la fois ; les autres attendent en mémoire (gratuit),
// dans l'ordre d'arrivée. Les autres offres ne sont pas affectées (file indépendante par id).
//
// Limite connue : cette file vit dans le process Node — correcte pour un déploiement
// mono-instance (le cas ici, Passenger sur O2Switch), mais ne coordonnerait pas plusieurs
// instances derrière un load balancer. Le verrou en base, lui, resterait correct dans tous
// les cas.
const MAX_QUEUE_DEPTH = 50;
const queues = new Map(); // offerId -> { promise, depth }

async function runQueued(offerId, task) {
  const entry = queues.get(offerId) || { promise: Promise.resolve(), depth: 0 };

  if (entry.depth >= MAX_QUEUE_DEPTH) {
    const err = new Error('Trop de monde tente de réserver cette offre en ce moment, réessayez dans quelques secondes.');
    err.status = 503;
    throw err;
  }

  entry.depth += 1;
  queues.set(offerId, entry);
  // Enchaîne après la tâche précédente qu'elle ait réussi ou échoué (sinon un seul échec
  // bloquerait la file indéfiniment) ; le retour de `run` reste propre à cet appel.
  const run = entry.promise.then(task, task);
  entry.promise = run.then(() => {}, () => {});

  try {
    return await run;
  } finally {
    entry.depth -= 1;
    if (entry.depth === 0 && queues.get(offerId) === entry) queues.delete(offerId);
  }
}

module.exports = { runQueued };
