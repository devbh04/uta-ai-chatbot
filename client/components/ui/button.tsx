import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm":
              variant === "default",
            "bg-red-600 text-white hover:bg-red-700 shadow-sm":
              variant === "destructive",
            "border border-input bg-transparent hover:bg-secondary hover:text-secondary-foreground":
              variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-secondary hover:text-secondary-foreground bg-transparent":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto font-normal":
              variant === "link",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
