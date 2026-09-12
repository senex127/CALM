import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Ticket, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import StatTile from '../../components/StatTile';
import { SkeletonGrid } from '../../components/Skeleton';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <SkeletonGrid count={3} />;

  const publishedOffers = stats.offers.PUBLISHED || 0;
  const pendingReservations = stats.reservations.PENDING || 0;
  const totalReservations = Object.values(stats.reservations).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Utilisateurs" value={stats.users} icon={Users} />
        <StatTile label="Offres publiées" value={publishedOffers} icon={Package} />
        <StatTile label="Réservations" value={totalReservations} icon={Ticket} hint={`${pendingReservations} en attente de décision`} />
      </div>

      {pendingReservations > 0 && (
        <Link
          to="/admin/reservations" className="card mt-6 p-4 flex items-center gap-3"
          style={{ background: 'var(--status-pending-bg)', borderColor: 'transparent' }}
        >
          <AlertCircle size={18} color="var(--status-pending)" className="shrink-0" />
          <p style={{ color: 'var(--status-pending)' }}>
            <span className="font-semibold">{pendingReservations} réservation{pendingReservations > 1 ? 's' : ''}</span> en attente de décision — voir la liste.
          </p>
        </Link>
      )}
    </div>
  );
}
