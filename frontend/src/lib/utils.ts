import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows our custom text sizes (`text-title`, `text-body`, ...). Without this it
 * reads them as text colours and drops one of two classes such as `text-title text-foreground`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "title",
            "section",
            "body",
            "meta",
            "overline",
            "stat",
            "display",
            "brand",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
