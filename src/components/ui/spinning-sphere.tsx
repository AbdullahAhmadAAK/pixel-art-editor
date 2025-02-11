import { motion } from "framer-motion";
import { SpinningText } from "./spinning-text";
import { useState, useEffect } from "react";

export interface SpinningSphereProps {
  text: string;
  videoUrl?: string;
  hideText?: boolean;
}

export const SpinningSphere = ({
  text,
  videoUrl = "https://cdn.b3.fun/b3-sphere-to-coin.mp4",
  hideText = false,
}: SpinningSphereProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {!hideText && (
        <motion.div
          className="pointer-events-none absolute inset-0 top-1/2 z-10 max-md:top-[44%] max-md:scale-75"
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: [0, 1] } : {}}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          <SpinningText
            radius={10}
            fontSize={1.2}
            duration={20}
            className="font-montreal-semibold uppercase text-neutral-500"
            reverse={true}
          >
            {text}
          </SpinningText>
        </motion.div>
      )}

      <motion.div
        animate={shouldAnimate ? { y: [0, -8, 0] } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        <video
          src={videoUrl}
          autoPlay
          muted
          playsInline
          className="h-72 w-72 transition-all duration-300 hover:scale-105 max-md:h-56 max-md:w-56"
          onEnded={() => setShouldAnimate(true)}
        />
      </motion.div>
    </div>
  );
};
