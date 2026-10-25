// A small allowlist parser: supplied scripts, event handlers, styles and URLs
// are never executed or inserted as HTML. Raw originals remain in the dataset.
export type SafeTextNode =
  | string
  | { tag: string; attrs: Record<string, string>; children: SafeTextNode[] };
const tags = new Set([
  "br",
  "b",
  "strong",
  "i",
  "em",
  "sub",
  "sup",
  "code",
  "pre",
  "p",
  "div",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "svg",
  "g",
  "path",
  "line",
  "rect",
  "circle",
  "ellipse",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "marker",
  "pattern",
]);
const attrs = new Set([
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "fill",
  "stroke",
  "strokeWidth",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "textAnchor",
  "dominantBaseline",
  "transform",
  "opacity",
  "colSpan",
  "rowSpan",
  "id",
  "markerEnd",
  "markerStart",
  "markerWidth",
  "markerHeight",
  "refX",
  "refY",
  "orient",
  "patternUnits",
  "strokeDasharray",
  "fillOpacity",
]);
const names: Record<string, string> = {
  viewbox: "viewBox",
  "stroke-width": "strokeWidth",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
  "text-anchor": "textAnchor",
  "dominant-baseline": "dominantBaseline",
  colspan: "colSpan",
  rowspan: "rowSpan",
  "marker-end": "markerEnd",
  "marker-start": "markerStart",
  "stroke-dasharray": "strokeDasharray",
  "fill-opacity": "fillOpacity",
};
function safeAttribute(value: string) {
  return (
    !/[<>]|javascript:|data:|https?:/i.test(value) &&
    (!/url\s*\(/i.test(value) || /^url\(#[A-Za-z][\w:.-]*\)$/.test(value))
  );
}
function decode(text: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    times: "×",
    minus: "−",
    le: "≤",
    ge: "≥",
    pi: "π",
    alpha: "α",
    beta: "β",
    theta: "θ",
    Delta: "Δ",
    mu: "μ",
    deg: "°",
    rarr: "→",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (full, key: string) => {
    if (key.startsWith("#")) {
      const n =
        key[1].toLowerCase() === "x"
          ? parseInt(key.slice(2), 16)
          : Number(key.slice(1));
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : full;
    }
    return entities[key] ?? full;
  });
}
export function safeTextTree(source: string): SafeTextNode[] {
  const root: { children: SafeTextNode[] } = { children: [] },
    stack: (typeof root & { tag?: string })[] = [root];
  for (const token of source.match(/<\/?[a-zA-Z][^>]*>|[^<]+|</g) || []) {
    const match = token.match(/^<(\/)?([\w-]+)([^>]*)>$/);
    const tag = match?.[2].toLowerCase();
    if (!match || !tag || !tags.has(tag)) {
      stack[stack.length - 1].children.push(decode(token));
      continue;
    }
    if (match[1]) {
      if (stack.length > 1 && stack[stack.length - 1].tag === tag) stack.pop();
      continue;
    }
    const node: {
      tag: string;
      attrs: Record<string, string>;
      children: SafeTextNode[];
    } = { tag, attrs: {}, children: [] };
    for (const m of match[3].matchAll(
      /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g,
    )) {
      const name = names[m[1].toLowerCase()] || m[1];
      const value = m[2] ?? m[3] ?? m[4];
      if (attrs.has(name) && safeAttribute(value))
        node.attrs[name] = decode(value);
    }
    stack[stack.length - 1].children.push(node);
    if (tag !== "br" && !token.endsWith("/>")) stack.push(node);
  }
  function normalize(nodes: SafeTextNode[]) {
    for (const node of nodes) {
      if (typeof node === "string") continue;
      normalize(node.children);
      if (node.tag !== "table") continue;
      const children: SafeTextNode[] = [];
      for (const child of node.children) {
        if (typeof child !== "string" && child.tag === "tr") {
          const last = children[children.length - 1];
          if (last && typeof last !== "string" && last.tag === "tbody")
            last.children.push(child);
          else children.push({ tag: "tbody", attrs: {}, children: [child] });
        } else children.push(child);
      }
      node.children = children;
    }
  }
  normalize(root.children);
  return root.children;
}
