import { coreApi } from "@/lib/api";
import { acceptInvitationAction } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input } from "@notifyafrica/ui";

/** Invitation accept screen (Lot 3 Auth, 03_Specifications_Console §3). */
export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  let invitation;
  try {
    invitation = await coreApi().getInvitation(token);
  } catch {
    invitation = null;
  }

  if (!invitation) {
    return (
      <main style={{ maxWidth: 420, margin: "64px auto" }}>
        <Card elevation="md">
          <CardTitle>Invitation introuvable</CardTitle>
          <CardBody>Ce lien d&apos;invitation est invalide, expiré ou déjà utilisé.</CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "64px auto" }}>
      <Card elevation="md">
        <CardTitle>Rejoindre {invitation.organizationName}</CardTitle>
        <CardBody>
          Vous êtes invité(e) en tant que <strong>{invitation.role}</strong> avec l&apos;adresse{" "}
          {invitation.email}. Choisissez un mot de passe pour activer votre compte.
        </CardBody>
        {error ? <CardBody>L&apos;activation a échoué. Réessayez.</CardBody> : null}
        <form action={acceptInvitationAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="token" value={token} />
          <Field label="Mot de passe">
            <Input type="password" name="password" minLength={10} required />
          </Field>
          <Button type="submit" variant="primary" block>
            Activer mon compte
          </Button>
        </form>
      </Card>
    </main>
  );
}

export const dynamic = "force-dynamic";
