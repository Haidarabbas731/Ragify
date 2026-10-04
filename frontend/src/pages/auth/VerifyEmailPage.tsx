import { CircleCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput, type OtpStatus } from "@/components/auth/OtpInput";
import { VerifyPanel } from "@/components/auth/panels/VerifyPanel";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import api from "@/lib/api";
import { getApiErrorDetail, getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
import type { TokenResponse } from "@/types/auth";

/** How long the success state stays before the app opens: long enough to read as "done". */
const SUCCESS_BEAT_MS = 650;
/** How long the wrong-code shake plays before the boxes clear. */
const ERROR_BEAT_MS = 450;
/** The server's wait between two emails to one address. */
const RESEND_WAIT_SECONDS = 60;

/** "3 tries left", "1 try left". */
function triesLeft(count: number): string {
  return `${count} ${count === 1 ? "try" : "tries"} left`;
}

/** The screen after sign-up, or after signing in to an account that was never verified. */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  if (!email) return <Navigate to="/register" replace />;
  return <VerifyEmail email={email} />;
}

function VerifyEmail({ email }: { email: string }) {
  const navigate = useNavigate();
  const loginWithTokens = useAuthStore((state) => state.loginWithTokens);
  const { remaining, restart } = useResendCountdown(RESEND_WAIT_SECONDS);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    },
    [],
  );

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const handleChange = (next: string) => {
    if (status === "verifying" || status === "success") return;
    setCode(next);
    // Typing again clears a message about the previous code
    if (message && !locked) setMessage(null);
  };

  const verify = async (entered: string) => {
    setStatus("verifying");
    setMessage(null);
    try {
      const { data } = await api.post<TokenResponse>("/auth/verify-email", {
        email,
        code: entered,
      });
      setStatus("success");
      later(SUCCESS_BEAT_MS, () => {
        loginWithTokens(data);
        navigate("/dashboard", { replace: true });
      });
    } catch (error: unknown) {
      const detail = getApiErrorDetail(error);
      if (detail?.code === "already_verified") {
        toast.success("This email is already verified. Sign in.");
        navigate("/login", { replace: true });
        return;
      }

      const wrong = detail?.code === "invalid_code";
      setMessage(
        wrong
          ? `That code isn't right. ${triesLeft(detail?.attempts_left ?? 0)}.`
          : getApiErrorMessage(
              error,
              "We couldn't check that code. Try again.",
            ),
      );
      if (detail?.code === "too_many_attempts") setLocked(true);

      // Show the wrong digits shaking, then clear the boxes for the next try
      setStatus("error");
      later(ERROR_BEAT_MS, () => {
        setCode("");
        setStatus("idle");
        setFocusToken((n) => n + 1);
      });
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-code", { email });
      restart(RESEND_WAIT_SECONDS);
      setCode("");
      setLocked(false);
      setMessage(null);
      setStatus("idle");
      setFocusToken((n) => n + 1);
      toast.success("New code sent");
    } catch (error: unknown) {
      const detail = getApiErrorDetail(error);
      if (detail?.code === "resend_too_soon" && detail.retry_after) {
        restart(detail.retry_after);
      }
      toast.error(
        getApiErrorMessage(error, "We couldn't send a new code. Try again."),
      );
    } finally {
      setResending(false);
    }
  };

  const success = status === "success";

  return (
    <AuthShell
      panel={<VerifyPanel />}
      title="Check your email"
      description={
        <>
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-foreground break-words">
            {email}
          </span>
          .
        </>
      }
      footer={
        <>
          Wrong address?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline underline-offset-4"
          >
            Start again
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OtpInput
          value={code}
          onChange={handleChange}
          onComplete={verify}
          status={status}
          locked={locked}
          focusToken={focusToken}
          describedBy="otp-message"
        />

        {/* Fixed height, so a message appearing never moves what is below it */}
        <div
          id="otp-message"
          aria-live="polite"
          className="flex min-h-10 items-start justify-center text-center text-meta"
        >
          {success ? (
            <p className="fade-in-soft flex items-center gap-2 text-success">
              <CircleCheck className="size-4" aria-hidden="true" />
              Email verified. Opening Ragify…
            </p>
          ) : status === "verifying" ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Checking your code…
            </p>
          ) : message ? (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          ) : null}
        </div>

        <p className="text-center text-body text-muted-foreground">
          {remaining > 0 ? (
            <>
              Send a new code in{" "}
              <span className="tabular-nums text-foreground">{remaining}</span>{" "}
              seconds.
            </>
          ) : (
            <>
              Didn't get it?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={resending || success}
                className="font-medium text-primary underline underline-offset-4 disabled:opacity-60"
              >
                {resending ? "Sending…" : "Send a new code"}
              </button>
            </>
          )}
        </p>
      </div>
    </AuthShell>
  );
}
