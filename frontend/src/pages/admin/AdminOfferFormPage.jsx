import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, MapPin, Users, Package, Trophy, Eye, PencilLine } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/Button';
import ImageUploadField from '../../components/ImageUploadField';
import OfferPreview from '../../components/OfferPreview';

const EMPTY = {
  type: 'PRODUCT', title: '', description: '', imageUrl: '', price: '', startAt: '', registrationDeadline: '',
  location: '', limitPerPerson: 1, totalCapacity: '', requiresValidation: false,
};

const TYPES = [
  { value: 'PRODUCT', label: 'Produit', Icon: Package },
  { value: 'TOURNAMENT', label: 'Tournoi', Icon: Trophy },
];

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const inputClass = 'block w-full mt-1 px-3 py-2.5 rounded-lg min-h-11';
const inputStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' };
const labelClass = 'text-sm font-medium';
const hintClass = 'text-xs mt-1.5';
const hintStyle = { color: 'var(--text-muted)' };

// En-tête de section réutilisé pour les quatre blocs du formulaire — juste assez de
// structure visuelle pour que le regard sache où il en est dans un formulaire par ailleurs
// long, sans aller jusqu'à un multi-étapes (tout reste visible et modifiable d'un coup d'œil).
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
        <Icon size={15} style={{ color: 'var(--accent-ink)' }} /> {title}
      </h3>
      {children}
    </div>
  );
}

