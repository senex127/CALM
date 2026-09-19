# Comme à la Maison

Site du bar à jeux "Comme à la Maison" : vente de cartes à collectionner (TCG) en précommande
et inscription à ses tournois. Client final : compte email/mot de passe ou Google, réserve un
produit ou une place de tournoi. Admin : back-office pour gérer les offres et traiter les
réservations, avec validation manuelle optionnelle, limite par personne et liste d'attente
automatique.

Dérivé de **Reservator**, un projet marketplace multi-boutique — celui-ci sert un seul
établissement, donc sans sous-domaine par boutique, sans file de validation, sans thème par
boutique : une seule identité, réglable depuis Admin → Paramètres. Stack et conventions de
déploiement reprises de **Portfy**, qui tourne déjà en production sur le même compte O2Switch
mutualisé.

## Stack

- **Backend** : Node.js 20 + Express, Prisma 5 (PostgreSQL)
- **Frontend** : React + Vite, Tailwind v4, React Router, Zustand
- **Auth** : JWT maison (email + mot de passe) + Google Identity Services (vérification
  d'ID token côté serveur, voir `backend/src/lib/googleAuth.js`)
- **Emails** : node-mailjet

## Démarrage rapide (Docker)

```bash
cp backend/.env.example backend/.env     # renseigner JWT_SECRET (DATABASE_URL vient de docker-compose)
cp frontend/.env.example frontend/.env
docker compose up
```

- Frontend → http://localhost:5174
- Backend → http://localhost:3002 (le conteneur applique `prisma db push` au démarrage, tables créées automatiquement)
- PostgreSQL → localhost:5433 (`calm` / `calm_secret`, voir `docker-compose.yml`)

Ports volontairement différents de Reservator (5173/3001/5432) pour que les deux projets
tournent en même temps sans conflit sur la même machine.

Le code est monté en volume (`./backend:/app`, `./frontend:/app`) : les modifications sont
prises en compte à chaud, pas besoin de rebuild l'image sauf changement de `package.json`
(`docker compose up --build` dans ce cas).

Au tout premier démarrage, le backend peut échouer une fois (`P1001: Can't reach database
server`) si Postgres n'est pas encore prêt — `restart: unless-stopped` le relance
automatiquement quelques secondes plus tard, rien à corriger.

<details>
<summary>Démarrage sans Docker</summary>

```bash
# Backend — nécessite un PostgreSQL déjà accessible
cd backend
cp .env.example .env   # renseigner DATABASE_URL, JWT_SECRET, etc.
npm install
npm run db:push        # crée les tables
npm run dev             # http://localhost:3001

# Frontend (autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5174
```

Un PostgreSQL local peut être lancé à part :
`docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15`
</details>

## Variables d'environnement

`backend/.env` (voir `backend/.env.example` pour les commentaires détaillés) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL — fournie par `docker-compose.yml` en local |
| `JWT_SECRET` | Signature des tokens de session |
| `FRONTEND_URL` | Origine exacte du frontend — un seul établissement, une seule origine à autoriser en CORS |
| `GOOGLE_CLIENT_ID` | Connexion Google — absente = bouton masqué, pas d'erreur |
| `MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE` / `MJ_SENDER_EMAIL` | Mailjet — absent = emails simplement non envoyés (loggé), rien ne casse |
| `TURNSTILE_SECRET_KEY` | Anti-bot à l'inscription — absente = vérification désactivée (voir plus bas) |

`frontend/.env` (voir `frontend/.env.example`) :

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de l'API backend |
| `VITE_GOOGLE_CLIENT_ID` | Doit correspondre à `GOOGLE_CLIENT_ID` côté backend |
| `VITE_TURNSTILE_SITE_KEY` | Doit correspondre à `TURNSTILE_SECRET_KEY` côté backend (clé publique, sans risque à exposer) |

## Données de test

```bash
npm run db:seed --prefix backend   # ou : cd backend && npm run db:seed
```

Purge et recrée un jeu de données cohérent : les réglages du site, 7 offres (produit/tournoi,
brouillon/publiée/close), et des réservations couvrant les 6 statuts possibles — y compris une
liste d'attente déjà pleine, pour voir la mécanique sans avoir à la reconstituer à la main.
Détail dans `backend/src/prisma/seed.js`. Mot de passe pour tous les comptes : `password123`.

| Compte | Rôle |
|---|---|
| `admin@commealamaison.test` | Administrateur (offres, réservations, réglages du site) |
| `lea` / `hugo` / `nora` / `tom` `@client.test` | Clients |

## Premier compte administrateur (hors seed)

Aucune route ne permet de se promouvoir admin (volontaire — c'est un rôle qu'on ne donne
jamais via une API publique). Après inscription d'un compte, le passer en `ADMIN`
directement en base :

```bash
cd backend
npx prisma studio --schema ./src/prisma/schema.prisma
# → table User → éditer le champ role du compte concerné → "ADMIN"
```

## Couleur du site

Un seul établissement : sa couleur de marque se règle depuis **Admin → Paramètres**
(sélecteur de couleur + aperçu en direct) et recolore aussitôt tout le site — bannières,
boutons, badges — pas seulement une portion, contrairement à Reservator où chaque boutique
n'affecte que sa propre vitrine. Voir `frontend/src/lib/theme.js` (dérive 5 tokens depuis une
seule teinte) et `components/GlobalTheme.jsx` (les injecte au chargement).

