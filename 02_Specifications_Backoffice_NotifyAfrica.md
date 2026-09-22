---
title: "NotifyAfrica Admin - Spécifications fonctionnelles détaillées"
author: "NotifyAfrica"
date: "22 septembre 2026"
lang: fr-FR
---

# 1. Rôle du Backoffice

NotifyAfrica Admin est le centre d'administration de l'écosystème. Il ne doit pas être un simple CRUD : il doit permettre de piloter le produit, les prix, les clients, les providers, la future activité d'agrégateur, les flux, les notifications, les règles et l'exploitation.

# 2. Principes

- source de vérité pour les configurations publiées ;
- aucun secret envoyé aux frontends ;
- RBAC granulaire ;
- audit complet ;
- versioning ;
- dates d'effet ;
- publication contrôlée ;
- environnement Sandbox/Production ;
- multi-pays ;
- multi-devise ;
- multi-provider ;
- multi-produit.

# 3. Dashboard Admin

KPIs configurables :

- nouvelles inscriptions ;
- organisations créées ;
- utilisateurs actifs ;
- messages envoyés ;
- consommation ;
- revenu ;
- coûts providers ;
- marge brute ;
- devis ouverts ;
- wallets faibles ;
- incidents ;
- erreurs API ;
- santé providers.

Widgets réordonnables selon rôle.

# 4. Notifications nouvelles inscriptions

À chaque `USER_REGISTERED` provenant de la Console :

1. l'événement est enregistré ;
2. le Notification Engine évalue les règles ;
3. le Backoffice peut créer une notification in-app ;
4. email, SMS ou webhook interne peuvent être déclenchés ;
5. le tableau de bord met à jour les compteurs ;
6. l'utilisateur peut apparaître dans une file de suivi commercial.

Les règles doivent permettre :

- activation/désactivation ;
- destinataires par rôle ;
- destinataires spécifiques ;
- canal ;
- template ;
- horaires ;
- pays ;
- source d'inscription ;
- priorité.

# 5. Centre Notifications

Fonctions :

- liste ;
- non lues ;
- marquer lu ;
- filtrer par type ;
- ouvrir la ressource liée ;
- gérer préférences personnelles ;
- configurer règles globales selon permissions.

# 6. Gestion des utilisateurs

Vue liste :

- identité ;
- email ;
- téléphone ;
- date inscription ;
- statut ;
- vérification ;
- organisation ;
- dernière activité.

Actions :

- consulter ;
- suspendre ;
- réactiver ;
- forcer reset sécurisé ;
- consulter audit ;
- voir organisations/projets.

# 7. Organizations / Customer 360

Chaque organisation dispose d'une vue 360 :

- profil ;
- conformité ;
- membres ;
- projets ;
- produits actifs ;
- wallet ;
- consommation ;
- pricing spécifique ;
- discounts ;
- devis ;
- transactions ;
- API keys métadonnées ;
- tickets ;
- risques ;
- notes internes ;
- audit.

# 8. Catalogue Produits

Le module Catalog permet de créer et administrer :

- SMS ;
- OTP ;
- WhatsApp ;
- Email ;
- Payment Collection ;
- Payout ;
- nouveaux produits futurs.

Champs :

- key immuable ;
- nom ;
- catégorie ;
- description ;
- icon ;
- visibilité publique ;
- statut ;
- pays ;
- devise ;
- modèle tarifaire ;
- champs requis ;
- documentation ;
- CTA ;
- ordre.

# 9. Offers Management

Les offres doivent être des objets administrables distincts du produit.

Une offre peut combiner :

- un ou plusieurs produits ;
- prix ;
- quota ;
- remise ;
- durée ;
- cible ;
- pays ;
- plan ;
- CTA.

Statuts : Draft, Scheduled, Active, Archived.

# 10. Pricing Engine

## 10.1 Règle tarifaire

Attributs :

