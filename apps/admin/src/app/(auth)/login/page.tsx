"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "../actions";
import { Button, Card, CardBody, Field, Input } from "@notifyafrica/ui";

const initialState: AuthFormState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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
          <p className="text-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
            Back-office · accès interne
          </p>
        </div>

        <Card elevation="md" style={{ padding: "var(--space-8)", gap: "var(--space-4)" }}>
          <div>
            <h4 style={{ margin: 0 }}>Se connecter</h4>
          </div>

          {state.status === "error" ? (
            <Card elevation="sm" accentBorder>
              <CardBody>{state.message}</CardBody>
            </Card>
          ) : null}

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Field label="Email">
              <Input type="email" name="email" placeholder="prenom.nom@notifyafrica.com" autoComplete="email" required />
            </Field>
            <Field label="Mot de passe">
              <Input type="password" name="password" placeholder="••••••••••" autoComplete="current-password" required />
            </Field>
            <Button type="submit" variant="primary" block disabled={pending}>
              {pending ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
