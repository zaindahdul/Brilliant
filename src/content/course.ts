/**
 * The course registry. Server-safe (plain data); pages pick out just what a
 * screen needs so lesson text never ships to the client unnecessarily.
 */
import type { Course, CourseMeta, Lesson, LessonMeta, Unit, UnitMeta } from "./types";
import { isQuestion } from "./types";
import { unit1 } from "./linear-algebra/unit1-linear-systems";
import { unit2 } from "./linear-algebra/unit2-vectors";
import { unit3 } from "./linear-algebra/unit3-transformations";
import { unit4 } from "./linear-algebra/unit4-matrix-algebra";
import { unit5 } from "./linear-algebra/unit5-determinants";
import { unit6 } from "./linear-algebra/unit6-vector-spaces";
import { unit7 } from "./linear-algebra/unit7-eigenvalues";
import { unit8 } from "./linear-algebra/unit8-orthogonality";
import { unit9 } from "./linear-algebra/unit9-symmetric-svd";
import { sm1 } from "./solid-mechanics/unit1-axial-bars";
import { sm2 } from "./solid-mechanics/unit2-stress";
import { sm3 } from "./solid-mechanics/unit3-strain";
import { sm4 } from "./solid-mechanics/unit4-constitutive";
import { sm5 } from "./solid-mechanics/unit5-basic-techniques";
import { sm6 } from "./solid-mechanics/unit6-torsion";
import { sm7 } from "./solid-mechanics/unit7-beams";

export const course: Course = {
  id: "linear-algebra",
  title: "Linear Algebra",
  tagline: "Built for Math 54: see it, do it, then prove you can do it alone.",
  description:
    "A problem-first tour of the linear algebra half of Math 54 — linear systems, vectors, transformations, matrix algebra, determinants, vector spaces, eigenvalues, orthogonality and the SVD — following Lay's chapters 1–7 in the order Berkeley teaches them. Every concept starts with something you manipulate, every lesson ends with you doing the work.",
  units: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9],
};

export const solidMechanics: Course = {
  id: "solid-mechanics",
  title: "Solid Mechanics",
  tagline: "Built for CE C30 / ME C85: kinematics, equilibrium, constitution — on every problem.",
  description:
    "A problem-first tour of the deformable-bodies half of Berkeley's Introduction to Solid Mechanics (Govindjee, Engineering Mechanics of Deformable Solids, chapters 2–8): axial bars, stress and strain as tensors, generalized Hooke's law, pressure vessels and Saint-Venant, torsion, and the bending of beams — in the order the lectures cover them. Every lesson starts with something you manipulate and ends with you doing the calculation.",
  units: [sm1, sm2, sm3, sm4, sm5, sm6, sm7],
};

export const courses: Course[] = [course, solidMechanics];

function lessonMeta(l: Lesson): LessonMeta {
  return {
    id: l.id,
    unitId: l.unitId,
    title: l.title,
    summary: l.summary,
    textbook: l.textbook,
    minutes: l.minutes,
    stepCount: l.steps.length,
    questionCount: l.steps.filter(isQuestion).length,
  };
}

function unitMeta(u: Unit): UnitMeta {
  return {
    id: u.id,
    title: u.title,
    subtitle: u.subtitle,
    description: u.description,
    textbook: u.textbook,
    lessons: u.lessons.map(lessonMeta),
    practiceCount: u.practice.length,
  };
}

export function getCourseMeta(courseId = course.id): CourseMeta | null {
  const c = courses.find((x) => x.id === courseId);
  if (!c) return null;
  const units = c.units.map(unitMeta);
  return {
    id: c.id,
    title: c.title,
    tagline: c.tagline,
    description: c.description,
    units,
    lessonCount: units.reduce((n, u) => n + u.lessons.length, 0),
    exerciseCount: units.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.questionCount, 0) + u.practiceCount, 0),
  };
}

export function getUnit(unitId: string): { unit: Unit; course: Course } | null {
  for (const c of courses) {
    const u = c.units.find((x) => x.id === unitId);
    if (u) return { unit: u, course: c };
  }
  return null;
}

export interface LessonLookup {
  lesson: Lesson;
  unit: Unit;
  course: Course;
  prev: Lesson | null;
  next: Lesson | null;
}

export function getLesson(lessonId: string): LessonLookup | null {
  for (const c of courses) {
    const all = c.units.flatMap((u) => u.lessons.map((l) => ({ l, u })));
    const i = all.findIndex((x) => x.l.id === lessonId);
    if (i === -1) continue;
    return { lesson: all[i].l, unit: all[i].u, course: c, prev: all[i - 1]?.l ?? null, next: all[i + 1]?.l ?? null };
  }
  return null;
}

export function allLessonIds(): string[] {
  return courses.flatMap((c) => c.units.flatMap((u) => u.lessons.map((l) => l.id)));
}

export function allUnitIds(): string[] {
  return courses.flatMap((c) => c.units.map((u) => u.id));
}

/** Ordered list of lessons for "what's next" logic. */
export function lessonOrder(courseId = course.id): LessonMeta[] {
  const c = courses.find((x) => x.id === courseId);
  if (!c) return [];
  return c.units.flatMap((u) => u.lessons.map(lessonMeta));
}