export default function AdminOfferFormPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  // Formulaire et aperçu tiennent côte à côte à partir de lg ; en dessous, un onglet évite
  // de faire défiler deux écrans complets l'un sous l'autre sur mobile.
  const [mobileView, setMobileView] = useState('form');
  const isEdit = Boolean(offerId);

  useEffect(() => {
    if (!isEdit) return;
    // Route admin (pas /offers/:id, réservée aux offres PUBLISHED) : une offre encore en
    // DRAFT — le cas le plus courant juste après création — doit aussi pouvoir être éditée.
    api.get(`/admin/offers/${offerId}`).then(({ data }) => {
      const o = data.offer;
      setForm({
        type: o.type, title: o.title, description: o.description || '', imageUrl: o.imageUrl || '', price: o.price ?? '',
        startAt: toLocalInput(o.startAt), registrationDeadline: toLocalInput(o.registrationDeadline),
        location: o.location, limitPerPerson: o.limitPerPerson, totalCapacity: o.totalCapacity ?? '',
        requiresValidation: o.requiresValidation,
      });
      setStatus(o.status);
    }).catch(() => setError('Impossible de charger cette offre'));
  }, [offerId, isEdit]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      ...form,
      totalCapacity: form.totalCapacity || undefined,
      price: form.price || undefined,
      // chaîne vide (champ non renseigné) → absent plutôt qu'une date invalide côté API
      registrationDeadline: form.registrationDeadline || undefined,
      // en création l'API n'accepte pas `null` pour imageUrl (juste absent) ; en modification
      // `null` retire explicitement une image déjà en place.
      imageUrl: form.imageUrl || (isEdit ? null : undefined),
    };
    try {
      if (isEdit) {
        await api.patch(`/offers/${offerId}`, payload);
      } else {
        await api.post('/offers', payload);
      }
      navigate('/admin/offres');
    } catch (err) {
      setError(err.response?.data?.error || 'Enregistrement impossible');
      setSubmitting(false);
    }
  };

  const changeStatus = async (next) => {
    setStatusBusy(true);
    try {
      await api.patch(`/offers/${offerId}/status`, { status: next });
      setStatus(next);
    } finally {
      setStatusBusy(false);
    }
  };

  const capacityTooLow = form.totalCapacity && Number(form.totalCapacity) < Number(form.limitPerPerson || 1);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{isEdit ? 'Modifier l’offre' : 'Nouvelle offre'}</h2>
        {isEdit && status === 'DRAFT' && (
          <Button onClick={() => changeStatus('PUBLISHED')} loading={statusBusy}>Publier</Button>
        )}
        {isEdit && status === 'PUBLISHED' && (
          <Button variant="secondary" onClick={() => changeStatus('CLOSED')} loading={statusBusy}>Clore l’offre</Button>
        )}
      </div>

      {/* Bascule formulaire / aperçu — mobile et tablette uniquement, les deux colonnes
          cohabitent à partir de lg (voir le grid juste dessous). */}
      <div className="flex lg:hidden gap-2 mb-4">
        <button
          type="button" onClick={() => setMobileView('form')}
          className="flex-1 min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          style={{
            background: mobileView === 'form' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: mobileView === 'form' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <PencilLine size={14} /> Formulaire
        </button>
        <button
          type="button" onClick={() => setMobileView('preview')}
          className="flex-1 min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          style={{
            background: mobileView === 'preview' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: mobileView === 'preview' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <Eye size={14} /> Aperçu
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <form
          onSubmit={submit}
          className={`flex-col gap-5 ${mobileView === 'preview' ? 'hidden lg:flex' : 'flex'}`}
        >
          <SectionCard icon={Info} title="Informations">
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ value, label, Icon }) => (
                <button
                  key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                  className="min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: form.type === value ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: `1px solid ${form.type === value ? 'var(--accent)' : 'var(--border-strong)'}`,
                    color: form.type === value ? 'var(--accent-ink)' : 'var(--text-secondary)',
                  }}
                  aria-pressed={form.type === value}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            <label className={labelClass}>
              Titre
              <input
                required maxLength={120} placeholder="Ex. Booster Box — Extension Aurore Céleste"
                value={form.title} onChange={update('title')} className={inputClass} style={inputStyle}
              />
              <span className={hintClass} style={hintStyle}>{form.title.length}/120</span>
            </label>

            <label className={labelClass}>
              Description
              <textarea
                placeholder="Ce que le client doit savoir avant de réserver…" rows={3}
                value={form.description} onChange={update('description')}
                className="block w-full mt-1 px-3 py-2.5 rounded-lg font-normal" style={inputStyle}
              />
            </label>
          </SectionCard>

          <SectionCard icon={MapPin} title="Visuel & lieu">
            <ImageUploadField label="Visuel de l’offre" value={form.imageUrl} wide onChange={(url) => setForm({ ...form, imageUrl: url })} />

            <label className={labelClass}>
              Lieu
              <input
                required placeholder="Ex. salle principale, table 3" value={form.location} onChange={update('location')}
                className={inputClass} style={inputStyle}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Date
                <input required type="datetime-local" value={form.startAt} onChange={update('startAt')} className={inputClass} style={inputStyle} />
              </label>
              <label className={labelClass}>
                Prix (€, optionnel)
                <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0,00" value={form.price} onChange={update('price')} className={inputClass} style={inputStyle} />
              </label>
            </div>

            <label className={labelClass}>
              Date limite de réservation (optionnel)
              <input type="datetime-local" value={form.registrationDeadline} onChange={update('registrationDeadline')} className={inputClass} style={inputStyle} />
              <span className={hintClass} style={hintStyle}>Passé ce moment, réserver ne sera plus possible. Laissez vide pour rester ouvert jusqu’à la date de l’offre.</span>
            </label>
          </SectionCard>

          <SectionCard icon={Users} title="Places & réservation">
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                Limite par personne
                <input required type="number" inputMode="numeric" min="1" value={form.limitPerPerson} onChange={update('limitPerPerson')} className={inputClass} style={inputStyle} />
                <span className={hintClass} style={hintStyle}>Quantité max. réservable par un même client.</span>
              </label>
              <label className={labelClass}>
                Capacité totale (optionnel)
                <input type="number" inputMode="numeric" min="1" value={form.totalCapacity} onChange={update('totalCapacity')} className={inputClass} style={inputStyle} />
                <span className={hintClass} style={hintStyle}>Vide = illimitée. Au-delà, les clients passent en liste d’attente.</span>
              </label>
            </div>
            {capacityTooLow && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending)' }}>
                La capacité totale est inférieure à la limite par personne — un seul client pourrait suffire à tout occuper.
              </p>
            )}

            <label className="text-sm flex items-center gap-2 min-h-11">
              <input type="checkbox" checked={form.requiresValidation} onChange={update('requiresValidation')} className="w-5 h-5 shrink-0" />
              <span>
                Valider manuellement chaque réservation
                <span className="block text-xs" style={hintStyle}>Chaque demande devra être acceptée ou refusée dans le back-office plutôt que d’être confirmée automatiquement.</span>
              </span>
            </label>
          </SectionCard>

          {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
          <Button type="submit" loading={submitting}>{isEdit ? 'Enregistrer' : 'Créer l’offre'}</Button>
        </form>

        <aside className={`lg:sticky lg:top-20 ${mobileView === 'form' ? 'hidden lg:block' : ''}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Aperçu client
          </p>
          <OfferPreview offer={form} />
        </aside>
      </div>
    </div>
  );
}
