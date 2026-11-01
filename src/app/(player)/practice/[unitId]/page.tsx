import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allUnitIds, getUnit } from "@/content/course";
import { PracticePlayer } from "@/components/player/PracticePlayer";

export function generateStaticParams() {
  return allUnitIds().map((unitId) => ({ unitId }));
}

export async function generateMetadata(props: PageProps<"/practice/[unitId]">): Promise<Metadata> {
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  return { title: found ? `Level check · ${found.unit.title}` : "Practice" };
}

export default async function PracticePage(props: PageProps<"/practice/[unitId]">) {
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found) notFound();
  const { unit, course } = found;
  const problems = unit.practice.map((step) => ({ key: `practice:${unit.id}:${step.id}`, unitId: unit.id, step: { ...step, id: `practice:${unit.id}:${step.id}` } }));
  return (
    <PracticePlayer
      unit={{ id: unit.id, title: unit.title }}
      course={{ id: course.id, title: course.title }}
      problems={problems}
      generatorIds={unit.generators}
      backHref={`/course/${course.id}#${unit.id}`}
    />
  );
}
