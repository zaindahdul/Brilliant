/**
 * Math 54, Fall 2026 homework schedule (instructor: Ko Ohm) — section and
 * problem numbers only, as published on the public course page:
 * https://math.berkeley.edu/~kwohm/Homework54-FA26.html
 *
 * The problem statements themselves stay in the textbook; this list exists so
 * the app can point each assignment at the lessons that teach it and so the
 * tutor knows which problem you're working on.
 */

export interface HomeworkSection {
  section: string;
  problems: string;
  note?: string;
  /** "lay" = linear algebra (covered here), "nagle" = ODE half (not covered). */
  book: "lay" | "nagle";
}

export interface HomeworkSet {
  id: string;
  number: number;
  due: string; // ISO date
  sections: HomeworkSection[];
}

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

/** Which unit's Level Check drills each section. */
export function unitForSection(section: string): string | null {
  const first = sectionLessons[section]?.[0];
  return first ? first.split("-")[0] : null;
}