## Sécurité

- **En-têtes** : Helmet avec une vraie CSP (pas désactivée), `trust proxy` activé en prod
  (indispensable derrière Passenger — sans ça, `req.ip` voit l'IP du proxy pour tout le monde
  et le rate limiting par IP ne sert plus à rien), redirection HTTPS forcée en prod.
- **Auth** : validation zod sur email/mot de passe (email réellement vérifié, mot de passe
  8–128 caractères — évite au passage un mot de passe de plusieurs Mo qui ralentirait bcrypt),
  hash bcrypt coût 12, JWT_SECRET vérifié au démarrage (32 caractères minimum, sinon le
  serveur refuse de démarrer).
- **Uploads** : en plus du filtrage par extension/mimetype (spoofable côté client), le fichier
  écrit sur disque est relu et sa signature binaire réelle vérifiée (jpeg/png/webp) avant
  d'être rendu accessible — un fichier renommé avec un faux `Content-Type` est rejeté.
- **Réservations** : voir "File d'attente" ci-dessous.
- **Anti-bot** : voir "Anti-bot à l'inscription" ci-dessous.
- **CSRF** : pas de protection dédiée nécessaire — l'API est en JWT Bearer (Authorization
  header), jamais en cookie de session, donc pas de recours ambiant qu'un site tiers pourrait
  déclencher malgré lui.

## File d'attente sur les réservations

Le verrou `SELECT ... FOR UPDATE` posé sur l'offre (déjà en place, voir
`reservation.service.js`) empêche la survente : deux clients ne peuvent pas obtenir la même
dernière place. Mais sans rien de plus, un pic de popularité sur une offre (un tournoi qui se
remplit en quelques secondes) ouvrirait autant de transactions Postgres simultanées que de
requêtes reçues, chacune bloquée en attente du même verrou — au risque d'épuiser le pool de
connexions et de ralentir tout le site, pas seulement cette offre.

`lib/offerQueue.js` ajoute une file en mémoire, une par offre : une seule tentative de
réservation par offre est traitée à la fois, les autres attendent en mémoire (gratuit) dans
l'ordre d'arrivée — sans bloquer les réservations sur les *autres* offres. Au-delà de 50
tentatives en attente sur une même offre, les nouvelles sont refusées tout de suite (503) avec
un message clair plutôt que de faire attendre indéfiniment.

Testé avec de vraies requêtes concurrentes (20 requêtes simultanées, 4 comptes, une offre à
2 par personne) : la limite par personne a tenu exactement, sans survente, malgré la charge —
voir `git log` / l'historique de session pour le détail du test si besoin de le rejouer.

Limite connue : cette file vit dans le process Node, correcte pour un déploiement
mono-instance (Passenger sur O2Switch, le cas ici) mais ne coordonnerait pas plusieurs
instances derrière un load balancer — le verrou en base, lui, resterait correct dans tous les
cas.

## Anti-bot à l'inscription

Deux couches, toutes deux optionnelles et sans dépendance bloquante :

1. **Honeypot** — un champ `website` invisible pour un humain (masqué en CSS, hors du flux de
   tabulation) mais présent dans le DOM ; un bot qui remplit tous les champs d'un formulaire
   s'y fait piéger. Actif d'office, aucune configuration nécessaire.
