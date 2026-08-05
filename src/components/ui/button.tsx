import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "lg";
}

/**
 * Componente de botão no padrão shadcn/ui: primitivo local em vez de
 * dependência de pacote, estilizado só com classes Tailwind + cva-like variants.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500",
          "disabled:pointer-events-none disabled:opacity-60",
          variant === "default" &&
            "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:shadow-emerald-400/40 active:scale-[0.98]",
          variant === "outline" &&
            "border border-white/20 bg-transparent text-white hover:bg-white/10",
          size === "default" && "h-11 px-6 text-sm sm:text-base",
          size === "lg" && "h-14 px-8 text-base sm:text-lg",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
