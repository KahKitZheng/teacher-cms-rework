import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./Modal.module.scss";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "small" | "medium" | "large" | "xlarge";
};

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "large",
}: Readonly<ModalProps>) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div styleName="overlay" onClick={onClose}>
      <div
        styleName={`modal ${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div styleName="header">
            <h2 styleName="title">{title}</h2>
            <button
              styleName="close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div styleName="content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
