import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, MapPin, Calendar, Users, Package, Trophy, CheckCircle2, Clock, LogIn } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import Button, { buttonBaseClass, primaryButtonStyle } from '../components/Button';
import TurnstileWidget from '../components/TurnstileWidget';
import { SkeletonLine } from '../components/Skeleton';
import { socket } from '../lib/socket';

const TURNSTILE_ENABLED = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

const TYPE_ICON = { PRODUCT: Package, TOURNAMENT: Trophy };
const TYPE_LABEL = { PRODUCT: 'Produit', TOURNAMENT: 'Tournoi' };
const OUTCOME = {
  CONFIRMED: { Icon: CheckCircle2, text: 'Réservation confirmée — vous recevrez un email de confirmation.' },
  PENDING: { Icon: Clock, text: 'Demande envoyée — on doit encore la valider.' },
  WAITLISTED: { Icon: Users, text: 'Offre complète : vous êtes en liste d’attente, vous serez prévenu si une place se libère.' },
};

export default function OfferPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Places restantes / liste d'attente en direct (voir lib/socket.js) — null tant que le
  // serveur n'a pas encore répondu à l'abonnement, ou si l'offre n'a pas de capacité limitée.
  const [availability, setAvailability] = useState(null);

  const onVerify = useCallback((token) => setTurnstileToken(token), []);

  useEffect(() => {
    api.get(`/offers/${id}`)
      .then(({ data }) => setOffer(data.offer))
      .catch(() => setError('Offre introuvable'));
  }, [id]);

  // Rejoint la « room » de cette offre pour recevoir ses mises à jour de disponibilité en
  // direct (une réservation de quelqu'un d'autre change le nombre de places restantes sans
  // que personne n'ait à recharger la page) ; se désabonne au changement d'offre/démontage.
  useEffect(() => {
    setAvailability(null);
    if (!id) return undefined;
    socket.emit('offer:subscribe', id);
    const onAvailability = (data) => {
      if (data.offerId === id) setAvailability(data);
    };
    socket.on('offer:availability', onAvailability);
    return () => {
      socket.emit('offer:unsubscribe', id);
      socket.off('offer:availability', onAvailability);
    };
  }, [id]);

  // Complet (waitlist) : la quantité reste bornée par la limite par personne — rejoindre la
  // liste d'attente ne dépend pas des places restantes, qui sont à 0 par définition. Sinon,
  // bornée par le plus petit des deux (impossible de demander plus qu'il n'en reste).
  const maxQuantity = !offer ? 1
    : availability && !availability.full
      ? Math.max(1, Math.min(offer.limitPerPerson, availability.remaining))
      : offer.limitPerPerson;

  // Si la disponibilité baisse en direct pendant que ce client a déjà choisi une quantité
  // plus haute (quelqu'un d'autre vient de réserver), on la ramène automatiquement au max
  // désormais permis plutôt que de le laisser soumettre une quantité qui n'est plus valide.
  useEffect(() => {
    setQuantity((q) => Math.min(q, maxQuantity));
  }, [maxQuantity]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/offers/${id}/reservations`, { quantity, comment, turnstileToken });
      setOutcome(data.reservation.status);
    } catch (err) {
      setError(err.response?.data?.error || 'Réservation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !offer) return <p style={{ color: 'var(--status-refused)' }}>{error}</p>;

  if (!offer) {
    return (
      <div className="max-w-lg mx-auto">
        <SkeletonLine width="30%" height={12} className="mb-3" />
        <SkeletonLine width="70%" height={24} className="mb-4" />
        <SkeletonLine width="90%" height={80} />
      </div>
    );
  }

  const TypeIcon = TYPE_ICON[offer.type];

  return (
    <div className="max-w-lg mx-auto">
      {offer.imageUrl && (
        <img
          src={offer.imageUrl} alt={offer.title}
          className="w-full h-48 sm:h-64 object-cover rounded-xl mb-5"
        />
      )}
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-ink)' }}>
        <TypeIcon size={14} /> {TYPE_LABEL[offer.type]}
      </span>
      <h1 className="text-2xl font-bold mt-2">{offer.title}</h1>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1"><MapPin size={13} /> {offer.location}</span>
        <span className="flex items-center gap-1">
          <Calendar size={13} /> {new Date(offer.startAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
        </span>
      </div>

      {offer.price != null && (
        <p className="mt-4 text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
          {Number(offer.price).toFixed(2)} €
        </p>
      )}
      {offer.description && <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{offer.description}</p>}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          <Users size={13} /> Limite {offer.limitPerPerson} par personne · retrait sur place uniquement
        </span>

        {offer.totalCapacity != null && (
          // aria-live : un client malvoyant doit aussi être informé quand la disponibilité
          // change en direct, pas seulement voir le badge se redessiner visuellement.
          <span
            aria-live="polite"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: availability?.full ? 'var(--status-pending-bg)' : 'var(--status-confirmed-bg)',
              color: availability?.full ? 'var(--status-pending)' : 'var(--status-confirmed)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} aria-hidden="true" />
            {!availability
              ? `${offer.totalCapacity} places au total`
              : availability.full
                ? `Complet${availability.waitlisted ? ` · ${availability.waitlisted} en liste d’attente` : ''}`
                : `${availability.remaining} place${availability.remaining > 1 ? 's' : ''} restante${availability.remaining > 1 ? 's' : ''} sur ${availability.totalCapacity}`}
          </span>
        )}
      </div>

      <div className="card mt-6 p-5">
        {outcome ? (
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
              {(() => { const O = OUTCOME[outcome]; return <O.Icon size={17} color="var(--accent-ink)" />; })()}
            </span>
            <p style={{ color: 'var(--accent-ink)' }}>{OUTCOME[outcome].text}</p>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p style={{ color: 'var(--text-secondary)' }}>Connectez-vous pour réserver cette offre.</p>
            <Link to="/connexion" className={buttonBaseClass} style={primaryButtonStyle}>
              <LogIn size={16} /> Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <span className="text-sm font-medium block mb-1.5">Quantité</span>
              <div className="inline-flex items-center rounded-lg" style={{ border: '1px solid var(--border-strong)' }}>
                <button
                  type="button" aria-label="Diminuer la quantité"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="min-h-11 min-w-11 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-8 text-center tabular-nums font-semibold" aria-live="polite">{quantity}</span>
                <button
                  type="button" aria-label="Augmenter la quantité"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="min-h-11 min-w-11 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
              {/* Sous liste d'attente (offre complète), la quantité ne peut être limitée par la
                  disponibilité en direct — le rang en attente ne dépend pas d'une quantité choisie
                  ici, elle rejoint simplement la file. */}
              {availability && !availability.full && availability.remaining < offer.limitPerPerson && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Seulement {availability.remaining} place{availability.remaining > 1 ? 's' : ''} restante{availability.remaining > 1 ? 's' : ''}.
                </p>
              )}
            </div>
            <label className="text-sm font-medium">
              Commentaire (optionnel)
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                className="block w-full mt-1.5 px-3 py-2.5 rounded-lg font-normal" style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' }}
              />
            </label>
            <TurnstileWidget onVerify={onVerify} />
            {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
            <Button type="submit" loading={submitting} disabled={TURNSTILE_ENABLED && !turnstileToken} className="w-full">
              {submitting ? 'Envoi…' : availability?.full ? 'Rejoindre la liste d’attente' : 'Réserver'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
