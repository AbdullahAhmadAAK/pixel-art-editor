// React
import { JSX } from "react";

// Internal components
import { LinksPanel } from "./links-panel";

/**
 * MobileLinksPanel component that displays a link to Liveblocks.
 * This panel is only visible on smaller screens (hidden on extra-large screens).
 *
 * @component
 * @returns {JSX.Element} The rendered MobileLinksPanel component.
 */
export function MobileLinksPanel(): JSX.Element {
  return (
    <div
      className="flex flex-grow justify-end border-t-2 border-gray-100 pb-5 xl:hidden"
    >
      <div className="w-full overflow-hidden">
        <div className="p-5 pb-3 text-sm font-semibold text-gray-500">Technology</div>
        <LinksPanel />
      </div>
    </div>
  );
}
