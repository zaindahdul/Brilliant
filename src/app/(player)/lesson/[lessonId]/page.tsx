import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allLessonIds, getLesson } from "@/content/course";
import { LessonPlayer } from "@/components/player/LessonPlayer";

export function generateStaticParams() {
  return allLessonIds().map((lessonId) => ({ lessonId }));
}

export async function generateMetadata(props: PageProps<"/lesson/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await props.params;
  const found = getLesson(lessonId);
  return { title: found ? found.lesson.title : "Lesson" };
}

async function LessonLoader({ params }: { params: PageProps<"/lesson/[lessonId]">["params"] }) {
  const { lessonId } = await params;
  const found = getLesson(lessonId);
  if (!found) notFound();
  const { lesson, unit, course, next } = found;
  return <LessonPlayer lesson={lesson} unit={{ id: unit.id, title: unit.title }} course={{ id: course.id, title: course.title }} next={next ? { id: next.id, title: next.title } : null} />;
}

export default function LessonPage(props: PageProps<"/lesson/[lessonId]">) {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-muted">Loading lesson…</div>}>
      <LessonLoader params={props.params} />
    </Suspense>
  );
}
