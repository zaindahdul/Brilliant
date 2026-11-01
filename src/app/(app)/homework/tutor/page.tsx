import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeworkTutor } from "@/components/homework/HomeworkTutor";

export const metadata: Metadata = { title: "Homework tutor" };

export default function HomeworkTutorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 text-muted">Loading…</div>}>
      <HomeworkTutor />
    </Suspense>
  );
}
