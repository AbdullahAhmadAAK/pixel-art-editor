import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CustomTooltipProps {
  children: React.ReactNode;
  tooltipContent: string;
  contentStyle?: string;
}

export function CustomTooltip({ children, tooltipContent, contentStyle = 'text-black' }: CustomTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className={contentStyle}>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
