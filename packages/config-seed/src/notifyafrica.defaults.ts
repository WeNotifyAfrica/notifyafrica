/**
 * NotifyAfrica config seed — versioned initial data, sourced from the
 * design handoff (design_handoff_notifyafrica/README.md §4, §9) and the
 * specs (00_Contexte_Global §12, 02_Specifications_Backoffice §11-12).
 *
 * This is NOT a set of application constants. It exists purely as the last
 * resort in the resolution chain:
 *   Published Admin Config -> Scoped Override -> Design Seed -> Safe Empty Fallback
 * The Core API's config resolver (apps/core-api/src/lib/config-resolver.ts)
 * is the only thing that reads this file. No frontend component may import
 * it directly (04_Prompt §6).
 *
 * SEED_VERSION must be bumped whenever a value below changes, so the Admin
 * "import seed" action (04_Prompt §7) stays idempotent and auditable.
 */

export const SEED_VERSION = 3;

/**
 * Catalog copy (description/features/billingUnit) mirrors the reference
 * mockup's product cards (design_handoff_notifyafrica/designs/NotifyAfrica
 * - Site web (présentation).dc.html, `catalog` getter) — this is exactly
 * the "donnée métier d'exemple" the handoff says to seed, not hardcode into
 * a Website component (04_Prompt §6).
 */
export const seedCatalog = [
  {
    key: "SMS",
    name: "SMS",
    slug: "sms",
    category: "Messagerie",
    summary: "Envoi de SMS transactionnels et de masse en Afrique de l'Ouest et centrale.",
    description:
      "Envoi unitaire, envoi en masse et campagnes planifiées. Nom d'expéditeur personnalisé, modèles réutilisables, personnalisation par destinataire, plusieurs opérateurs avec repli automatique en cas de dégradation.",
    icon: "chat-text",
    features: ["Envoi en masse", "Planification", "Modèles", "Nom d'expéditeur", "Suivi de livraison"],
    billingUnit: "message",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "ACTIVE" as const,
    publicPageEnabled: true,
    order: 1,
  },
  {
    key: "OTP",
    name: "Codes OTP",
    slug: "otp",
    category: "Authentification",
    summary: "Codes de vérification à usage unique, multi-canal avec repli.",
    description:
      "Génération, envoi et vérification de codes à usage unique. Durée de validité, longueur et format paramétrables, nombre de tentatives limité, message personnalisable. Les codes non délivrés ne sont pas facturés.",
    icon: "shield-check",
    features: ["Vérification", "Durée de validité", "Anti-fraude", "Multi-applications"],
    billingUnit: "code vérifié",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "ACTIVE" as const,
    publicPageEnabled: true,
    order: 2,
  },
  {
    key: "WHATSAPP",
    name: "WhatsApp Business",
    slug: "whatsapp",
    category: "Conversationnel",
    summary: "Modèles Meta, conversations et notifications WhatsApp Business.",
    description:
      "Numéro professionnel vérifié, modèles de message approuvés, conversations entrantes centralisées. Catégories service client, authentification et marketing, chacune avec son tarif.",
    icon: "whatsapp-logo",
    features: ["Modèles approuvés", "Conversations entrantes", "Numéros vérifiés", "Catégories Meta"],
    billingUnit: "conversation",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "BETA" as const,
    publicPageEnabled: true,
    order: 3,
  },
  {
    key: "EMAIL",
    name: "Email",
    slug: "email",
    category: "Transactionnel",
    summary: "Envoi transactionnel, domaines et modèles email.",
    description:
      "Domaines authentifiés, adresses d'expédition vérifiées, gestion automatique des désinscriptions et des adresses invalides, suivi d'ouverture et de délivrabilité.",
    icon: "envelope",
    features: ["Domaines authentifiés", "Désinscriptions", "Délivrabilité", "Modèles"],
    billingUnit: "email",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "COMING_SOON" as const,
    publicPageEnabled: true,
    order: 4,
  },
  {
    key: "PAYMENT_COLLECTION",
    name: "Payment Collection",
    slug: "payment-collection",
    category: "Paiements",
    summary: "Collecte de paiements Mobile Money et carte (feuille de route).",
    description: null,
    icon: "wallet",
    features: [],
    billingUnit: null,
    countries: [],
    status: "COMING_SOON" as const,
    publicPageEnabled: false,
    order: 5,
  },
  {
    key: "PAYOUT",
    name: "Payout",
    slug: "payout",
    category: "Paiements",
    summary: "Décaissement vers portefeuilles Mobile Money (feuille de route).",
    description: null,
    icon: "arrow-line-up-right",
    features: [],
    billingUnit: null,
    countries: [],
    status: "COMING_SOON" as const,
    publicPageEnabled: false,
    order: 6,
  },
];