- productId ;
- serviceId ;
- countryId ;
- operatorId ;
- providerId ;
- routeId ;
- category ;
- volumeMin ;
- volumeMax ;
- currency ;
- baseCost ;
- basePrice ;
- markupType ;
- markupValue ;
- customerScope ;
- priority ;
- effectiveFrom ;
- effectiveTo ;
- publicVisible ;
- quoteRequired ;
- status ;
- version.

## 10.2 Simulation

L'Admin doit pouvoir simuler un pricing avant publication :

- client ;
- produit ;
- pays ;
- opérateur ;
- catégorie ;
- volume ;
- date.

Résultat : règles appliquées, prix final, remise, taxes, marge.

# 11. Valeurs SMS initiales

Seed initial :

- 0-25 000 : 7 XOF/SMS ;
- 25 001-100 000 : 6,8 XOF/SMS ;
- tranches supérieures : quote required selon configuration.

Ces valeurs doivent pouvoir être modifiées, supprimées ou remplacées.

# 12. Meta / WhatsApp Pricing

Module provider pricing :

- provider : Meta ;
- pays ;
- catégorie ;
- prix officiel ;
- devise ;
- date effet ;
- date fin ;
- URL/source de référence ;
- version ;
- statut.

Le markup NotifyAfrica est une règle séparée.

Seed initial : +40 %, mais entièrement configurable.

# 13. Discount Engine

Types :

- PERCENT ;
- FIXED_AMOUNT ;
- UNIT_DISCOUNT ;
- FIXED_PRICE ;
- PROMO ;
- BONUS.

Scopes :

- global ;
- produit ;
- pays ;
- organisation ;
- projet ;
- volume ;
- plan ;
- code promo.

Champs :

- priority ;
- stackable ;
- maxDiscount ;
- usageLimit ;
- start/end ;
- eligibility.

# 14. Quotes

L'Admin reçoit les demandes de devis de la Console et du Website.

Workflow :

Draft -> Submitted -> Under Review -> Info Required -> Offer Available -> Accepted / Rejected / Expired.

Actions :

- assigner commercial ;
- demander informations ;
- simuler coût ;
- sélectionner provider/route ;
- définir prix ;
- appliquer remise ;
- vérifier marge ;
- générer PDF ;
- publier offre ;
- convertir en règle tarifaire client.

# 15. Wallets

Liste des wallets organisations :

- disponible ;
- réservé ;
- pending ;
- devise ;
- état.

Actions sensibles :

- crédit manuel ;
- débit manuel ;
- adjustment ;
- refund ;
- freeze/unfreeze.

Toute action manuelle exige motif et audit.

# 16. Transactions financières

Filtres :

- client ;
- type ;
- devise ;
- montant ;
- statut ;
- provider ;
- période.

Détail :

- transactionId ;
- idempotencyKey ;
- références ;
- mouvements wallet ;
- frais ;
- provider ;
- callbacks ;
- audit.

# 17. Pays

Gestion :

- code ISO ;
- nom ;
- indicatif ;
- devise ;
- timezone ;
- services actifs ;
- moyens de paiement ;
- opérateurs ;
- statut.

# 18. Devises

Gestion :

- code ISO ;
- symbole ;
- decimals ;
- format ;
- statut.

# 19. Operators

Un opérateur est distinct du provider technique.

Champs :

- nom ;
- pays ;
- code ;
- produits disponibles ;
- statut.

# 20. Providers

Provider :

- nom ;
- type ;
- pays ;
- services ;
- environnements ;
- endpoints ;
- SLA ;
- health ;
- credentials references ;
- statut.

# 21. Proxy & API Gateway

Module central pour la future agrégation.

## 21.1 Endpoints providers

- provider ;
- environment ;
- base URL ;
- path ;
- method ;
- auth type ;
- headers ;
- timeout ;
- retry policy ;
- rate limit ;
- callback settings.

## 21.2 Mapping request

Interface permettant de mapper le modèle NotifyAfrica vers le payload provider.

Fonctions :

- rename field ;
- static value ;
- nested path ;
- format transformation ;
- conditional mapping ;
- headers mapping.

## 21.3 Mapping response

Normaliser les réponses provider vers les contrats NotifyAfrica.

## 21.4 Mapping erreurs/statuts

