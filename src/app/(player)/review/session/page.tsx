import { Suspense } from "react";
import type { Metadata } from "next";
import { ReviewSession } from "@/components/review/ReviewSession";

export const metadata: Metadata = { title: "Review session" };

export default function ReviewSessionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-muted">Loading review…</div>}>
      <ReviewSession />
    </Suspense>
  );
}
