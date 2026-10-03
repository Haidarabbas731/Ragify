import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** One short line of context under the number. */
  detail?: ReactNode;
}

/** A single headline number with its label and context line. */
export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-meta text-muted-foreground">{label}</p>
        <p className="mt-1 text-stat tabular-nums text-foreground">{value}</p>
        {detail && (
          <p className="mt-3 text-meta text-muted-foreground">{detail}</p>
        )}
      </CardContent>
    </Card>
  );
}
