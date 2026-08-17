import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Grid2x2,
  Hand,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Unlock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BindKind } from "@/lib/rdm-mock";

export type CellDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: "rect" | "pill" | "pump" | "chiller";
};

export const schematicCells: CellDef[] = [
  { id: "cell_chws_temp", label: "CHWS Temp", x: 60, y: 70, w: 84, h: 30 },
  { id: "cell_chwr_temp", label: "CHWR Temp", x: 60, y: 112, w: 84, h: 30 },
  { id: "cell_ch1_state", label: "Chiller 1 body", x: 210, y: 150, w: 120, h: 70, shape: "chiller" },
  { id: "cell_ch2_state", label: "Chiller 2 body", x: 210, y: 250, w: 120, h: 70, shape: "chiller" },
  { id: "cell_chwp1", label: "CHWP-OFF1", x: 380, y: 160, w: 70, h: 48, shape: "pump" },
  { id: "cell_chwp2", label: "CHWP-OFF2", x: 380, y: 262, w: 70, h: 48, shape: "pump" },
  { id: "cell_cdws_temp", label: "CDWS Temp", x: 500, y: 70, w: 84, h: 30 },
  { id: "cell_cdwr_temp", label: "CDWR Temp", x: 500, y: 112, w: 84, h: 30 },
  { id: "cell_flow", label: "Flow Meter", x: 500, y: 200, w: 96, h: 30 },
  { id: "cell_link_ahu", label: "AHU Old Wing link", x: 60, y: 320, w: 140, h: 38, shape: "pill" },
  { id: "cell_link_ct", label: "Cooling Tower link", x: 480, y: 320, w: 140, h: 38, shape: "pill" },
];

type Props = {
  selectedCellId: string | null;
  cellKinds: Record<string, BindKind[]>;
  cellText: Record<string, string>;
  cellFill: Record<string, string>;
  onSelect: (cell: CellDef) => void;
};

const kindStroke: Record<BindKind, string> = {
  text: "var(--bind-text)",
  fill: "var(--bind-fill)",
  navigation: "var(--bind-nav)",
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 6;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function SchematicCanvas({
  selectedCellId,
  cellKinds,
  cellText,
  cellFill,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [locked, setLocked] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [panning, setPanning] = useState(false);

  const stateRef = useRef({ zoom, offset, locked });
  stateRef.current = { zoom, offset, locked };

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const next = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
    const k = next / z;
    setZoom(next);
    setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (stateRef.current.locked) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(Math.exp(-dy * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomByButton(factor: number) {
    const el = containerRef.current;
    if (!el || locked) return;
    const rect = el.getBoundingClientRect();
    zoomAt(factor, rect.width / 2, rect.height / 2);
  }

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (locked) return;
    // pan with middle mouse, space-less drag on empty canvas, or any drag with alt
    const target = e.target as Element;
    const isCell = target.closest("[data-cell]");
    if (e.button !== 1 && e.button !== 0) return;
    if (e.button === 0 && isCell && !e.altKey) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!panning) return;
    setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
  }

  function endPan() {
    setPanning(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-[var(--canvas-bg)]",
        locked ? "cursor-default" : panning ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerLeave={endPan}
    >
      <svg
        viewBox="0 0 680 390"
        className="h-full w-full select-none"
        role="img"
        aria-label="Chiller plant schematic with bindable cells"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--canvas-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="680" height="390" fill="var(--canvas-bg)" />
        {showGrid && <rect width="680" height="390" fill="url(#grid)" />}

        <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
          {/* static pipework */}
          <g stroke="var(--pipe-chilled)" strokeWidth="3" fill="none">
            <path d="M144 85 H330 V150" />
            <path d="M144 127 H180 V300 H210" />
          </g>
          <g stroke="var(--pipe-condenser)" strokeWidth="3" fill="none">
            <path d="M500 85 H460 V185 H450" />
            <path d="M500 127 H470 V286 H450" />
          </g>
          <text x="24" y="34" className="fill-[var(--canvas-title)] text-[13px] font-semibold">
            CHILLER PLANT SCHEMATIC
          </text>

          {schematicCells.map((c) => {
            const kinds = cellKinds[c.id] ?? [];
            const selected = selectedCellId === c.id;
            const value = cellText[c.id];
            const fill = cellFill[c.id];
            const rx = c.shape === "pill" ? 19 : 4;
            const strokeKind = kinds.includes("fill")
              ? "fill"
              : kinds.includes("text")
                ? "text"
                : kinds[0];
            return (
              <g
                key={c.id}
                data-cell={c.id}
                onClick={() => onSelect(c)}
                className="cursor-pointer"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSelect(c)}
              >
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx={rx}
                  fill={fill ?? (kinds.length ? "var(--cell-bound-bg)" : "var(--cell-bg)")}
                  stroke={
                    selected
                      ? "var(--cell-selected)"
                      : strokeKind
                        ? kindStroke[strokeKind]
                        : "var(--cell-stroke)"
                  }
                  strokeWidth={selected ? 2.5 : 1.5}
                  strokeDasharray={kinds.length ? undefined : "4 3"}
                  className={cn(selected && "animate-pulse")}
                />
                <text
                  x={c.x + c.w / 2}
                  y={c.y + c.h / 2 + 4}
                  textAnchor="middle"
                  className="pointer-events-none text-[11px] font-medium"
                  fill={value ? "var(--canvas-value)" : "var(--canvas-muted)"}
                >
                  {value ?? c.label}
                </text>
                {/* per-kind badges */}
                {kinds.map((k, i) => (
                  <circle
                    key={k}
                    cx={c.x + c.w - 7 - i * 9}
                    cy={c.y + 7}
                    r="3.5"
                    fill={kindStroke[k]}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* viewport controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-border bg-card/90 p-1 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title="Zoom in"
          onClick={() => zoomByButton(1.2)}
        >
          <Plus className="size-4" />
        </Button>
        <span className="py-0.5 text-center font-mono text-[10px] text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title="Zoom out"
          onClick={() => zoomByButton(1 / 1.2)}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title="Reset view (100%)"
          onClick={reset}
        >
          <Maximize2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title="Center diagram"
          onClick={() => setOffset({ x: 0, y: 0 })}
        >
          <Crosshair className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8", showGrid && "text-primary")}
          title="Toggle grid"
          onClick={() => setShowGrid((v) => !v)}
        >
          <Grid2x2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8", locked && "text-bind-fill")}
          title={locked ? "Unlock view" : "Lock view (no zoom or pan)"}
          onClick={() => setLocked((v) => !v)}
        >
          {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-border bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
        <Hand className="size-3" />
        {locked ? "View locked" : "Drag to pan · scroll to zoom · Alt+drag over cells"}
      </div>
    </div>
  );
}
