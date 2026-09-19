import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import EmptyState from '../../components/EmptyState';
import { SkeletonList } from '../../components/Skeleton';

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/users', { params: search ? { search } : {} })
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300); // évite un appel réseau à chaque frappe
    return () => clearTimeout(t);
  }, [search]);

  const toggle = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/admin/users/${id}/toggle-active`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text" aria-label="Rechercher un utilisateur"
          placeholder="Rechercher un nom ou un email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg min-h-11"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-secondary)' }}
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : !users.length ? (
        <EmptyState icon={Users} title="Aucun utilisateur trouvé" description="Essayez un autre terme de recherche." />
      ) : (
        <div className="card overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="text-left" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Nom</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Email</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Rôle</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Réservations</th>
                  <th className="py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Statut</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-2.5 px-4 font-medium">{u.name}</td>
                    <td className="py-2.5 px-4" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td className="py-2.5 px-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{u.role}</td>
                    <td className="py-2.5 px-4 tabular-nums">{u._count.reservations}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: u.active ? 'var(--status-confirmed)' : 'var(--status-refused)',
                          background: u.active ? 'var(--status-confirmed-bg)' : 'var(--status-refused-bg)',
                        }}
                      >
                        {u.active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => toggle(u.id)} disabled={busyId === u.id}
                          className="text-xs font-medium underline min-h-11 px-2 disabled:opacity-50"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {busyId === u.id ? '…' : u.active ? 'Désactiver' : 'Réactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
