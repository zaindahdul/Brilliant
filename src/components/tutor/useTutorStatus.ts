"use client";

import { useEffect, useState } from "react";

export interface TutorStatus {
  configured: boolean;
  provider?: string;
  model?: string;
  help?: string;
}

let statusCache: TutorStatus | null = null;

/** Whether the AI tutor has a key configured (asked once per page load). */
export function useTutorStatus(): TutorStatus | null {
  const [status, setStatus] = useState<TutorStatus | null>(statusCache);
  useEffect(() => {
    if (statusCache) return;
    fetch("/api/tutor/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: TutorStatus) => {
        statusCache = s;
        setStatus(s);
      })
      .catch(() => setStatus({ configured: false, help: "Could not reach the tutor API." }));
  }, []);
  return status;
}
