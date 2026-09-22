# Handoff : NotifyAfrica — plateforme CPaaS (site, console client, back-office)

> **À lire en premier (Claude Code).** Ce dossier contient les maquettes de 25 lots sur 27, plus les règles métier. Deux lots, le **26** et le **27**, **ne sont pas encore conçus** (voir §8). Ne les invente pas visuellement : crée leurs routes et leurs modèles de données avec des écrans en attente (« placeholder »), en suivant les conventions décrites ici.

---

## 1. Présentation

NotifyAfrica est une plateforme de communication (CPaaS) pour l'Afrique de l'Ouest et centrale : SMS, OTP, WhatsApp Business, email, gestion de campagnes, API développeurs, facturation prépayée et post-payée en devises locales.

Trois applications partagent le même design system :

| Application | Utilisateurs | Lots |
|---|---|---|
| **Site web public** | Prospects | 2 |
| **Console client** | Clients (Owner, Admin, Billing Manager, Developer, Campaign Manager, Support Agent, Viewer/Auditor) | 3 → 18 |
| **Back-office interne** | Équipes NotifyAfrica (Ops, Commercial, Finance, Support, Direction) | 19 → 27 |

## 2. À propos des fichiers de design

Les fichiers de `designs/` sont des **références de design en HTML** : des prototypes qui montrent le rendu et le comportement attendus. **Ce n'est pas du code de production à copier.**

Ta mission est de **recréer ces écrans dans l'environnement du codebase cible**, avec ses patterns et ses librairies. S'il n'y a pas encore de codebase, recommandé : **Next.js (App Router) + TypeScript + Tailwind** ou CSS Modules, avec les tokens du §6 exposés en variables CSS. Utilise un monorepo si les trois applications partagent un package `ui`.

Pour ouvrir une maquette : servir le dossier `designs/` en local (`npx serve designs`), puis ouvrir un fichier `.dc.html`. Les fichiers chargent `support.js` (runtime de prototypage — **à ne pas réutiliser**) et `_ds/.../styles.css` (tokens et classes du design system — **à réutiliser comme source de vérité**).

Dans chaque fichier :
- le markup se trouve entre `<x-dc>` et `</x-dc>` ;
- la logique et **toutes les données d'exemple** sont dans la classe `Component`, méthode `renderVals()`, dans le `<script data-dc-script>`. Ces données sont réalistes : sers-t'en comme fixtures ou seeds.

## 3. Fidélité

**Haute fidélité** pour les couleurs, la typographie, l'espacement, les composants, les textes (en français) et les états. Recrée les écrans au plus près, avec les tokens du §6.

