import {
  PencilLine, Sparkles, Lock, Archive, Clock, CheckCircle2, XCircle, Ban, Users, UserX, ShieldOff,
} from 'lucide-react';

const CONFIG = {
  DRAFT:      ['Brouillon',        PencilLine,   'var(--text-muted)',        'var(--bg-tertiary)'],
  PUBLISHED:  ['Publiée',          Sparkles,     'var(--status-confirmed)',  'var(--status-confirmed-bg)'],
  CLOSED:     ['Close',            Lock,         'var(--text-muted)',        'var(--bg-tertiary)'],
  ARCHIVED:   ['Archivée',         Archive,      'var(--text-muted)',        'var(--bg-tertiary)'],
  PENDING:    ['En attente',       Clock,        'var(--status-pending)',    'var(--status-pending-bg)'],
  CONFIRMED:  ['Confirmée',        CheckCircle2, 'var(--status-confirmed)',  'var(--status-confirmed-bg)'],
  REFUSED:    ['Refusée',          XCircle,      'var(--status-refused)',    'var(--status-refused-bg)'],
  CANCELLED:  ['Annulée',          Ban,          'var(--text-muted)',        'var(--bg-tertiary)'],
  WAITLISTED: ['Liste d’attente',  Users,        'var(--status-waitlist)',   'var(--status-waitlist-bg)'],
  NO_SHOW:    ['Non présenté',     UserX,        'var(--status-refused)',    'var(--status-refused-bg)'],
  APPROVED:   ['Validée',          CheckCircle2, 'var(--status-confirmed)',  'var(--status-confirmed-bg)'],
  SUSPENDED:  ['Suspendue',        ShieldOff,    'var(--status-refused)',    'var(--status-refused-bg)'],
};

export default function StatusBadge({ status }) {
  const [label, Icon, color, bg] = CONFIG[status] || [status, null, 'var(--text-muted)', 'var(--bg-tertiary)'];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ color, background: bg }}
    >
      {Icon && <Icon size={13} strokeWidth={2.4} aria-hidden="true" />}
      {label}
    </span>
  );
}
