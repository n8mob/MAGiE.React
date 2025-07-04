// Dialog.tsx
import './Dialog.css';
import { ReactNode } from "react";

interface DialogProps {
  onClose: () => void;
  children: ReactNode;
}

export default function Dialog({ onClose, children }: DialogProps) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        {children}
        <div className="dialog-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
