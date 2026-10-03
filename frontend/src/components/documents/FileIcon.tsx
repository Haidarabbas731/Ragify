import { File, FileText, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

const FILE_STYLES: Record<string, string> = {
  pdf: "bg-destructive/10 text-destructive",
  docx: "bg-info/10 text-info",
  md: "bg-primary/10 text-primary",
  txt: "bg-muted text-muted-foreground",
};

interface FileIconProps {
  /** File extension or type, e.g. `pdf`. */
  type: string;
  className?: string;
}

/** Tinted icon tile for a document's file type. */
export function FileIcon({ type, className }: FileIconProps) {
  const key = type.toLowerCase();
  const Icon =
    key === "docx" ? FileType : key === "pdf" || key === "md" ? FileText : File;
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5",
        FILE_STYLES[key] ?? FILE_STYLES.txt,
        className,
      )}
    >
      <Icon />
    </div>
  );
}
