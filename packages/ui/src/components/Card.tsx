/**
 * Card Component
 * 
 * Container component with alchemy-themed styling
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}) => {
  return (
    <div
      className={className}
      data-variant={variant}
      data-padding={padding}
    >
      {children}
    </div>
  );
};
