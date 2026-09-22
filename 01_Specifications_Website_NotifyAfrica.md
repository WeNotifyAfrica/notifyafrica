---
title: "NotifyAfrica Website - Spécifications fonctionnelles détaillées"
author: "NotifyAfrica"
date: "22 septembre 2026"
lang: fr-FR
---

# 1. Rôle de l'application

NotifyAfrica Website est le site public de la marque. Il remplit quatre fonctions : **présenter**, **convertir**, **informer** et **orienter vers la Console**.

Il ne porte pas de logique financière autonome et ne doit pas avoir sa propre copie des prix. Il consomme le catalogue, les offres, le pricing public, les promotions, les contenus et les disponibilités depuis le Core API.

# 2. Stack et déploiement

- Next.js / TypeScript ;
- rendu SSR/SSG/ISR selon page ;
- Node.js runtime ;
- connexion au Core API ;
- Design System Claude fourni comme référence ;
- domaine final distinct de la Console et de l'Admin.

Configuration environnementale :

- `PUBLIC_SITE_URL` ;
- `CONSOLE_URL` ;
- `CORE_API_URL` ;
- `DOCS_URL` ;
- `STATUS_URL`.

Aucune URL finale ne doit être écrite dans les composants.

# 3. Sources de données

Le Website résout chaque donnée dans cet ordre :

1. configuration publiée Admin ;
2. contenu/catégorie publique du Catalog API ;
3. seed de configuration issu du design Claude ;
4. état de fallback neutre.

Le Website doit savoir si une donnée provient de `admin`, `seed` ou `fallback`, afin de faciliter le diagnostic sans afficher cette information au public.

# 4. Navigation

Navigation configurable :

- Produits ;
- Solutions ;
- Tarifs ;
- Développeurs ;
- Ressources ;
- Entreprise ;
- Se connecter ;
- Créer un compte.

Les entrées peuvent être activées, désactivées et ordonnées dans l'Admin.

# 5. Parcours Inscription

## 5.1 Déclenchement

Tous les CTA d'inscription doivent utiliser une destination fournie par la configuration globale.

## 5.2 Flux

1. clic sur `Créer un compte` ;
2. conservation éventuelle du contexte d'origine : produit, campagne, source marketing ;
3. redirection vers `CONSOLE_URL/register` ;
4. transmission de paramètres sûrs tels que `source`, `product`, `campaign` ;
5. la Console gère l'inscription ;
6. le Website ne stocke pas le mot de passe.

# 6. Parcours Connexion

Le CTA `Se connecter` redirige vers la Console.

Si SSO futur, le Website peut reconnaître une session publique uniquement pour adapter le CTA, sans devenir l'autorité d'authentification.

# 7. Homepage

Sections attendues et configurables :

- Header ;
- Hero ;
- proposition de valeur ;
- CTA ;
- produits ;
- cas d'usage ;
- développeurs/API ;
- comment ça marche ;
- pricing preview ;
- confiance/sécurité ;
- témoignages/clients ;
- FAQ ;
- CTA final ;
- Footer.

Pour chaque section, l'Admin peut gérer :

- visibilité ;
- ordre ;
- titre ;
- texte ;
- média ;
- CTA ;
- cible ;
- période de publication.

# 8. Catalogue produits

Chaque produit exposé publiquement contient :

- nom ;
- slug ;
- icon ;
- catégorie ;
- résumé ;
- description ;
- avantages ;
- pays disponibles ;
- pricing public ;
- documentation ;
- CTA ;
- badge ;
- statut.

Statuts possibles :

- ACTIVE ;
- BETA ;
- COMING_SOON ;
- PRIVATE ;
- DISABLED.

# 9. Pages produit

Les pages SMS, OTP, WhatsApp, Email et futurs produits doivent être construites à partir d'un gabarit dynamique.

Une nouvelle entrée Catalog publiée avec `publicPageEnabled = true` doit pouvoir générer une nouvelle page sans dupliquer une logique complète.

# 10. Tarification publique

La page Pricing consomme un endpoint public du Core API.

Le payload doit pouvoir contenir :

- produit ;
- devise ;
- libellé ;
- unité ;
- paliers ;
- prix minimum ;
- texte `sur devis` ;
- promotions publiques ;
- taxes incluses/non incluses ;
- date d'effet ;
- CTA.

