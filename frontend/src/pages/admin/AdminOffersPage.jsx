import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Trophy, Plus } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { buttonBaseClass } from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonList } from '../../components/Skeleton';

const TYPE_ICON = { PRODUCT: Package, TOURNAMENT: Trophy };

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/offers').then(({ data }) => setOffers(data.offers)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Offres</h2>
        <Link to="/admin/offres/nouvelle" className={buttonBaseClass} style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}>
          <Plus size={16} /> Nouvelle offre
        </Link>
      </div>

      {loading ? (
        <SkeletonList />
      ) : !offers.length ? (
        <EmptyState icon={Package} title="Aucune offre créée" description="Créez votre première offre pour commencer à recevoir des réservations." />
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => {
            const TypeIcon = TYPE_ICON[offer.type];
            return (
              <Link key={offer.id} to={`/admin/offres/${offer.id}`} className="card card-interactive p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                    <TypeIcon size={16} color="var(--accent-ink)" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold">{offer.title}</span>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(offer.startAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                      {offer.totalCapacity != null && ` · ${offer.totalCapacity} places`} · limite {offer.limitPerPerson}/personne
                    </p>
                  </div>
                </div>
                <StatusBadge status={offer.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
