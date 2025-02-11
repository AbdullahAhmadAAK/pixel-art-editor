import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { WhyStakeDialog } from "@/components/ui/why-stake-dialog";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect } from "react";

const GamechainDiagram = ({ className }: { className?: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const ref = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      // Wait 1 second before starting the sequence
      const timer = setTimeout(() => {
        videoRef.current?.play();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  const innerCircleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 1.5 + i * 0.2, // 1s initial delay + staggered delay
        duration: 0.5,
      },
    }),
  };

  const outerCircleVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 1.5 + i * 0.2, // 1.5s initial delay + staggered delay
        duration: 0.5,
      },
    }),
  };

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "group relative h-[300px] w-[300px] overflow-hidden",
          className
        )}
      >
        <div className="relative flex h-[450px] w-full flex-col items-center justify-center">
          <video
            ref={videoRef}
            src={"https://cdn.b3.fun/b3-sphere-to-coin.mp4"}
            muted
            playsInline
            className="h-64 w-64 transition-all duration-300 group-hover:scale-105 max-md:h-56 max-md:w-56 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />

          <OrbitingCircles iconSize={52} radius={124} reverse speed={1}>
            {[6, 7, 8, 9, 10].map((num, i) => (
              <motion.img
                key={num}
                custom={i}
                variants={innerCircleVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                src={`https://cdn.b3.fun/sphere${num}.avif`}
                alt=""
                width={52}
                height={52}
                className="rounded-full"
              />
            ))}
          </OrbitingCircles>

          <OrbitingCircles iconSize={42} radius={190} speed={1}>
            {[1, 2, 3, 4, 5, 11, 12, 13, 14, 15].map((num, i) => (
              <motion.img
                key={num}
                custom={i}
                variants={outerCircleVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                src={`https://cdn.b3.fun/sphere${num}.avif`}
                alt=""
                width={42}
                height={42}
                className="rounded-full"
              />
            ))}
          </OrbitingCircles>
        </div>
        <div className="absolute bottom-0 left-0 h-2/3 w-full bg-gradient-to-b from-transparent to-neutral-100 transition-opacity duration-300 group-hover:opacity-0" />

        <button
          onClick={() => setIsDialogOpen(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary bg-white px-5 py-2 font-montreal-semibold text-sm text-primary shadow-lg transition-all duration-300 hover:bottom-7 hover:border-black/40 hover:bg-gradient-to-b hover:from-blue-400 hover:to-primary hover:text-white"
        >
          <div className="flex items-center gap-2">
            {`Discover $B3`}
            <ChevronRight className="size-4" />
          </div>
        </button>
      </div>

      <WhyStakeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};

export default GamechainDiagram;
