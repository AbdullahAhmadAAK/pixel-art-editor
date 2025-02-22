import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Testnet Questers | NFT Drop",
  description:
    "A platform for minting NFTs for fun, built on the B3 blockchain.",
  metadataBase: new URL("https://basemint.fun"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
