import type { LucideIcon } from 'lucide-react';
import { useRef } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradientFrom,
  gradientTo,
  delay = 0,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient border effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          padding: '2px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMaskComposite: 'xor',
        }}
      />

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}20)` }}
      >
        <Icon
          className="w-7 h-7 transition-all duration-300 group-hover:scale-110"
          style={{ color: gradientFrom }}
        />
      </div>

      {/* Content */}
      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
