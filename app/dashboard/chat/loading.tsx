import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ChatLoading() {
  return (
    <LoadingSkeleton
      titleWidth="w-32"
      titleHeight="h-8"
      listItemCount={4}
      cardCount={0}
      chartCount={0}
      showSimpleList={true}
      showButton={true}
    />
  );
}