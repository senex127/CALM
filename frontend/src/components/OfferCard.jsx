import { Link } from 'react-router-dom';
import { Package, Trophy, Calendar } from 'lucide-react';

const TYPE_ICON = { PRODUCT: Package, TOURNAMENT: Trophy };
const TYPE_LABEL = { PRODUCT: 'Produit', TOURNAMENT: 'Tournoi' };

// Carte d'offre réutilisée sur l'accueil boutique, la liste d'offres et (implicitement) tout
// futur point d'entrée — un seul endroit à mettre à jour si le visuel change.
export default function OfferCard({ offer }) {
  const TypeIcon = TYPE_ICON[offer.type];

  return (
    <Link to={`/offres/${offer.id}`} className="card card-interactive overflow-hidden block">
      {offer.imageUrl && (
        // alt="" : le titre juste en dessous porte déjà l'information, l'image est ici décorative
        <img src={offer.imageUrl} alt="" className="w-full h-36 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-ink)' }}>
            <TypeIcon size={13} /> {TYPE_LABEL[offer.type]}
          </span>
          {offer.price != null && (
            <span className="text-sm font-semibold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
              {Number(offer.price).toFixed(2)} €
            </span>
          )}
        </div>
        <h3 className="font-semibold mt-2">{offer.title}</h3>
        <p className="text-sm mt-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <Calendar size={13} className="shrink-0" />
          {new Date(offer.startAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
        </p>
      </div>
    </Link>
  );
}
