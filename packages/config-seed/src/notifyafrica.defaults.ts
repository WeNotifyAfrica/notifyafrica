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

export const SEED_VERSION = 1;

export const seedCatalog = [
  {
    key: "SMS",
    name: "SMS",
    slug: "sms",
    category: "messaging",
    summary: "Envoi de SMS transactionnels et de masse en Afrique de l'Ouest et centrale.",
    icon: "chat-text",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "ACTIVE" as const,
    publicPageEnabled: true,
    order: 1,
  },
  {
    key: "OTP",
    name: "OTP",
    slug: "otp",
    category: "messaging",
    summary: "Codes de vérification à usage unique, multi-canal avec repli.",
    icon: "shield-check",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "ACTIVE" as const,
    publicPageEnabled: true,
    order: 2,
  },
  {
    key: "WHATSAPP",
    name: "WhatsApp Business",
    slug: "whatsapp",
    category: "messaging",
    summary: "Modèles Meta, conversations et notifications WhatsApp Business.",
    icon: "whatsapp-logo",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "BETA" as const,
    publicPageEnabled: true,
    order: 3,
  },
  {
    key: "EMAIL",
    name: "Email",
    slug: "email",
    category: "messaging",
    summary: "Envoi transactionnel, domaines et modèles email.",
    icon: "envelope",
    countries: ["TG", "CI", "SN", "BJ", "BF", "ML"],
    status: "COMING_SOON" as const,
    publicPageEnabled: true,
    order: 4,
  },
  {
    key: "PAYMENT_COLLECTION",
    name: "Payment Collection",
    slug: "payment-collection",
    category: "payments",
    summary: "Collecte de paiements Mobile Money et carte (feuille de route).",
    icon: "wallet",
    countries: [],
    status: "COMING_SOON" as const,
    publicPageEnabled: false,
    order: 5,
  },
  {
    key: "PAYOUT",
    name: "Payout",
    slug: "payout",
    category: "payments",
    summary: "Décaissement vers portefeuilles Mobile Money (feuille de route).",
    icon: "arrow-line-up-right",
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
  {
    // WhatsApp: baseCost holds the Meta official cost, markup is the
    // configurable NotifyAfrica margin applied on top (+40% initial seed).
    productKey: "WHATSAPP",
    countryCode: null,
    category: "utility",
    volumeMin: 0,
    volumeMax: null,
    currency: "XOF",
    baseCost: 1,
    basePrice: 1.4,
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

/** Website navigation seed (01_Specifications_Website §4). */
export const seedNavigation = [
  { key: "products", label: "Produits", href: "/produits", order: 1, enabled: true },
  { key: "solutions", label: "Solutions", href: "/solutions", order: 2, enabled: true },
  { key: "pricing", label: "Tarifs", href: "/tarifs", order: 3, enabled: true },
  { key: "developers", label: "Développeurs", href: "/developpeurs", order: 4, enabled: true },
  { key: "resources", label: "Ressources", href: "/ressources", order: 5, enabled: true },
  { key: "company", label: "Entreprise", href: "/entreprise", order: 6, enabled: true },
];

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

/** Homepage sections seed (01_Specifications_Website §7). */
export const seedHomepageSections = [
  { key: "hero", order: 1, visible: true, title: "Communiquez avec toute l'Afrique de l'Ouest et centrale", cta: { label: "Créer un compte", target: "register" } },
  { key: "value_prop", order: 2, visible: true },
  { key: "products", order: 3, visible: true },
  { key: "use_cases", order: 4, visible: true },
  { key: "developers", order: 5, visible: true },
  { key: "how_it_works", order: 6, visible: true },
  { key: "pricing_preview", order: 7, visible: true },
  { key: "trust_security", order: 8, visible: true },
  { key: "testimonials", order: 9, visible: true },
  { key: "faq", order: 10, visible: true },
  { key: "cta_final", order: 11, visible: true, cta: { label: "Créer un compte", target: "register" } },
];

export const notifyAfricaSeed = {
  version: SEED_VERSION,
  catalog: seedCatalog,
  pricingRules: seedPricingRules,
  navigation: seedNavigation,
  countries: seedCountries,
  currencies: seedCurrencies,
  homepageSections: seedHomepageSections,
};
