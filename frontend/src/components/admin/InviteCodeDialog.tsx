import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FieldError } from "@/components/auth/FieldError";
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
import type { CreateInviteCodeRequest } from "@/types/api";

const inviteCodeSchema = z.object({
  max_uses: z
    .number({ error: "Enter a number from 1 to 1000" })
    .int("Enter a whole number")
    .min(1, "Enter a number from 1 to 1000")
    .max(1000, "Enter a number from 1 to 1000"),
  expires_at: z.string(),
  description: z.string().trim().max(200, "Use 200 characters or fewer"),
});

type InviteCodeFormValues = z.infer<typeof inviteCodeSchema>;

const DEFAULTS: InviteCodeFormValues = {
  max_uses: 10,
  expires_at: "",
  description: "",
};

interface InviteCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  onSubmit: (request: CreateInviteCodeRequest) => void;
}

/** Form for a new invite code: how many people can use it, when it expires, and a note. */
export function InviteCodeDialog({
  open,
  onOpenChange,
  pending = false,
  onSubmit,
}: InviteCodeDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteCodeFormValues>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const submit = (values: InviteCodeFormValues) =>
    onSubmit({
      max_uses: values.max_uses,
      ...(values.expires_at && {
        expires_at: new Date(values.expires_at).toISOString(),
      }),
      ...(values.description && { description: values.description }),
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New invite code</DialogTitle>
          <DialogDescription>
            People enter this code when they create an account.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-max-uses">Number of uses</Label>
            <Input
              id="invite-max-uses"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              aria-invalid={!!errors.max_uses}
              aria-describedby={
                errors.max_uses ? "invite-uses-error" : undefined
              }
              {...register("max_uses", { valueAsNumber: true })}
            />
            <FieldError
              id="invite-uses-error"
              message={errors.max_uses?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-expires">
              Expires{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="invite-expires"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              {...register("expires_at")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-description">
              Note{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="invite-description"
              autoComplete="off"
              placeholder="Who this code is for"
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? "invite-description-error" : undefined
              }
              {...register("description")}
            />
            <FieldError
              id="invite-description-error"
              message={errors.description?.message}
            />
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
              Create code
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
