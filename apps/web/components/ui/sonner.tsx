"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:border group-[.toast]:border-border group-[.toast]:bg-white group-[.toast]:text-foreground",
          cancelButton:
            "group-[.toast]:border group-[.toast]:border-border group-[.toast]:bg-[#FAF9F5] group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
