import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export const OTP_LENGTH = 6;

/** How long the six digits of a paste are staggered, per slot. */
const PASTE_STAGGER_MS = 30;

export type OtpStatus = "idle" | "verifying" | "success" | "error";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once when the sixth digit is entered, with the full code. */
  onComplete: (code: string) => void;
  status: OtpStatus;
  /** The code is locked after too many wrong tries; the boxes stop taking input. */
  locked?: boolean;
  /** Change this number to put the cursor back in the field (after a wrong code, say). */
  focusToken?: number;
  /** Id of the element that explains an error, for screen readers. */
  describedBy?: string;
}

/**
 * Six keycap-style boxes over one real input (input-otp), so paste, autofill, password
 * managers and the number keypad all behave. The boxes are drawn here: the active key sits
 * pressed in, a typed digit drops into place, and a paste lands digit by digit.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  status,
  locked = false,
  focusToken = 0,
  describedBy,
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // The slots a change filled and where it started, so a paste can be staggered.
  const batch = useRef({ from: 0, added: 0 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: `focusToken` is the trigger
  useEffect(() => {
    inputRef.current?.focus();
  }, [focusToken]);

  const handleChange = (next: string) => {
    batch.current = {
      from: value.length,
      added: Math.max(0, next.length - value.length),
    };
    onChange(next);
  };

  const delayFor = (index: number) => {
    const { from, added } = batch.current;
    if (added < 2 || index < from || index >= from + added) return 0;
    return (index - from) * PASTE_STAGGER_MS;
  };

  return (
    // The shake replays by itself: a wrong code always goes error, then back to idle, before the
    // next attempt, so the class comes off and on again. (A changing `key` would rebuild the real
    // input and lose autofill.)
    <div className={cn(status === "error" && "shake-x")}>
      <OTPInput
        ref={inputRef}
        maxLength={OTP_LENGTH}
        value={value}
        onChange={handleChange}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        // "482 913" or "482-913" pasted from the email is still six digits
        pasteTransformer={(pasted) => pasted.replace(/\D/g, "")}
        // Read-only keeps focus while the code is checked; success locks it
        readOnly={status === "verifying"}
        disabled={status === "success" || locked}
        aria-label="6-digit verification code"
        aria-describedby={describedBy}
        aria-invalid={status === "error"}
        containerClassName="flex items-center justify-center"
        render={({ slots }) => (
          <div className="flex gap-2 sm:gap-3" aria-hidden="true">
            {slots.map((slot, index) => (
              <Keycap
                // biome-ignore lint/suspicious/noArrayIndexKey: the six slots never reorder
                key={index}
                {...slot}
                status={status}
                locked={locked}
                delay={delayFor(index)}
              />
            ))}
          </div>
        )}
      />
    </div>
  );
}

function Keycap({
  char,
  isActive,
  hasFakeCaret,
  status,
  locked,
  delay,
}: SlotProps & { status: OtpStatus; locked: boolean; delay: number }) {
  return (
    <div
      data-active={isActive}
      className={cn(
        "keycap relative flex h-14 w-11 items-center justify-center rounded-xl border bg-card text-stat tabular-nums sm:h-16 sm:w-12",
        status === "success"
          ? "border-success/60 text-success"
          : status === "error"
            ? "border-destructive/60 text-destructive"
            : cn(
                "text-foreground",
                isActive
                  ? "border-foreground/40 ring-2 ring-ring/25"
                  : "border-border",
              ),
        (status === "verifying" || locked) && "opacity-70",
      )}
    >
      {char && (
        <span
          key={char}
          className="keycap-glyph"
          style={{ "--keycap-delay": `${delay}ms` } as React.CSSProperties}
        >
          {char}
        </span>
      )}
      {hasFakeCaret && (
        <span className="keycap-caret absolute h-6 w-px bg-foreground" />
      )}
    </div>
  );
}
