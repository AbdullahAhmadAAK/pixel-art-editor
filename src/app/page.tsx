import type { Metadata } from "next";
import CheckAirdrop from "@/components/CheckAirdrop";

export const metadata: Metadata = {
  title: "B3 Airdrop Eligibility Check",
  description: "Check if you are eligible for the $B3 Token Airdrop",
};

export default function Page() {
  return (
    <div className="flex h-screen">
      <main className="container mx-auto">
        <CheckAirdrop />
      </main>
    </div>
  );
}
