import { getCourseMeta } from "@/content/course";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default function HomePage() {
  const course = getCourseMeta()!;
  return <HomeDashboard course={course} />;
}
