import { MapPin, Calendar, Users, Package, Trophy, ImageOff } from 'lucide-react';

const TYPE_ICON = { PRODUCT: Package, TOURNAMENT: Trophy };
const TYPE_LABEL = { PRODUCT: 'Produit', TOURNAMENT: 'Tournoi' };

// Rendu au plus près de ce qu'un client voit réellement sur la fiche offre (voir
// pages/OfferPage.jsx) — pas la carte de liste, qui montre trop peu pour juger d'un coup
// d'œil si le texte/visuel choisis fonctionnent bien ensemble. Champs vides → placeholders
// discrets plutôt que de casser la mise en page pendant la saisie.
export default function OfferPreview({ offer }) {
  const TypeIcon = TYPE_ICON[offer.type] || Package;
  const hasDate = offer.startAt && !Number.isNaN(new Date(offer.startAt).getTime());
  const hasPrice = offer.price !== '' && offer.price != null && !Number.isNaN(Number(offer.price));

  return (
    <div className="card overflow-hidden">
      {offer.imageUrl ? (
        <img src={offer.imageUrl} alt="" className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 flex items-center justify-center gap-2" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          <ImageOff size={18} aria-hidden="true" />
          <span className="text-xs">Aucun visuel</span>
        </div>
      )}

      <div className="p-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-ink)' }}>
          <TypeIcon size={13} /> {TYPE_LABEL[offer.type] || TYPE_LABEL.PRODUCT}
        </span>

        <h3 className="font-bold text-lg mt-2" style={{ color: offer.title ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {offer.title || 'Titre de l’offre'}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <MapPin size={13} className="shrink-0" />
            {offer.location || <span style={{ color: 'var(--text-muted)' }}>Lieu à préciser</span>}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} className="shrink-0" />
            {hasDate
              ? new Date(offer.startAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
              : <span style={{ color: 'var(--text-muted)' }}>Date à préciser</span>}
          </span>
        </div>

        {hasPrice && (
          <p className="mt-3 text-xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
            {Number(offer.price).toFixed(2)} €
          </p>
        )}

        {offer.description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{offer.description}</p>
        )}

        <div className="flex items-center gap-1.5 mt-4 text-xs px-3 py-1.5 rounded-full w-fit" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          <Users size={13} />
          Limite {offer.limitPerPerson || 1} par personne
          {offer.totalCapacity ? ` · ${offer.totalCapacity} places au total` : ''}
        </div>
      </div>
    </div>
  );
}
