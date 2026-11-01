import type { Metadata } from "next";
import { getCourseMeta } from "@/content/course";
import { HomeworkHub } from "@/components/homework/HomeworkHub";

export const metadata: Metadata = { title: "Homework" };

export default function HomeworkPage() {
  return <HomeworkHub course={getCourseMeta()!} />;
}