Exceptions :
- **Mise en page de la console et du back-office.** Les lots 7 → 25 présentent chaque module comme une **page de spécification** : en-tête du lot, onglets par écran, puis une grille de cartes « I · Règles métier / J · États / L · Cas limites / N · À valider ». En production, ces modules vivent **dans le shell de la console** (lots 5-6 : sidebar, topbar, sélecteur d'organisation et de projet). Les **onglets deviennent des sous-routes** ; les **cartes I/J/L/N sont de la spec, pas de l'UI** : ne les affiche pas.
- **Site web (lot 2 et « Site web (présentation) »).** Fond **blanc**, à la demande du client, contrairement au reste en thème sombre Nocturne. Le fichier « présentation » contient des prix réels ; le lot 2 contient des placeholders `{{pricing.*}}`. **En production, les prix viennent de l'API du moteur de prix** : aucun prix n'est codé en dur.

## 4. Inventaire des lots et des écrans

Chaque ligne = un fichier dans `designs/`. Les noms d'onglets sont les écrans ou sous-routes à implémenter.

| Lot | Fichier | Application | Écrans |
|---|---|---|---|
| 0 · 1 · 1B | `Lots 0-1-1B` | Doc | Audit du design system, architecture de l'information, spécification du moteur de prix |
| 2 | `Lot 2 Website` + `Site web (présentation)` | Site | Accueil, Produits, Solutions, Tarifs (+ pages reliées entre elles) |
| 3 | `Lot 3 Auth` | Console | Connexion, inscription, vérification email, 2FA, mot de passe oublié/réinitialisation, invitation, session expirée |
| 4 | `Lot 4 Onboarding` | Console | Assistant de démarrage (organisation, pays/devise, canal, premier envoi test) |
| 5-6 | `Lots 5-6 Console` | Console | **Shell** (sidebar, topbar, sélecteurs org/projet, environnement test/live) + vue d'ensemble |
| 7 | `Lot 7 SMS` | Console | Envoyer, envoi en masse, historique, détail message, noms d'expéditeur, modèles, planifiés |
| 8 | `Lot 8 Campagnes` | Console | Liste, création, audiences, planification, suivi, résultats |
| 9 | `Lot 9 OTP` | Console | Vue d'ensemble, configuration, modèles, journal, statistiques, repli (fallback) |
| 10 | `Lot 10 WhatsApp` | Console | Vue d'ensemble, envoi, modèles Meta, numéros, conversations, journal, analytics, tarifs |
| 11 | `Lot 11 Email` | Console | Domaines, envoi, modèles, journal, délivrabilité |
| 12 | `Lot 12 Developpeurs` | Console | Clés API, webhooks, journaux d'appels, SDK/docs, sandbox |
| 13 | `Lot 13 Statistiques` | Console | Tableaux de bord, par canal/pays/opérateur, exports |
| 14 | `Lot 14 Tarifs et devis` | Console | Grille tarifaire client, simulateur, demande de devis, devis reçus |
| 15 | `Lot 15 Facturation` | Console | Solde, recharge, factures, reçus, relevés |
| 16 | `Lot 16 Equipe` | Console | Membres, rôles (7), invitations, permissions |
| 17 | `Lot 17 Parametres` | Console | Organisation, projets, limites, sécurité, sessions, notifications |
| 18 | `Lot 18 Support` | Console | Tickets, état du service, incidents |
| 19 | `Lot 19 Back-office pilotage` | Back-office | Tableau de bord opérationnel global |
| 20 | `Lot 20 Providers` | Back-office | Catalogue opérateurs/providers, déclaration, routage et bascule, santé/SLA, coûts d'achat, connectivité |
| 21 | `Lot 21 Moteur de prix` | Back-office | Règles, constructeur, paliers, remises, simulateur d'impact, versions et audit |
| 22 | `Lot 22 Devis interne` | Back-office | Pipeline, construction de devis, circuit de validation, contrats, comptes |
| 23 | `Lot 23 Moyens de paiement` | Back-office | Catalogue, déclaration, éligibilité, transactions/rapprochement, remboursements |
| 24 | `Lot 24 Clients back-office` | Back-office | Annuaire, fiche client, KYC, actions sensibles, accès support |
| 25 | `Lot 25 Finance` | Back-office | Rentabilité, factures fournisseurs, recouvrement, taxes, clôture mensuelle |
| **26** | — | Back-office | **NON CONÇU — voir §8** |
| **27** | — | Back-office | **NON CONÇU — voir §8** |

## 5. Invariants d'architecture (non négociables)

Ils traversent tous les lots. Les cartes « I · Règles métier » de chaque fichier les détaillent.

1. **Un seul moteur de prix (lot 21).** Tout prix affiché (site, console, devis, facture) vient d'une API de pricing. L'interface n'en calcule jamais. Ordre immuable : prix de base → palier → remise (exclusive, la priorité la plus haute l'emporte) → majoration → taxe. Chaque règle a un plancher de marge.
2. **Instantané de prix (prix figé).** Chaque message stocke `{rule_id, rule_version, unit_price, tax, currency}` au moment de l'envoi. Une modification ultérieure n'est jamais rétroactive.
3. **Règles versionnées et datées.** On ne modifie pas une règle : on crée une version avec une `effective_from` ≥ aujourd'hui. Un motif est obligatoire.
4. **Estimation avant envoi.** Aucun envoi sans estimation affichée (coût, remise, taxe, solde après). L'estimation est valable 15 minutes et revérifiée à la confirmation. Les fonds sont réservés avant exécution.
5. **Providers, opérateurs et moyens de paiement = configuration, pas code (lots 20 et 23).** Ajouter Moov, MTN, Yas, Telecel ou un nouveau moyen de paiement se fait en back-office, sans déploiement. À modéliser comme entités génériques : `Operator` (destination, préfixes), `Provider` (moyen d'accès : SMPP/HTTP/SMTP, couverture, débit), `Route` (principale et secours, règle de bascule), `SupplierCost` (daté, devise), `PaymentMethod` (famille : mobile_money, card, wire ou credit ; règles d'éligibilité). Utilise des **adapters par protocole**, jamais par fournisseur.
6. **Multi-devises :** XOF, XAF, GHS, NGN, KES, USD, EUR, ZAR. Montants en entiers (unité mineure) ou en décimal exact ; jamais en float.
7. **Multi-tenant :** Organisation → Projets → Environnements (test/live). Les clés API sont liées à un projet et à un environnement.
8. **RBAC, 7 rôles côté client :** Owner, Admin, Billing Manager, Developer, Campaign Manager, Support Agent, Viewer/Auditor. Les rôles internes sont séparés (voir lot 27).
9. **Double validation et séparation des tâches.** L'auteur ne valide jamais sa propre demande : devis, remises > 10 %, ajustements de solde, remboursements > 500 000 FCFA, suspensions.
10. **Journal d'audit** pour toute action sensible : horodatage, auteur, avant/après, motif.
11. **Revenu reconnu à la consommation.** Les soldes prépayés sont un passif (lot 25).

