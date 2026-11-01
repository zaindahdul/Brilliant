import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses, getCourseMeta } from "@/content/course";
import { CourseMap } from "@/components/course/CourseMap";

export function generateStaticParams() {
  return courses.map((c) => ({ courseId: c.id }));
}

export async function generateMetadata(props: PageProps<"/course/[courseId]">): Promise<Metadata> {
  const { courseId } = await props.params;
  const meta = getCourseMeta(courseId);
  return { title: meta ? meta.title : "Course" };
}

async function CourseLoader({ params }: { params: PageProps<"/course/[courseId]">["params"] }) {
  const { courseId } = await params;
  const meta = getCourseMeta(courseId);
  if (!meta) notFound();
  return <CourseMap course={meta} />;
}

export default function CoursePage(props: PageProps<"/course/[courseId]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 text-muted">Loading course…</div>}>
      <CourseLoader params={props.params} />
    </Suspense>
  );
}
