
import * as React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DivPropsForMotion = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd" | "onTransitionEnd"
>;

interface AlertCardProps extends DivPropsForMotion {
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  isVisible: boolean;
  onDismiss?: () => void;
    tone?: "destructive" | "success";
    secondaryButtonText?: string;
  onSecondaryClick?: () => void;
}

const TONE_CLASSES: Record<NonNullable<AlertCardProps["tone"]>, { card: string; desc: string }> = {
  destructive: { card: "bg-destructive text-destructive-foreground", desc: "text-destructive-foreground/80" },
  success: { card: "bg-emerald-600 text-white", desc: "text-white/80" },
};

const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({
    className,
    icon,
    title,
    description,
    buttonText,
    onButtonClick,
    isVisible,
    onDismiss,
    tone = "destructive",
    secondaryButtonText,
    onSecondaryClick,
    ...props
  }, ref) => {

    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 50, scale: 0.95 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          staggerChildren: 0.1,
        }
      },
      exit: {
        opacity: 0,
        y: 20,
        scale: 0.98,
        transition: { duration: 0.2 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    const toneClasses = TONE_CLASSES[tone];

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-2xl p-6 shadow-2xl",
              toneClasses.card,
              className
            )}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alert"
            aria-live="assertive"
            {...props}
          >
            {}
            {onDismiss && (
              <motion.div variants={itemVariants} className="absolute top-3 right-3">
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} style={{ display: 'inline-flex' }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-white/20"
                    onClick={onDismiss}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {}
            {icon && (
               <motion.div
                variants={itemVariants}
                className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
              >
                 <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    {icon}
                </motion.div>
              </motion.div>
            )}

            {}
            <motion.h3 variants={itemVariants} className="text-2xl font-bold tracking-tight">
              {title}
            </motion.h3>

            {}
            <motion.p variants={itemVariants} className={cn("mt-2 text-sm max-w-[80%]", toneClasses.desc)}>
              {description}
            </motion.p>

            {}
            <motion.div variants={itemVariants} className="mt-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="w-full rounded-full bg-primary-foreground py-6 text-base font-semibold text-primary shadow-lg transition-transform duration-200 hover:bg-primary-foreground/90"
                  onClick={onButtonClick}
                >
                  {buttonText}
                </Button>
              </motion.div>
            </motion.div>

            {}
            {secondaryButtonText && onSecondaryClick && (
              <motion.div variants={itemVariants} className="mt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="ghost"
                    className="w-full rounded-full py-5 text-sm font-medium text-current hover:bg-white/10"
                    onClick={onSecondaryClick}
                  >
                    {secondaryButtonText}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AlertCard.displayName = "AlertCard";

export { AlertCard };
