export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      {Icon && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--accent-subtle)' }}
        >
          <Icon size={24} color="var(--accent-ink)" strokeWidth={1.8} aria-hidden="true" />
        </div>
      )}
      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
