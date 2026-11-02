/**
 * Homework schedules for the two classes this app teaches — section and
 * problem numbers only. The problem statements themselves stay in the
 * textbooks; these lists exist so the app can point each assignment at the
 * lessons that teach it and so the tutor knows which problem you're working on.
 *
 * - Math 54, Fall 2026 (instructor: Ko Ohm), as published on the public
 *   course page: https://math.berkeley.edu/~kwohm/Homework54-FA26.html
 * - CE C30 / ME C85, Fall 2026 (Prof. Govindjee): problems from Govindjee,
 *   *Engineering Mechanics of Deformable Solids*; due Fridays at 5:59 pm,
 *   each set covering the previous week's lectures.
 */

/** "lay" = Math 54's linear algebra (covered here), "nagle" = its ODE half (not covered), "govindjee" = CE C30 / ME C85. */
export type HomeworkBook = "lay" | "nagle" | "govindjee";

export interface HomeworkSection {
  /** Key into the course's `sectionLessons`: "1.2" (shown as §1.2), or a label with its own prefix ("§2.4–2.4.1", "ch. 4"). */
  section: string;
  /** Problem numbers; empty for a reading-only section. */
  problems: string;
  note?: string;
  book: HomeworkBook;
}

export interface HomeworkSet {
  id: string;
  /** Assignment number, for classes that number their sets (Math 54). */
  number?: number;
  /** Lectures the set covers, for classes that key homework to lectures (CE C30), e.g. "13–14". */
  lectures?: string;
  due: string; // ISO date
  note?: string;
  sections: HomeworkSection[];
}

export interface HomeworkCourse {
  /** The course in `@/content/course` that teaches this material. */
  courseId: string;
  /** The class, e.g. "Math 54". */
  title: string;
  /** Term and instructor. */
  subtitle: string;
  /** How the homework tutor names the course, e.g. "Linear Algebra (Math 54)". */
  tutorTitle: string;
  /** Short textbook name for section labels: "Lay §1.2". */
  bookLabel: string;
  /** The class's own textbook; sections from any other book (Math 54's ODE half) are listed but not tutored. */
  book: HomeworkBook;
  /** Shown after each due date. */
  dueTime: string;
  /** In due-date order. */
  sets: HomeworkSet[];
  /** Which lessons teach each section (keys are `HomeworkSection.section`); a section missing here isn't covered yet. */
  sectionLessons: Record<string, string[]>;
}

/* ------------------------------------------------------------------ */
/* Math 54 (kept under the original export names)                     */
/* ------------------------------------------------------------------ */

