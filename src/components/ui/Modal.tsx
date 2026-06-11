import React, { useEffect } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] p-4">
      <div
        className={cn(
          "w-full max-w-[480px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl flex flex-col max-h-[90vh]",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <h2 className="text-[20px] font-display font-medium text-[var(--color-text-primary)] m-0">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none z-10"
          >
            <X size={20} />
          </button>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
