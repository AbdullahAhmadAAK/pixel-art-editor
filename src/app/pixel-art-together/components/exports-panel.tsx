import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Canvg } from "canvg";
import { useState } from "react";

export function ExportsPanel({
  width = 2000,
  ratio = 1,
}: {
  width?: number;
  ratio?: number;
}) {
  let renderer;
  const [selected, setSelected] = useState("svg");

  function handleSaveSvg() {
    const queryResult = document.querySelector("#svg-image");
    if (!queryResult) return;

    const svgContent = queryResult.outerHTML;
    const file = new File([svgContent], "pixelart.svg", {
      type: "image/svg+xml",
    });
    downloadFile(file);
  }

  async function handleSavePng() {
    const svgQueryResult = document.querySelector("#svg-image");
    const canvasQueryResult = document.querySelector(
      "#export-canvas"
    ) as HTMLCanvasElement;

    if (!svgQueryResult || !canvasQueryResult) return;

    const svgContent = svgQueryResult.outerHTML;
    const canvas: HTMLCanvasElement = canvasQueryResult;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    renderer = Canvg.fromString(ctx, svgContent);
    renderer.start();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "pixelart.png", {
          type: "image/png",
        });
        downloadFile(file);
      }
    });
  }

  function downloadFile(file: File) {
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = URL.createObjectURL(file);
    link.download = file.name;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.parentNode?.removeChild(link);
    }, 0);
  }

  return (
    <>
      <canvas
        className="hidden"
        height={width * ratio}
        id="export-canvas"
        width={width}
      ></canvas>

      <div className="border-t-2 border-gray-100 p-5">
        <div className="pb-3 text-sm font-semibold text-gray-500">Exports</div>
        <div className="flex gap-3">
          <ToggleGroup
            type="single"
            value={selected}
            onValueChange={(value) => value && setSelected(value)}
            className="w-full"
          >
            <ToggleGroupItem
              value="svg"
              onClick={handleSaveSvg}
              className="w-1/2"
            >
              Download SVG
            </ToggleGroupItem>
            <ToggleGroupItem
              value="png"
              onClick={handleSavePng}
              className="w-1/2"
            >
              Download PNG
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </>
  );
}
