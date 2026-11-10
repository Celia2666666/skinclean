# SKINCLEAN — Your skin. Your glow.

Site e-commerce skincare (projet académique, marque fictive) : catalogue, Skin Diag, routine par e-mail, panier, paiement Stripe, compte client, SKINCLEAN Club, Skin Journal, Glow Assistant, back-office.

## Démarrer

```bash
npm install
cp .env.example .env.local   # facultatif : sans clés, tout tourne en mode démo
npm run dev                  # http://localhost:3000
npm test                     # tests (catalogue, diag, panier, fidélité, liens signés, Marketing Hub)
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

## Marketing Hub (`/hub`)

Plateforme de **stratégie, création et pilotage marketing** reliée au site (ce n'est pas un CRM : clients, commandes, chiffre d'affaires et stock sont dans le [CRM](#crm-crm), outil distinct).

```bash
npm run dev            # puis http://localhost:3000/hub
```

**Compte universel** (créé au premier lancement, tous les droits) — change le mot de passe dans « Mon compte » :

- E-mail : `skinclean@skinclean.local`
- Mot de passe : la valeur de `HUB_SEED_PASSWORD` dans `.env.local` ; sans cette variable, un mot de passe aléatoire est affiché dans le terminal au premier lancement (pour le changer : `npm run hub:mot-de-passe`). Aucun mot de passe n'est écrit dans le code.

**Mot de passe oublié** : lien « Mot de passe oublié ? » sur l'écran de connexion. Le lien de réinitialisation (30 min, usage unique) est envoyé par e-mail si Resend est configuré, sinon déposé dans `data/hub/lien-reinitialisation.txt` (et affiché dans le terminal du serveur). Secours en ligne de commande : `npm run hub:mot-de-passe -- <e-mail> <nouveau-mot-de-passe>`.

D'autres comptes peuvent être ajoutés dans « Mon compte → Autorisations & utilisateurs » (accès complet par défaut).

### Modules
1. **Accueil** — programme du jour (voir, modifier, valider, publier, reporter), publications à venir, contenus à valider, campagnes en cours, 3 recommandations, Copilot.
2. **Ma stratégie** — analyse de marché, tendances, benchmark, SWOT, positionnement, proposition de valeur, parcours, objectifs, canaux, ligne éditoriale, messages, stratégies (contenu, acquisition, influence, notoriété). Chaque bloc est qualifié : *fait vérifié*, *hypothèse* ou *proposition*. Objectifs SMART modifiables, 4 personas.
3. **Calendrier éditorial** — vues jour, semaine, mois (navigation sur 12 mois), par réseau, par campagne ; glisser-déposer ; ~15 semaines préremplies aux fréquences demandées (ajustables) ; fiche complète de chaque publication.
4. **Réseaux sociaux** — bibliothèques prêtes à l'emploi (Instagram, TikTok avec hook/script/scènes, Facebook, Pinterest), simulations fidèles des plateformes, téléchargement, copie légende/hashtags, programmation, publication.
5. **Studio créatif** — éditeur de visuels multipages (carrousels) : modèles à la charte, textes, logo, couleurs, arrière-plans, import de photos, retouches, export PNG, bibliothèque avec recherche/dossiers/filtres.
6. **Campagnes 360°** — 12 campagnes complètes ; l'activation ajoute les actions au calendrier (en brouillon).
7. **SEO** — audit réel des pages, mots-clés, titres/metas publiés sur les fiches produits, maillage interne, optimisation WebP des images, calendrier SEO, articles publiés sur **`/conseils`**.
8. **SEA & Social Ads** — Google/Meta/TikTok : audience, annonces, budget, dates, URL, mots-clés, UTM, aperçus, export (CSV Google Ads Editor), validation de budget obligatoire, KPI de diffusion.
9. **E-mailing** — 9 modèles, éditeur par blocs, aperçus mobile/ordinateur, test, programmation et envoi via Resend.
10. **Gestion du site** — fiches et médias produits, ajout de produit, hero, slider, bannière promo, collection mise en avant, best-sellers, bandeau d'annonces, kits saisonniers, médiathèque.
11. **Plan annuel** — roadmap 12 mois éditable, vue chronologique avec les campagnes.
12. **Performances** — réseaux, publicité, SEO, e-mailing, gestion éditoriale ; graphiques ; rapports CSV et PDF (impression).
13. **Messages & demandes** — tickets numérotés (pièces jointes, priorité, statut, historique).
14. **Assistant IA** — SKINCLEAN Marketing Copilot (Claude si `ANTHROPIC_API_KEY`, sinon mode guidé) ; propose des brouillons, applique après confirmation.
15. **Mon compte** — informations, mot de passe, notifications, autorisations et utilisateurs, historique des validations, intégrations.

### Architecture
- `src/app/hub/**` pages · `src/app/api/hub/[...slug]` API unique (session + permission vérifiées à chaque action) · `src/lib/hub/**` logique (base, auth, handlers, connecteurs, Copilot, planificateur) · `src/components/hub/**` interface.
- **Base locale SQLite** (`node:sqlite`, aucun service à installer) : `data/hub/marketing-hub.sqlite`. Supprimer le fichier puis relancer le serveur recrée les contenus initiaux.
- **Lien avec le site** : le Hub écrit `src/data/site-overrides.json`, appliqué par `products.ts`, `kits.ts`, `home.ts` et `config.ts` (une seule source produit). En développement, le site se met à jour immédiatement ; en production, relancer le build pour les pages statiques.
- **Médias** : `public/media/uploads/` (servis directement par le site).
- **Futur CRM** : `GET /api/hub/events` (journal d'événements marketing) et `GET /api/hub/export?collection=…` ; UTM générés sur chaque publicité.
- **Uniquement en localhost** : `src/proxy.ts` renvoie une 404 pour `/hub` et `/api/hub` sur tout autre hôte (Vercel, domaine public, adresse réseau). Le site public n'est pas affecté.

### Publication automatique et comptes de test
- **Valider = programmer** : valider un contenu prépare ses visuels et le programme à sa date et son heure du calendrier. Le planificateur du serveur local (chaque minute) le publie automatiquement, sans connexion de l'utilisateur. Serveur éteint à l'heure prévue → publication au redémarrage, signalée « avec retard ».
- **Comptes de test locaux** (`/hub/comptes-test`) : profils fictifs Instagram, TikTok, Facebook et Pinterest. Quand un réseau n'est pas connecté, les contenus y sont publiés (statut « Publié (compte de test) ») ; aucune diffusion réelle. Réglages dans « Mon compte → Intégrations ».

### Honnêteté des données
- Rien n'est marqué « publié » sans identifiant renvoyé par l'API de la plateforme ; sinon statut **« Publié manuellement »** (déclaration).
- Aucune dépense publicitaire sans budget validé ; l'activation passe par la plateforme (export) puis une déclaration.
- Les données de **démonstration** (statistiques) sont étiquetées et ne sont jamais additionnées aux données réelles ; volumes et positions SEO ne s'affichent que mesurés.

## CRM (`/crm`)

Outil de **gestion commerciale** inspiré des grands CRM (HubSpot, Shopify Analytics, Klaviyo) : ventes, clients, stock, paniers abandonnés, rentabilité. Même compte et même session que le Marketing Hub, **localhost uniquement** (même garde-fou `src/proxy.ts`, jamais sur Vercel).

```bash
npm run dev            # puis http://localhost:3000/crm
```

### Modules

| Module | Contenu |
| --- | --- |
| **Tableau de bord** | 12 indicateurs comparés à la période précédente (CA TTC/HT, commandes, panier moyen, marge brute, marge de contribution, nouveaux clients, conversion, abandon de panier, réachat, LTV, ruptures, valeur du stock), courbe du CA vs période précédente, objectif du mois et prévision, alertes actionnables, meilleure vente, catégories, canaux, carte de chaleur jour × heure, appareils, paiements, régions, campagnes du Marketing Hub sur la période |
| **Rentabilité & prévisions** | Compte de résultat mensuel (CA → TVA → coût des marchandises → marge brute → logistique → paiement → marketing → contribution → charges fixes → EBITDA), cascade, économie d'une commande moyenne, seuil de rentabilité, ROAS / CAC par canal, marge par catégorie, prévision de CA à 4 mois (saisonnalité × croissance) |
| **Commandes** | Recherche, filtres (statut, canal, période), tri, pagination ; fiche commande avec marge ligne à ligne et cycle de vie (préparation → expédition + suivi → livraison → remboursement avec remise en stock) |
| **Produits & best-sellers** | Classement (CA, unités, marge, évolution), matrice volume × marge (Star / Locomotive / Pépite / À revoir), ventes croisées (support, confiance, lift), codes promo, coffrets |
| **Paniers abandonnés** | Taux d'abandon, valeur perdue / récupérée, tunnel de conversion, étape d'abandon, produits abandonnés, relance e-mail / SMS |
| **Contacts** | Cycle de vie (abonné → lead → client → fidèle → VIP), segments RFM, fiche 360° : chronologie (commandes, paniers, SAV, notes, appels), score RFM et action recommandée, prochain achat estimé, consentements RGPD tracés, tags, tâches, recommandations produit |
| **Segments, cohortes & LTV** | Matrice RFM cliquable, rétention par cohorte mensuelle, nouveaux vs récurrents, fréquence d'achat, LTV / CAC par canal, niveaux du Club, CA par type de peau |
| **Messages & contact** | Boîte de réception des messages du formulaire « Nous contacter » (`/contact`) et du Glow Assistant (« Parler à l'équipe »), réponses types, réponse par e-mail, nouveau message à n'importe quel contact |
| **Automatisations** | Scénarios activables et modifiables (délai, objet, message) : alerte retour en stock, relance panier 1 h puis 24 h, bienvenue après la 1ʳᵉ commande, demande d'avis 7 j après livraison, rappel de réapprovisionnement, réactivation des clients à risque. Exécution automatique (toutes les 10 min à l'ouverture du CRM et à chaque réception de stock), dédoublonnage, journal des envois, conversions et CA attribué |
| **Chatbot (Glow Assistant)** | Questions posées (journal anonyme : e-mails et numéros masqués), réponses qui reviennent le plus, taux de compréhension, questions sans réponse (→ tâche), produits introuvables demandés, alertes créées, transferts à l'équipe |
| **Assistant SAV (Service client + Messages)** | Chaque nouvelle demande est triée automatiquement. Questions standard (suivi de commande, code promo, feuilles du Club, conseil de routine, rupture) : réponse envoyée tout de suite, badge « Répondu auto · à vérifier », bouton « C'est bon, vérifié ». Cas spécifiques (réaction cutanée, grossesse, remboursement, colis abîmé ou perdu, réclamation, partenariat, RGPD, facturation) : badge « ⚠ À toi de répondre » + brouillon prêt à compléter. Le tri suit des règles explicites (`src/lib/crm/support-ai.ts`) ; la rédaction utilise Claude si `ANTHROPIC_API_KEY` est défini, sinon des réponses types complétées avec la commande (statut, suivi Colissimo) |
| **Service client** | Demandes liées aux commandes, 1ʳᵉ réponse, délai de résolution, CSAT, motifs de contact, réponse et clôture |
| **Stock & réassort** | Inventaire par format (couverture en jours, date de rupture estimée, point de commande, stock de sécurité), réassort suggéré, bons de commande fournisseurs (envoi, réception → stock), mouvements, analyse ABC (Pareto) |
| **Pipeline B2B** | Kanban glisser-déposer (instituts, spas, concept stores, pharmacies), prévision pondérée, taux de transformation, cycle de vente |
| **Tâches** | Relances, appels, réassorts liés aux clients, commandes, produits et opportunités |
| **Paramètres & exports** | Hypothèses (TVA, frais Stripe, coût d'expédition, emballage, charges fixes, objectif), état de la connexion Stripe, exports CSV (Excel), régénération de la démo |

Recherche globale **⌘ K** (clients, commandes, produits, entreprises).

Côté site : le Glow Assistant reconnaît « je ne trouve plus… » (vérifie la disponibilité en direct dans le stock du CRM et propose « Me prévenir du retour en stock ») et « parler à quelqu'un » (message à l'équipe) ; la fiche d'un produit en rupture propose aussi l'alerte. Routes : `POST /api/alerte-stock`, `POST /api/assistant/log`, `GET /api/disponibilite`, `POST /api/contact` (→ CRM). En ligne (Vercel), ces données sont enregistrées dans la base temporaire de la démo (jeu « Données réelles ») ; le stock du site reste celui du catalogue.

**Stock du site = stock du CRM (en local)** : `<LiveStockSync />` charge `/api/stock` (au chargement, au retour sur l'onglet, toutes les 60 s) ; ruptures, « plus que X en stock », boutons d'achat et alerte de retour en stock suivent le CRM, et le paiement (`/api/checkout`) vérifie ce même stock. Priorité : surcharge `/admin` > CRM > catalogue. En ligne (pas de CRM), le site garde le stock du catalogue.

**Envois d'e-mails** : uniquement via Resend (`RESEND_API_KEY`). Sans clé, ou pour une adresse `@example.com`, l'envoi est marqué « Simulé » — jamais « Envoyé ». Chaque e-mail produit par le CRM est visible tel quel dans la **Boîte mail de démo**, classée par catégorie (réponses SAV, relances panier, retour en stock, nouveautés produit, bienvenue, avis, réapprovisionnement, réactivation, messages manuels) (`/crm/boite-demo`, adresse par défaut `demo@skinclean.example`). Dans Paramètres, on peut remplacer cette adresse par la sienne et, avec Resend, y recevoir réellement une copie des e-mails de démo (objet préfixé « [Démo → destinataire] »).

### Données : démonstration vs réel

- **Démonstration** (par défaut) : ~14 mois générés de façon déterministe à partir du **vrai catalogue** (produits, formats, prix, coffrets) — croissance, saisonnalité (Black Friday, Noël, soldes, SPF l'été), codes promo, retours, paniers relancés, réassorts. Clients fictifs en `@example.com` (domaine réservé : aucun envoi possible), entreprises B2B et fournisseurs fictifs, dépenses marketing et trafic simulés. Bandeau « Mode démonstration » sur chaque page.
- **Données réelles** : chaque paiement confirmé par le webhook Stripe (`checkout.session.completed`) crée la commande et la fiche client dans le CRM et décrémente le stock. Bascule en haut de l'écran ; les deux jeux ne sont **jamais additionnés**.
- Coûts de revient : estimations de démonstration par type de produit, modifiables par référence (Stock → fiche produit).

### Architecture

- `src/lib/crm/` : `db.ts` (SQLite `data/crm/crm.sqlite`, collections documentaires indexées + cache mémoire), `seed.ts` (générateur), `analytics.ts` (moteur d'indicateurs pur et testé : RFM, cohortes, LTV/CAC, ABC, ventes croisées, P&L, prévisions), `pages.ts` (données de chaque écran), `actions.ts` (écritures validées côté serveur), `exports.ts`, `search.ts`.
- `src/app/crm/(app)/*` : pages serveur ; `src/components/crm/*` : interface et graphiques SVG sans dépendance.
- API : `POST /api/crm/<action>`, `GET /api/crm/export/<jeu>`, `GET /api/crm/search?q=`.
- Supprimer `data/crm/crm.sqlite` (ou « Régénérer la démonstration ») recrée le jeu de démonstration. Tests : `tests/crm/`.

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
