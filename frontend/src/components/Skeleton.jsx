export function SkeletonLine({ width = '100%', height = 14, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

// Imite la forme d'une carte boutique/offre pendant le chargement.
export function SkeletonCard() {
  return (
    <div className="card p-4">
      <SkeletonLine width="40%" height={11} className="mb-3" />
      <SkeletonLine width="70%" height={16} className="mb-2" />
      <SkeletonLine width="90%" height={13} />
    </div>
  );
}

// Imite une ligne de liste (réservation, utilisateur...).
export function SkeletonRow() {
  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="flex-1">
        <SkeletonLine width="45%" height={15} className="mb-2" />
        <SkeletonLine width="65%" height={12} />
      </div>
      <SkeletonLine width={90} height={26} className="rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
