import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90",
            secondary: "bg-secondary text-white hover:bg-secondary/80",
            outline: "border border-white/10 bg-transparent hover:bg-white/5",
            ghost: "bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white",
            danger: "bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
            icon: "p-2",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button };
