import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const POLL_MS = 30_000;

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
function relativeTime(iso) {
  const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.345, 'week'], [12, 'month'], [Infinity, 'year'],
  ];
  let value = diffSec;
  let unit = 'second';
  for (const [limit, u] of steps) {
    if (Math.abs(value) < limit) { unit = u; break; }
    value /= limit;
  }
  return rtf.format(Math.round(value), unit);
}

// Cloche de notifications in-app : réservations confirmées/refusées/en liste d'attente côté
// client, demandes à valider côté admin (voir backend/src/services/notification.service.js).
// Interrogation périodique plutôt qu'un websocket — suffisant pour ce volume, et plus simple
// à héberger sur Passenger/O2Switch (pas de connexion longue durée à maintenir).
export default function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);

  const load = () => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  const toggle = () => setOpen((o) => !o);

  const markOneRead = (id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, readAt: n.readAt || new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    api.post(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    api.post('/notifications/read-all').catch(() => {});
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={toggle} aria-label="Notifications" aria-expanded={open}
        className="relative min-h-11 min-w-11 flex items-center justify-center rounded-lg active:scale-95 transition-transform"
      >
        <Bell size={19} color="var(--text-secondary)" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--status-refused)', color: '#fff' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl overflow-hidden z-40 card"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: 'var(--accent-ink)' }}
              >
                <CheckCheck size={13} /> Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-center py-8 px-4" style={{ color: 'var(--text-muted)' }}>
                Aucune notification pour l’instant.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.readAt && markOneRead(n.id)}
                  className="w-full text-left px-4 py-3 flex gap-2.5 items-start transition-colors"
                  style={{ borderBottom: '1px solid var(--border)', background: n.readAt ? 'transparent' : 'var(--accent-subtle)' }}
                >
                  {!n.readAt && (
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                  )}
                  <span className="flex-1">
                    <span className="block text-sm" style={{ color: 'var(--text-primary)' }}>{n.content}</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{relativeTime(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
