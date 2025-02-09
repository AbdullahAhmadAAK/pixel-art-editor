"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowLeft, X } from "lucide-react";
import Turnstile, { useTurnstile } from "react-turnstile";
import { turnstileSiteKey } from "@/lib/turnstile";
import { SpinningSphere } from "./spinning-sphere";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { GamechainDiagram } from "./gamechain-diagram";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarBadge from "./star-badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { usePrivy, useWallets, WalletWithMetadata } from "@privy-io/react-auth";
interface SimpleProfile {
  exists: boolean;
  username?: string;
  address?: string;
  linkedAccountsCount: number;
  associatedAccountsCount: number;
  eligible: boolean;
  xp: number;
  bp: number;
}

export default function CheckAirdrop() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [profile, setProfile] = useState<SimpleProfile | null>(null);

  // Get turnstile instance to handle resets
  const turnstile = useTurnstile();
  const { ready,login, authenticated, user, logout, getAccessToken} = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const selectedWalletAddress = user?.linkedAccounts
    .filter((account) => account.type === "wallet")
    .sort((a, b) => Number(b.latestVerifiedAt) - Number(a.latestVerifiedAt))[0] as WalletWithMetadata;

  const selectedWallet = wallets.filter((wallet) => wallet?.address === selectedWalletAddress?.address)[0];

  // Keep video timer effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVideoVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const checkEligibility = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const message = `Check B3 Airdrop for ${selectedWallet?.address}`;
      const signature = await selectedWallet.sign(message);


      if (!signature) {
        throw new Error("Failed to sign message");
      }

      const response = await fetch(
        `/api/profile?query=${user?.id}&address=${
          selectedWallet?.address
        }&token=${turnstileToken}&signature=${signature}&message=${encodeURIComponent(
          message
        )}`
      );

      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }

      if (!response.ok) {
        turnstile.reset();
        throw new Error("Profile not found");
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again later."
      );
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWallet, user?.id, turnstileToken, turnstile]);

  // Add effect to fetch profile when wallet is connected
  useEffect(() => {
    const handleCheckEligibility = async () => {
      if (ready && walletsReady && authenticated && selectedWallet && turnstileToken) {
        const accessToken = await getAccessToken();
        if (accessToken) {
          checkEligibility();
        }
      }      
    }
    handleCheckEligibility();
  }, [authenticated, selectedWallet, turnstileToken, checkEligibility, ready, walletsReady, getAccessToken]);


  // Reset search
  const resetSearch = async () => {
    await logout();
    setProfile(null);
    setError(null);
    turnstile.reset();
    setTurnstileToken(null);
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between gap-20">
      {authenticated && (
        <Button onClick={() => logout()} className="absolute top-4 right-4">
          Logout
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
                    Check Airdrop Eligibility
                  </h2>
                  <p className="text-center text-neutral-500">
                    Connect with any wallets in your account, or your BSMNT
                    profile.
                  </p>

                  <Button
                    onClick={login}
                    className="text-2xl mt-6 h-auto px-8 shadow-lg py-3 rounded-full"
                  >
                    Connect or Sign In
                  </Button>
                </div>
              </motion.div>
            ) : !profile ? (
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
                    Check Airdrop Eligibility
                  </h2>

                  <Card className="w-full mt-6">
                    <CardHeader>
                      <CardTitle className="text-2xl font-montreal-semibold flex items-center gap-2 w-full justify-center">
                        {isLoading ? (
                          <p className="text-center text-black flex items-center gap-2">
                            <Loader2 className="animate-spin" />
                            Checking Eligibility...
                          </p>
                        ) : (
                          <p className="text-center text-black flex items-center gap-2">
                            Check Eligibility
                          </p>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {user?.wallet?.address}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-4">
                        <Turnstile
                          sitekey={
                            process.env.NEXT_PUBLIC_ENV === "local"
                              ? "1x00000000000000000000AA"
                              : turnstileSiteKey
                          }
                          onVerify={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken(null)}
                          onError={() => {
                            setError(
                              "Turnstile verification failed. Please try again."
                            );
                            setTurnstileToken(null);
                          }}
                          refreshExpired="auto"
                          theme="light"
                          size="normal"
                          className="mx-auto"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-lg"
              >
                <div className="mt-8 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="relative flex justify-center">
                      <SpinningSphere
                        text={
                          profile.eligible
                            ? "Eligible • Eligible • Eligible • "
                            : ""
                        }
                      />

                      {profile.eligible ? (
                        <span className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-green-600 bg-green-200/70 px-2 py-1 font-montreal-medium text-sm text-green-700 shadow-md backdrop-blur-sm">
                          <Check className="size-5" /> Eligible for Season 1
                        </span>
                      ) : (
                        <span className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-red-600 bg-red-200/70 px-2 py-1 font-montreal-medium text-sm text-red-700 shadow-md backdrop-blur-sm">
                          <X className="size-5" /> Not Eligible for Season 1
                        </span>
                      )}
                    </div>

                    {profile.exists ? (
                      <Card className="w-full">
                        <CardHeader>
                          <CardTitle className="text-4xl font-montreal-semibold">
                            {profile.username}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {profile.address}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <Separator className="col-span-2 mb-6" />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-2xl text-black font-montreal-semibold flex items-center gap-3">
                                <StarBadge className="w-8 h-8" variant="xp" />{" "}
                                {profile.xp.toLocaleString()} XP
                              </p>
                            </div>
                            <div>
                              <p className="text-2xl text-black font-montreal-semibold flex items-center gap-3">
                                <StarBadge className="w-8 h-8" variant="bp" />{" "}
                                {profile.bp.toLocaleString()} BP
                              </p>
                            </div>

                            <Separator className="col-span-2 mt-2" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Linked Accounts
                              </p>
                              <p>{profile.linkedAccountsCount}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Associated Accounts
                              </p>
                              <p>{profile.associatedAccountsCount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="w-full">
                        <CardHeader>
                          <CardTitle className="text-2xl font-montreal-semibold text-center">
                            No Account Found
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-center text-gray-500 mb-4">
                            {`We couldn't find a B3 account associated with this
                            wallet. Make sure you're connecting with the correct
                            wallet or create an account on B3.`}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-center"
                    >
                      <Button
                        variant="ghost"
                        onClick={resetSearch}
                        className="mb-4 flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Search
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      </div>

      <GamechainDiagram className="mt-8 w-full" />
    </div>
  );
}
