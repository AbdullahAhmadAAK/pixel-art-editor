"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { CustomTooltip } from "@/components/custom-tooltip";

/**
 * A reusable button component with an optional tooltip and toggle functionality.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.screenReader=""] - Text for screen readers, also used as the tooltip content.
 * @param {boolean} [props.toggled=false] - Determines the button variant (default or outline).
 * @param {string} [props.classes=""] - Additional CSS classes for styling customization.
 * @param {(e: React.MouseEvent<HTMLButtonElement>) => void} [props.handleClick] - Click event handler.
 * @param {ReactNode} [props.children] - Icon or any content to be displayed inside the button.
 * @returns {JSX.Element} A button wrapped with a tooltip.
 */
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
    <CustomTooltip tooltipContent={screenReader}>
      <Button
        className={`relative flex h-10 w-10 items-center justify-center ${classes}`}
        onClick={(e) => handleClick?.(e)}
        variant={toggled ? "default" : "outline"}
      >
        <span className="sr-only">{screenReader}</span>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </Button>
    </CustomTooltip>
  );
}