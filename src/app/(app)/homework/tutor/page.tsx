import { Suspense } from "react";
import type { Metadata } from "next";
import { courses, lessonOrder } from "@/content/course";
import { HomeworkTutor } from "@/components/homework/HomeworkTutor";

export const metadata: Metadata = { title: "Homework tutor" };

/** Lesson id → title for every course, so the tutor can label its lesson links. */
function allLessonTitles(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of courses) for (const l of lessonOrder(c.id)) out[l.id] = l.title;
  return out;
}

export default function HomeworkTutorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-8 text-muted">Loading…</div>}>
      <HomeworkTutor lessonTitles={allLessonTitles()} />
    </Suspense>
  );
}
