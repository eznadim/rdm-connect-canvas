import { cn } from "@/lib/utils";

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
  boundCellIds: Record<string, "text" | "fill" | "navigation">;
  liveValues: Record<string, string>;
  onSelect: (cell: CellDef) => void;
};

const kindStroke: Record<string, string> = {
  text: "var(--bind-text)",
  fill: "var(--bind-fill)",
  navigation: "var(--bind-nav)",
};

export function SchematicCanvas({ selectedCellId, boundCellIds, liveValues, onSelect }: Props) {
  return (
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
      <rect width="680" height="390" fill="url(#grid)" />

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
        const kind = boundCellIds[c.id];
        const selected = selectedCellId === c.id;
        const value = liveValues[c.id];
        const rx = c.shape === "pill" ? 19 : 4;
        return (
          <g
            key={c.id}
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
              fill={
                kind === "fill" && value
                  ? "var(--bind-fill-soft)"
                  : kind
                    ? "var(--cell-bound-bg)"
                    : "var(--cell-bg)"
              }
              stroke={selected ? "var(--cell-selected)" : kind ? kindStroke[kind] : "var(--cell-stroke)"}
              strokeWidth={selected ? 2.5 : 1.5}
              strokeDasharray={kind ? undefined : "4 3"}
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
            {kind === "navigation" && (
              <circle cx={c.x + c.w - 8} cy={c.y + 8} r="4" fill="var(--bind-nav)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
