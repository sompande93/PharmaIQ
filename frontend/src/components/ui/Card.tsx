import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("glass-card rounded-xl p-6 overflow-hidden", className)}
            {...props}
        />
    )
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
);

const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)} {...props} />
);

const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
