import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 max-w-full overflow-hidden text-ellipsis",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "glass-button backdrop-blur-xl border-[1.5px] border-primary/30 hover:border-primary/50 hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20",
        secondary: "glass-button backdrop-blur-xl border-[1.5px] border-secondary/30 bg-secondary/20 hover:bg-secondary/30 hover:border-secondary/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-secondary/20",
        ghost: "glass backdrop-blur-md hover:bg-primary/10 hover:border-primary/20 hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-cta text-cta-foreground hover:bg-cta-hover shadow-lg hover:shadow-xl hover:scale-[1.02] border border-cta/50",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-xl px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
