"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-sky-blue text-white shadow-sm hover:bg-royal-blue hover:shadow-md focus-visible:ring-sky-blue",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md focus-visible:ring-red-600",
        outline:
          "border border-neutral-gray bg-white text-slate-gray hover:bg-sky-tint hover:text-royal-blue hover:border-sky-blue focus-visible:ring-sky-blue",
        secondary:
          "bg-vivid-violet text-white shadow-sm hover:bg-deep-purple hover:shadow-md focus-visible:ring-vivid-violet",
        ghost:
          "text-slate-gray hover:bg-sky-tint hover:text-sky-blue focus-visible:ring-sky-blue",
        link:
          "text-sky-blue underline-offset-4 hover:text-royal-blue hover:underline focus-visible:ring-sky-blue",
        gradient:
          "bg-gradient-to-r from-sky-blue to-vivid-violet text-white shadow-sm hover:shadow-md hover:scale-105 focus-visible:ring-vivid-violet",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };