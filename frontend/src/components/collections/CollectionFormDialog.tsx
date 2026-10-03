import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

const collectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(NAME_MAX, `Use ${NAME_MAX} characters or fewer`),
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Use ${DESCRIPTION_MAX} characters or fewer`),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Values to edit; omit to create a new collection. */
  initialValues?: { name: string; description: string | null };
  pending?: boolean;
  onSubmit: (values: CollectionFormValues) => void;
}

/** Create or edit a collection's name and description. */
export function CollectionFormDialog({
  open,
  onOpenChange,
  initialValues,
  pending = false,
  onSubmit,
}: CollectionFormDialogProps) {
  const editing = initialValues !== undefined;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name ?? "",
        description: initialValues?.description ?? "",
      });
    }
  }, [open, initialValues, reset]);

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit collection" : "New collection"}
          </DialogTitle>
          <DialogDescription>
            Group related documents so you can filter and chat with them
            together.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={
                errors.name ? "collection-name-error" : undefined
              }
              {...register("name")}
            />
            {errors.name && (
              <p
                id="collection-name-error"
                role="alert"
                className="text-meta text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="collection-description"
              rows={3}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "collection-description-error" : undefined
              }
              {...register("description")}
            />
            {errors.description && (
              <p
                id="collection-description-error"
                role="alert"
                className="text-meta text-destructive"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {editing ? "Save changes" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
