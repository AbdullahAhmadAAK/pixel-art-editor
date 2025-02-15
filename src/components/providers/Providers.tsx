"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";
import { mainnet, sepolia } from "viem/chains";
import { http } from "wagmi";

interface ProvidersProps {
  children: ReactNode;
}

// Create a client
const queryClient = new QueryClient();

// Configure wagmi
const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveObject } from '@liveblocks/client';
import { PixelColor, PixelKey } from "@/app/pixel-art-together/page";
import { Layer, Tool } from "@/lib/types";
// import { Layer } from "@/lib/types";
// import { PixelColor, PixelKey } from "@/app/pixel-art-together/page";

export function Providers({ children }: ProvidersProps) {

  if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY) throw new Error("NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY not found in .env file")

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <PrivyProvider
        clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID as string}
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets", // defaults to 'off'
            },
          },
          externalWallets: {
            coinbaseWallet: {
              connectionOptions: "all",
            },
          },
          appearance: {
            theme: "light",
            accentColor: "#ffffff",
            logo: "https://cdn.b3.fun/b3_logo.svg",
          },
          loginMethodsAndOrder: {
            primary: [
              "detected_wallets",
              "coinbase_wallet",
              "email",
              "wallet_connect",
            ],
            overflow: [
              "google",
              "sms",
              "discord",
              "apple",
              "telegram",
              "farcaster",
            ],
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY}>
              <RoomProvider
                id="your-room-id"
                initialPresence={{
                  name: "",
                  selectedLayer: 0,
                  cursor: null,
                  tool: Tool.Brush,
                  mouseDown: false,
                }}

                initialStorage={{
                  pixelStorage: new LiveObject<Record<PixelKey, PixelColor>>({}),
                  layerStorage: new LiveObject<Record<number, Layer>>({})
                }}

              >
                <ClientSideSuspense fallback={<div>Loading…</div>}>
                  {children}
                </ClientSideSuspense>
              </RoomProvider>
            </LiveblocksProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </NextThemesProvider>
  );
}
