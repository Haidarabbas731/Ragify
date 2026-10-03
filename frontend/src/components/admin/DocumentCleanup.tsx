import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminUsers,
  useCleanupAllDocuments,
  useCleanupUserDocuments,
} from "@/hooks/useAdmin";

/** Bulk document deletion: one user's documents, or every document in the system. */
export function DocumentCleanup() {
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [allDialogOpen, setAllDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");

  const { data } = useAdminUsers({ limit: 100 });
  const users = data?.users ?? [];
  const cleanupUser = useCleanupUserDocuments();
  const cleanupAll = useCleanupAllDocuments();

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setUserId("");
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Bulk delete
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-body text-muted-foreground">
          Deleting removes documents from the database, file storage and search
          index. This can't be undone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setUserDialogOpen(true)}>
            Delete a user's documents
          </Button>
          <Button variant="destructive" onClick={() => setAllDialogOpen(true)}>
            Delete all documents
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={userDialogOpen}
        onOpenChange={(open) =>
          !open && !cleanupUser.isPending && closeUserDialog()
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete a user's documents</DialogTitle>
            <DialogDescription>
              Every document this user has uploaded is permanently removed.
              Their account stays.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger aria-label="User" className="w-full">
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={cleanupUser.isPending}
              onClick={closeUserDialog}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!userId || cleanupUser.isPending}
              onClick={() =>
                cleanupUser.mutate(userId, { onSuccess: closeUserDialog })
              }
            >
              {cleanupUser.isPending && <Loader2 className="animate-spin" />}
              Delete documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={allDialogOpen}
        onOpenChange={setAllDialogOpen}
        tone="destructive"
        title="Delete every document?"
        description="This removes all documents from every account and resets the search index. Accounts, chats and collections stay."
        confirmLabel="Delete all documents"
        requireText="delete all"
        pending={cleanupAll.isPending}
        onConfirm={() =>
          cleanupAll.mutate(undefined, {
            onSuccess: () => setAllDialogOpen(false),
          })
        }
      />
    </Card>
  );
}
