import { cookies } from "next/headers";
import { coreApi } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/env";
import {
  createOperatorAction,
  createProviderAction,
  createProviderEndpointAction,
  createRouteAction,
} from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input, Table, Tag } from "@notifyafrica/ui";

const HEALTH_LABELS: Record<string, string> = {
  UNKNOWN: "Inconnue",
  HEALTHY: "Opérationnel",
  DEGRADED: "Dégradé",
  DOWN: "Hors service",
};

const ROUTE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
};

/**
 * Providers, Operators & Routing (02_Specifications_Backoffice §19-22,
 * 04_Prompt §17). Configuration storage only — adding a provider here does
 * not open a live proxy to it, it only makes it an eligible route target.
 * No real adapter exists yet (design handoff README §9 point 4).
 */
export default async function ProvidersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)!.value;
  const api = coreApi(token);

  const [{ operators }, { providers }, { routes }] = await Promise.all([
    api.listOperators(),
    api.listProviders(),
    api.listRoutes(),
  ]);

  return (
    <div>
      <h1>Providers &amp; Routage</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24 }}>
        <div>
          <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
            <CardTitle>Providers</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Pays</th>
                  <th>Santé</th>
                  <th>Endpoints</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.type}</td>
                    <td>{p.countryCode ?? "—"}</td>
                    <td>
                      <Tag variant="neutral">{HEALTH_LABELS[p.healthState] ?? p.healthState}</Tag>
                    </td>
                    <td>
                      {p.endpoints.length === 0 ? (
                        <span className="text-muted">Aucun</span>
                      ) : (
                        p.endpoints.map((e) => (
                          <div key={e.id} className="text-muted" style={{ fontSize: 12 }}>
                            {e.environment}: {e.method} {e.baseUrl}
                            {e.path}
                          </div>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
                {providers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      Aucun provider pour l&apos;instant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Card>

          <Card elevation="md" style={{ marginBottom: 16, overflow: "auto" }}>
            <CardTitle>Routes</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Pays</th>
                  <th>Provider</th>
                  <th>Priorité</th>
                  <th>Stratégie</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productKey}</td>
                    <td>{r.countryCode ?? "—"}</td>
                    <td>{r.provider.name}</td>
                    <td className="num">{r.priority}</td>
                    <td>{r.strategy}</td>
                    <td>
                      <Tag variant={r.status === "ACTIVE" ? "accent" : "neutral"}>
                        {ROUTE_STATUS_LABELS[r.status] ?? r.status}
                      </Tag>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted">
                      Aucune route pour l&apos;instant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Card>

          <Card elevation="md" style={{ overflow: "auto" }}>
            <CardTitle>Opérateurs</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Pays</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td>{o.countryCode}</td>
                    <td>{o.code}</td>
                  </tr>
                ))}
                {operators.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted">
                      Aucun opérateur pour l&apos;instant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card elevation="sm">
            <CardTitle>Nouveau provider</CardTitle>
            <form action={createProviderAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Nom">
                <Input name="name" required />
              </Field>
              <Field label="Type (ex: smpp, http, smtp)">
                <Input name="type" required />
              </Field>
              <Field label="Pays (code ISO, optionnel)">
                <Input name="countryCode" maxLength={2} />
              </Field>
              <Button type="submit" variant="primary">
                Créer
              </Button>
            </form>
          </Card>

          <Card elevation="sm">
            <CardTitle>Nouvel endpoint</CardTitle>
            <CardBody>Rattaché à un provider existant (identifiant ci-dessous).</CardBody>
            <form
              action={createProviderEndpointAction}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Field label="ID du provider">
                <select name="providerId" className="input" required>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Environnement">
                <select name="environment" className="input" defaultValue="sandbox">
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </Field>
              <Field label="Base URL">
                <Input name="baseUrl" placeholder="https://api.provider.example" required />
              </Field>
              <Field label="Path">
                <Input name="path" placeholder="/v1/sms" required />
              </Field>
              <Field label="Méthode">
                <select name="method" className="input" defaultValue="POST">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </Field>
              <Field label="Type d'authentification">
                <select name="authType" className="input" defaultValue="API_KEY">
                  <option value="API_KEY">API Key</option>
                  <option value="BASIC">Basic</option>
                  <option value="BEARER">Bearer</option>
                  <option value="OAUTH2">OAuth2</option>
                  <option value="HMAC">HMAC</option>
                  <option value="CUSTOM_HEADERS">Custom headers</option>
                  <option value="NONE">Aucune</option>
                </select>
              </Field>
              <Field label="Timeout (ms)">
                <Input name="timeoutMs" type="number" defaultValue={10000} />
              </Field>
              <Button type="submit" variant="primary" disabled={providers.length === 0}>
                Créer
              </Button>
            </form>
          </Card>

          <Card elevation="sm">
            <CardTitle>Nouvelle route</CardTitle>
            <form action={createRouteAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Clé produit (ex: SMS)">
                <Input name="productKey" required />
              </Field>
              <Field label="Pays (optionnel)">
                <Input name="countryCode" maxLength={2} />
              </Field>
              <Field label="Opérateur (optionnel)">
                <select name="operatorId" className="input" defaultValue="">
                  <option value="">—</option>
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.countryCode})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Provider">
                <select name="providerId" className="input" required>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priorité">
                <Input name="priority" type="number" defaultValue={0} />
              </Field>
              <Field label="Stratégie">
                <select name="strategy" className="input" defaultValue="priority">
                  <option value="priority">Priorité</option>
                  <option value="weighted">Pondérée</option>
                  <option value="failover">Secours</option>
                  <option value="cheapest">Moins chère</option>
                  <option value="best_quality">Meilleure qualité</option>
                </select>
              </Field>
              <Button type="submit" variant="primary" disabled={providers.length === 0}>
                Créer
              </Button>
            </form>
          </Card>

          <Card elevation="sm">
            <CardTitle>Nouvel opérateur</CardTitle>
            <form action={createOperatorAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Nom">
                <Input name="name" required />
              </Field>
              <Field label="Pays (code ISO)">
                <Input name="countryCode" maxLength={2} required />
              </Field>
              <Field label="Code">
                <Input name="code" required />
              </Field>
              <Button type="submit" variant="primary">
                Créer
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
