import type { LucideIcon } from "lucide-react";

interface StepCardProps {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  isLast?: boolean;
}

export function StepCard({
  number,
  icon: Icon,
  title,
  description,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="relative flex flex-col">
      {/* Connector line between cards */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-8 z-0"
          style={{
            left: "calc(100% - 12px)",
            width: "24px",
            height: "1px",
            background: "rgba(119,52,231,0.20)",
          }}
        />
      )}

      {/* Card body */}
      <div
        className="relative z-10 p-6 rounded-2xl h-full flex flex-col gap-4"
        style={{
          background: "var(--card)",
          border: "1px solid rgba(119, 52, 231, 0.12)",
        }}
      >
        {/* Top: decorative number + icon */}
        <div className="flex items-center justify-between">
          <span
            className="text-5xl font-bold font-mono leading-none select-none"
            style={{ color: "rgba(119, 52, 231, 0.40)" }}
          >
            {number}
          </span>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(119, 52, 231, 0.10)" }}
          >
            <Icon className="w-5 h-5" style={{ color: "#7734e7" }} />
          </div>
        </div>

        {/* Text */}
        <div>
          <h3
            className="text-[15px] font-bold mb-1.5"
            style={{ color: "var(--card-foreground)" }}
          >
            {title}
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StepCard;
