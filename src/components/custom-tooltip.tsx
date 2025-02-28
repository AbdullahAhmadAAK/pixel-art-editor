import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CustomTooltipProps {
  children: React.ReactNode;
  tooltipContent: string;
  contentStyle?: string;
}

/**
 * CustomTooltip Component
 *
 * A wrapper around the Tooltip component that provides a customizable tooltip 
 * for any child element. This is easier and more intuitive to customize than importing Tooltip, TooltipTrigger, and TooltipContent,
 * and then having to configure them.
 *
 * @param {React.ReactNode} children - The element that triggers the tooltip when hovered or focused.
 * @param {string} tooltipContent - The text or content displayed inside the tooltip.
 * @param {string} [contentStyle='text-black'] - Additional Tailwind CSS classes for styling the tooltip content.
 *
 * @example
 * <CustomTooltip tooltipContent="This is a tooltip">
 *   <button>Hover me</button>
 * </CustomTooltip>
 *
 * @returns {JSX.Element} A tooltip-wrapped component.
 */
export function CustomTooltip({ children, tooltipContent, contentStyle = 'text-black' }: CustomTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className={contentStyle}>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
