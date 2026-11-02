import { courses, getCourseMeta } from "@/content/course";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default function HomePage() {
  return <HomeDashboard courses={courses.map((c) => getCourseMeta(c.id)!)} />;
}
