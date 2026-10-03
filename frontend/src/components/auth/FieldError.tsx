/** Inline validation message under a field; `id` should match the field's `aria-describedby`. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-meta text-destructive">
      {message}
    </p>
  );
}
