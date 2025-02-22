import { LinksPanel } from "./links-panel";

export function MobileLinksPanel() {
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