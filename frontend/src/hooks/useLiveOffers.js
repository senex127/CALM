import { useEffect, useState } from 'react';
import api from '../api/client';
import { socket } from '../lib/socket';

// Charge les offres publiées (filtrables par type) et les tient à jour en direct par
// WebSocket (offer:changed, voir backend/src/controllers/offer.controller.js) — sans que la
// page ait besoin d'être rechargée quand l'admin publie, modifie ou ferme une offre. Utilisé
// par OffersPage (liste complète) et HomePage (aperçu des prochaines offres).
export function useLiveOffers({ type } = {}) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/offers', { params: type ? { type } : {} })
      .then(({ data }) => setOffers(data.offers))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => {
    const onChanged = (offer) => {
      setOffers((prev) => {
        const matchesFilter = !type || offer.type === type;
        const exists = prev.some((o) => o.id === offer.id);
        if (offer.status !== 'PUBLISHED' || !matchesFilter) {
          return exists ? prev.filter((o) => o.id !== offer.id) : prev;
        }
        if (exists) return prev.map((o) => (o.id === offer.id ? offer : o));
        // Même tri que le serveur (date de début croissante).
        return [...prev, offer].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      });
    };
    socket.on('offer:changed', onChanged);
    return () => socket.off('offer:changed', onChanged);
  }, [type]);

  return { offers, loading };
}
