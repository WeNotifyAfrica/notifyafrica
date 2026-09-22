import { registerAction } from "../actions";
import { Button, Card, CardTitle, Field, Input } from "@notifyafrica/ui";

/**
 * Lot 3 Auth (design handoff): inscription. Campaign/source params arriving
 * from the Website (01_Specifications_Website §5) are carried through as
 * hidden fields so they land in USER_REGISTERED's payload.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; product?: string; campaign?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={{ maxWidth: 420, margin: "64px auto" }}>
      <Card elevation="md">
        <CardTitle>Créer un compte NotifyAfrica</CardTitle>
        <form action={registerAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="source" value={params.source ?? ""} />
          <input type="hidden" name="campaign" value={params.campaign ?? ""} />
          <Field label="Email professionnel">
            <Input type="email" name="email" required />
          </Field>
          <Field label="Mot de passe">
            <Input type="password" name="password" minLength={10} required />
          </Field>
          <Field label="Nom de l'organisation">
            <Input type="text" name="organizationName" required />
          </Field>
          <Field label="Pays (code ISO)">
            <Input type="text" name="country" maxLength={2} defaultValue="TG" required />
          </Field>
          <Field label="Devise (code ISO)">
            <Input type="text" name="currency" maxLength={3} defaultValue="XOF" required />
          </Field>
          <Button type="submit" variant="primary" block>
            Créer mon compte
          </Button>
        </form>
      </Card>
    </main>
  );
}
