"use client";

import { useActionState } from "react";
import { createApiKeyAction, type CreateApiKeyState } from "./actions";
import { Button, Card, CardTitle, CardBody, Field, Input } from "@notifyafrica/ui";

const initialState: CreateApiKeyState = { status: "idle" };

export function CreateApiKeyForm() {
  const [state, formAction] = useActionState(createApiKeyAction, initialState);

  return (
    <Card elevation="sm">
      <CardTitle>Créer une clé API</CardTitle>
      <CardBody>Le secret n&apos;est affiché qu&apos;une seule fois — copiez-le immédiatement.</CardBody>

      {state.status === "success" ? (
        <Card elevation="sm" accentBorder>
          <CardBody>
            Clé <strong>{state.name}</strong> créée. Copiez-la maintenant, elle ne sera plus jamais
            affichée :
          </CardBody>
          <code
            style={{
              display: "block",
              padding: "var(--space-2)",
              background: "var(--color-bg)",
              borderRadius: "var(--radius-md)",
              wordBreak: "break-all",
              fontSize: 13,
            }}
          >
            {state.secret}
          </code>
        </Card>
      ) : null}
      {state.status === "error" ? (
        <Card elevation="sm" accentBorder>
          <CardBody>{state.message}</CardBody>
        </Card>
      ) : null}

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Nom">
          <Input name="name" required />
        </Field>
        <Field label="Environnement">
          <select name="environment" className="input" defaultValue="sandbox">
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </Field>
        <Button type="submit" variant="primary">
          Créer
        </Button>
      </form>
    </Card>
  );
}