export const homeworkSets: HomeworkSet[] = [
  {
    id: "hw1",
    number: 1,
    due: "2026-09-08",
    sections: [
      { section: "1.1", problems: "1, 8, 9, 13, 17, 21, 25, 26, 27, 32, 34", book: "lay" },
      { section: "1.2", problems: "1, 3, 11, 13, 15 (or 17), 19, 23, 25, 31, 32", book: "lay" },
      { section: "1.3", problems: "6, 7, 10, 13, 17, 19, 22, 24", book: "lay" },
      { section: "1.4", problems: "1, 2, 9, 11, 13, 14, 15, 19, 32, 34", book: "lay" },
    ],
  },
  {
    id: "hw2",
    number: 2,
    due: "2026-09-14",
    sections: [
      { section: "1.5", problems: "1, 6, 11, 15, 18, 24, 27, 28, 30, 38", book: "lay" },
      { section: "1.7", problems: "1, 6, 10, 13, 21, 24, 26, 33, 36, 38", book: "lay" },
      { section: "1.8", problems: "2, 5, 7, 11, 17, 24, 26, 29, 31", book: "lay" },
      { section: "1.9", problems: "2, 6, 13, 15, 19, 21, 23, 25, 32, 33", book: "lay" },
    ],
  },
  {
    id: "hw3",
    number: 3,
    due: "2026-09-21",
    sections: [
      { section: "1.8", problems: "41, 44", book: "lay" },
      { section: "2.1", problems: "1, 3, 7, 9, 11, 12, 15, 17, 22, 35", book: "lay" },
      { section: "2.2", problems: "1, 5, 7, 9, 12, 17, 18, 19, 20, 23, 29, 31, 33, 41", book: "lay" },
      { section: "2.3", problems: "3, 7, 11, 13, 15, 21, 23, 28, 33, 38, 41, 44", book: "lay" },
    ],
  },
  {
    id: "hw4",
    number: 4,
    due: "2026-09-28",
    sections: [
      { section: "3.1", problems: "1, 5, 11, 13, 21", book: "lay" },
      { section: "3.2", problems: "2, 3, 5, 9, 15, 19, 20, 23, 24, 27, 29, 31", book: "lay" },
      { section: "3.3", problems: "3, 5, 9, 11, 21, 27, 29, 30", book: "lay" },
      { section: "4.1", problems: "2, 3, 6, 7, 10, 11, 20, 23, 28, 32", book: "lay" },
    ],
  },
  {
    id: "hw5",
    number: 5,
    due: "2026-10-05",
    sections: [
      { section: "4.2", problems: "1, 5, 9, 13, 15, 17, 24, 25, 31, 32, 36, 38, 40, 43, 46", book: "lay" },
      { section: "4.3", problems: "3, 5, 13, 15, 20, 23, 24, 26, 29, 31, 41, 44", book: "lay" },
    ],
  },
  {
    id: "hw6",
    number: 6,
    due: "2026-10-12",
    sections: [
      { section: "4.4", problems: "1, 3, 7, 13, 15, 17, 19, 25, 36", book: "lay" },
      { section: "4.5", problems: "1, 3, 9, 11, 17, 18, 22, 24, 25, 27, 33, 35, 44, 45", note: "Do all the True/False questions in this section too.", book: "lay" },
      { section: "4.6", problems: "1, 5, 6, 9, 12, 13, 15", book: "lay" },
    ],
  },
  {
    id: "hw7",
    number: 7,
    due: "2026-10-19",
    sections: [
      { section: "5.1", problems: "3, 5, 7, 9, 13, 23, 24, 27, 28, 29, 30, 34", book: "lay" },
      { section: "5.2", problems: "5, 7, 11, 13, 15, 18, 19, 24, 25", book: "lay" },
      { section: "5.3", problems: "1, 3, 7, 13, 19, 22, 23, 24, 26, 30", book: "lay" },
      { section: "5.4", problems: "1, 3, 4, 5, 7, 8, 9, 15, 20, 22, 23, 27", book: "lay" },
    ],
  },
  {
    id: "hw8",
    number: 8,
    due: "2026-10-26",
    sections: [
      { section: "5.5", problems: "3, 5, 10, 13, 15, 24", book: "lay" },
      { section: "6.1", problems: "1, 7, 9, 13, 17, 22, 23, 27, 30, 34", book: "lay" },
      { section: "6.2", problems: "5, 7, 9, 15, 17, 23, 24, 26, 27, 29, 32", book: "lay" },
      { section: "6.3", problems: "3, 7, 11, 15, 17, 22, 28, 30", book: "lay" },
    ],
  },
  {
    id: "hw9",
    number: 9,
    due: "2026-11-02",
    sections: [
      { section: "6.4", problems: "3, 7, 11, 15, 17, 20, 22", book: "lay" },
      { section: "6.5", problems: "3, 5, 11, 13, 17, 19, 22", book: "lay" },
    ],
  },
  {
    id: "hw10",
    number: 10,
    due: "2026-11-10",
    sections: [
      { section: "6.7", problems: "1, 3, 5, 7, 9, 13, 16, 18, 20, 23, 26, 28", book: "lay" },
      { section: "7.1", problems: "4, 6, 11, 18, 22, 23, 24, 25, 28, 30, 32", book: "lay" },
      { section: "7.4", problems: "1, 3, 7, 9, 14", book: "lay" },
      { section: "4.2 (ODE)", problems: "1, 9, 14, 20, 21, 28, 30, 31", note: "Nagle–Saff–Snider §4.2 (differential equations) — not covered by this course yet.", book: "nagle" },
    ],
  },
];

