export interface NavItem {
  key: string;
  label: string;
  href: string;
  order: number;
  enabled: boolean;
}

export interface CtaRef {
  label: string;
  target: string;
}

export interface HeroSection {
  key: "hero";
  order: number;
  visible: boolean;
  kicker: string;
  title: string;
  accentSpan: string;
  subtitle: string;
  badge: string;
  cta: CtaRef;
  secondaryCta: CtaRef;
}

export interface FinalCtaSection {
  key: "cta_final";
  order: number;
  visible: boolean;
  title: string;
  subtitle: string;
  cta: CtaRef;
  secondaryCta: CtaRef;
}

export type HomepageSection = HeroSection | FinalCtaSection | { key: string; order: number; visible: boolean };

export interface Stat {
  value: string;
  label: string;
}

export interface Step {
  n: string;
  title: string;
  desc: string;
}

export interface TitledCard {
  title: string;
  desc: string;
}

export interface TrustCard {
  kicker: string;
  title: string;
  desc: string;
  meta: string | null;
}

export interface DeveloperStat {
  kicker: string;
  value: string;
  desc: string;
}

export interface DocsSection {
  title: string;
  items: string;
}

export interface HeroPreview {
  campaignLabel: string;
  statusLabel: string;
  recipients: number;
  delivered: number;
  balanceAfterLabel: string;
}

export interface WebsiteContent {
  heroPreview: HeroPreview;
  stats: Stat[];
  howItWorks: Step[];
  useCases: TitledCard[];
  solutions: TitledCard[];
  trustCards: TrustCard[];
  paymentMethods: TitledCard[];
  developerStats: DeveloperStat[];
  docsSections: DocsSection[];
}