## 6. Design tokens (Nocturne)

La source de vérité est `designs/_ds/nocturne-*/styles.css` : reprends ses variables telles quelles.

**Couleurs**
- Fond `--color-bg` `#161826` · surface `--color-surface` `#232532` · texte `--color-text` `#e9e9ed` · séparateur `color-mix(#e9e9ed 16%, transparent)`
- Accent `--color-accent` `#9184d9` (usage en trait, contour et lueur ; **jamais en aplat large**). Texte d'accent de taille paragraphe : `--color-accent-300` `#d2cefd`
- Rampe accent 100→900 : `#f5f4ff #e7e5fe #d2cefd #b5abfc #968ae0 #796cbf #5d5294 #423a6a #2b2741`
- Rampe neutre 100→900 : `#f3f5fe #e4e7f5 #cfd3e5 #b2b6ca #9397ab #75798c #595d6c #3f424d #292b31`
- Texte atténué : `color-mix(in srgb, var(--color-text) 55%, transparent)` (classe `.text-muted`)
- **Site web** : fond blanc. Adapter la rampe neutre (texte `--color-neutral-900`, bordures `--color-neutral-200`), garder l'accent.

**Typographie** : Inter (400/500/600/700). Titres en poids **500 maximum**, interligne 1,12, espacement des lettres −0,015em. h1 42 · h2 32 · h3 25 · h4 20 · h5 16 · h6 13 (majuscules, +0,08em). Corps 15px / 1,55. Chiffres en `font-variant-numeric: tabular-nums` partout (classe `.num` des maquettes).

**Espacement** (densité 0,7×) : `--space-1` 2,8 · `-2` 5,6 · `-3` 8,4 · `-4` 11,2 · `-6` 16,8 · `-8` 22,4 px. **Il n'y a pas de `--space-5` ni de `--space-7`.**

**Rayons** : sm 4 · md 8 · lg 14 px.

**Ombres** : sm `0 0 0 1px #3f424d` · md `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)` · lg `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)`.

