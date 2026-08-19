import type { CellDef } from "@/components/binding/SchematicCanvas";

export type ImportedDiagram = {
  name: string;
  markup: string;
  viewBox: string;
  cells: CellDef[];
};

/**
 * Parses an uploaded SVG (e.g. exported from Drawio) and detects bindable cells.
 * A cell is any <rect> / <ellipse> that carries an id or a data-cell attribute.
 */
export function parseSvg(name: string, text: string): ImportedDiagram {
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) throw new Error("No <svg> element found in the uploaded file.");

  const width = Number.parseFloat(svg.getAttribute("width") ?? "") || 680;
  const height = Number.parseFloat(svg.getAttribute("height") ?? "") || 390;
  const viewBox = svg.getAttribute("viewBox") ?? `0 0 ${width} ${height}`;

  const cells: CellDef[] = [];
  const seen = new Set<string>();
  svg.querySelectorAll("rect, ellipse").forEach((el, i) => {
    const id = el.getAttribute("data-cell") ?? el.getAttribute("id");
    if (!id || seen.has(id)) return;
    let x: number, y: number, w: number, h: number;
    if (el.tagName.toLowerCase() === "ellipse") {
      const cx = Number.parseFloat(el.getAttribute("cx") ?? "0");
      const cy = Number.parseFloat(el.getAttribute("cy") ?? "0");
      const rx = Number.parseFloat(el.getAttribute("rx") ?? "0");
      const ry = Number.parseFloat(el.getAttribute("ry") ?? "0");
      x = cx - rx;
      y = cy - ry;
      w = rx * 2;
      h = ry * 2;
    } else {
      x = Number.parseFloat(el.getAttribute("x") ?? "0");
      y = Number.parseFloat(el.getAttribute("y") ?? "0");
      w = Number.parseFloat(el.getAttribute("width") ?? "0");
      h = Number.parseFloat(el.getAttribute("height") ?? "0");
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 8 || h < 8) return;
    if (w >= width * 0.98 && h >= height * 0.98) return; // background rect
    seen.add(id);
    cells.push({
      id,
      label: el.getAttribute("aria-label") ?? el.getAttribute("data-label") ?? id,
      x,
      y,
      w,
      h,
      ...(i === -1 ? {} : {}),
    });
  });

  return { name, markup: svg.innerHTML, viewBox, cells };
}
