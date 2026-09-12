import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/Button';
import ImageUploadField from '../../components/ImageUploadField';

const EMPTY = {
  type: 'PRODUCT', title: '', description: '', imageUrl: '', price: '', startAt: '', registrationDeadline: '',
  location: '', limitPerPerson: 1, totalCapacity: '', requiresValidation: false,
};

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const inputClass = 'block w-full mt-1 px-3 py-2.5 rounded-lg min-h-11';
const inputStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' };

export default function AdminOfferFormPage() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
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

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-6">{isEdit ? 'Modifier l’offre' : 'Nouvelle offre'}</h2>

      {isEdit && status === 'DRAFT' && (
        <Button onClick={() => changeStatus('PUBLISHED')} loading={statusBusy} className="mb-6">Publier</Button>
      )}
      {isEdit && status === 'PUBLISHED' && (
        <Button variant="secondary" onClick={() => changeStatus('CLOSED')} loading={statusBusy} className="mb-6">Clore l’offre</Button>
      )}

      <form onSubmit={submit} className="card p-6 flex flex-col gap-3">
        <label className="text-sm">
          Type
          <select value={form.type} onChange={update('type')} className={inputClass} style={inputStyle}>
            <option value="PRODUCT">Produit</option>
            <option value="TOURNAMENT">Tournoi</option>
          </select>
        </label>
        <input required placeholder="Titre" value={form.title} onChange={update('title')} className="px-3 py-2.5 rounded-lg min-h-11" style={inputStyle} />
        <textarea placeholder="Description" rows={3} value={form.description} onChange={update('description')} className="px-3 py-2.5 rounded-lg" style={inputStyle} />
        <ImageUploadField label="Visuel de l’offre" value={form.imageUrl} wide onChange={(url) => setForm({ ...form, imageUrl: url })} />
        <input required placeholder="Lieu (ex. salle principale, table 3)" value={form.location} onChange={update('location')} className="px-3 py-2.5 rounded-lg min-h-11" style={inputStyle} />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Date
            <input required type="datetime-local" value={form.startAt} onChange={update('startAt')} className={inputClass} style={inputStyle} />
          </label>
          <label className="text-sm">
            Prix (€, optionnel)
            <input type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={update('price')} className={inputClass} style={inputStyle} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Limite par personne
            <input required type="number" inputMode="numeric" min="1" value={form.limitPerPerson} onChange={update('limitPerPerson')} className={inputClass} style={inputStyle} />
          </label>
          <label className="text-sm">
            Capacité totale (optionnel)
            <input type="number" inputMode="numeric" min="1" value={form.totalCapacity} onChange={update('totalCapacity')} className={inputClass} style={inputStyle} />
          </label>
        </div>

        <label className="text-sm flex items-center gap-2 min-h-11">
          <input type="checkbox" checked={form.requiresValidation} onChange={update('requiresValidation')} className="w-5 h-5" />
          Valider manuellement chaque réservation
        </label>

        {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
        <Button type="submit" loading={submitting}>{isEdit ? 'Enregistrer' : 'Créer l’offre'}</Button>
      </form>
    </div>
  );
}
