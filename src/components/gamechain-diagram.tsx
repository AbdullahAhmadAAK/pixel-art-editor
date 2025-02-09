import { OrbitingCircles } from "./ui/orbiting-circles";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { WhyStakeDialog } from "./why-stake-dialog";

export const GamechainDiagram = ({ className }: { className?: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div
        className={cn("group relative h-[200px] overflow-hidden", className)}
      >
        <div className="relative flex h-[400px] w-full flex-col items-center justify-center">
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/3 rounded-full bg-b3-primary/50 blur-2xl"></div>

          <span
            className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap pb-1 font-montreal-semibold text-5xl uppercase text-black/20 transition-all duration-300 group-hover:text-primary/60"
            style={{
              textShadow:
                "0 0 1px rgba(255, 255, 255, 0.1), 0 0 2px rgba(255, 255, 255, 0.1), 0 0 3px rgba(255, 255, 255, 0.1)",
            }}
          >
            Gamechain
          </span>

          <span
            className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap pb-1 font-montreal-semibold text-7xl uppercase text-black/20 transition-all duration-300 group-hover:text-primary/60"
            style={{
              textShadow:
                "0 0 1px rgba(255, 255, 255, 0.1), 0 0 2px rgba(255, 255, 255, 0.1), 0 0 3px rgba(255, 255, 255, 0.1)",
            }}
          >
            Rewards
          </span>

          <OrbitingCircles iconSize={42} radius={160} speed={1}>
            <Image
              src="https://cdn.b3.fun/sphere1.avif"
              alt=""
              width={42}
              height={42}
            />
            <Image
              src="https://cdn.b3.fun/sphere2.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere3.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere4.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere5.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />

            <Image
              src="https://cdn.b3.fun/sphere11.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere12.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere13.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere14.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere15.avif"
              alt=""
              width={42}
              height={42}
              className="rounded-full"
            />
          </OrbitingCircles>

          <OrbitingCircles iconSize={52} radius={90} reverse speed={1}>
            <Image
              src="https://cdn.b3.fun/sphere6.avif"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere7.avif"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere8.avif"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere9.avif"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
            />
            <Image
              src="https://cdn.b3.fun/sphere10.avif"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
            />
          </OrbitingCircles>
        </div>
        <div className="absolute bottom-0 left-0 h-2/3 w-full bg-gradient-to-b from-transparent to-neutral-100 transition-opacity duration-300 group-hover:opacity-0" />

        <button
          onClick={() => setIsDialogOpen(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary bg-white px-5 py-2 font-montreal-semibold text-sm text-primary shadow-lg transition-all duration-300 hover:bottom-7 hover:border-black/40 hover:bg-gradient-to-b hover:from-blue-400 hover:to-primary hover:text-white"
        >
          <div className="flex items-center gap-2">
            {`Discover $B3 Staking`}
            <ChevronRight className="size-4" />
          </div>
        </button>
      </div>

      <WhyStakeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};
