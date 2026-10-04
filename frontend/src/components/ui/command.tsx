import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex size-full flex-col overflow-hidden rounded-2xl bg-card text-card-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-border px-4">
    <Search
      className="size-4 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
    {/* 16px on touch screens so iOS does not zoom in on focus. */}
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "h-12 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-body",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = "CommandInput";

/** Fixed height so the panel never resizes while the results change under the cursor. */
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "custom-scrollbar h-[min(24rem,60dvh)] overflow-y-auto overflow-x-hidden p-2 [scroll-padding-block:8px]",
      className,
    )}
    {...props}
  />
));
CommandList.displayName = "CommandList";

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-overline [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-2 my-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

/** The selected row follows the arrow keys with no transition, on purpose. */
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-3 rounded-lg px-2.5 py-2 text-body outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => (
  <kbd
    className={cn(
      "ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-meta text-muted-foreground",
      className,
    )}
    {...props}
  />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandSeparator,
  CommandItem,
  CommandShortcut,
};
