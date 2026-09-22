import "@notifyafrica/design-system/nocturne.css";
import "@notifyafrica/design-system/website-light.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "NotifyAfrica — Communication SMS, OTP, WhatsApp, Email",
  description: "Plateforme de communication pour l'Afrique de l'Ouest et centrale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="website-light">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