**Composants** (classes dans `styles.css`) : `.btn` (+ `-primary` en contour d'accent, jamais plein ; `-secondary`, `-ghost`, `-icon`, `-block`) · `.tag` (+ `-accent`, `-neutral`, `-outline`) · `.field` / `.input` / `.radio` / `.seg` + `.seg-opt` · `.card` (+ `-kicker`, `-title`, `-body`, `-meta`) · `.elev-sm/md/lg` · `.table` · `.nav` · `.dialog`.

**États** : hover teinté depuis la rampe accent ; pressé = `--color-accent-400` ; focus = `outline: 2px solid var(--color-accent); outline-offset: 2px` ; désactivé = opacité 45 %.

**Icônes** : Phosphor (phosphoricons.com).

**Conventions visuelles récurrentes**
- Carte d'alerte ou de règle mise en avant : `.card.elev-sm` + `border-left: 2px solid var(--color-accent)`.
- Barre d'onglets : boutons `.btn` ; l'onglet actif a une bordure et un texte en accent, avec un fond `color-mix(accent 12%, transparent)`.
- Panneau d'estimation (lots 7, 8, 10, 14) : lignes libellé atténué / valeur alignée à droite, total en 22px `--color-accent-300`, CTA `.btn-primary.btn-block`.
- Tableaux de données : `.table` dans une `.card.elev-md` avec `overflow:auto` et une `min-width` pour le défilement horizontal.
- Mise en page à 2 colonnes : `grid-template-columns: minmax(0,1.3–1.5fr) minmax(0,1fr)` ; conteneur max 1320px.

## 7. Interactions et états

Chaque fichier contient les interactions de référence dans `renderVals()`. Les plus importantes :
- **Simulateurs en direct** (curseurs) : marge et verdict (lot 21), remise → circuit de validation, avec blocage sous le plancher de 15 % (lot 22), limites et résumé calculé (lot 17), éligibilité des paiements selon pays, compte et montant (lot 23).
- **Workflows à étapes** : mise en service d'un provider en 5 étapes (lot 20), clôture mensuelle avec checklist qui active le bouton (lot 25), KYC (lot 24).
- **États** : chaque lot liste ses états dans la carte « J · États ». Implémente-les tous (vide, chargement, erreur, solde insuffisant, devis requis, expiré, dégradé, etc.).
- **Cas limites** : carte « L » de chaque lot. À convertir en tests.
- **Questions ouvertes** : carte « N » de chaque lot. **Ne les tranche pas.** Implémente la recommandation indiquée derrière un feature flag ou un paramètre, et liste-les dans un `DECISIONS.md`.

## 8. Travail non terminé — à traiter comme tel

### Lots 26 et 27 : non conçus
Aucune maquette n'existe. Les périmètres ci-dessous sont **proposés** d'après les références croisées des autres lots, et **doivent être validés par le client avant tout design**.

**Lot 26 — Conformité & modération (proposé)**
- Validation back-office des noms d'expéditeur, côté opérateur (pendant interne du lot 7)
- Revue des modèles WhatsApp avant soumission à Meta (pendant du lot 10)
- Listes de désinscription (STOP) globales, mots interdits, filtrage de contenu
- Signalements et abus, suspensions pour conformité (lien avec le lot 24)
- Conservation des données et demandes d'accès ou de suppression

**Lot 27 — Administration plateforme (proposé)**
- **Marges visibles** : coût fournisseur vs prix client par message, organisation et route. Référencé explicitement dans le lot 10 : « coût Meta et marge visibles côté Admin dans le lot 27 ».
- Rôles et permissions **internes** (Ops, Commercial, Finance, Support, Conformité, Direction) et seuils de validation paramétrables (utilisés par les lots 21, 22, 23, 24, 25)
- Journal d'audit global de la plateforme
- Paramètres système : devises et taux de change, pays, feature flags, modèles d'emails système

**Consigne :** crée les routes, la navigation et les modèles de données de ces deux lots, avec une page « Écran en cours de conception » qui reprend le shell du back-office. **Ne conçois pas leur UI.**

### Autres points non terminés
- **Questions « N · À valider »** de chaque lot : décisions produit en attente (remises cumulables ou non, palier par tranche ou non, SSO SAML/OIDC, KYC interne ou prestataire, frais de paiement absorbés ou non, CRM externe, SYSCOHADA, etc.).
- **Taux de taxe** (lot 25) : exemples de structure, **à faire valider par un conseil fiscal**.
- **Montants, volumes, noms de clients** : fictifs. Ce sont des fixtures, pas des données réelles.
- **Lot 2 Website** : les placeholders `{{pricing.*}}` sont à brancher sur l'API de pricing.

## 9. Ce que le développeur doit fournir à Claude Code

1. **Ce dossier complet** (`README.md` + `designs/`).
2. **Le codebase cible**, s'il existe (repo et branche), ou la décision de stack s'il n'existe pas.
3. **Les décisions tranchées** sur les questions « N » (sinon, les recommandations par défaut s'appliquent derrière des flags).
4. **Les accès sandbox** des fournisseurs, pour les adapters : agrégateur SMPP, API Meta WhatsApp, passerelles mobile money. À défaut, implémente des adapters mock derrière l'interface générique.
5. **Le périmètre validé des lots 26 et 27**, quand il sera disponible.

**Ordre d'implémentation recommandé :** tokens et composants UI → shell console (5-6) et auth (3) → moteur de prix (21, API d'abord) → providers et routage (20) → SMS (7) → facturation (15) et moyens de paiement (23) → autres canaux (8-12) → back-office (19, 22, 24, 25) → site (2) branché sur l'API de pricing.

## 10. Assets

- `designs/assets/notifyafrica-logo-lockup.png`, `notifyafrica-logo.png` et `notifyafrica-logo-white.png` : logos fournis par le client
- Police Inter via Google Fonts
- Icônes Phosphor
- Aucune photo : les emplacements d'image éventuels sont à remplir avec des visuels du client
