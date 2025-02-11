"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { toast } from "sonner";
import { NFT_CONFIG } from "@/config/nft";
import { Loader2, Sparkle, CheckCircle, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

// Dynamic import of GamechainDiagram with loading state disabled
const GamechainDiagram = dynamic(
  () => import("@/components/ui/gamechain-diagram"),
  { ssr: false, loading: () => null }
);

// Add these types
type ClaimStatus = "not_eligible" | "eligible" | "claimed";

interface ClaimResponse {
  canClaim: boolean;
  status: ClaimStatus;
  tokenId?: string;
  txHash?: string;
}

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

  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<ClaimResponse | null>(null);

  const checkEligibility = useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/claim?address=${address}`);
      const data: ClaimResponse = await response.json();
      setClaimStatus(data);
      setIsEligible(data.canClaim);
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setIsEligible(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWallet?.address) {
      checkEligibility(selectedWallet.address);
    }
  }, [selectedWallet?.address, checkEligibility]);

  const handleClaim = async () => {
    if (!selectedWallet?.address) return;

    setIsClaiming(true);
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: selectedWallet.address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim NFT");
      }

      toast.success("Successfully claimed your NFT!");
      setIsEligible(false);
    } catch (error) {
      console.error("Claim error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to claim NFT"
      );
    } finally {
      setIsClaiming(false);
    }
  };

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

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between gap-20 ">
      {authenticated ? (
        <div className="flex absolute top-4 right-4 gap-4 items-center">
          <div className="flex items-center gap-2">
            {selectedWallet?.walletClientType &&
              getWalletIcon(selectedWallet?.walletClientType)}
            <span
              className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-400 transition-colors"
              onClick={() =>
                selectedWallet?.address && copyAddress(selectedWallet.address)
              }
            >
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

      <div className="flex-1 flex flex-col justify-between min-h-screen">
        <div></div>

        <div className="mx-auto my-20 flex max-w-2xl flex-col items-center justify-center py-8 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col gap-4 justify-center items-center">
              <h1 className="text-6xl font-pack text-primary uppercase tracking-wider pointer-events-none">
                B3
              </h1>
              <h2 className="text-2xl font-montreal-semibold">
                Testnet Questers Badge
              </h2>

              <div className="card-container">
                <img
                  src={NFT_CONFIG.publicImage}
                  alt="NFT"
                  className="nft-card"
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rotateX = (y - centerY) / 20;
                    const rotateY = -(x - centerX) / 20;

                    card.style.transform = `translateZ(20px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateZ(20px)";
                  }}
                />
              </div>

              <AnimatePresence mode="wait">
                {!authenticated ? (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-lg flex flex-col gap-4 justify-center items-center"
                  >
                    <Button
                      onClick={login}
                      disabled={!ready}
                      className="text-2xl mt-6 h-auto px-8 shadow-lg py-3 rounded-full"
                    >
                      Connect to Mint
                    </Button>
                  </motion.div>
                ) : authenticated && selectedWallet ? (
                  <motion.div
                    key="claim"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-lg"
                  >
                    <div className="flex flex-col gap-4 justify-center items-center">
                      {isEligible === null ? (
                        <div className="flex gap-2 items-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <p>Checking eligibility...</p>
                        </div>
                      ) : claimStatus?.status === "claimed" ? (
                        <div className="flex flex-col gap-4 items-center text-center">
                          <div className="flex gap-2 items-center text-green-500 font-montreal-medium text-xl">
                            <CheckCircle className="w-5 h-5" />
                            <p>Successfully claimed!</p>
                          </div>
                          <div className="text-sm text-neutral-500">
                            <p>You claimed NFT #{claimStatus.tokenId}</p>
                            <Link
                              href={`https://explorer.b3.fun/tx/${claimStatus.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-neutral-400 transition-colors"
                            >
                              <Button variant="link">
                                View Transaction{" "}
                                <ExternalLinkIcon className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                          <Button onClick={() => logout()} variant="outline">
                            Disconnect Wallet
                          </Button>
                        </div>
                      ) : claimStatus?.status === "not_eligible" ? (
                        <div className="flex flex-col gap-4 items-center text-center">
                          <p className="text-neutral-500">
                            This wallet is not eligible to claim the NFT.
                          </p>
                          <Button onClick={() => logout()} variant="outline">
                            Try Different Wallet
                          </Button>
                        </div>
                      ) : isEligible ? (
                        <Button
                          onClick={handleClaim}
                          disabled={isClaiming}
                          className="text-2xl mt-6 h-auto px-8 shadow-lg py-3 rounded-full"
                        >
                          {isClaiming ? (
                            <div className="flex gap-2 items-center">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <p>Claiming...</p>
                            </div>
                          ) : (
                            <div className="flex gap-3 items-center">
                              <Sparkle className="!w-5 !h-5" />
                              <p>Claim NFT</p>
                            </div>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div ref={diagramRef} className="h-[300px]">
          {!isVideoVisible && isInView && (
            <GamechainDiagram className="mt-8 w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
