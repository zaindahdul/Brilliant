/**
 * A deliberately small markdown dialect parser (see content/types.ts for the
 * supported syntax). It produces a plain AST that RichText renders.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; c: Inline[] }
  | { t: "italic"; c: Inline[] }
  | { t: "code"; v: string }
  /** `display` is set for `$$…$$` written inside a paragraph (rendered as display math). */
  | { t: "math"; v: string; display?: boolean }
  | { t: "br" };

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "math"; v: string }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; items: Inline[][] }
  | { t: "callout"; c: Inline[] }
  | { t: "h3"; c: Inline[] };

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push({ t: "text", v: buf });
      buf = "";
    }
  };

  while (i < src.length) {
    const ch = src[i];

    // escaped characters
    if (ch === "\\" && i + 1 < src.length && "*`$_".includes(src[i + 1])) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    // display math written inline: $$...$$ (authors do this for aligned systems mid-paragraph)
    if (ch === "$" && src[i + 1] === "$") {
      const end = findClosingDoubleDollar(src, i + 2);
      if (end !== -1) {
        flush();
        out.push({ t: "math", v: src.slice(i + 2, end).trim(), display: true });
        i = end + 2;
        continue;
      }
    }

    // inline math $...$
    if (ch === "$") {
      const end = findClosingDollar(src, i + 1);
      if (end !== -1) {
        flush();
        out.push({ t: "math", v: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // code
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        out.push({ t: "code", v: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // bold
    if (ch === "*" && src[i + 1] === "*") {
      const end = findClosing(src, i + 2, "**");
      if (end !== -1) {
        flush();
        out.push({ t: "bold", c: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // italic (single *, not followed by space)
    if (ch === "*" && src[i + 1] !== " " && src[i + 1] !== "*") {
      const end = findClosing(src, i + 1, "*");
      if (end !== -1 && src[end - 1] !== " ") {
        flush();
        out.push({ t: "italic", c: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    if (ch === "\n") {
      flush();
      out.push({ t: "br" });
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

function findClosingDollar(src: string, from: number): number {
  for (let j = from; j < src.length; j++) {
    if (src[j] === "\\") {
      j += 1;
      continue;
    }
    if (src[j] === "$") return j;
    if (src[j] === "\n" && src[j + 1] === "\n") return -1;
  }
  return -1;
}

function findClosingDoubleDollar(src: string, from: number): number {
  for (let j = from; j < src.length - 1; j++) {
    if (src[j] === "\\") {
      j += 1;
      continue;
    }
    if (src[j] === "$" && src[j + 1] === "$") return j;
  }
  return -1;
}

function findClosing(src: string, from: number, marker: string): number {
  let j = from;
  while (j < src.length) {
    if (src[j] === "$" && src[j + 1] === "$") {
      const end = findClosingDoubleDollar(src, j + 2);
      if (end !== -1) {
        j = end + 2;
        continue;
      }
    }
    if (src[j] === "$") {
      const end = findClosingDollar(src, j + 1);
      if (end !== -1) {
        j = end + 1;
        continue;
      }
    }
    if (src[j] === "`") {
      const end = src.indexOf("`", j + 1);
      if (end !== -1) {
        j = end + 1;
        continue;
      }
    }
    if (src.startsWith(marker, j)) return j;
    j += 1;
  }
  return -1;
}

export function parseBlocks(src: string): Block[] {
  const text = src.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const blocks: Block[] = [];

  // Split into raw blocks on blank lines, but keep $$...$$ spans intact.
  const raw: string[] = [];
  let cur: string[] = [];
  let inMath = false;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("$$") && !inMath) {
      if (cur.length) {
        raw.push(cur.join("\n"));
        cur = [];
      }
      cur.push(line);
      // single-line $$...$$
      if (trimmed.length > 2 && trimmed.endsWith("$$")) {
        raw.push(cur.join("\n"));
        cur = [];
      } else {
        inMath = true;
      }
      continue;
    }
    if (inMath) {
      cur.push(line);
      if (trimmed.endsWith("$$")) {
        raw.push(cur.join("\n"));
        cur = [];
        inMath = false;
      }
      continue;
    }
    if (trimmed === "") {
      if (cur.length) {
        raw.push(cur.join("\n"));
        cur = [];
      }
      continue;
    }
    cur.push(line);
  }
  if (cur.length) raw.push(cur.join("\n"));

  for (const chunk of raw) {
    const lines = chunk.split("\n");
    const first = lines[0].trim();

    if (first.startsWith("$$")) {
      const inner = chunk.trim().replace(/^\$\$/, "").replace(/\$\$$/, "").trim();
      blocks.push({ t: "math", v: inner });
      continue;
    }
    if (lines.every((l) => /^\s*-\s+/.test(l))) {
      blocks.push({ t: "ul", items: lines.map((l) => parseInline(l.replace(/^\s*-\s+/, ""))) });
      continue;
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      blocks.push({ t: "ol", items: lines.map((l) => parseInline(l.replace(/^\s*\d+[.)]\s+/, ""))) });
      continue;
    }
    if (lines.every((l) => /^\s*>\s?/.test(l))) {
      blocks.push({ t: "callout", c: parseInline(lines.map((l) => l.replace(/^\s*>\s?/, "")).join("\n")) });
      continue;
    }
    if (/^###\s+/.test(first) && lines.length === 1) {
      blocks.push({ t: "h3", c: parseInline(first.replace(/^###\s+/, "")) });
      continue;
    }
    blocks.push({ t: "p", c: parseInline(lines.join("\n")) });
  }
  return blocks;
}

/** Strip formatting for places that need plain text (e.g. aria labels, tutor context). */
export function toPlainText(src: string): string {
  return src
    .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-]\s+/gm, "• ")
    .trim();
}
