import type { Metadata } from "next";
import Drop from "@/components/Drop";

export const metadata: Metadata = {
  title: "Testnet Questers | NFT Drop",
  description:
    "A platform for minting NFTs for fun, built on the B3 blockchain.",
};

export default function Page() {
  return (
    <div className="flex h-screen">
      <main className="container mx-auto">
        <Drop />
      </main>
    </div>
  );
}
