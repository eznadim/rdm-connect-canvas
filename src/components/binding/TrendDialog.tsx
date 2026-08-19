import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pointName: string;
  units: string;
  value: string;
};

// deterministic pseudo-random walk so the mock trend is stable per point
function series(seedText: string, base: number) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) % 100000;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const spread = Math.max(Math.abs(base) * 0.08, 0.5);
  let v = base - spread;
  return Array.from({ length: 48 }, (_, i) => {
    v += (rand() - 0.5) * spread * 0.9;
    v += (base - v) * 0.12;
    const d = new Date(Date.now() - (47 - i) * 30 * 60 * 1000);
    return {
      t: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      v: Number(v.toFixed(2)),
    };
  });
}

export function TrendDialog({ open, onOpenChange, title, pointName, units, value }: Props) {
  const numeric = Number.parseFloat(value);
  const base = Number.isFinite(numeric) ? numeric : 1;
  const data = useMemo(() => series(pointName + title, base), [pointName, title, base]);
  const isNumeric = Number.isFinite(numeric);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{title} — trend</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {pointName} · last 24 h · now {value} {units}
          </DialogDescription>
        </DialogHeader>
        {isNumeric ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bind-text)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--bind-text)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval={7}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  unit={units ? ` ${units}` : ""}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--bind-text)"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  name={units || "value"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            This point is not numeric — trending is only available for analogue values.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
