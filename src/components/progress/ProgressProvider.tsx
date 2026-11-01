"use client";

import { useEffect, useRef } from "react";
import { useProgressStore } from "@/lib/progress/store";
import { normalizeProgress } from "@/lib/progress/logic";
import type { ProgressState } from "@/lib/progress/types";

const SYNC_DEBOUNCE_MS = 900;

/**
 * Hydrates the store from localStorage, pulls the server copy and merges it,
 * then keeps the server file up to date (debounced, plus a beacon on exit so
 * closing the tab mid-lesson never loses progress).
 */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const timer = useRef<number | null>(null);
  const lastSent = useRef<number>(0);
  const dirty = useRef(false);

  useEffect(() => {
    const store = useProgressStore;
    let cancelled = false;

    const pushNow = async () => {
      const st = store.getState();
      if (!dirty.current) return;
      const snapshot = st.state;
      st._setSync("saving");
      try {
        const res = await fetch("/api/progress", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: snapshot }),
          keepalive: true,
        });
        if (!res.ok) throw new Error(String(res.status));
        lastSent.current = snapshot.updatedAt;
        dirty.current = store.getState().state.updatedAt !== snapshot.updatedAt;
        store.getState()._setSync("saved", Date.now());
        if (dirty.current) scheduleSync();
      } catch {
        store.getState()._setSync("error");
        dirty.current = true;
      }
    };

    const scheduleSync = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void pushNow(), SYNC_DEBOUNCE_MS);
    };

    (async () => {
      try {
        await store.persist.rehydrate();
      } catch {
        /* localStorage unavailable — keep in-memory state */
      }
      store.getState()._setHydrated(true);
      applyTheme(store.getState().state.settings.theme);

      // Pull the server copy and merge.
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { state: unknown };
          const remote = json.state ? normalizeProgress(json.state) : null;
          if (remote && !cancelled) {
            store.getState().mergeIn(remote);
            // Make sure the merged result is written back everywhere.
            dirty.current = true;
            scheduleSync();
          }
          store.getState()._setSync("saved", Date.now());
        } else {
          store.getState()._setSync("offline");
        }
      } catch {
        store.getState()._setSync("offline");
      }
    })();

    const unsub = store.subscribe((cur, prev) => {
      if (cur.state === prev.state) return;
      if (cur.state.settings.theme !== prev.state.settings.theme) applyTheme(cur.state.settings.theme);
      dirty.current = true;
      scheduleSync();
    });

    // Flush on exit. sendBeacon survives tab close; fetch keepalive is the fallback.
    const flush = () => {
      if (!dirty.current) return;
      const snapshot = store.getState().state;
      const body = JSON.stringify({ state: snapshot });
      try {
        if (navigator.sendBeacon) {
          const ok = navigator.sendBeacon("/api/progress", new Blob([body], { type: "application/json" }));
          if (ok) {
            dirty.current = false;
            return;
          }
        }
        void fetch("/api/progress", { method: "PUT", headers: { "content-type": "application/json" }, body, keepalive: true });
        dirty.current = false;
      } catch {
        /* ignore */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return <>{children}</>;
}

export function applyTheme(theme: ProgressState["settings"]["theme"]) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem("nudge-theme");
    else localStorage.setItem("nudge-theme", theme);
  } catch {
    /* ignore */
  }
}
