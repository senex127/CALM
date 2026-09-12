import { Link } from 'react-router-dom';
import { Package, Trophy, ArrowRight } from 'lucide-react';
import { buttonBaseClass } from '../components/Button';

const STEPS = [
  { title: 'Choisissez une offre', text: 'Un produit en édition limitée ou une place de tournoi, publiés au fil de la semaine.' },
  { title: 'Réservez en 2 minutes', text: 'Un formulaire simple, une limite claire par personne, connecté avec votre compte ou Google.' },
  { title: 'Passez au bar', text: 'Confirmation par email, retrait ou inscription sur place — pas de paiement en ligne à avancer.' },
];

export default function HomePage() {
  return (
    <div>
      <section className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start pt-4 pb-14">
        <div>
          <p className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--accent-ink)', letterSpacing: '0.14em' }}>
            Bar à jeux &amp; cartes à collectionner
          </p>
          <h1 className="text-4xl sm:text-5xl leading-[1.08] mb-5">
            Votre place au tournoi,<br />
            <span style={{ color: 'var(--accent-ink)' }}>réservée avant d’arriver.</span>
          </h1>
          <p className="text-lg max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
            Comme à la Maison met en ligne ses sorties de boosters, ses pièces rares et ses tournois
            de la semaine — vous réservez en ligne, vous passez au bar.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/offres" className={buttonBaseClass} style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}>
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
        <h2 className="text-xs font-semibold uppercase mb-8" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          Comment ça marche
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ title, text }, i) => (
            <div key={title}>
              <span className="block text-4xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-ink)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
