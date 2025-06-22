"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (

    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}
