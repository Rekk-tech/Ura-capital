import React, { useEffect, useRef } from "react";
import { CalendarX, Loader2, X } from "lucide-react";

interface CancelSubscriptionDialogProps {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  open,
  pending,
  onCancel,
  onConfirm,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;
      const first = cancelButtonRef.current;
      const last = confirmButtonRef.current;
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="subscription-dialog-backdrop" data-testid="cancel-dialog-backdrop">
      <section
        className="subscription-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <div className="subscription-dialog-heading">
          <div className="subscription-dialog-icon" aria-hidden="true">
            <CalendarX size={22} />
          </div>
          <div>
            <h2 id="cancel-dialog-title">Schedule cancellation?</h2>
            <p id="cancel-dialog-description">
              Your current access remains controlled by the server through the displayed period end.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="subscription-dialog-close"
          aria-label="Close cancellation dialog"
          onClick={onCancel}
          disabled={pending}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="subscription-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={pending}
          >
            Keep subscription
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className="btn subscription-cancel-confirm"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="subscription-spin" size={18} aria-hidden="true" />
                Confirming
              </>
            ) : (
              "Confirm cancellation"
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
