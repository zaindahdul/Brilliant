import { connection } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { mergeProgress, normalizeProgress } from "@/lib/progress/logic";
import type { ProgressState } from "@/lib/progress/types";

/**
 * Single-user progress persistence: a JSON file under ./data. Writes are
 * atomic (temp file + rename) and merged with what's already on disk, so a
 * stale tab can never clobber newer progress.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "progress.json");

const Body = z.object({ state: z.object({ version: z.literal(1) }).passthrough() });

async function readFile(): Promise<ProgressState | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return null;
  }
}

let writeChain: Promise<void> = Promise.resolve();

async function writeFile(state: ProgressState) {
  // serialise writes so concurrent PUT + beacon can't interleave
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await fs.rename(tmp, FILE);
  });
  await writeChain;
}

export async function GET() {
  await connection();
  const state = await readFile();
  return Response.json({ state }, { headers: { "cache-control": "no-store" } });
}

async function save(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 400 });
  const incoming = normalizeProgress(parsed.data.state);
  if (!incoming) return Response.json({ error: "invalid state" }, { status: 400 });
  const current = await readFile();
  const merged = current ? mergeProgress(current, incoming) : incoming;
  await writeFile(merged);
  return Response.json({ ok: true, updatedAt: merged.updatedAt }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: Request) {
  return save(req);
}

/** sendBeacon can only POST. */
export async function POST(req: Request) {
  return save(req);
}
