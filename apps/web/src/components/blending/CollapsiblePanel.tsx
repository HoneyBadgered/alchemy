/**
 * CollapsiblePanel Component
 * 
 * Reusable collapsible panel with smooth animations
 * Used for hiding ingredient panels by default on the blending page
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsiblePanelProps {
  /** Whether the panel is expanded */
  isOpen: boolean;
  /** Callback to toggle the panel */
  onToggle: () => void;
  /** Trigger element (icon/button) shown when collapsed */
  trigger: React.ReactNode;
  /** Content to show when expanded */
  children: React.ReactNode;
  /** Position of the panel */
  position?: 'left' | 'right';
  /** Additional className for the container */
  className?: string;
  /** Test ID for testing purposes */
  testId?: string;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  isOpen,
  onToggle,
  trigger,
  children,
  position = 'left',
  className = '',
  testId,
}) => {
  return (
    <div className={`relative ${className}`} data-testid={testId}>
      {/* Collapsed trigger - shown when panel is closed */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer"
            onClick={onToggle}
          >
            {trigger}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ 
              opacity: 0, 
              x: position === 'left' ? -20 : 20,
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              x: position === 'left' ? -20 : 20,
              scale: 0.95 
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30 
            }}
            className="relative"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * PanelTrigger Component
 * 
 * Visual trigger element for opening a collapsed panel
 */
interface PanelTriggerProps {
  /** Emoji or icon to display */
  icon: string;
  /** Label text */
  label: string;
  /** Whether there is a selection made */
  hasSelection?: boolean;
  /** Selection preview text */
  selectionPreview?: string;
  /** Additional className */
  className?: string;
}

export const PanelTrigger: React.FC<PanelTriggerProps> = ({
  icon,
  label,
  hasSelection = false,
  selectionPreview,
  className = '',
}) => {
  return (
    <div
      className={`
        group flex flex-col items-center gap-2 p-4
        bg-white/20 backdrop-blur-sm rounded-2xl
        border-2 border-white/30 hover:border-purple-400/50
        shadow-lg hover:shadow-xl
        transition-all duration-200
        cursor-pointer
        ${hasSelection ? 'ring-2 ring-purple-400/50' : ''}
        ${className}
      `}
    >
      {/* Icon with glow effect */}
      <div className="relative">
        <span className="text-4xl group-hover:scale-110 transition-transform duration-200 block">
          {icon}
        </span>
        {hasSelection && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Label */}
      <span className="text-white/80 text-sm font-medium text-center">
        {label}
      </span>
      
      {/* Selection preview */}
      {hasSelection && selectionPreview && (
        <span className="text-purple-300 text-xs text-center truncate max-w-full">
          {selectionPreview}
        </span>
      )}
      
      {/* Expand indicator */}
      <div className="flex items-center gap-1 text-white/50 group-hover:text-white/80 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-xs">Tap to open</span>
      </div>
    </div>
  );
};
