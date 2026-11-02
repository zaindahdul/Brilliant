import type { Metadata } from "next";
import { courses, getCourseMeta } from "@/content/course";
import { HomeworkHub } from "@/components/homework/HomeworkHub";

export const metadata: Metadata = { title: "Homework" };

export default function HomeworkPage() {
  return <HomeworkHub courses={courses.map((c) => getCourseMeta(c.id)!)} />;
}