/** SMS tiers per 00_Contexte_Global §12 / 04_Prompt §11 — seed data, not code constants. */
export const seedPricingRules = [
  {
    productKey: "SMS",
    countryCode: null,
    category: null,
    volumeMin: 0,
    volumeMax: 25000,
    currency: "XOF",
    basePrice: 7,
    markupType: "PERCENT" as const,
    markupValue: 0,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
  {
    productKey: "SMS",
    countryCode: null,
    category: null,
    volumeMin: 25001,
    volumeMax: 100000,
    currency: "XOF",
    basePrice: 6.8,
    markupType: "PERCENT" as const,
    markupValue: 0,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
  {
    productKey: "SMS",
    countryCode: null,
    category: null,
    volumeMin: 100001,
    volumeMax: null,
    currency: "XOF",
    basePrice: 6.8,
    markupType: "PERCENT" as const,
    markupValue: 0,
    publicVisible: true,
    quoteRequired: true,
    priority: 0,
  },
  // WhatsApp: baseCost holds the Meta official cost per category (each
  // category has its own official Meta rate), markup is the configurable
  // NotifyAfrica margin (+40% initial seed) applied on top. Target prices
  // (24/28/46 XOF) match design_handoff_notifyafrica's own reference
  // catalog data exactly — this replaces an earlier placeholder single
  // rule (1.4 XOF, no category distinction) that predated a full read of
  // that content and didn't match it.
  {
    productKey: "WHATSAPP",
    countryCode: null,
    category: "utility",
    volumeMin: 0,
    volumeMax: null,
    currency: "XOF",
    baseCost: 17.14,
    basePrice: 24,
    markupType: "PERCENT" as const,
    markupValue: 40,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
  {
    productKey: "WHATSAPP",
    countryCode: null,
    category: "authentication",
    volumeMin: 0,
    volumeMax: null,
    currency: "XOF",
    baseCost: 20,
    basePrice: 28,
    markupType: "PERCENT" as const,
    markupValue: 40,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
  {
    productKey: "WHATSAPP",
    countryCode: null,
    category: "marketing",
    volumeMin: 0,
    volumeMax: null,
    currency: "XOF",
    baseCost: 32.86,
    basePrice: 46,
    markupType: "PERCENT" as const,
    markupValue: 40,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
  {
    // OTP: illustrative seed price, same ballpark as a transactional SMS —
    // not a business decision, just a non-empty starting point for Admin
    // to replace (04_Prompt §11 applies here the same as SMS/WhatsApp).
    productKey: "OTP",
    countryCode: null,
    category: null,
    volumeMin: 0,
    volumeMax: null,
    currency: "XOF",
    basePrice: 5,
    markupType: "PERCENT" as const,
    markupValue: 0,
    publicVisible: true,
    quoteRequired: false,
    priority: 0,
  },
];

/** Website navigation seed (01_Specifications_Website §4) — matches the
 * reference mockup's nav bar exactly (Produits, Solutions, Tarifs,
 * Développeurs, Docs). */
export const seedNavigation = [
  { key: "products", label: "Produits", href: "/produits", order: 1, enabled: true },
  { key: "solutions", label: "Solutions", href: "/solutions", order: 2, enabled: true },
  { key: "pricing", label: "Tarifs", href: "/tarifs", order: 3, enabled: true },
  { key: "developers", label: "Développeurs", href: "/developpeurs", order: 4, enabled: true },
  { key: "docs", label: "Docs", href: "/docs", order: 5, enabled: true },
];

/**
 * Website marketing content seed — mirrors the reference mockup's example
 * data verbatim (design handoff, `Component.renderVals()` /
 * `Component.catalog`). Illustrative, Admin-editable content
 * (00_Contexte_Global §7.1 lists "contenu commercial critique" among what
 * must never be hardcoded in a component), not pricing — pricing always
 * comes from the Pricing Engine.
 */
export const seedWebsiteContent = {
  /** The hero's illustrative "campaign in progress" card. Recipient/delivery
   * counts and the balance-after label are decorative UI-mockup flavor;
   * unit price and total are deliberately NOT seeded here — the Website
   * computes them live from a real Pricing Engine estimate at `recipients`
   * quantity, so this card never shows a stale or fabricated price
   * (04_Prompt §5/§6). */
  heroPreview: {
    campaignLabel: "Rappel échéance",
    statusLabel: "En cours",
    recipients: 50000,
    delivered: 48912,
    balanceAfterLabel: "1 260 000 FCFA",
  },
  stats: [
    { value: "12", label: "pays couverts" },
    { value: "28", label: "opérateurs connectés" },
    { value: "98,4 %", label: "taux de délivrabilité" },
    { value: "99,95 %", label: "disponibilité sur 30 jours" },
  ],
  howItWorks: [
    { n: "01", title: "Créez votre compte", desc: "Une organisation, autant de projets que nécessaire." },
    { n: "02", title: "Testez gratuitement", desc: "100 messages de test offerts, sans carte bancaire." },
    { n: "03", title: "Rechargez votre solde", desc: "Mobile money, carte bancaire ou virement." },
    { n: "04", title: "Envoyez et suivez", desc: "Coût affiché avant envoi, livraison suivie en temps réel." },
  ],
  useCases: [
    { title: "Codes de connexion", desc: "Sécuriser les connexions des banques, fintechs et applications." },
    { title: "Alertes transactionnelles", desc: "Confirmations de paiement, relevés, rappels d'échéance." },
    { title: "Campagnes marketing", desc: "Audiences ciblées, planification, rapport de campagne." },
    { title: "Notifications logistiques", desc: "Statuts de livraison et confirmations de rendez-vous." },
    { title: "Secteur public", desc: "Convocations, rappels de santé, alertes institutionnelles." },
    { title: "Service client", desc: "WhatsApp entrant relié à vos outils internes." },
  ],
  solutions: [
    {
      title: "Banques & fintechs",
      desc: "Codes de connexion, alertes de transaction, relances de prélèvement. Volumes élevés et exigences de sécurité.",
    },
    { title: "Opérateurs & utilities", desc: "Rappels de facture, coupures programmées, campagnes de recouvrement." },
    { title: "E-commerce & logistique", desc: "Confirmations de commande, suivi de livraison, créneaux de retrait." },
    { title: "Santé & institutions", desc: "Convocations, rappels de rendez-vous, alertes de santé publique." },
    { title: "Plateformes SaaS", desc: "Notifications produit et authentification, en marque blanche via API." },
    { title: "ONG & bailleurs", desc: "Sensibilisation de masse, enquêtes par SMS, coordination terrain." },
  ],
  trustCards: [
    {
      kicker: "Sécurité",
      title: "Vos données restent les vôtres",
      desc: "Chiffrement des échanges, accès par rôle, journal d'activité complet, conformité aux exigences locales de conservation des données.",
      meta: null,
    },
    {
      kicker: "Fiabilité",
      title: "Plusieurs routes par opérateur",
      desc: "Si une route se dégrade, vos messages basculent automatiquement sur une autre. Page de statut publique et historique des incidents.",
      meta: "99,95 % de disponibilité sur 30 jours",
    },
    {
      kicker: "Couverture",
      title: "Multi-pays, multi-devises",
      desc: "Facturation dans la devise de votre choix, disponibilité gérée pays par pays.",
      meta: "XOF · XAF · GHS · NGN · KES · USD · EUR · ZAR",
    },
  ],
  paymentMethods: [
    { title: "Mobile Money", desc: "Moov, MTN, Yas, Telecel — crédit immédiat" },
    { title: "Carte bancaire", desc: "Visa, Mastercard — crédit immédiat" },
    { title: "Virement bancaire", desc: "À partir de 500 000 FCFA — 24 à 48 h" },
    { title: "Facturation mensuelle", desc: "Réservée aux contrats Enterprise" },
  ],
  developerStats: [
    { kicker: "Disponibilité", value: "99,95 %", desc: "sur les 30 derniers jours" },
    { kicker: "Latence moyenne", value: "1,2 s", desc: "de l'appel à la remise opérateur" },
    { kicker: "Taux de livraison", value: "98,4 %", desc: "toutes destinations confondues" },
  ],
  docsSections: [
    { title: "Démarrage", items: "Créer un compte · Générer une clé · Premier envoi" },
    { title: "SMS", items: "Envoi simple · Envoi en masse · Noms d'expéditeur · Modèles" },
    { title: "OTP", items: "Générer un code · Vérifier · Durée de validité" },
    { title: "WhatsApp", items: "Modèles approuvés · Conversations · Numéros" },
    { title: "Email", items: "Domaines · Adresses d'expédition · Désinscriptions" },
    { title: "Suivi", items: "Statuts de livraison · Notifications de statut · Journaux" },
    { title: "Facturation", items: "Solde · Recharges · Factures" },
    { title: "Sécurité", items: "Clés et environnements · Rôles · Journal d'activité" },
  ],
};

/** Countries/currencies seed (design handoff §5 invariant 6, invariant 7 scope). */
export const seedCountries = [
  { code: "TG", name: "Togo", dialCode: "228", currency: "XOF", timezone: "Africa/Lome" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "225", currency: "XOF", timezone: "Africa/Abidjan" },
  { code: "SN", name: "Sénégal", dialCode: "221", currency: "XOF", timezone: "Africa/Dakar" },
  { code: "BJ", name: "Bénin", dialCode: "229", currency: "XOF", timezone: "Africa/Porto-Novo" },
  { code: "BF", name: "Burkina Faso", dialCode: "226", currency: "XOF", timezone: "Africa/Ouagadougou" },
  { code: "ML", name: "Mali", dialCode: "223", currency: "XOF", timezone: "Africa/Bamako" },
];

export const seedCurrencies = [
  { code: "XOF", symbol: "FCFA", decimals: 0 },
  { code: "XAF", symbol: "FCFA", decimals: 0 },
  { code: "GHS", symbol: "GH₵", decimals: 2 },
  { code: "NGN", symbol: "₦", decimals: 2 },
  { code: "KES", symbol: "KSh", decimals: 2 },
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "ZAR", symbol: "R", decimals: 2 },
];

/** Homepage sections seed (01_Specifications_Website §7) — hero copy matches
 * the reference mockup verbatim. */
export const seedHomepageSections = [
  {
    key: "hero",
    order: 1,
    visible: true,
    kicker: "Plateforme de communication",
    title: "Parlez à toute l'Afrique depuis une seule plateforme.",
    accentSpan: "une seule plateforme",
    subtitle:
      "SMS, codes de sécurité, WhatsApp Business et Email — routage multi-opérateurs, tarifs transparents, paiement à l'usage sans abonnement.",
    badge: "100 messages de test offerts · aucune carte bancaire requise",
    cta: { label: "Créer un compte", target: "register" },
    secondaryCta: { label: "Parler à un expert", target: "contact" },
  },
  { key: "value_prop", order: 2, visible: true },
  { key: "products", order: 3, visible: true },
  { key: "use_cases", order: 4, visible: true },
  { key: "developers", order: 5, visible: true },
  { key: "how_it_works", order: 6, visible: true },
  { key: "pricing_preview", order: 7, visible: true },
  { key: "trust_security", order: 8, visible: true },
  { key: "testimonials", order: 9, visible: true },
  { key: "faq", order: 10, visible: true },
  {
    key: "cta_final",
    order: 11,
    visible: true,
    title: "Vos 100 premiers messages de test sont offerts.",
    subtitle: "Créez un compte, testez gratuitement, rechargez seulement quand vous passez en production.",
    cta: { label: "Créer un compte", target: "register" },
    secondaryCta: { label: "Demander un devis", target: "quote" },
  },
];

export const notifyAfricaSeed = {
  version: SEED_VERSION,
  catalog: seedCatalog,
  pricingRules: seedPricingRules,
  navigation: seedNavigation,
  countries: seedCountries,
  currencies: seedCurrencies,
  homepageSections: seedHomepageSections,
  websiteContent: seedWebsiteContent,
};
