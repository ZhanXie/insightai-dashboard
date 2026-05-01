import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DocumentsLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-40"
      titleHeight="h-8"
      showUploadArea={true}
      listItemCount={5}
    />
  );
}