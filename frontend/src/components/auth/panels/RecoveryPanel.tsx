import { Clock, FolderLock, Mail } from "lucide-react";

const POINTS = [
  { icon: Mail, text: "We email you a link to choose a new password." },
  { icon: Clock, text: "The link works for 15 minutes." },
  {
    icon: FolderLock,
    text: "Your documents and chats stay exactly as they are.",
  },
];

/** Beside the forgot and reset password forms: calm and plain, nothing to watch. */
export function RecoveryPanel() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-display text-foreground">
          Locked out? It happens.
        </h2>
        <p className="text-body text-muted-foreground">
          Getting back in takes a minute.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {POINTS.map((point) => (
          <li key={point.text} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <point.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-body text-muted-foreground">
              {point.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
