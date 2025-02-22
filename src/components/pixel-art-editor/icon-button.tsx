"use client";

import SlTooltip from "@shoelace-style/shoelace/dist/react/tooltip/index.js";
import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import { ReactNode } from "react";

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
    <SlTooltip content={screenReader} hoist className="bg-gray-800">
      <SlButton
        className={`relative flex h-10 w-10 items-center justify-center ${classes}`}
        onClick={(e) => handleClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>)}
        variant={toggled ? "primary" : "primary"}
      >
        <span className="sr-only">{screenReader}</span>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </SlButton>
    </SlTooltip>
  );
}
