import type { HTMLAttributes } from "react";
import { cn } from "@/utils/lib";

const toneStyle = {
  neutral: "bg-[#edf1f5] text-[#738093]",
  open: "bg-status-open-bg text-status-open",
  review: "bg-status-review-bg text-status-review",
  escalated: "bg-status-escalated-bg text-status-escalated",
  resolved: "bg-status-resolved-bg text-status-resolved",
  success: "bg-[#e8f7f0] text-[#3c8a6a]",
  warning: "bg-[#fff2df] text-[#a66c23]",
  ai: "bg-[#f0edff] text-[#7968da]",
};

const sizeStyle = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-1.75 py-0.75 text-[10px]",
};

export type BadgeTone = keyof typeof toneStyle;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: keyof typeof sizeStyle;
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-[3px] font-bold",
        toneStyle[tone],
        sizeStyle[size],
        className
      )}
      {...props}
    />
  );
}