/** Which lessons teach each Lay section. */
export const sectionLessons: Record<string, string[]> = {
  "1.1": ["u1-l1-when-lines-meet", "u1-l2-row-operations", "u1-l5-parameters"],
  "1.2": ["u1-l3-echelon-forms", "u1-l4-reading-solutions", "u1-l5-parameters"],
  "1.3": ["u2-l1-vectors-and-combinations", "u2-l2-span"],
  "1.4": ["u2-l3-matrix-equation"],
  "1.5": ["u2-l4-solution-sets"],
  "1.7": ["u2-l5-linear-independence"],
  "1.8": ["u3-l1-matrices-as-transformations"],
  "1.9": ["u3-l2-standard-matrix", "u3-l3-one-to-one-onto"],
  "2.1": ["u4-l1-matrix-operations"],
  "2.2": ["u4-l2-inverses"],
  "2.3": ["u4-l3-invertible-matrix-theorem"],
  "3.1": ["u5-l1-determinants"],
  "3.2": ["u5-l2-determinant-properties"],
  "3.3": ["u5-l3-cramer-area-volume"],
  "4.1": ["u6-l1-vector-spaces-subspaces"],
  "4.2": ["u6-l2-null-column-space"],
  "4.3": ["u6-l3-bases"],
  "4.4": ["u6-l4-coordinate-systems"],
  "4.5": ["u6-l5-dimension-rank"],
  "4.6": ["u6-l6-change-of-basis"],
  "5.1": ["u7-l1-eigenvectors-eigenvalues"],
  "5.2": ["u7-l2-characteristic-equation"],
  "5.3": ["u7-l3-diagonalization"],
  "5.4": ["u7-l4-eigenvectors-transformations"],
  "5.5": ["u7-l5-complex-eigenvalues"],
  "6.1": ["u8-l1-inner-product-length-orthogonality"],
  "6.2": ["u8-l2-orthogonal-sets"],
  "6.3": ["u8-l3-orthogonal-projections"],
  "6.4": ["u8-l4-gram-schmidt"],
  "6.5": ["u8-l5-least-squares"],
  "6.7": ["u8-l6-inner-product-spaces"],
  "7.1": ["u9-l1-symmetric-matrices"],
  "7.4": ["u9-l2-svd"],
};

/* ------------------------------------------------------------------ */
/* CE C30 / ME C85                                                     */
/* ------------------------------------------------------------------ */

const NOT_COVERED = "Not covered by the course yet.";

