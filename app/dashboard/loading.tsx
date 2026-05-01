import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-48"
      titleHeight="h-8"
      cardCount={4}
      cardColumns={4}
    />
  );
}