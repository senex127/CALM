import { useEffect, useState } from 'react';
import { Dice5 } from 'lucide-react';
import api from '../../api/client';
import Button from '../../components/Button';
import ImageUploadField from '../../components/ImageUploadField';
import { buildBrandTheme } from '../../lib/theme';

const inputClass = 'block w-full mt-1 px-3 py-2.5 rounded-lg min-h-11';
const inputStyle = { border: '1px solid var(--border-strong)', background: 'var(--bg-primary)' };
const DEFAULT_ACCENT = '#0c1239'; // bleu marine du vrai site commealamaison-puteaux.fr

export default function AdminSettingsPage() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      const s = data.settings;
      setForm({
        name: s.name, description: s.description || '', address: s.address,
        phone: s.phone || '', openingHours: s.openingHours || '',
        logoUrl: s.logoUrl || '', coverImageUrl: s.coverImageUrl || '',
        accentColor: s.accentColor || DEFAULT_ACCENT,
      });
    });
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSubmitting(true);
    const payload = { ...form };
    payload.logoUrl = payload.logoUrl || null;
    payload.coverImageUrl = payload.coverImageUrl || null;
    try {
      await api.patch('/settings', payload);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Enregistrement impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <p>Chargement…</p>;

  const preview = buildBrandTheme(form.accentColor);

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-6">Paramètres du site</h2>
      <form onSubmit={submit} className="card p-6 flex flex-col gap-3">
        <label className="text-sm font-medium">
          Nom
          <input required value={form.name} onChange={update('name')} className={inputClass} style={inputStyle} />
        </label>
        <label className="text-sm font-medium">
          Description
          <textarea rows={3} value={form.description} onChange={update('description')} className="block w-full mt-1 px-3 py-2.5 rounded-lg font-normal" style={inputStyle} />
        </label>
        <label className="text-sm font-medium">
          Adresse
          <input required value={form.address} onChange={update('address')} className={inputClass} style={inputStyle} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Téléphone (optionnel)
            <input type="tel" value={form.phone} onChange={update('phone')} className={inputClass} style={inputStyle} />
          </label>
          <label className="text-sm font-medium">
            Horaires (optionnel)
            <input placeholder="Mar–Ven 16h–00h" value={form.openingHours} onChange={update('openingHours')} className={inputClass} style={inputStyle} />
          </label>
        </div>

        <ImageUploadField label="Logo" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />
        <ImageUploadField label="Bannière" value={form.coverImageUrl} wide onChange={(url) => setForm({ ...form, coverImageUrl: url })} />

        <div>
          <span className="text-sm font-medium block mb-1.5">Couleur du site</span>
          <div className="flex items-center gap-3">
            <input
              type="color" value={form.accentColor} onChange={update('accentColor')}
              className="w-11 h-11 rounded-lg cursor-pointer shrink-0" style={{ border: '1px solid var(--border-strong)', padding: 2, background: 'var(--bg-primary)' }}
              aria-label="Choisir la couleur du site"
            />
            <input
              type="text" aria-label="Code couleur hexadécimal"
              value={form.accentColor} onChange={update('accentColor')}
              className="px-3 py-2.5 rounded-lg min-h-11 font-mono text-sm flex-1"
              style={inputStyle} maxLength={7}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Recolore tout le site — bannières, boutons et badges.
          </p>
        </div>

        {preview && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="h-14" style={{ background: preview.light.accentGradient }} />
            <div className="p-3 flex items-center gap-2" style={{ background: 'var(--bg-secondary)' }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: preview.light.accentSubtle }}>
                <Dice5 size={15} color={preview.light.accentInk} strokeWidth={1.9} />
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Aperçu — {form.name || 'votre site'}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
        {saved && !error && <p className="text-sm" style={{ color: 'var(--status-confirmed)' }}>Enregistré — rechargez la page pour voir la nouvelle couleur partout.</p>}
        <Button type="submit" loading={submitting}>Enregistrer</Button>
      </form>
    </div>
  );
}