const solidMechanicsSets: HomeworkSet[] = [
  {
    id: "lec13-14",
    lectures: "13–14",
    due: "2026-10-02",
    sections: [
      { section: "§2.1–2.3", problems: "2.3, 2.4", book: "govindjee" },
      { section: "§2.4–2.4.1", problems: "2.9, 2.15", book: "govindjee" },
    ],
  },
  {
    id: "lec15-17",
    lectures: "15–17",
    due: "2026-10-09",
    sections: [
      { section: "§2.4.2", problems: "2.11, 2.16, 2.31", book: "govindjee" },
      { section: "§2.5–2.6", problems: "2.33", book: "govindjee" },
      { section: "§3.1", problems: "3.4", book: "govindjee" },
    ],
  },
  {
    id: "lec18-20",
    lectures: "18–20",
    due: "2026-10-16",
    sections: [
      { section: "§3.2", problems: "3.8, 3.10, 3.15", book: "govindjee" },
      { section: "§3.3", problems: "", note: "Reading only — no problems assigned.", book: "govindjee" },
      { section: "ch. 4", problems: "4.1, 4.5, 4.12", book: "govindjee" },
    ],
  },
  {
    id: "lec21-23",
    lectures: "21–23",
    due: "2026-10-23",
    sections: [
      { section: "ch. 5", problems: "5.3, 5.11", book: "govindjee" },
      { section: "§6.1", problems: "6.4", book: "govindjee" },
      { section: "§6.2–6.3", problems: "6.7, 6.10, 6.11", book: "govindjee" },
    ],
  },
  {
    id: "lec24-26",
    lectures: "24–26",
    due: "2026-10-30",
    sections: [
      { section: "§7.1–7.2", problems: "7.2", book: "govindjee" },
      { section: "§7.3–7.4", problems: "7.5, 7.8, 7.13, 7.21, 7.26, 7.28", book: "govindjee" },
      { section: "§7.7", problems: "7.41, 7.43", book: "govindjee" },
    ],
  },
  {
    id: "lec27-29",
    lectures: "27–29",
    due: "2026-11-06",
    sections: [
      { section: "§8.1", problems: "8.2", book: "govindjee" },
      { section: "§8.2", problems: "8.5", book: "govindjee" },
      { section: "§8.3", problems: "8.8, 8.13, 8.15", book: "govindjee" },
    ],
  },
  {
    id: "lec31-33",
    lectures: "31–33",
    due: "2026-11-13",
    sections: [
      { section: "§8.4", problems: "8.19, 8.34", note: NOT_COVERED, book: "govindjee" },
      { section: "§8.5", problems: "8.38", note: NOT_COVERED, book: "govindjee" },
      { section: "§8.6", problems: "8.41, 8.47", note: NOT_COVERED, book: "govindjee" },
    ],
  },
  {
    id: "lec34-36",
    lectures: "34–36",
    due: "2026-11-20",
    sections: [
      { section: "§9.1–9.2.1", problems: "9.1", note: NOT_COVERED, book: "govindjee" },
      { section: "§9.2.2–9.2.3", problems: "9.2, 9.4", note: NOT_COVERED, book: "govindjee" },
      { section: "§9.2.4–9.2.5", problems: "9.6, 9.11", note: NOT_COVERED, book: "govindjee" },
    ],
  },
  {
    id: "lec37-42",
    lectures: "37–42",
    due: "2026-12-04",
    note: "Two weeks of lectures: Thanksgiving week falls in between.",
    sections: [
      { section: "§9.3", problems: "9.15, 9.16a, 9.18", note: NOT_COVERED, book: "govindjee" },
      { section: "§9.4", problems: "9.25, 9.26, 9.28, 9.29", note: NOT_COVERED, book: "govindjee" },
      { section: "§12.1–12.2", problems: "12.1, 12.4, 12.5, 12.12", note: NOT_COVERED, book: "govindjee" },
      { section: "§12.3", problems: "12.14, 12.15", note: NOT_COVERED, book: "govindjee" },
    ],
  },
];

/** Which lessons teach each Govindjee section (§8.4 onward isn't covered yet). */
const solidMechanicsSectionLessons: Record<string, string[]> = {
  "§2.1–2.3": ["sm1-l1-displacement-and-strain", "sm1-l2-stress-and-equilibrium", "sm1-l3-hookes-law"],
  "§2.4–2.4.1": ["sm1-l4-axial-response", "sm1-l5-indeterminate-bars"],
  "§2.4.2": ["sm1-l6-differential-equation"],
  "§2.5–2.6": ["sm1-l7-energy-and-design"],
  "§3.1": ["sm2-l1-average-stress", "sm2-l2-design-with-average-stresses"],
  "§3.2": ["sm2-l3-stress-at-a-point", "sm2-l4-cauchy-and-resultants", "sm2-l5-equilibrium-in-stresses"],
  "§3.3": ["sm2-l6-polar-and-spherical"],
  "ch. 4": ["sm3-l1-normal-and-shear-strain", "sm3-l2-strain-tensor", "sm3-l3-polar-strain-and-counting"],
  "ch. 5": ["sm4-l1-poisson-and-3d-hooke", "sm4-l2-pressure-volume-energy", "sm4-l3-plane-stress-and-plane-strain", "sm4-l4-uniaxial-and-other-coordinates"],
  "§6.1": ["sm5-l1-axial-rod-in-3d"],
  "§6.2–6.3": ["sm5-l2-cylindrical-pressure-vessels", "sm5-l3-spheres-and-design", "sm5-l4-saint-venant"],
  "§7.1–7.2": ["sm6-l1-kinematics", "sm6-l2-equilibrium-and-torque-diagrams"],
  "§7.3–7.4": ["sm6-l3-elastic-response", "sm6-l4-indeterminate-and-ode", "sm6-l5-energy-and-nonlinear"],
  "§7.7": ["sm6-l6-thin-walled-tubes"],
  "§8.1": ["sm7-l1-kinematics-of-bending"],
  "§8.2": ["sm7-l2-equilibrium-shear-moment"],
  "§8.3": ["sm7-l3-elastic-response", "sm7-l4-composite-beams"],
};

