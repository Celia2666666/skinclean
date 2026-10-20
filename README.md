# SKINCLEAN — Your skin. Your glow.

Site e-commerce skincare (projet académique, marque fictive) : catalogue, Skin Diag, routine par e-mail, panier, paiement Stripe, compte client, SKINCLEAN Club, Skin Journal, Glow Assistant, back-office.

## Démarrer

```bash
npm install
cp .env.example .env.local   # facultatif : sans clés, tout tourne en mode démo
npm run dev                  # http://localhost:3000
npm test                     # 22 tests (catalogue, diag, panier, fidélité, liens signés)
npm run build && npm start   # production
```

Prérequis : Node 20+.

## Stack et pourquoi

| Brique | Choix | Raison |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | SSR/SSG pour le SEO, routes API pour Stripe/e-mails, une seule base de code |
| Style | **Tailwind CSS 4** + tokens dans `src/app/globals.css` | Design system centralisé (palette, rayons, ombres, animations) |
| Animations | **Framer Motion** + CSS keyframes | Transitions de pages/quiz, scroll reveal, parallaxe ; textures animées en CSS (léger). Respect de `prefers-reduced-motion` partout |
| État client | **Zustand** (persisté) | Panier conservé entre les visites, mode démo complet sans serveur |
| Paiement | **Stripe Checkout** | CB, Apple Pay, Google Pay sans manipuler de données bancaires |
| E-mails | **Resend** | Routine, double opt-in newsletter, rappels Journal, contact |
| Données (prod) | **PostgreSQL + Prisma** | Schéma prêt : `prisma/schema.prisma` |

GSAP n'a pas été ajouté : Framer Motion couvre tous les besoins sans doubler le poids JS.

## Architecture

```
src/
  app/                    pages (une route = un dossier) + routes API (app/api)
  components/
    layout/               header + mega-menu, footer, panier latéral, recherche, cookies, newsletter
    home/                 les 11 sections de l'accueil
    product/              carte produit vivante, packshot, mise en scène de texture, galerie, avant/après
    catalog/              grilles filtrables, kits, configurateur « Créer mon set »
    diag/                 Skin Diag, résultats, routine partagée
    account/              compte, Club, Skin Journal, back-office
    assistant/            Glow Assistant
  data/                   ← CONTENU MODIFIABLE : products.ts, categories.ts, kits.ts, config.ts, home.ts
  lib/                    logique : catalog, pricing, diag (moteur), assistant, store, sign (HMAC)
  emails/                 gabarits HTML d'e-mails
public/media/             ← VOS MÉDIAS (voir public/media/README.md)
prisma/schema.prisma      modèle de données de production
tests/                    tests Vitest
```

### Pages
Accueil · `/soins-visage` (+ 26 catégories : 13 types, 11 préoccupations, nouveautés, mini-formats) · `/produits/[slug]` (30 fiches) · `/best-sellers` · `/kits`, `/kits-de-saison`, `/kits/[slug]` · `/creer-mon-set` · `/skin-diag`, `/skin-diag/resultats`, `/routine/[lien-signé]` · `/club` · `/panier`, `/paiement`, `/commande/confirmation` · `/compte` (commandes, routines, journal, favoris, profil), connexion, inscription, mot de passe oublié · `/notre-histoire`, `/nos-engagements`, `/faq` (+ contact), `/livraison`, `/legal/*` · `/admin` · `sitemap.xml`, `robots.txt`.

## Ce qui est réel / ce qui est en mode démo

| Fonction | Sans clés (démo) | Avec clés |
|---|---|---|
| Paiement | **Aucun paiement simulé.** Seule une « commande de test » marquée *non payée* est possible | Stripe Checkout ; commande annoncée payée uniquement après vérification serveur de la session |
| E-mail routine / newsletter | Rien n'est envoyé ; aperçu de l'e-mail et lien de confirmation affichés | Envoi Resend |
| Comptes, fidélité, Journal | Stockés dans le navigateur (mot de passe haché) — **pas sécurisé pour la prod** | À brancher sur Postgres (schéma fourni) + Auth.js |
| Glow Assistant | Assistant **guidé** (scénarios + mots-clés), indiqué comme tel | `ASSISTANT_AI_ENDPOINT` → `/api/assistant` |
| Back-office | Modifications locales au navigateur, accès non protégé | Routes protégées + rôles + base |

Liens de routine : réels même en démo (contenu signé HMAC, valables sans limite, prix relus en direct). Le bon -20 % est aussi signé par le serveur et revérifié au paiement ; l'usage unique par e-mail nécessite la base (table `WelcomeCode`).

## Ajouter vos photos et vidéos

1. **Packshot** : déposer `public/media/packshots/mon-produit.png` (fond transparent idéal ; sinon `node scripts/remove-bg.mjs photo.jpg public/media/packshots/mon-produit.png`), puis dans `src/data/products.ts` :
   ```ts
   media: { packshot: "/media/packshots/mon-produit.png", gallery: ["/media/lifestyle/x.webp"] }
   ```
   Tant que `packshot` est vide, un flacon SVG aux couleurs du produit s'affiche, marqué « visuel provisoire ».
