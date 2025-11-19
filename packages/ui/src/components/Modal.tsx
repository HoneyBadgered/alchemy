/**
 * Modal Component
 * 
 * Overlay modal dialog for important interactions
 */

import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className={className}>
      <div onClick={onClose} />
      <div>
        {title && <h2>{title}</h2>}
        <button onClick={onClose} aria-label="Close modal">
          ×
        </button>
        {children}
      </div>
    </div>
  );
};
