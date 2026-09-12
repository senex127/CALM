import { useEffect, useMemo, useState } from 'react';
import { Ticket, Package, Trophy } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonList } from '../../components/Skeleton';

const TYPE_ICON = { PRODUCT: Package, TOURNAMENT: Trophy };
const selectStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-secondary)' };
const selectClass = 'px-3 py-2 rounded-lg text-sm min-h-11';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [offerFilter, setOfferFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // `${id}:${action}` en cours

  // Toutes les offres (pas seulement celles déjà publiées) pour peupler le filtre — un admin
  // doit pouvoir consulter les réservations d'une offre même si elle n'en a plus aucune
  // correspondant au filtre de statut sélectionné.
  useEffect(() => {
    api.get('/admin/offers').then(({ data }) => setOffers(data.offers)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    api.get('/admin/reservations', {
      params: { ...(statusFilter ? { status: statusFilter } : {}), ...(offerFilter ? { offerId: offerFilter } : {}) },
    })
      .then(({ data }) => setReservations(data.reservations))
      .finally(() => setLoading(false));
  };
  useEffect(load, [statusFilter, offerFilter]);

  const act = async (id, action) => {
    setBusy(`${id}:${action}`);
    try {
      await api.post(`/admin/reservations/${id}/${action}`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  // Regroupées par offre plutôt qu'en liste plate : on voit d'un coup d'œil qui a réservé quoi
  // sur chaque produit/tournoi. L'ordre des groupes suit la première apparition (déjà triée par
  // date de réservation la plus récente côté API).
  const groups = useMemo(() => {
    const byOffer = new Map();
    for (const r of reservations) {
      if (!byOffer.has(r.offerId)) {
        byOffer.set(r.offerId, { offerId: r.offerId, title: r.offer.title, type: r.offer.type, reservations: [] });
      }
      byOffer.get(r.offerId).reservations.push(r);
    }
    return [...byOffer.values()];
  }, [reservations]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Réservations</h2>
        <div className="flex gap-2 flex-wrap">
          <select value={offerFilter} onChange={(e) => setOfferFilter(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="">Toutes les offres</option>
            {offers.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} style={selectStyle}>
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="WAITLISTED">Liste d’attente</option>
            <option value="REFUSED">Refusées</option>
            <option value="CANCELLED">Annulées</option>
            <option value="NO_SHOW">Non présentées</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonList />
      ) : !groups.length ? (
        <EmptyState icon={Ticket} title="Aucune réservation" description="Les nouvelles demandes sur vos offres apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => {
            const TypeIcon = TYPE_ICON[g.type] || Package;
            return (
              <section key={g.offerId}>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <TypeIcon size={15} color="var(--accent-ink)" />
                  <h3 className="font-semibold text-sm">{g.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {g.reservations.length} réservation{g.reservations.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {g.reservations.map((r) => (
                    <div key={r.id} className="card p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <span className="font-medium">{r.user.name}</span>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {r.user.email} · quantité {r.quantity}
                          {r.waitlistRank && ` · rang ${r.waitlistRank}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={r.status} />
                        {r.status === 'PENDING' && (
                          <>
                            <Button
                              variant="primary" style={{ background: 'var(--status-confirmed)' }} className="px-3 text-xs"
                              loading={busy === `${r.id}:accept`} disabled={busy != null}
                              onClick={() => act(r.id, 'accept')}
                            >
                              Accepter
                            </Button>
                            <Button
                              variant="secondary" className="px-3 text-xs"
                              loading={busy === `${r.id}:refuse`} disabled={busy != null}
                              onClick={() => act(r.id, 'refuse')}
                            >
                              Refuser
                            </Button>
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <Button
                            variant="secondary" className="px-3 text-xs"
                            loading={busy === `${r.id}:no-show`} disabled={busy != null}
                            onClick={() => act(r.id, 'no-show')}
                          >
                            Non présenté
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
