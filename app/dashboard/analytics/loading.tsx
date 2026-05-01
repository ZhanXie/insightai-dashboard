import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AnalyticsLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-32"
      titleHeight="h-8"
      chartCount={3}
      chartColumns={2}
    />
  );
}