Exemple : code provider `00` -> `SUCCESS`, timeout -> `PROVIDER_TIMEOUT`.

# 22. Routing Engine

Règles configurables :

- priority ;
- weighted ;
- failover ;
- cheapest ;
- best quality ;
- customer-specific.

Une route relie : produit + pays + opérateur + provider + environnement.

# 23. API Product Catalog

Permet de définir les APIs vendues :

- `communication.sms.send` ;
- `communication.otp.create` ;
- `payment.collection.create` ;
- `payment.collection.status` ;
- `payment.payout.create`.

Attributs :

- version ;
- endpoint public ;
- méthode ;
- scopes ;
- providers ;
- pricing ;
- pays ;
- statut.

# 24. Credentials Vault UI

L'Admin peut créer et faire tourner les credentials providers, mais jamais afficher un secret complet après stockage.

Support :

- API Key ;
- Basic ;
- Bearer ;
- OAuth2 ;
- HMAC ;
- certificate ;
- custom headers.

# 25. Webhooks et callbacks

Vue globale :

- endpoint client/provider ;
- event ;
- statut ;
- attempts ;
- last error ;
- next retry.

Possibilité de replay manuel contrôlé.

# 26. Notification & Event Engine

## 26.1 Événements

Les événements sont enregistrés dans un catalogue.

## 26.2 Règles

Une règle contient :

- trigger ;
- conditions ;
- audience ;
- channels ;
- template ;
- schedule ;
- throttle ;
- status.

## 26.3 Exemples

- nouveau compte -> Sales + Admin ;
- devis demandé -> Commercial ;
- provider down -> Technical + Operations ;
- low balance client -> client Billing ;
- anomalie -> Risk.

# 27. Content Management

Gestion des contenus dynamiques utiles au Website :

- hero ;
- sections ;
- FAQ ;
- CTA ;
- pricing labels ;
- banners ;
- messages système ;
- pages produit.

Pas besoin d'un CMS complexe au MVP, mais l'Admin doit pouvoir éditer les contenus structurants.

# 28. Feature Flags

Activation par :

- global ;
- pays ;
- organisation ;
- projet ;
- environnement.

# 29. RBAC Admin

Permissions granulaires, par exemple :

- `pricing.read` ;
- `pricing.publish` ;
- `discount.manage` ;
- `wallet.adjust` ;
- `provider.credentials.manage` ;
- `route.manage` ;
- `quote.approve` ;
- `user.suspend` ;
- `content.publish`.

# 30. Audit

Toutes les actions sensibles sont auditées. L'audit doit être non modifiable par les rôles métier ordinaires.

# 31. Configuration Registry

Objet générique :

- key ;
- value ;
- type ;
- scope ;
- scopeId ;
- environment ;
- version ;
- status ;
- effective dates.

Il gère les paramètres qui ne justifient pas un module dédié.

# 32. Seed et bootstrap

L'Admin doit offrir une action contrôlée : **Importer la configuration initiale du design**.

Le seed doit être versionné et idempotent.

L'import ne doit pas écraser silencieusement des configurations déjà publiées.

# 33. Health et Monitoring

Dashboard technique :

- API latency ;
- error rate ;
- queues ;
- workers ;
- providers ;
- last callbacks ;
- failed jobs ;
- status services.

# 34. Incidents

Gestion incident :

- titre ;
- impact ;
- services ;
- providers ;
- pays ;
- timeline ;
- updates ;
- visibilité publique.

# 35. Support

Tickets clients :

- assignation ;
- priorité ;
- SLA ;
- statut ;
- notes internes ;
- historique.

# 36. Critères d'acceptation

- nouvelle inscription visible et notifiable ;
- pricing modifiable sans code ;
- publication tarifaire synchronisée avec Website/Console ;
- remise globale ou ciblée applicable ;
- nouveau produit publiable ;
- nouveaux pays/providers ajoutables ;
- endpoints provider configurables ;
- secrets protégés ;
- audit présent ;
- seed initial importable ;
- Customer 360 complet ;
- workflows Draft/Publish fonctionnels.
