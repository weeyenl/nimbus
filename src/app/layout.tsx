import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastViewport } from "@/components/ui/toast-system";

export const metadata: Metadata = {
  title: "Nimbus — Grooming Management",
  description: "Pet grooming department management system by Doglab",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nimbus",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <ToastViewport />
        </TooltipProvider>
      </body>
    </html>
  );
}
