type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "취소",
  confirmLabel = "확인",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-[#17202d66] px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="w-full max-w-90 rounded-xl bg-white p-6 shadow-[0_20px_60px_#17202d33]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
      >
        <h2 id="confirm-dialog-title" className="mb-2 text-base font-extrabold">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mb-6 text-xs leading-[1.6] text-muted">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2.5">
          <button
            className="rounded-md border border-[#dbe1e9] bg-white px-4 py-2.5 text-xs font-bold text-[#536173]"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            className="rounded-md border border-action-primary bg-action-primary px-4 py-2.5 text-xs font-bold text-white"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