2. **Vidéo au survol** (application sur la peau, style Typology) : `media.hoverVideo: "/media/videos/clear-skin-application.mp4"` (MP4 court, muet, < 4 Mo). Sinon une mise en scène animée (gouttes, crème étalée, mousse, brume, pad, patch) sert de remplacement.
3. **Tutoriel** : `media.howToVideo`.
4. **Avant/après** : uniquement de vraies photos → `media.beforeAfter: [{ before, after, caption }]` sur le produit, et/ou `src/data/home.ts → beforeAfter`.
5. **Hero & reels d'accueil** : `src/data/home.ts` → `heroVideo`, `heroVideoMobile`, `heroPoster`, `demoVideos[].src`.

## Gérer les produits

- **Modifier un produit / ajouter un produit** : `src/data/products.ts` (un objet par produit ; id et slug uniques). Les catégories se calculent toutes seules à partir de `type`, `concerns` et `skinTypes` : pas de doublon de fiche.
- **Best-sellers** : champ `bestseller: 1…7`.
- **Kits** : `src/data/kits.ts` (le prix = somme des produits − `discountPercent`, donc toujours synchronisé).
- **Fidélité, offres, livraison, bandeau d'annonces, rôles** : `src/data/config.ts`.
- **Back-office `/admin`** (démo) : prix, stocks, remises kits, remise « Créer mon set », statuts des commandes (expédiée → feuilles créditées ; remboursée → feuilles retirées), clients, hero de l'accueil, statistiques agrégées des diags.
- `npm test` vérifie la cohérence du catalogue après chaque modification.

## Activer les paiements (Stripe)

1. Créer un compte Stripe, récupérer `sk_test_…` → `STRIPE_SECRET_KEY` dans `.env.local`.
2. Dashboard → Paramètres → Moyens de paiement : activer Cartes, **Apple Pay**, **Google Pay** (Stripe Checkout les affiche automatiquement sur les appareils compatibles ; pas de vérification de domaine nécessaire pour Checkout hébergé).
3. Webhook : endpoint `https://votre-domaine/api/stripe/webhook`, événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded` → `STRIPE_WEBHOOK_SECRET`. En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Tester avec la carte `4242 4242 4242 4242`. Paiement refusé : `4000 0000 0000 0002`.
5. Passer en production : clés `sk_live_…`. Le webhook contient les `TODO(base de données)` pour persister la commande, décrémenter les stocks et envoyer l'e-mail récapitulatif.

Les prix sont toujours recalculés côté serveur à partir du catalogue (le navigateur n'envoie que des identifiants et quantités).

## E-mails (Resend)

`RESEND_API_KEY`, `EMAIL_FROM` (domaine vérifié chez Resend), `CONTACT_EMAIL`. Les rappels du Skin Journal (J7/J14/J30, gabarit `src/emails/newsletter.ts → journalReminderEmail`) nécessitent la base + une tâche planifiée (ex. Vercel Cron quotidien).

## Passer en production (base + authentification)

1. `npm i -D prisma && npm i @prisma/client`, `DATABASE_URL`, `npx prisma migrate dev`.
2. Script d'import : charger `src/data/*.ts` dans les tables `Product`, `Variant`, `Category`, `Kit`.
3. Authentification : Auth.js (credentials + lien magique) ; protéger `/compte` et `/admin` via `proxy.ts` (ex-middleware dans Next 16) et le champ `role`.
4. Remplacer les actions du store (`src/lib/store.ts`) par des appels API ; le Skin Journal stocke les photos dans un bucket privé chiffré (URL signées courte durée).

## Déployer

Vercel (recommandé) : importer le dépôt, ajouter les variables d'environnement, déployer. Mettre `NEXT_PUBLIC_SITE_URL` sur le domaine final et déclarer le webhook Stripe.

## Garde-fous respectés

- Aucune certification, test clinique ou pourcentage inventé (`naturalOrigin` reste vide tant qu'il n'est pas validé ; « cruelty-free » présenté comme engagement à valider).
- Aucun faux avis : la section avis reste vide tant qu'il n'y a pas d'avis vérifiés.
- Avant/après de démonstration clairement étiquetés comme illustrations.
- Le programme Yepoda (« Yepoda Fam », monnaie « cœurs ») ne publie pas ses seuils : seuls ses principes publics sont repris (paliers sur 12 mois, expiration après 12 mois d'inactivité, non cumulable, feuilles retirées en cas de retour, bonus avis 1×/mois). Les valeurs chiffrées sont des propositions modifiables.
- Diag et assistant : conseil cosmétique, pas de diagnostic médical ; orientation vers un professionnel pour les cas sévères ; rétinoïdes exclus si peau réactive, grossesse ou non-tolérance, et jamais associés à un acide exfoliant (testé).

## Comptes de test

Deux comptes clients fictifs sont définis dans `src/data/demo-accounts.ts` (e-mails et mots de passe dans ce fichier).
Sur `/compte/connexion`, les boutons « Comptes de test » remplissent le formulaire automatiquement :

- **Cliente fidèle** — commandes livrées et en cours, feuilles SKINCLEAN Club (palier Bourgeon), routine enregistrée, favoris.
- **Nouvelle cliente** — aucune commande : cadeau de 1ʳᵉ commande, Skin Diag, newsletter.

Le compte est créé dans le navigateur à la première connexion. Pour repartir de zéro : vider les données du site dans le navigateur.
