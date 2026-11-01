import type { Metadata } from "next";
import { ReviewHub } from "@/components/review/ReviewHub";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return <ReviewHub />;
}
