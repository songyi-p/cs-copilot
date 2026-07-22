import { useId, type ReactNode } from "react";
import { cn } from "@/utils/lib";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-[#17202d66] px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={cn(
          "w-full max-w-100 rounded-xl bg-white p-6 shadow-[0_20px_60px_#17202d33]",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <h2 id={titleId} className="mb-2 text-base font-extrabold">
          {title}
        </h2>
        {description && (
          <p
            id={descId}
            className={cn(
              "text-xs leading-[1.6] text-muted",
              children ? "mb-5" : "mb-6"
            )}
          >
            {description}
          </p>
        )}
        {children}
        {footer && <div className="flex justify-end gap-2.5">{footer}</div>}
      </section>
    </div>
  );
}
