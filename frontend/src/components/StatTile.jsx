export default function StatTile({ label, value, hint, icon: Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {Icon && (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
            <Icon size={14} color="var(--accent-ink)" strokeWidth={1.9} />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{hint}</p>}
    </div>
  );
}
