import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/lib";

const variantStyle = {
  primary:
    "border-action-primary bg-action-primary text-white disabled:border-[#aab3c5] disabled:bg-[#aab3c5]",
  secondary: "border-[#dbe1e9] bg-white text-[#536173]",
  accent: "border-[#d6cdf6] bg-[#fbfaff] text-[#6250bb]",
  ghost: "border-line bg-white text-[#778398]",
};

const sizeStyle = {
  sm: "px-2.5 py-2 text-xs",
  md: "px-3.75 py-2.5 text-xs",
  icon: "size-7.5 p-0",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyle;
  size?: keyof typeof sizeStyle;
  trailingIcon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  trailingIcon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md border font-bold disabled:cursor-not-allowed disabled:opacity-70",
        variantStyle[variant],
        sizeStyle[size],
        className
      )}
      type={type}
      {...props}
    >
      {children}
      {trailingIcon && <span className="ml-2 text-base leading-none">{trailingIcon}</span>}
    </button>
  );
}