/* ------------------------------------------------------------------ */
/* Registry and helpers                                                */
/* ------------------------------------------------------------------ */

/** Every class with a homework schedule, Math 54 first. */
export const homeworkCourses: HomeworkCourse[] = [
  {
    courseId: "linear-algebra",
    title: "Math 54",
    subtitle: "Fall 2026",
    tutorTitle: "Linear Algebra (Math 54)",
    bookLabel: "Lay",
    book: "lay",
    dueTime: "11:59 pm PT",
    sets: homeworkSets,
    sectionLessons,
  },
  {
    courseId: "solid-mechanics",
    title: "CE C30 / ME C85",
    subtitle: "Fall 2026 · Prof. Govindjee",
    tutorTitle: "Solid Mechanics (CE C30 / ME C85)",
    bookLabel: "Govindjee",
    book: "govindjee",
    dueTime: "5:59 pm PT",
    sets: solidMechanicsSets,
    sectionLessons: solidMechanicsSectionLessons,
  },
];

export function getHomeworkCourse(courseId: string | null | undefined): HomeworkCourse | undefined {
  return homeworkCourses.find((c) => c.courseId === courseId);
}

/** "1.2" → "§1.2"; labels that carry their own prefix ("§2.4.2", "ch. 4") pass through. */
export function sectionLabel(section: string): string {
  return /^\d/.test(section) ? `§${section}` : section;
}

/** "Homework 3" for numbered sets, "Lectures 13–14" for sets keyed to lectures. */
export function homeworkTitle(hw: HomeworkSet): string {
  if (hw.number !== undefined) return `Homework ${hw.number}`;
  return hw.lectures ? `Lectures ${hw.lectures}` : "Homework";
}

/** The first set due on or after `today` (an ISO day); undefined once every set is past. */
export function nextDueSet(hc: HomeworkCourse, today: string): HomeworkSet | undefined {
  return hc.sets.find((h) => h.due >= today);
}

/** Which class the homework pages open on: Solid Mechanics when its next set is due no later than Math 54's, otherwise Math 54. */
export function defaultHomeworkCourseId(today: string): string {
  const nextDue = (courseId: string) => {
    const hc = getHomeworkCourse(courseId);
    return (hc && nextDueSet(hc, today)?.due) ?? "9999-12-31";
  };
  return nextDue("solid-mechanics") <= nextDue("linear-algebra") ? "solid-mechanics" : "linear-algebra";
}

/** Lesson ids that teach a section; empty when the course doesn't cover it (yet). */
export function lessonsForSection(section: string, lessons: Record<string, string[]> = sectionLessons): string[] {
  return Object.hasOwn(lessons, section) ? lessons[section] : [];
}

/** Which unit's Level Check drills a section: the prefix of its first lesson id ("u6-l2-…" → "u6", "sm3-l1-…" → "sm3"). */
export function unitForSection(section: string, lessons: Record<string, string[]> = sectionLessons): string | null {
  const first = lessonsForSection(section, lessons)[0];
  return first ? first.split("-")[0] : null;
}

/** Readable stand-in for a lesson id when its title isn't at hand: "sm1-l3-hookes-law" → "hookes law". */
export function prettyLessonId(id: string): string {
  return id.replace(/^[a-z]+\d+-l\d+-/, "").replace(/-/g, " ");
}
