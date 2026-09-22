import "@notifyafrica/design-system/nocturne.css";

export const metadata = {
  title: "NotifyAfrica Admin",
  description: "Backoffice interne NotifyAfrica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
