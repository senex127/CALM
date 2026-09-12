import { useEffect, useState } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import api from '../api/client';
import { SkeletonLine } from '../components/Skeleton';

export default function AboutPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSettings(data.settings));
  }, []);

  if (!settings) {
    return (
      <div className="max-w-lg mx-auto">
        <SkeletonLine width="90%" height={60} className="mb-6" />
        <SkeletonLine width="100%" height={140} />
      </div>
    );
  }

  const rows = [
    { Icon: MapPin, label: 'Adresse', value: settings.address },
    settings.phone && { Icon: Phone, label: 'Téléphone', value: settings.phone },
    settings.openingHours && { Icon: Clock, label: 'Horaires', value: settings.openingHours },
  ].filter(Boolean);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6">À propos</h1>
      {settings.description && (
        <p className="mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{settings.description}</p>
      )}

      <div className="card">
        {rows.map(({ Icon, label, value }, i) => (
          <div key={label} className="flex items-center gap-3 p-4" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
              <Icon size={16} color="var(--accent-ink)" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
