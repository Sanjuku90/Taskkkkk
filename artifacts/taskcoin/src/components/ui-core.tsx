import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// BUTTON
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "glass";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";

    const variants = {
      default: "bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400 hover:shadow-amber-400/40 hover:-translate-y-0.5",
      outline: "border-2 border-primary/40 text-primary bg-primary/5 hover:bg-primary/12 hover:border-primary/70 hover:-translate-y-0.5",
      ghost: "text-slate-400 hover:bg-white/8 hover:text-white",
      destructive: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30 hover:from-rose-400 hover:to-red-500 hover:-translate-y-0.5",
      glass: "bg-white/8 border border-white/12 text-slate-200 hover:bg-white/14 hover:border-white/20 hover:text-white",
    };

    const sizes = {
      default: "h-11 px-6 py-2 text-sm",
      sm: "h-9 rounded-lg px-4 text-sm",
      lg: "h-14 rounded-2xl px-8 text-base",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// CARD
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("glass-card rounded-2xl overflow-hidden border border-white/8", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-display text-xl font-bold leading-none tracking-tight text-white", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// INPUT
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm text-white shadow-inner transition-all placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/60 hover:border-white/16 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-semibold leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
));
Label.displayName = "Label";

// BADGE
export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "success" | "warning" | "destructive" | "outline" }) => {
  const variants = {
    default: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    success: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/12 text-amber-300 border border-amber-500/25",
    destructive: "bg-rose-500/12 text-rose-400 border border-rose-500/25",
    outline: "text-slate-300 border border-white/20",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props} />
  );
};

// MODAL
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}
export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="glass-card rounded-3xl border border-white/10 shadow-2xl shadow-black overflow-hidden">
                {/* Accent top bar */}
                <div className="h-0.5 bg-gradient-to-r from-primary via-amber-300 to-cyan-400" />
                <CardHeader className="flex flex-row items-start justify-between border-b border-white/6 pb-4">
                  <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/12 transition-colors shrink-0 ml-3 mt-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardContent className="pt-6 max-h-[72vh] overflow-y-auto">
                  {children}
                </CardContent>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
