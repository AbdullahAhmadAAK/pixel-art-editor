'use client'

// React & Hooks
import { JSX, useState } from "react";

// Utilities & Helpers
import { copyUrlToClipboard } from "@/app/pixel-art-together/lib/utils/copy-text";

// Internal components
import { Button } from "@/components/ui/button";

/**
 * CopyLinkButton Component
 *
 * This component renders a button that allows users to copy the current page URL to their clipboard.
 * It provides visual feedback by displaying "Copied!" temporarily after the button is clicked.
 *
 * @component
 * @returns {JSX.Element} A button that copies the URL when clicked.
 */
export function CopyLinkButton(): JSX.Element {
  // State to track whether the URL has been copied
  const [copied, setCopied] = useState<boolean>(false);

  /**
   * Handles the copy action by copying the URL to the clipboard and 
   * temporarily displaying a "Copied!" message.
   */
  function copy() {
    copyUrlToClipboard();
    setCopied(true);

    // Reset copied state after 1 second
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <Button className="mt-2 w-full" disabled={copied} onClick={copy}>
      {copied ? (
        <>Copied!</>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="inline h-4 w-4 -mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
              clipRule="evenodd"
            />
          </svg>
          Click to copy link
        </>
      )}
    </Button>
  );
}
