import { cn } from "@/lib/utils";

/** The recognisable "Amazon's Choice" pill. */
export function AmazonChoiceBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold rounded-sm px-2 py-1 bg-[#232f3e] text-white",
      className,
    )}>
      <span className="text-[#ff9900]">Amazon's</span> Choice
    </span>
  );
}
