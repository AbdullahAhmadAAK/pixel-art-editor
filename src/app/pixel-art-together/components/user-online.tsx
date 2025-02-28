// React and Next
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

// Third party libraries
import { motion } from "framer-motion";

// Utilities
import ntc from "../utils/name-that-color";
import { contrastingTextColour } from "../utils/contrasting-text-colour";

// Types
import { Tool } from "@/lib/types/pixel-art-editor/tool";
import { BrushData } from "@/lib/types/pixel-art-editor/brush-data";

// Internal components
import { CustomTooltip } from "@/components/custom-tooltip";

interface UserOnlineProps {
  /** Whether to show a shortened version. */
  short?: boolean;

  /** Whether the user is the current user. */
  isYou?: boolean;

  /** The user's brush settings. */
  brush: BrushData;

  /** The currently selected layer. */
  selectedLayer: number;

  /** The user's display name. */
  name: string;

  /** The user's profile picture URL. */
  picture: string;

  /** The current tool used by the user. */
  tool: Tool;

  /** Function to handle color selection. */
  handleSelectColor?: (event: { detail: { color: string } }) => void;
}


/**
 * Renders the UserOnline component, displaying user information and selected tools.
 * @param {UserOnlineProps} props - The props for the UserOnline component.
 * @returns {JSX.Element}
 */
export function UserOnline({
  short = false,
  isYou = false,
  brush,
  selectedLayer,
  name,
  picture,
  tool,
  handleSelectColor
}: UserOnlineProps) {
  const [blackText, setBlackText] = useState<boolean | undefined>(undefined);
  const brushOpacity = useMemo(() => brush?.opacity, [brush]);
  const brushRgb = useMemo(() => brush?.rgb, [brush]);

  // This is supposed to tell whether a chosen color is light enough to be given a black text label
  useEffect(() => {
    if (brushOpacity !== undefined) {
      setBlackText(brushOpacity < 35 ? true : contrastingTextColour(brushRgb));
    }
  }, [brushOpacity, brushRgb]);

  /**
   * This returns us a human-friendly name for each color's hex string
   * @param hex 
   * @returns 
   */
  const getColorName = (hex: string) => (ntc.name(hex)[1] as string);

  /**
   * This function is used to change the color of the current user's brush to the color of the clicked online user's color circle
   */
  function handleColorChange() {
    if (brush?.color && handleSelectColor) {
      handleSelectColor({ detail: { color: brush.color } });
    }
  }

  return (
    <motion.div
      className="flex h-16 items-center justify-between px-5"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0, transition: { duration: isYou ? 0 : 0.5, ease: [0.83, 0, 0.17, 1] } }}
      exit={{ opacity: 0, x: 50, transition: { duration: isYou ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="flex items-center overflow-hidden">
        {/* Avatar */}
        <div className="transparent-bg relative h-10 w-10">
          <Image alt={`${name}'s avatar`} src={picture} width={40} height={40} />
        </div>

        <div className="pl-3">
          <div className="mr-3 font-medium">
            {name} {isYou && <>&nbsp;(you)</>}
          </div>
          <div className="mr-3.5 w-full max-w-[150px] truncate text-sm text-gray-500">
            <span className="font-semibold">Layer {selectedLayer}</span>
            {!short && <>,{getColorName(brush.color.slice(0, 7))}</>}
          </div>
        </div>
      </div>

      {!short && (
        <div className={isYou ? "pointer-events-none" : ""}>
          <CustomTooltip tooltipContent="Use color">
            <button
              onClick={handleColorChange}
              className="focus-visible-style transparent-bg group relative h-[40px] w-[40px] rounded-[4px]"
            >
              <span
                className="inner-border mix absolute inset-0 flex items-center justify-center rounded-[4px]"
                style={{ background: `${brush.color}` }}
              >
                <span
                  className={`mix-blend-luminosity transition-colors ${blackText
                    ? 'text-gray-500 group-hover:text-black group-active:text-gray-500'
                    : 'text-gray-300 group-hover:text-white group-active:text-gray-300'}`}
                >
                  {tool === Tool.Brush && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"
                      />
                    </svg>
                  )}

                  {tool === Tool.Eraser && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z"
                      />
                    </svg>
                  )}
                </span>
              </span>
            </button>
          </CustomTooltip>
        </div>
      )}
    </motion.div>
  );
}
