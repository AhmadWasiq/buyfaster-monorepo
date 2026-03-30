import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    // For gradient variant
    if (variant === "gradient") {
      return (
        <button
          className={cn(
            "btn-gradient relative inline-flex items-center justify-center gap-2 font-semibold text-white transition-all duration-150 ease-in-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px] active:scale-[0.99]",
            "rounded-brand-xl shadow-brand-strong overflow-hidden bg-gradient-brand",
            "focus-visible:ring-4 focus-visible:ring-cyan-500/45 focus-visible:ring-offset-4 focus-visible:ring-offset-white/25",
            {
              "px-6 py-3.5": size === "default",
              "px-5 py-2.5 text-sm": size === "sm",
              "px-8 py-4 text-lg": size === "lg",
              "h-10 w-10": size === "icon",
            },
            className
          )}
          ref={ref}
          {...props}
        >
          {/* Glossy shine effect */}
          <span className="btn-shine absolute -inset-[30%] bg-white/20 blur-[5px] rotate-45 -translate-y-[120%] transition-transform duration-600 ease-out pointer-events-none z-0" aria-hidden="true" />
          
          {/* Button content */}
          <span className="relative z-10 flex items-center gap-2">
            {children}
          </span>
        </button>
      );
    }

    // Standard button variants
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-brand-xl text-base font-semibold tracking-tight leading-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground shadow-brand-soft hover:shadow-brand": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground rounded-xl": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
