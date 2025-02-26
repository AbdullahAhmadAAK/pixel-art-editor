"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { CustomTooltip } from "@/components/custom-tooltip";

interface IconButtonProps {
  screenReader?: string;
  toggled?: boolean;
  classes?: string;
  handleClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

export function IconButton({
  screenReader = "",
  toggled = false,
  classes = "",
  handleClick,
  children,
}: IconButtonProps) {
  return (

    <CustomTooltip tooltipContent={screenReader} >
      <Button
        className={`relative flex h-10 w-10 items-center justify-center ${classes}`}
        onClick={(e) => handleClick?.(e)}
        variant={toggled ? "default" : "outline"} // Adjusted variants
      >
        <span className="sr-only">{screenReader}</span>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </Button>
    </CustomTooltip>
  );
}
