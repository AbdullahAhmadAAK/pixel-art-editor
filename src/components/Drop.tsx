"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import dynamic from "next/dynamic";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import {
  WalletMetamask,
  WalletCoinbase,
  WalletWalletConnect,
  WalletPhantom,
  WalletRainbow,
  WalletRabby,
} from "@web3icons/react";

// Dynamic import of GamechainDiagram with loading state disabled
const GamechainDiagram = dynamic(
  () => import("@/components/ui/gamechain-diagram"),
  { ssr: false, loading: () => null }
);

export default function Drop() {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const diagramRef = useRef(null);
  const isInView = useInView(diagramRef, { once: true });

  // Get turnstile instance to handle resets
  const { login, authenticated, user, logout, ready } = usePrivy();

  const selectedWallet = user?.linkedAccounts
    .filter((account) => account.type === "wallet")
    .sort(
      (a, b) => Number(b.latestVerifiedAt) - Number(a.latestVerifiedAt)
    )[0] as WalletWithMetadata;

  // Keep video timer effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVideoVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const getWalletIcon = (walletType: string) => {
    switch (walletType?.toLowerCase()) {
      case "metamask":
        return <WalletMetamask className="w-5 h-5" />;
      case "coinbase":
        return <WalletCoinbase className="w-5 h-5" />;
      case "walletconnect":
        return <WalletWalletConnect className="w-5 h-5" />;
      case "phantom":
        return <WalletPhantom className="w-5 h-5" />;
      case "rainbow":
        return <WalletRainbow className="w-5 h-5" />;
      case "rabby":
        return <WalletRabby className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between gap-20">
      {authenticated ? (
        <div className="flex absolute top-4 right-4 gap-4 items-center">
          <div className="flex items-center gap-2">
            {selectedWallet?.walletClientType &&
              getWalletIcon(selectedWallet?.walletClientType)}
            <span className="text-sm text-neutral-500">
              {truncateAddress(selectedWallet?.address)}
            </span>
          </div>
          <Button onClick={() => logout()} variant="outline">
            Logout
          </Button>
        </div>
      ) : (
        <Button onClick={() => login()} className="absolute top-4 right-4">
          Connect
        </Button>
      )}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-8 px-4">
          <motion.video
            className={`w-full h-full fixed top-0 left-0 object-contain bg-white z-20 transition-opacity duration-500 ${
              isVideoVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            autoPlay
            muted
            onEnded={() => setIsVideoVisible(false)}
            src={
              isMobile
                ? "https://cdn.b3.fun/b3-logo-animation-square.mp4"
                : "https://cdn.b3.fun/b3-logo-animation-wide.mp4"
            }
          />

          <AnimatePresence mode="wait">
            {!authenticated ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg"
              >
                <div className="flex flex-col gap-4 justify-center items-center">
                  <h1 className="text-8xl font-pack text-primary uppercase tracking-wider pointer-events-none">
                    B3
                  </h1>
                  <h2 className="text-2xl font-montreal-semibold">
                    Testnet Questers Badge
                  </h2>
                  <p className="text-center text-neutral-500">
                    Connect with any wallets in your account, or your BSMNT
                    profile.
                  </p>

                  <Button
                    onClick={login}
                    disabled={!ready}
                    className="text-2xl mt-6 h-auto px-8 shadow-lg py-3 rounded-full"
                  >
                    Connect or Sign In
                  </Button>
                </div>
              </motion.div>
            ) : !user ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg"
              >
                <div className="flex flex-col gap-4 justify-center items-center">
                  <h1 className="text-8xl font-pack text-primary uppercase tracking-wider pointer-events-none">
                    B3
                  </h1>
                  <h2 className="text-2xl font-montreal-semibold">
                    Mint Testnet Questers Badge
                  </h2>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div ref={diagramRef} className="h-[300px]">
        {!isVideoVisible && isInView && (
          <GamechainDiagram className="mt-8 w-full" />
        )}
      </div>
    </div>
  );
}
