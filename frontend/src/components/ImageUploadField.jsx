import { useRef, useState } from 'react';
import { Upload, Loader2, ImageOff } from 'lucide-react';
import api from '../api/client';

// Champ réutilisable pour logo/bannière boutique et visuel d'offre : envoie le fichier tout
// de suite (POST /api/uploads), puis remonte l'URL obtenue via onChange — le formulaire
// parent la traite comme n'importe quel autre champ texte.
export default function ImageUploadField({ label, value, onChange, wide = false }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier après une erreur
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/uploads', formData);
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Envoi impossible (5 Mo max, jpeg/png/webp)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-lg flex items-center justify-center"
          style={{
            width: wide ? 96 : 64, height: 64,
            background: value ? `center / cover no-repeat url("${value}")` : 'var(--bg-tertiary)',
            border: '1px solid var(--border-strong)',
          }}
        >
          {!value && <ImageOff size={18} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />}
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-sm font-medium px-3 min-h-11 rounded-lg inline-flex items-center gap-2 disabled:opacity-60"
            style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-secondary)' }}
          >
            {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
            {value ? 'Changer l’image' : 'Ajouter une image'}
          </button>
          {value && !uploading && (
            <button type="button" onClick={() => onChange('')} className="text-xs underline" style={{ color: 'var(--text-muted)' }}>
              Retirer l’image
            </button>
          )}
        </div>

        <input
          ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={handleFile} className="hidden" aria-label={label}
        />
      </div>
      {error && <p className="text-xs mt-1.5" role="alert" style={{ color: 'var(--status-refused)' }}>{error}</p>}
    </div>
  );
}
