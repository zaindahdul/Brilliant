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

export default async function CoursePage(props: PageProps<"/course/[courseId]">) {
  const { courseId } = await props.params;
  const meta = getCourseMeta(courseId);
  if (!meta) notFound();
  return <CourseMap course={meta} />;
}
