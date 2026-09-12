import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, MapPin, Calendar, Users, Package, Trophy, CheckCircle2, Clock, LogIn } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import Button from '../components/Button';
import TurnstileWidget from '../components/TurnstileWidget';
import { SkeletonLine } from '../components/Skeleton';

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

  const onVerify = useCallback((token) => setTurnstileToken(token), []);

  useEffect(() => {
    api.get(`/offers/${id}`)
      .then(({ data }) => setOffer(data.offer))
      .catch(() => setError('Offre introuvable'));
  }, [id]);

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

      <div className="flex items-center gap-1.5 mt-4 text-xs px-3 py-1.5 rounded-full w-fit" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
        <Users size={13} /> Limite {offer.limitPerPerson} par personne · retrait sur place uniquement
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
            <Link to="/connexion" className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
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
                  onClick={() => setQuantity((q) => Math.min(offer.limitPerPerson, q + 1))}
                  disabled={quantity >= offer.limitPerPerson}
                  className="min-h-11 min-w-11 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
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
              {submitting ? 'Envoi…' : 'Réserver'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
