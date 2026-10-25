import { createElement } from "react";
import {
  safeTextTree,
  type SafeTextNode,
} from "@/lib/supplied-practice/rich-text";
function render(nodes: SafeTextNode[]): React.ReactNode {
  return nodes.map((node, index) =>
    typeof node === "string"
      ? node
      : createElement(
          node.tag,
          { ...node.attrs, key: index },
          node.tag === "br" ? undefined : render(node.children),
        ),
  );
}
export default function SuppliedText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_pre]:overflow-x-auto [&_code]:font-mono">
      {render(safeTextTree(text))}
    </div>
  );
}
