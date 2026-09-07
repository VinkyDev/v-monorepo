import { cn } from "cn";
import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";

const Spinner = ({ className, ...props }: ComponentProps<"svg">) => (
  <Loader2Icon
    data-slot="spinner"
    aria-label="Loading"
    className={cn("size-4 animate-spin", className)}
    {...props}
  />
);

export { Spinner };
