import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronRight,
  Circle,
  Link2,
  MousePointerClick,
  PaintBucket,
  Plus,
  Search,
  Trash2,
  Type as TypeIcon,
} from "lucide-react";

import { SchematicCanvas, schematicCells, type CellDef } from "@/components/binding/SchematicCanvas";
import {
  controllers,
  defaultFillRules,
  graphs,
  pointTypeLabels,
  type BindKind,
  type Binding,
  type PointType,
  type RdmPoint,
} from "@/lib/rdm-mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diagram Binding Studio — RDM Data Manager" },
      {
        name: "description",
        content:
          "Bind RDM Data Manager points to SVG diagram cells: text, fill and navigation bindings in one guided workspace.",
      },
      { property: "og:title", content: "Diagram Binding Studio — RDM Data Manager" },
      {
        property: "og:description",
        content: "Guided three-step workspace for binding live controller data to SVG schematics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BindingStudio,
});

const kindMeta: Record<BindKind, { label: string; icon: typeof TypeIcon; token: string }> = {
  text: { label: "Text", icon: TypeIcon, token: "text-bind-text" },
  fill: { label: "Fill", icon: PaintBucket, token: "text-bind-fill" },
  navigation: { label: "Navigation", icon: ArrowRightLeft, token: "text-bind-nav" },
};

const typeOrder: PointType[] = ["input", "output", "parameter", "state"];
const kindOrder: BindKind[] = ["text", "fill", "navigation"];

const bindingId = (cellId: string, kind: BindKind) => `${cellId}:${kind}`;

