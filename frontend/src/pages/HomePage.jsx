import { Link } from 'react-router-dom';
import { Package, Trophy, ArrowRight } from 'lucide-react';
import { buttonBaseClass, primaryButtonStyle } from '../components/Button';
import OfferCard from '../components/OfferCard';
import { SkeletonGrid } from '../components/Skeleton';
import { useLiveOffers } from '../hooks/useLiveOffers';

export default function HomePage() {
  // Aperçu des prochaines offres plutôt qu'un bloc générique « Comment ça marche » — un bar
  // montre ce qu'il a en rayon et à l'affiche, pas un schéma abstrait de son parcours de
  // réservation (voir commealamaison-puteaux.fr, qui mène sa page d'accueil avec ses
  // meilleures ventes et ses nouveautés, pas un explicatif du fonctionnement du site).
  const { offers, loading } = useLiveOffers();
  const upcoming = offers.slice(0, 4);

  return (
    <div>
      <section className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start pt-4 pb-14">
        <div>
          <p className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--accent-ink)', letterSpacing: '0.14em' }}>
            Bar à jeux &amp; cartes à collectionner
          </p>
          <h1 className="text-4xl sm:text-5xl leading-[1.08] mb-5">
            Boosters, pièces rares et tournois,<br />
            <span style={{ color: 'var(--accent-ink)' }}>réservés avant d’arriver.</span>
          </h1>
          <p className="text-lg max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
            Comme à la Maison met en ligne ses sorties de boosters, ses pièces rares et ses tournois
            de la semaine — vous réservez en ligne, vous passez au bar.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/offres" className={buttonBaseClass} style={primaryButtonStyle}>
              Voir les offres <ArrowRight size={16} />
            </Link>
            <Link to="/inscription" className="text-sm font-semibold inline-flex items-center gap-1.5 min-h-11">
              Créer un compte <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="lg:pt-2">
          <div className="flex items-start gap-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Package size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-ink)' }} />
            <div>
              <h2 className="font-semibold text-sm mb-1">Produits en édition limitée</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Boosters, coffrets et pièces rares — avant qu'il n'en reste plus.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Trophy size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" style={{ color: 'var(--accent-ink)' }} />
            <div>
              <h2 className="font-semibold text-sm mb-1">Tournois toutes les semaines</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Standard, draft, format libre — validation par nos soins ou confirmation automatique.
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      </section>

      <section className="pt-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <h2 className="text-xl font-bold">Nos prochaines offres</h2>
          <Link to="/offres" className="text-sm font-semibold inline-flex items-center gap-1.5 min-h-11" style={{ color: 'var(--accent-ink)' }}>
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : upcoming.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Aucune offre publiée pour l’instant — revenez bientôt.</p>
        )}
      </section>
    </div>
  );
}
