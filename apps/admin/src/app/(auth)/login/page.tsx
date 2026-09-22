import { loginAction } from "../actions";
import { Button, Card, CardTitle, Field, Input } from "@notifyafrica/ui";

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420, margin: "64px auto" }}>
      <Card elevation="md">
        <CardTitle>NotifyAfrica Admin</CardTitle>
        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email">
            <Input type="email" name="email" required />
          </Field>
          <Field label="Mot de passe">
            <Input type="password" name="password" required />
          </Field>
          <Button type="submit" variant="primary" block>
            Se connecter
          </Button>
        </form>
      </Card>
    </main>
  );
}
