import React, { useState, createContext, useContext } from "react";
import { cn } from "../../lib/utils";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-2xl border border-gray-200 bg-background px-3 py-2 text-base font-normal tracking-tight leading-relaxed ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <svg
        className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

const SelectContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useContext(SelectContext);
  
  if (!open) return null;
  
  return (
    <div
      className={cn(
        "absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-2xl border border-gray-200 bg-popover text-popover-foreground shadow-brand",
        className
      )}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

const SelectItem = ({ value, children, className, ...props }: {
  value: string;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const { onValueChange, setOpen } = useContext(SelectContext);
  
  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