Les valeurs initiales SMS ou WhatsApp ne doivent pas être dans le code de la page.

# 11. Exemple de rendu SMS

Si l'Admin publie :

- tranche A : 0-25 000, 7 XOF ;
- tranche B : 25 001-100 000, 6,8 XOF ;
- tranche C : quote required ;

le Website l'affiche automatiquement.

Si demain ces tranches sont remplacées, le Website ne nécessite aucun changement de code.

# 12. WhatsApp

Le Website ne doit jamais contenir les prix Meta officiels statiquement.

Il affiche les valeurs publiques calculées ou publiées par le Pricing Engine, comprenant potentiellement :

- coût provider ;
- markup NotifyAfrica ;
- prix client public ;
- catégorie ;
- pays ;
- date d'effet.

Le coût provider n'est pas nécessairement affiché au public.

# 13. Promotions et réductions

Une promotion publique créée dans Admin peut affecter :

- une page produit ;
- Pricing ;
- Hero ;
- bannière ;
- CTA.

Le Website doit respecter :

- date début/fin ;
- audience ;
- pays ;
- produit ;
- statut ;
- visibilité publique.

# 14. Formulaire Contact

Champs dynamiques :

- nom ;
- email ;
- téléphone ;
- société ;
- pays ;
- sujet ;
- message.

Le Backoffice doit pouvoir configurer les catégories de contact.

À soumission :

- création d'un lead/contact ;
- génération d'un événement ;
- notification équipe selon règle ;
- accusé de réception configurable.

# 15. Demande de devis publique

Le Website peut proposer une entrée publique vers une demande de devis.

Options :

- rediriger vers Console pour les utilisateurs authentifiés ;
- autoriser une pré-demande sans compte ;
- demander la création d'un compte avant soumission finale.

Les champs sont fournis par le Backoffice selon le produit.

# 16. Documentation Développeur

Le Website ou domaine docs doit présenter :

- démarrage rapide ;
- auth ;
- endpoints ;
- erreurs ;
- webhooks ;
- SDKs ;
- exemples ;
- changelog.

La documentation doit supporter le versioning des APIs.

# 17. Page Status

Lien vers la page de statut. Les incidents publiés dans l'Admin peuvent y être visibles.

# 18. SEO et métadonnées

Les métadonnées par page doivent être configurables :

- title ;
- description ;
- OG image ;
- canonical ;
- index/noindex ;
- structured data selon page.

# 19. Analytics

Événements minimum :

- page_view ;
- product_view ;
- pricing_view ;
- signup_click ;
- login_click ;
- quote_start ;
- quote_submit ;
- docs_open.

Les identifiants analytics sont configurables par environnement.

# 20. Fallback Design Claude

Si le Backoffice est vide :

- le Website utilise le seed issu du design Claude ;
- la mise en page reste identique au design ;
- les données de seed sont centralisées ;
- les composants ne contiennent pas leurs propres constantes métier ;
- une fois les données publiées dans Admin, elles remplacent automatiquement le seed.

# 21. Cache et invalidation

Les contenus publics peuvent être mis en cache.

Toute publication Admin importante doit pouvoir déclencher une invalidation/revalidation du Website :

- pricing ;
- produit ;
- promotion ;
- contenu ;
- disponibilité.

# 22. États UX

Prévoir :

- loading ;
- empty ;
- indisponible ;
- prix non disponible ;
- quote required ;
- maintenance ;
- erreur API ;
- service coming soon.

# 23. Sécurité

Le Website ne doit jamais recevoir :

- secrets providers ;
- coûts confidentiels ;
- données clients ;
- clés privées.

Les endpoints publics exposent uniquement les données explicitement publiables.

# 24. Critères d'acceptation

- l'inscription part du Website et se termine dans la Console ;
- les tarifs sont identiques à ceux publiés dans l'Admin ;
- une modification de prix n'exige pas de commit Website ;
- les produits activés/désactivés sont reflétés ;
- le fallback seed fonctionne avec Backoffice vide ;
- les CTA et URLs sont configurables ;
- les pages sont responsive ;
- le build Website est indépendant ;
- le déploiement sur domaine distinct fonctionne.
