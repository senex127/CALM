import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/Skeleton';

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'WAITLISTED'];

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/reservations/mine').then(({ data }) => setReservations(data.reservations)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return;
    setBusyId(id);
    try {
      await api.post(`/reservations/${id}/cancel`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Mes réservations</h1>
      {loading ? (
        <SkeletonList />
      ) : !reservations.length ? (
        <EmptyState icon={Ticket} title="Aucune réservation" description="Vos précommandes et inscriptions à des tournois apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-3">
          {reservations.map((r) => (
            <div key={r.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link to={`/offres/${r.offerId}`} className="font-semibold">{r.offer.title}</Link>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Quantité {r.quantity}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={r.status} />
                {CANCELLABLE.includes(r.status) && (
                  <Button variant="ghost" className="min-h-11 px-2 text-sm underline" loading={busyId === r.id} onClick={() => cancel(r.id)}>
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
