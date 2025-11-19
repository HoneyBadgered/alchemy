/**
 * Progress Bar Component
 * 
 * Visual progress indicator for XP and quest progress
 */

import React from 'react';

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'xp' | 'quest' | 'default';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className} data-variant={variant}>
      {label && (
        <div>
          <span>{label}</span>
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
