// import { createEventDispatcher, onMount } from "svelte";
// import { quintInOut, quintOut } from "svelte/easing";
// import { slide } from "svelte/transition";
import Image from 'next/image';
import { Brush, Tool } from '@/lib/types';
import { contrastingTextColour } from '../../app/pixel-art-together/lib/utils/contrasting-text-colour';
import ntc from '@/app/pixel-art-together/lib/utils/name-that-color';
import { useEffect, useState } from 'react';
import SlTooltip from '@shoelace-style/shoelace/dist/react/tooltip/index.js';
// import { Brush } from 'lucide-react';

interface UserOnlineProps {
  short?: boolean;
  isYou?: boolean;
  brush: Brush;
  selectedLayer: number;
  name: string;
  picture: string;
  tool: Tool;
  handleSelectColor?: ({ detail }: { detail: { color: string } }) => void // sveltekit had dispatched events to selectColor from child to parent. we are trying it this way
}

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

  const getColorName = (hex: string) => ntc.name(hex)[1];

  const [blackText, setBlackText] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (brush && brush.opacity) {
      if (brush.opacity < 35) {
        setBlackText(true)
      } else {
        const newIsBlackText = contrastingTextColour(brush.rgb)
        setBlackText(newIsBlackText)
      }
    }
  }, [brush]) // TODO: only need to rerender when opacity changes though? can we optimize this

  function handleColorChange() {
    if (brush?.color && handleSelectColor) {
      handleSelectColor({ detail: { color: brush.color } })
      // dispatch("selectColor", { color: brush.color });
    }
  }

  return (
    <div
      className="flex h-16 items-center justify-between px-5"
    // TODO: add these animations soon
    // in:slide={{ duration: isYou ? 0 : 500, easing: quintInOut }}
    // out:slide={{ duration: isYou ? 0 : 500, easing: quintOut }}
    >
      <div className="flex items-center overflow-hidden">
        {/* <!-- Avatar --> */}
        <div className="transparent-bg relative h-10 w-10">
          {/* TODO: choose better width height later */}
          <Image alt={`${name}'s avatar`} src={picture} width={40} height={40} />
        </div>

        {/* <!-- Text --> */}
        <div className="pl-3">
          <div className="mr-3 font-medium">
            {name}
            {isYou && (
              <>&nbsp;(you)</>
            )}
          </div>
          <div className="mr-3.5 w-full max-w-[150px] truncate text-sm text-gray-500">
            <span className="font-semibold">Layer {selectedLayer}</span>
            {!short && (
              <>
                ,{getColorName(brush.color.slice(0, 7))}
              </>
            )}
          </div>
        </div>
      </div>

      {!short && (
        // <!-- Copyable color preview -->
        <div className={isYou ? "pointer-events-none" : ""}>
          <SlTooltip content="Use color">
            <button
              onClick={handleColorChange}
              className="focus-visible-style transparent-bg group relative h-[40px] w-[40px] rounded-[4px]"
            >
              <span
                className="inner-border mix absolute inset-0 flex items-center justify-center rounded-[4px]"
                style={{ background: `${brush.color}` }}
              // style="background: {brush.color};"
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

                  {tool === Tool.Fill && (
                    <svg
                      className="mt-1.5 ml-0.5 h-6 w-6 scale-x-[-1]"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z"
                      />
                    </svg>
                  )}
                </span>

              </span>
            </button>
          </SlTooltip>
        </div>
      )}
    </div>
  );
}