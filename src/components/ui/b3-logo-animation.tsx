import React, { useEffect, useRef } from "react";

interface B3LogoAnimationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function B3LogoAnimation({
  containerRef,
}: B3LogoAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const mainElement = document.querySelector("main");
    if (!mainElement) {
      return;
    }

    // number of images to be sequenced
    const frameCount = 76;

    // Function to generate the filename of the image based on the current index
    const currentFrame = (index: number) => {
      return `https://cdn.b3.fun/b3-sphere-to-coin-small/SPHERE_TO_COIN_BLUE0000_${index
        .toString()
        .padStart(4, "0")}.png`;
    };

    // Set canvas size
    canvas.width = 320;
    canvas.height = 320;

    // Drawing the initial images on the canvas
    const img: HTMLImageElement = new window.Image();
    img.src = currentFrame(0);
    img.onload = function () {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Preloading images
    const preloadImages = () => {
      Array.from({ length: frameCount }, (_, i) => {
        const img: HTMLImageElement = new window.Image();
        img.src = currentFrame(i);
      });
    };

    // Update images
    const updateImage = (index: number) => {
      img.src = currentFrame(index);
      img.onload = () => {
        // Clear the canvas before drawing the new frame
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    };

    // Track scroll position
    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const mainScroll = mainElement.scrollTop;

      // Calculate progress based on main element scroll
      const totalScroll = containerRect.height - mainElement.clientHeight;
      const currentScroll = mainScroll;
      const scrollPercentage = (currentScroll / totalScroll) * 100;

      // Only animate between X% and X% scroll
      const start = 10;
      const end = 90;
      if (scrollPercentage < start) {
        requestAnimationFrame(() => updateImage(0));
        return;
      }
      if (scrollPercentage > end) {
        requestAnimationFrame(() => updateImage(frameCount - 1));
        return;
      }

      // Map the progress (5-90%) to frame index (0-75)
      const normalizedProgress = (scrollPercentage - start) / (end - start);
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(normalizedProgress * frameCount)
      );
      requestAnimationFrame(() => updateImage(frameIndex));
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    preloadImages();

    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