2. **Cloudflare Turnstile** (gratuit) — un vrai défi anti-bot, vérifié côté serveur avant de
   créer le compte. Désactivé tant que `TURNSTILE_SECRET_KEY` / `VITE_TURNSTILE_SITE_KEY` ne
   sont pas renseignées (le formulaire d'inscription fonctionne normalement, juste sans ce
   filtre) — à activer sur **Dashboard Cloudflare → Turnstile → Add site** (domaine, mode
   *Managed*), qui donne une Site Key (publique) et une Secret Key (privée).

   En local, `.env` pointe actuellement vers la paire de test publique "always passes" de
   Cloudflare (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`, documentée
   sur [developers.cloudflare.com/turnstile/troubleshooting/testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/))
   — elle valide n'importe quel jeton, pratique pour développer sans dépendre du réseau, mais
   **à remplacer par de vraies clés avant la mise en prod**, sans quoi la protection est un
   théâtre : elle laisserait passer n'importe quoi.

Turnstile protège aussi la création de réservation (`POST /offers/:id/reservations`), pas
seulement l'inscription — les précommandes/réservations sont la cible la plus probable d'un
bot (accaparer un stock ou des places limitées avant les vrais clients). Le widget apparaît
dans le formulaire de réservation (`OfferPage.jsx`) exactement comme à l'inscription. La
connexion reste protégée par le rate limiting existant (`authLimiter`).

## Disponibilité en direct (WebSocket)

Les places restantes, le passage en liste d'attente et la publication/fermeture d'une offre
se répercutent chez tous les visiteurs qui ont la page ouverte, sans qu'ils aient à la
recharger — via Socket.IO plutôt qu'une lib WebSocket "pure" (`ws`) : le Node.js Selector
cPanel d'O2Switch tourne derrière Passenger/Apache, dont le support de l'upgrade WebSocket
dépend de la configuration exacte de l'hébergement (voir *Déploiement* plus bas) — pas garanti
sur un mutualisé. Socket.IO retombe automatiquement en polling HTTP long si l'upgrade échoue,
là où une connexion WebSocket pure casserait net.

- `backend/src/lib/socket.js` — serveur Socket.IO attaché au serveur HTTP (`app.js`), CORS
  aligné sur `FRONTEND_URL` comme le reste de l'API. Un client s'abonne à une offre précise
  (`offer:subscribe`, room `offer:<id>`) pour recevoir ses mises à jour de disponibilité —
  jamais un broadcast global de toutes les réservations du site.
- `backend/src/lib/offerAvailability.js` — recalcule places prises/restantes/liste d'attente
  à la demande (mêmes règles que la cascade de réservation, en lecture seule) et diffuse le
  résultat (`offer:availability`) à la room de l'offre concernée, à chaque réservation créée,
  acceptée, refusée, annulée ou marquée non-présentée.
- `offer.controller.js` diffuse `offer:changed` à **tous** les clients connectés (pas une room
  précise, la page Offres n'est pas ciblée par offre) quand une offre entre ou sort de la
  visibilité publique, ou que son contenu change alors qu'elle est déjà publiée — jamais le
  contenu d'un brouillon, qui ne doit fuiter à personne avant publication.
- Frontend : `lib/socket.js` (connexion partagée), branché dans `OfferPage.jsx` (places
  restantes, bouton "Réserver" → "Rejoindre la liste d'attente" une fois complet, quantité
  max ajustée en direct) et `OffersPage.jsx` (une offre publiée/fermée apparaît ou disparaît de
  la liste sans recharger).

Aucune donnée sensible ne transite par ces évènements — uniquement des informations déjà
publiques (disponibilité, contenu d'une offre publiée).

## Déploiement (O2Switch)

Le déploiement est géré par un **cron cPanel qui pull toutes les 5 minutes**
(`scripts/server-deploy.sh`), pas par un webhook déclenché depuis GitHub Actions : le
port 22 est bloqué depuis les IPs GitHub Actions sur O2Switch, et la protection anti-bot
(Imunify360) bloque les requêtes entrantes. Le CI (`.github/workflows/deploy.yml`) se
limite donc à valider le build et l'audit de sécurité.

1. Sur le serveur : cloner le repo dans `~/public_html/comme-a-la-maison`, configurer l'app
   Node.js (cPanel → Setup Node.js App, Node 20, dossier `backend`), copier `.env.example` en
   `.env` et le compléter.
2. Ajouter le cron : `*/5 * * * * ~/public_html/comme-a-la-maison/scripts/server-deploy.sh`
3. Chaque push sur `main` est récupéré au cron suivant, qui `git reset --hard`, réinstalle
   les dépendances si besoin, applique le schéma Prisma, rebuild le frontend si besoin et
   redémarre l'app (`touch backend/tmp/restart.txt`).

## Structure

```
backend/src/
  app.js                     # point d'entrée Express, CORS (une seule origine)
  prisma/
    schema.prisma            # User, Settings (singleton), Offer, Reservation, Notification
    seed.js                  # données de test (npm run db:seed)
  controllers/                # logique par ressource (settings, offer, reservation, auth, admin)
  services/
    reservation.service.js    # les 3 vérifications en cascade (limite / capacité / validation)
  routes/
  middleware/                 # auth (JWT), rôle, rate limiting, validation zod, upload (multer)
  schemas/                     # schémas zod par ressource
  lib/                          # prisma, mailer (Mailjet), googleAuth, turnstile, offerQueue

frontend/src/
  App.jsx                     # un seul arbre de routes (pas de multi-tenant)
  lib/theme.js                 # dérive la palette du site depuis Settings.accentColor
  components/
    GlobalTheme.jsx            # applique cette palette à tout le site au chargement
    ImageUploadField.jsx       # upload logo/bannière/visuel d'offre (POST /api/uploads)
    TurnstileWidget.jsx        # anti-bot à l'inscription (voir plus haut)
  pages/                       # espace public + client (accueil, offres, à propos...)
  pages/admin/                 # back-office : offres, réservations, utilisateurs, paramètres
  store/authStore.js           # session (zustand + persist)
  api/client.js                 # axios + injection du token
```

## Ce qui reste à faire après ce squelette

- Expiration automatique du délai de confirmation en liste d'attente (cron dédié).
- Emails HTML soignés (actuellement un template minimal dans `reservation.service.js`).
- Tests. Aucun pour l'instant.
