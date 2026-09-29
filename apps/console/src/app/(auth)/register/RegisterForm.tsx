"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "../actions";
import { Button, Card, CardBody, Field, Input } from "@notifyafrica/ui";
import { SUPPORTED_COUNTRIES } from "@notifyafrica/design-system";

const initialState: AuthFormState = { status: "idle" };

export function RegisterForm({ source, campaign }: { source: string; campaign: string }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            notify<span style={{ color: "var(--color-accent)" }}>Africa</span>
          </span>
        </div>

        <Card elevation="md" style={{ padding: "var(--space-8)", gap: "var(--space-4)" }}>
          <div>
            <h4 style={{ margin: 0 }}>Créer votre compte</h4>
            <p className="text-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
              Sandbox gratuit, aucune carte requise.
            </p>
          </div>

          {state.status === "error" ? (
            <Card elevation="sm" accentBorder>
              <CardBody>{state.message}</CardBody>
            </Card>
          ) : null}

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <input type="hidden" name="source" value={source} />
            <input type="hidden" name="campaign" value={campaign} />

            <Field label="Nom de l'organisation">
              <Input type="text" name="organizationName" placeholder="MaBanque SA" required />
            </Field>
            <Field label="Email professionnel">
              <Input type="email" name="email" placeholder="vous@entreprise.com" autoComplete="email" required />
            </Field>
            <Field label="Mot de passe">
              <Input
                type="password"
                name="password"
                placeholder="10 caractères minimum"
                minLength={10}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Pays">
              <select name="country" className="input" defaultValue={SUPPORTED_COUNTRIES[0].code} required>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Button type="submit" variant="primary" block disabled={pending}>
              {pending ? "Création du compte…" : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-muted" style={{ margin: 0, fontSize: 13, textAlign: "center" }}>
            Déjà un compte ? <Link href="/login">Se connecter</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
