export interface Operator {
  id: string;
  name: string;
  countryCode: string;
  code: string;
  status: string;
}

export interface ProviderEndpoint {
  id: string;
  environment: "sandbox" | "production";
  baseUrl: string;
  path: string;
  method: string;
  authType: string;
  timeoutMs: number;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  countryCode: string | null;
  status: string;
  healthState: string;
  endpoints: ProviderEndpoint[];
}

export interface RouteSummary {
  id: string;
  productKey: string;
  countryCode: string | null;
  operatorId: string | null;
  priority: number;
  strategy: string;
  status: string;
  provider: { id: string; name: string };
}