function BindingStudio() {
  const [graphId, setGraphId] = useState(graphs[0]!.id);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [selectedCell, setSelectedCell] = useState<CellDef | null>(null);
  const [kind, setKind] = useState<BindKind>("text");
  const [controllerId, setControllerId] = useState(controllers[0]!.id);
  const [typeFilter, setTypeFilter] = useState<PointType>("input");
  const [query, setQuery] = useState("");
  const [pointId, setPointId] = useState<string | null>(null);
  const [suffix, setSuffix] = useState("");
  const [prefix, setPrefix] = useState("");
  const [rules, setRules] = useState<{ match: string; color: string }[]>(defaultFillRules);
  const [targetGraphId, setTargetGraphId] = useState(graphs[1]!.id);

  const controller = controllers.find((c) => c.id === controllerId)!;
  const points = useMemo(
    () =>
      controller.points.filter(
        (p) =>
          p.type === typeFilter &&
          (query === "" || p.name.toLowerCase().includes(query.toLowerCase())),
      ),
    [controller, typeFilter, query],
  );
  const point = controller.points.find((p) => p.id === pointId) ?? null;

  const cellKinds = useMemo(() => {
    const out: Record<string, BindKind[]> = {};
    for (const b of bindings) (out[b.cellId] ??= []).push(b.kind);
    for (const id in out) out[id]!.sort((a, z) => kindOrder.indexOf(a) - kindOrder.indexOf(z));
    return out;
  }, [bindings]);

  const valueOf = (b: Binding) =>
    controllers.find((x) => x.id === b.controllerId)?.points.find((x) => x.id === b.pointId)
      ?.value ?? null;

  const cellText = useMemo(() => {
    const out: Record<string, string> = {};
    for (const b of bindings) {
      if (b.kind === "text") {
        const v = valueOf(b);
        if (v) out[b.cellId] = `${b.prefix ?? ""}${v}${b.suffix ? " " + b.suffix : ""}`.trim();
      } else if (b.kind === "navigation" && !out[b.cellId]) {
        out[b.cellId] = graphs.find((g) => g.id === b.targetGraphId)?.name ?? "Link";
      }
    }
    // text binding always wins over nav label
    for (const b of bindings) {
      if (b.kind === "text") {
        const v = valueOf(b);
        if (v) out[b.cellId] = `${b.prefix ?? ""}${v}${b.suffix ? " " + b.suffix : ""}`.trim();
      }
    }
    return out;
  }, [bindings]);

  const cellFill = useMemo(() => {
    const out: Record<string, string> = {};
    for (const b of bindings) {
      if (b.kind !== "fill") continue;
      const v = valueOf(b);
      const rule = b.rules?.find((r) => r.match.toLowerCase() === (v ?? "").toLowerCase());
      if (rule) out[b.cellId] = rule.color;
    }
    return out;
  }, [bindings]);

  const existing = selectedCell
    ? (bindings.find((b) => b.id === bindingId(selectedCell.id, kind)) ?? null)
    : null;

  // load existing binding into the form whenever the cell or bind type changes
  useEffect(() => {
    if (!selectedCell) return;
    const b = bindings.find((x) => x.id === bindingId(selectedCell.id, kind));
    if (!b) {
      setPointId(null);
      setPrefix("");
      setSuffix("");
      setRules(defaultFillRules);
      return;
    }
    if (b.controllerId) setControllerId(b.controllerId);
    setPointId(b.pointId ?? null);
    setPrefix(b.prefix ?? "");
    setSuffix(b.suffix ?? "");
    setRules(b.rules ?? defaultFillRules);
    if (b.targetGraphId) setTargetGraphId(b.targetGraphId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell?.id, kind]);

  const canApply = selectedCell && (kind === "navigation" ? !!targetGraphId : !!point);

  function selectCell(cell: CellDef) {
    setSelectedCell(cell);
  }

  function applyBinding() {
    if (!selectedCell) return;
    const next: Binding = {
      id: bindingId(selectedCell.id, kind),
      cellId: selectedCell.id,
      cellLabel: selectedCell.label,
      kind,
      controllerId: kind === "navigation" ? undefined : controllerId,
      pointId: kind === "navigation" ? undefined : (pointId ?? undefined),
      suffix: kind === "text" ? suffix || point?.units : undefined,
      prefix: kind === "text" ? prefix : undefined,
      rules: kind === "fill" ? rules : undefined,
      targetGraphId: kind === "navigation" ? targetGraphId : undefined,
    };
    setBindings((prev) => [...prev.filter((b) => b.id !== next.id), next]);
  }

  function removeBinding(id: string) {
    setBindings((prev) => prev.filter((b) => b.id !== id));
  }

  const stepDone = { one: true, two: !!selectedCell, three: !!canApply };

  return (
    <main className="flex h-screen flex-col bg-background text-foreground">
      {/* top bar */}
      <header className="flex items-center gap-4 border-b border-border bg-card px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary/15 text-primary">
            <Link2 className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Graphics Admin
            </p>
            <h1 className="text-sm font-semibold">Diagram Binding Studio</h1>
          </div>
        </div>

        <div className="ml-4 w-72">
          <Select value={graphId} onValueChange={setGraphId}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {graphs.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="mr-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="size-2 fill-state-run text-state-run" />
            Node-RED live · {controller.ip}
          </span>
          <Button variant="ghost" size="sm">
            Preview
          </Button>
          <Button variant="outline" size="sm">
            Revert
          </Button>
          <Button size="sm">Save mapping</Button>
        </div>
      </header>

      {/* step rail */}
      <div className="flex items-center gap-6 border-b border-border bg-card/50 px-5 py-2 text-xs">
        {[
          { n: 1, label: "Pick a diagram", done: stepDone.one },
          { n: 2, label: "Click a cell on the canvas", done: stepDone.two },
          { n: 3, label: "Add one or more bind types", done: stepDone.three },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border text-[10px] font-semibold",
                s.done
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {s.done ? <Check className="size-3" /> : s.n}
            </span>
            <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
            {i < 2 && <ChevronRight className="size-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* canvas */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-2 text-xs text-muted-foreground">
            <span>
              {schematicCells.length} detected cells · {bindings.length} bindings on{" "}
              {Object.keys(cellKinds).length} cells
            </span>
            <span className="flex items-center gap-4">
              {kindOrder.map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: `var(--bind-${k === "navigation" ? "nav" : k})` }}
                  />
                  {kindMeta[k].label}
                </span>
              ))}
            </span>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <div className="h-full overflow-hidden rounded-lg border border-border">
              <SchematicCanvas
                selectedCellId={selectedCell?.id ?? null}
                cellKinds={cellKinds}
                cellText={cellText}
                cellFill={cellFill}
                onSelect={selectCell}
              />
            </div>
          </div>

          {/* bindings table */}
          <div className="h-56 border-t border-border">
            <div className="flex items-center justify-between px-5 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Bindings on this diagram
              </h2>
            </div>
            <ScrollArea className="h-[calc(14rem-2.5rem)] px-5 pb-4">
              {bindings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No bindings yet — click a cell in the diagram to start.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="py-1.5 font-medium">Cell</th>
                      <th className="font-medium">Bind</th>
                      <th className="font-medium">Source</th>
                      <th className="font-medium">Live</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {bindings.map((b) => {
                      const Icon = kindMeta[b.kind].icon;
                      const src =
                        b.kind === "navigation"
                          ? (graphs.find((g) => g.id === b.targetGraphId)?.route ?? "—")
                          : `${b.controllerId} / ${
                              controllers
                                .find((c) => c.id === b.controllerId)
                                ?.points.find((p) => p.id === b.pointId)?.name ?? "—"
                            }`;
                      const live =
                        b.kind === "fill"
                          ? (valueOf(b) ?? "—")
                          : b.kind === "text"
                            ? (cellText[b.cellId] ?? "—")
                            : `→ /${graphs.find((g) => g.id === b.targetGraphId)?.route}`;
                      return (
                        <tr
                          key={b.id}
                          className="cursor-pointer border-t border-border/60 hover:bg-accent/40"
                          onClick={() => {
                            setSelectedCell(schematicCells.find((c) => c.id === b.cellId)!);
                            setKind(b.kind);
                          }}
                        >
                          <td className="py-2">{b.cellLabel}</td>
                          <td>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5",
                                kindMeta[b.kind].token,
                              )}
                            >
                              <Icon className="size-3.5" />
                              {kindMeta[b.kind].label}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-muted-foreground">{src}</td>
                          <td className="flex items-center gap-2 py-2 font-mono text-xs">
                            {b.kind === "fill" && cellFill[b.cellId] && (
                              <span
                                className="size-3 rounded-sm border border-border"
                                style={{ background: cellFill[b.cellId] }}
                              />
                            )}
                            {live}
                          </td>
                          <td className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBinding(b.id);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </ScrollArea>
          </div>
        </section>

        {/* inspector */}
        <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-card">
          {!selectedCell ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <MousePointerClick className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Select a cell</p>
              <p className="text-xs text-muted-foreground">
                Every rectangle in the diagram is a detectable cell. Click one and its binding
                options appear here. A cell can carry text, fill and navigation at the same time.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Selected cell
                </p>
                <p className="text-sm font-semibold">{selectedCell.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{selectedCell.id}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(cellKinds[selectedCell.id] ?? []).length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">No bindings yet</span>
                  ) : (
                    (cellKinds[selectedCell.id] ?? []).map((k) => {
                      const Icon = kindMeta[k].icon;
                      return (
                        <button
                          key={k}
                          onClick={() => setKind(k)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                            kindMeta[k].token,
                            kind === k ? "border-current" : "border-border",
                          )}
                        >
                          <Icon className="size-3" />
                          {kindMeta[k].label}
                          <Trash2
                            className="size-3 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBinding(bindingId(selectedCell.id, k));
                            }}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="px-4 py-3">
                <Tabs value={kind} onValueChange={(v) => setKind(v as BindKind)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {kindOrder.map((k) => {
                      const Icon = kindMeta[k].icon;
                      const bound = (cellKinds[selectedCell.id] ?? []).includes(k);
                      return (
                        <TabsTrigger key={k} value={k} className="gap-1.5 text-xs">
                          <Icon className="size-3.5" />
                          {kindMeta[k].label}
                          {bound && <Check className="size-3 text-state-run" />}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>

              <ScrollArea className="min-h-0 flex-1 px-4">
                {kind === "navigation" ? (
                  <div className="space-y-3 pb-4">
                    <Label className="text-xs">Navigate to</Label>
                    <Select value={targetGraphId} onValueChange={setTargetGraphId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {graphs
                          .filter((g) => g.id !== graphId)
                          .map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                      route: /{graphs.find((g) => g.id === targetGraphId)?.route}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Controller</Label>
                      <Select
                        value={controllerId}
                        onValueChange={(v) => {
                          setControllerId(v);
                          setPointId(null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {controllers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-2">
                                <Circle
                                  className={cn(
                                    "size-2",
                                    c.online
                                      ? "fill-state-run text-state-run"
                                      : "fill-state-stop text-state-stop",
                                  )}
                                />
                                {c.name} · {c.zone}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">{controller.description}</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Point</Label>
                      <div className="flex gap-1">
                        {typeOrder.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                              "flex-1 rounded-md border px-1 py-1 text-[11px] transition-colors",
                              typeFilter === t
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border text-muted-foreground hover:bg-accent",
                            )}
                          >
                            {pointTypeLabels[t]}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search points"
                          className="h-9 pl-7 text-xs"
                        />
                      </div>
                      <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                        {points.length === 0 && (
                          <p className="p-3 text-center text-xs text-muted-foreground">
                            No matching points.
                          </p>
                        )}
                        {points.map((p: RdmPoint) => (
                          <button
                            key={p.id}
                            onClick={() => setPointId(p.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors",
                              pointId === p.id ? "bg-primary/20 text-primary" : "hover:bg-accent",
                            )}
                          >
                            <span className="truncate">{p.name}</span>
                            <span className="ml-2 shrink-0 font-mono text-[11px] text-muted-foreground">
                              {p.value} {p.units}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {kind === "text" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Prefix</Label>
                          <Input
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="none"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Suffix</Label>
                          <Input
                            value={suffix}
                            onChange={(e) => setSuffix(e.target.value)}
                            placeholder={point?.units || "Deg. C"}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {kind === "fill" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Colour rules</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-[11px]"
                            onClick={() =>
                              setRules((r) => [...r, { match: "", color: "#7c8794" }])
                            }
                          >
                            <Plus className="size-3" /> Add rule
                          </Button>
                        </div>
                        {rules.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
                          >
                            <span className="shrink-0 text-muted-foreground">when value is</span>
                            <Input
                              value={r.match}
                              placeholder="Run"
                              onChange={(e) =>
                                setRules((prev) =>
                                  prev.map((x, xi) =>
                                    xi === i ? { ...x, match: e.target.value } : x,
                                  ),
                                )
                              }
                              className="h-7 flex-1 font-mono text-xs"
                            />
                            <label
                              className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded border border-border"
                              style={{ background: r.color }}
                              title={r.color}
                            >
                              <input
                                type="color"
                                value={r.color}
                                onChange={(e) =>
                                  setRules((prev) =>
                                    prev.map((x, xi) =>
                                      xi === i ? { ...x, color: e.target.value } : x,
                                    ),
                                  )
                                }
                                className="absolute inset-0 cursor-pointer opacity-0"
                              />
                            </label>
                            <button
                              onClick={() =>
                                setRules((prev) => prev.filter((_, xi) => xi !== i))
                              }
                              className="text-destructive"
                              aria-label="Remove rule"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                        <p className="text-[11px] text-muted-foreground">
                          Matching is case-insensitive against the live point value.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="space-y-2 border-t border-border p-4">
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Preview
                  </p>
                  <p className="flex items-center gap-2 font-mono text-sm">
                    {kind === "navigation" ? (
                      `→ /${graphs.find((g) => g.id === targetGraphId)?.route}`
                    ) : kind === "fill" ? (
                      point ? (
                        <>
                          <span
                            className="size-3 rounded-sm border border-border"
                            style={{
                              background:
                                rules.find(
                                  (r) => r.match.toLowerCase() === point.value.toLowerCase(),
                                )?.color ?? "transparent",
                            }}
                          />
                          {point.value}
                        </>
                      ) : (
                        "—"
                      )
                    ) : point ? (
                      `${prefix}${point.value}${suffix || point.units ? " " + (suffix || point.units) : ""}`
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={!canApply} onClick={applyBinding}>
                    {existing ? `Update ${kindMeta[kind].label} binding` : `Add ${kindMeta[kind].label} binding`}
                  </Button>
                  {existing && (
                    <Button
                      variant="outline"
                      onClick={() => removeBinding(bindingId(selectedCell.id, kind))}
                    >
                      Unbind
                    </Button>
                  )}
                </div>
                <Badge variant="secondary" className="w-full justify-center text-[11px]">
                  One cell can hold text + fill + navigation at once
                </Badge>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
