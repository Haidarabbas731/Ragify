import { AlertCircle } from "lucide-react";

/** Error banner for a failed form submission. Renders nothing without a message. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="step-in flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="text-body">{message}</p>
    </div>
  );
}
