import { CopyLinkButton } from "./copy-link-button";
import { QRCodeButton } from "./qr-code-button";

export function SharePanel() {
  return (
    <div className="mt-3 border-t-2 border-gray-100 px-5 pt-5 ">
      <div className="pb-1 text-sm font-semibold text-gray-500">Share with friends</div>
      <CopyLinkButton />
      <p className="mt-2 mb-2.5 text-center text-sm text-gray-600">
        Share link to play together
      </p>
      <QRCodeButton />
      <p className="mt-2 text-center text-sm text-gray-600">
        Scan code to play on mobile
      </p>
    </div>
  );
}