import { SquareArrowOutUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import Link from "next/link";

interface WhyStakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhyStakeDialog = ({ open, onOpenChange }: WhyStakeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why Stake B3</DialogTitle>
        </DialogHeader>

        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src="https://customer-gg6qs7nm5ue94t64.cloudflarestream.com/1ecdac6415dd5d8eba7f696bc1261322/iframe?loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-gg6qs7nm5ue94t64.cloudflarestream.com%2F1ecdac6415dd5d8eba7f696bc1261322%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600"
            loading="lazy"
            style={{
              border: "none",
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          ></iframe>
        </div>

        <div className="p-6">
          <p className="mb-4 text-neutral-600">
            {`B3 Open Gaming is composed of gamechains from top studios and brands.`}
          </p>
          <p className="text-neutral-600">
            The{" "}
            <span className="font-montreal-semibold text-primary">
              $B3 token
            </span>{" "}
            powers the ecosystem with holders getting rewards + airdrops from
            all gamechains.
          </p>

          <div className="mt-8">
            <Link href={"https://b3.fun/"} target="_blank" className="w-full">
              <Button className="h-auto w-full py-4">
                Learn more
                <SquareArrowOutUpRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>

          <Button
            variant="outline"
            className="mt-4 h-auto w-full py-2"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
