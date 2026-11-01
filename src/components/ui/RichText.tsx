import katex from "katex";
import { parseBlocks, type Block, type Inline } from "@/lib/markdown";
import { cn } from "@/lib/cn";

function renderMath(src: string, display: boolean) {
  return katex.renderToString(src, {
    throwOnError: false,
    displayMode: display,
    strict: "ignore",
    trust: false,
    output: "htmlAndMathml",
  });
}

export function Math({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderMath(tex, display) }} />;
}

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return <span key={i}>{n.v}</span>;
          case "bold":
            return (
              <strong key={i} className="font-semibold">
                <Inlines nodes={n.c} />
              </strong>
            );
          case "italic":
            return (
              <em key={i}>
                <Inlines nodes={n.c} />
              </em>
            );
          case "code":
            return <code key={i}>{n.v}</code>;
          case "math":
            return <Math key={i} tex={n.v} />;
          case "br":
            return <br key={i} />;
        }
      })}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case "p":
      return (
        <p>
          <Inlines nodes={block.c} />
        </p>
      );
    case "math":
      return <Math tex={block.v} display />;
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines nodes={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines nodes={item} />
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className="callout">
          <Inlines nodes={block.c} />
        </div>
      );
    case "h3":
      return (
        <h3 className="font-serif">
          <Inlines nodes={block.c} />
        </h3>
      );
  }
}

/**
 * Renders the content dialect (markdown-lite + KaTeX). Pure and synchronous,
 * so it works in both server and client components.
 */
export function RichText({ text, className, inline = false }: { text: string; className?: string; inline?: boolean }) {
  if (inline) {
    return (
      <span className={cn("rich", className)}>
        <Inlines nodes={parseBlocks(text).flatMap((b) => (b.t === "p" ? b.c : b.t === "math" ? [{ t: "math", v: b.v } as Inline] : []))} />
      </span>
    );
  }
  const blocks = parseBlocks(text);
  return (
    <div className={cn("rich leading-relaxed", className)}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}
