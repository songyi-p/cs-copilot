import { useEffect } from "react";

type ToastProps = {
  message: string;
  tone?: "success" | "info" | "error";
  duration?: number;
  onClose?: () => void;
};

const toneStyles = {
  success: "border-[#cde8dc] text-[#348264]",
  info: "border-[#d8e0fb] text-[#526ad0]",
  error: "border-[#f0cccc] text-status-escalated",
};

export function Toast({ message, tone = "success", duration = 2500, onClose }: ToastProps) {
  useEffect(() => {
    if (!message || !onClose) return;

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border bg-white px-4 py-3 text-xs font-bold shadow-[0_8px_28px_#23304a24] ${toneStyles[tone]}`}
      role="status"
      aria-live="polite"
    >
      {tone === "success" ? "✓ " : tone === "error" ? "! " : ""}
      {message}
    </div>
  );
}
