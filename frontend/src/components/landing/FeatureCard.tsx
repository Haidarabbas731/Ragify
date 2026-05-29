import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="group p-7 rounded-2xl bg-[#fffeff] dark:bg-[#160f2a] border border-[rgba(1,50,252,0.12)] dark:border-[rgba(119,52,231,0.15)] hover:border-[rgba(119,52,231,0.35)] dark:hover:border-[rgba(119,52,231,0.40)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(119,52,231,0.08)]">
      <div className="w-11 h-11 rounded-xl bg-[rgba(119,52,231,0.10)] dark:bg-[rgba(119,52,231,0.15)] flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-[#7734e7] dark:text-[#cd79f5]" />
      </div>
      <h3 className="text-[17px] font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
