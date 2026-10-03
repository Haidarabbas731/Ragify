import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { FileIcon } from "@/components/documents/FileIcon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatDate } from "@/lib/format";
import type { AdminDocument } from "@/types/api";

interface AdminDocumentsTableProps {
  documents: AdminDocument[];
  onView: (document: AdminDocument) => void;
  onDelete: (document: AdminDocument) => void;
}

/** Every user's documents with owner, status and a row menu. */
export function AdminDocumentsTable({
  documents,
  onView,
  onDelete,
}: AdminDocumentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Document</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.document_id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <FileIcon type={doc.file_type} className="size-8" />
                <span
                  className="max-w-72 truncate font-medium"
                  title={doc.filename}
                >
                  {doc.filename}
                </span>
              </div>
            </TableCell>
            <TableCell
              className="max-w-48 truncate text-muted-foreground"
              title={doc.user_email}
            >
              {doc.user_email}
            </TableCell>
            <TableCell>
              <StatusBadge status={doc.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
              {formatBytes(doc.size_bytes)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(doc.uploaded_at)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${doc.filename}`}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onView(doc)}>
                    <Eye /> View details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onDelete(doc)}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
