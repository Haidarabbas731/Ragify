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
    <div className="relative flex flex-col items-center text-center group">
      {/* Connecting line */}
      {!isLast && (
        <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5">
          <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-indigo-500 opacity-30" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-indigo-500"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(90deg, transparent 0%, black 20%, black 80%, transparent 100%)",
              animation: "shimmer 2s linear infinite",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      )}

      {/* Number badge */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-display font-bold text-3xl pulse-glow transition-transform group-hover:scale-110">
          {number}
        </div>
        {/* Floating icon */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center group-hover:animate-bounce">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

export default StepCard;
