// Next JS
import Link from "next/link";
import Image from "next/image";
import { JSX } from "react";

/**
 * LinksPanel component that displays a link to Liveblocks.io with an image.
 *
 * @component
 * @returns {JSX.Element} The rendered LinksPanel component.
 */
export function LinksPanel(): JSX.Element {
  return (
    <div className="mx-5 mb-16 flex w-full pb-1 md:mb-0 md:pb-0 xl:mt-5 xl:justify-end">
      <Link
        className="focus-visible-style group relative overflow-hidden rounded-[7px] ring-1 ring-inset ring-transparent transition-all hover:ring-[color:var(--sl-color-primary-200)] "
        href="https://liveblocks.io"
        target="_blank"
      >
        <Image alt="Powered by Liveblocks.io" src={'/liveblocks/poweredbyliveblocks.svg'} width={166} height={60} />
        <div
          className="absolute inset-0 bg-[color:var(--sl-color-primary-100)] opacity-0 mix-blend-darken transition-opacity group-hover:opacity-20"
        ></div>
      </Link>
    </div>
  );
}
