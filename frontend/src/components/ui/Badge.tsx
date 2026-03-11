import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "bg-primary/20 text-primary border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        outline: "border border-white/10 text-muted-foreground bg-transparent",
        success: "bg-success/20 text-success border-success/20",
        warning: "bg-warning/20 text-warning border-warning/20",
        danger: "bg-danger/20 text-danger border-danger/20",
        info: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
