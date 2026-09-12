import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../api/client';
import EmptyState from '../components/EmptyState';
import OfferCard from '../components/OfferCard';
import { SkeletonGrid } from '../components/Skeleton';

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'PRODUCT', label: 'Produits' },
  { value: 'TOURNAMENT', label: 'Tournois' },
];

export default function OffersPage() {
  const [filter, setFilter] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/offers', { params: filter ? { type: filter } : {} })
      .then(({ data }) => setOffers(data.offers))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Offres</h1>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="text-sm font-medium px-3.5 min-h-11 rounded-lg active:scale-95 transition-transform"
            style={{
              background: filter === f.value ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: filter === f.value ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : !offers.length ? (
        <EmptyState icon={Package} title="Aucune offre pour l’instant" description="Revenez bientôt — les prochains produits et tournois apparaîtront ici." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      )}
    </div>
  );
}
