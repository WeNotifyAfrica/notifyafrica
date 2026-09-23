import "@notifyafrica/design-system/nocturne.css";
import "@notifyafrica/design-system/website-light.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { coreApi } from "@/lib/api";
import type { NavItem } from "@notifyafrica/types";

export const metadata = {
  title: "NotifyAfrica — Communication SMS, OTP, WhatsApp, Email",
  description: "Plateforme de communication pour l'Afrique de l'Ouest et centrale.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = await coreApi.getConfig<NavItem[]>("website.navigation");

  return (
    <html lang="fr" data-theme="website-light">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <SiteHeader items={nav.value ?? []} />
        <div style={{ flex: 1 }}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
