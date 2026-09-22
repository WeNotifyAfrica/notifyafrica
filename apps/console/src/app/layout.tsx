import "@notifyafrica/design-system/nocturne.css";

export const metadata = {
  title: "NotifyAfrica Console",
  description: "Espace client NotifyAfrica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
